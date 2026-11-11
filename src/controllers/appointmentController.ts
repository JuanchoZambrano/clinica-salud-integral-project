import type { Request, Response } from "express";
import { prisma } from "../config/prisma";
import { z } from "zod";

const createAppointmentSchema = z.object({
  appointmentDate: z.coerce
    .date({ message: "Introduce una fecha y hora validas: YYYY-MM-DD" })
    .refine((date) => date >= new Date(), {
      message: "La fecha tiene que ser futura.",
    }),
  observation: z
    .string()
    .trim()
    .min(1, "La observación debe ser un texto")
    .optional(),
  patientId: z.number().int().positive(),
  medicId: z.number().int().positive(),
});

const updateAppointmentSchema = createAppointmentSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "Debe proporcionar al menos un campo para actualizar.",
  });

const appointmentStatusSchema = z.enum(["SCHEDULED", "COMPLETED", "CANCELLED"]);

const updateAppointmentStatusSchema = z.object({
  status: z.enum(["COMPLETED", "CANCELLED"], {
    message: "El estado debe ser COMPLETED o CANCELLED.",
  }),
});

const DURATION = 30 * 60 * 1000;

export async function createAppointment(req: Request, res: Response) {
/*
    #swagger.tags = ['Appointments']
    #swagger.summary = 'Crear una cita'
    #swagger.description = 'Permite programar una nueva cita médica. Roles permitidos: ADMIN y RECEPTIONIST.'
    #swagger.parameters['body'] = {
      in: 'body',
      description: 'Cuerpo para crear una cita',
      required: true,
      schema: {
        appointmentDate: "YYYY-MM-DDT00:00:00.000Z",
        observation: "",
        patientId: 1,
        medicId: 1
      }
    }
    #swagger.security = [{
      "bearerAuth": []
    }]
  */
  try {
    const validation = createAppointmentSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({
        message: "Uno o más campos no son validos.",
        errors: validation.error.flatten().fieldErrors,
      });
      return;
    }

    const appointmentData = validation.data;

    const now = new Date();

    if (appointmentData.appointmentDate <= now) {
      return res.status(400).json({
        ok: false,
        message: "No se pueden programar citas en fechas u horas pasadas.",
      });
    }

    const findPatient = await prisma.patient.findUnique({
      where: { id: appointmentData.patientId },
    });

    const findMedic = await prisma.medic.findUnique({
      where: { id: appointmentData.medicId },
    });

    if (!findPatient) {
      return res
        .status(404)
        .json({ ok: false, message: "No se encontró un paciente con ese ID." });
    }

    if (!findMedic) {
      return res
        .status(404)
        .json({ ok: false, message: "No se encontró un médico con ese ID." });
    }

    const start = appointmentData.appointmentDate;
    const end = new Date(start.getTime() + DURATION);
    const previous = new Date(start.getTime() - DURATION);

    const repeatedAppointmentForMedic = await prisma.appointment.findFirst({
      where: {
        medicId: appointmentData.medicId,
        status: "SCHEDULED",
        appointmentDate: {
          gt: previous,
          lt: end,
        },
      },
    });

    const repeatedAppointmentForPatient = await prisma.appointment.findFirst({
      where: {
        patientId: appointmentData.patientId,
        status: "SCHEDULED",
        appointmentDate: {
          gt: previous,
          lt: end,
        },
      },
    });

    if (repeatedAppointmentForMedic) {
      return res.status(409).json({
        ok: false,
        message: "El medico ya tiene una cita programada en esa fecha y hora.",
      });
    }

    if (repeatedAppointmentForPatient) {
      return res.status(409).json({
        ok: false,
        message: "El paciente ya tiene una cita programada esa fecha y hora.",
      });
    }

    const newAppointment = await prisma.appointment.create({
      data: {
        appointmentDate: appointmentData.appointmentDate,
        observation: appointmentData.observation,
        patientId: appointmentData.patientId,
        medicId: appointmentData.medicId,
      },
      select: {
        id: true,
        appointmentDate: true,
        patient: {
          select: {
            patientName: true,
            patientLastName: true,
          },
        },
        medic: {
          select: {
            professionalCode: true,
            specialty: {
              select: {
                specialtyName: true,
              },
            },
          },
        },
        observation: true,
        status: true,
      },
    });

    res.status(201).json({
      ok: true,
      message: "La cita se creó exitosamente.",
      data: newAppointment,
    });
  } catch (error) {
    console.error("Error al crear la cita: ", error);
    res.status(500).json({
      ok: false,
      message: "Error interno del servidor",
    });
  }
}

export async function getAppointments(req: Request, res: Response) {
  /*
    #swagger.tags = ['Appointments']
    #swagger.summary = 'Listar citas'
    #swagger.description = 'Permite consultar las citas médicas registradas. Roles permitidos: ADMIN, RECEPTIONIST, MANAGER y MEDIC.'
    #swagger.security = [{
      "bearerAuth": []
    }]
  */
  try {
    const authUser = res.locals.authUser;
    const { status, from, to } = req.query;
    let validatedStatus;

    if (status !== undefined) {
      const validation = appointmentStatusSchema.safeParse(status);

      if (!validation.success) {
        return res.status(400).json({
          ok: false,
          message: "El estado de la cita no es válido.",
          errors: validation.error.flatten().fieldErrors,
        });
      }
      validatedStatus = validation.data;
    }

    if ((from && !to) || (!from && to)) {
      return res.status(400).json({
        ok: false,
        message: "Debes proporcionar ambas fechas: from y to.",
      });
    }

    if (from && to && new Date(from as string) > new Date(to as string)) {
      return res.status(400).json({
        ok: false,
        message: "La fecha inicial no puede ser mayor que la fecha final.",
      });
    }

    const where = {
      ...(validatedStatus ? { status: validatedStatus } : {}), // Valido desde las querys, el filtro de estados

      ...(from && to // validar las fechas (Agenda del medico)
        ? {
            appointmentDate: {
              gte: new Date(`${from}T00:00:00`), // gte significa "mayor o igual que la fecha inicial"
              lt: new Date( // lt significa "menor que la fecha final exclusiva"
                new Date(`${to}T00:00:00`).setDate(
                  new Date(`${to}T00:00:00`).getDate() + 1,
                ),
              ),
            },
          }
        : {}),

      ...(authUser.role === "MEDIC" // Valido que el medico solo pueda ver sus citas
        ? {
            medic: {
              is: {
                userId: authUser.id,
              },
            },
          }
        : {}),
    };

    const appointments = await prisma.appointment.findMany({
      where,
      orderBy: {
        id: "asc",
      },
      select: {
        id: true,
        appointmentDate: true,
        observation: true,
        patient: {
          select: {
            patientName: true,
            patientLastName: true,
          },
        },
        medic: {
          select: {
            professionalCode: true,
            specialty: { select: { specialtyName: true } },
          },
        },
        status: true,
      },
    });

    res.status(200).json({
      ok: true,
      data: appointments,
    });
  } catch (error) {
    console.error("Error al cargar las citas: ", error);
    res.status(500).json({
      ok: false,
      message: "Error interno del servidor",
    });
  }
}

export async function getAppointmentById(req: Request, res: Response) {
  /*
    #swagger.tags = ['Appointments']
    #swagger.summary = 'Consultar cita por ID'
    #swagger.description = 'Permite consultar los detalles de una cita médica específica. Roles permitidos: ADMIN, RECEPTIONIST, MANAGER y MEDIC.'
    #swagger.security = [{
      "bearerAuth": []
    }]
  */
  try {
    const appointmentId = Number(req.params.id);

    if (!Number.isInteger(appointmentId) || appointmentId <= 0) {
      return res.status(400).json({
        ok: false,
        message: "El ID de la cita no es válido.",
      });
    }

    const authUser = res.locals.authUser;

    const appointment = await prisma.appointment.findFirst({
      where: {
        id: appointmentId,
        ...(authUser.role === "MEDIC"
          ? {
              medic: {
                is: {
                  userId: authUser.id,
                },
              },
            }
          : {}),
      },
      select: {
        id: true,
        appointmentDate: true,
        observation: true,
        status: true,
        patient: {
          select: {
            id: true,
            patientName: true,
            patientLastName: true,
            personalId: true,
          },
        },
        medic: {
          select: {
            id: true,
            professionalCode: true,
            specialty: {
              select: {
                specialtyName: true,
              },
            },
          },
        },
      },
    });

    if (!appointment) {
      return res.status(404).json({
        ok: false,
        message: "La cita no existe o no tienes permiso para consultarla.",
      });
    }

    return res.status(200).json({
      ok: true,
      data: appointment,
    });
  } catch (error) {
    console.error("Error al consultar la cita:", error);
    return res.status(500).json({
      ok: false,
      message: "Error interno del servidor.",
    });
  }
}

export async function updateAppointment(req: Request, res: Response) {
  /*
    #swagger.tags = ['Appointments']
    #swagger.summary = 'Actualizar una cita'
    #swagger.description = 'Permite modificar la información de una cita médica programada. Roles permitidos: ADMIN, RECEPTIONIST y MEDIC.'
    #swagger.parameters['body'] = {
      in: 'body',
      description: 'Replace - appointmentDate, observation, patientId, medicId',
      required: true,
      schema: {
        replace: ""
      }
    }
    #swagger.security = [{
      "bearerAuth": []
    }]
  */
  try {
    const authUser = res.locals.authUser;
    const appointmentId = Number(req.params.id);

    if (!Number.isInteger(appointmentId) || appointmentId <= 0) {
      return res.status(400).json({
        ok: false,
        message: "El ID del appointment no es valido",
      });
    }

    const getAppointment = await prisma.appointment.findFirst({
      where: {
        id: appointmentId,
        ...(authUser.role === "MEDIC"
          ? {
              medic: {
                is: {
                  userId: authUser.id,
                },
              },
            }
          : {}),
      },
    });

    if (!getAppointment) {
      return res.status(404).json({
        ok: false,
        message: `La cita no existe o no tienes permiso para modificarla.`,
      });
    }

    if (getAppointment.status !== "SCHEDULED") {
      return res.status(409).json({
        ok: false,
        message: "Solo se pueden modificar citas programadas.",
      });
    }

    const validation = updateAppointmentSchema.safeParse(req.body);

    if (!validation.success) {
      res.status(400).json({
        ok: false,
        message: "Uno o más campos no son validos.",
        errors: validation.error.flatten().fieldErrors,
      });
      return;
    }

    const appointmentData = validation.data;

    if (
      authUser.role === "MEDIC" &&
      appointmentData.medicId !== undefined &&
      appointmentData.medicId !== getAppointment.medicId
    ) {
      return res.status(403).json({
        ok: false,
        message: "No tienes permiso para reasignar esta cita a otro médico.",
      });
    }

    const patientId = appointmentData.patientId ?? getAppointment.patientId;
    const medicId = appointmentData.medicId ?? getAppointment.medicId;
    const appointmentDate =
      appointmentData.appointmentDate ?? getAppointment.appointmentDate;
    const observation =
      appointmentData.observation ?? getAppointment.observation;

    const findPatient = await prisma.patient.findUnique({
      where: { id: patientId },
    });

    if (!findPatient) {
      return res.status(404).json({
        ok: false,
        message: "El paciente indicado no existe.",
      });
    }

    const findMedic = await prisma.medic.findUnique({
      where: { id: medicId },
    });

    if (!findMedic) {
      return res.status(404).json({
        ok: false,
        message: "El médico indicado no existe.",
      });
    }

    const start = appointmentDate; // Duracion de citas 30mins, valido que no se crucen 2 citas en cuanto a sus horas
    const end = new Date(start.getTime() + DURATION);
    const previous = new Date(start.getTime() - DURATION);

    const repeatedAppointmentForMedic = await prisma.appointment.findFirst({
      where: {
        medicId,
        status: "SCHEDULED",
        id: { not: appointmentId },
        appointmentDate: {
          gt: previous,
          lt: end,
        },
      },
    });

    const repeatedAppointmentForPatient = await prisma.appointment.findFirst({
      where: {
        patientId,
        status: "SCHEDULED",
        id: { not: appointmentId },
        appointmentDate: {
          gt: previous,
          lt: end,
        },
      },
    });

    if (repeatedAppointmentForMedic) {
      return res.status(409).json({
        ok: false,
        message: "El médico ya tiene una cita programada en esa fecha y hora.",
      });
    }

    if (repeatedAppointmentForPatient) {
      return res.status(409).json({
        ok: false,
        message:
          "El paciente ya tiene una cita programada en esa fecha y hora.",
      });
    }

    const updatedAppointment = await prisma.appointment.update({
      where: {
        id: appointmentId,
      },
      data: {
        appointmentDate,
        observation,
        patientId,
        medicId,
      },
      select: {
        id: true,
        appointmentDate: true,
        observation: true,
        status: true,
        patient: {
          select: {
            patientName: true,
            patientLastName: true,
          },
        },
        medic: {
          select: {
            professionalCode: true,
            specialty: {
              select: {
                specialtyName: true,
              },
            },
          },
        },
      },
    });

    return res.status(200).json({
      ok: true,
      message: "La appointment se actualizó exitosamente.",
      data: updatedAppointment,
    });
  } catch (error) {
    console.error("Error al actualizar el appointment: ", error);
    res.status(500).json({
      ok: false,
      message: "Error interno del servidor",
    });
  }
}

export async function updateAppointmentStatus(req: Request, res: Response) {
  /*
    #swagger.tags = ['Appointments']
    #swagger.summary = 'Actualizar estado de una cita'
    #swagger.description = 'Permite cambiar el estado de una cita médica. Roles permitidos: ADMIN y MEDIC.'
    #swagger.parameters['body'] = {
      in: 'body',
      description: 'Usar COMPLETED o CANCELLED',
      required: true,
      schema: {
        status: ""
      }
    }
    #swagger.security = [{
      "bearerAuth": []
    }]
  */
  try {
    const authUser = res.locals.authUser;
    const appointmentId = Number(req.params.id);

    if (!Number.isInteger(appointmentId) || appointmentId <= 0) {
      return res.status(400).json({
        ok: false,
        message: "El ID del appointment no es valido",
      });
    }

    const getAppointment = await prisma.appointment.findFirst({
      where: {
        id: appointmentId,
        ...(authUser.role === "MEDIC"
          ? {
              medic: {
                is: {
                  userId: authUser.id,
                },
              },
            }
          : {}),
      },
    });

    if (!getAppointment) {
      return res.status(404).json({
        ok: false,
        message: `La cita no existe o no tienes permiso para modificarla.`,
      });
    }

    const validation = updateAppointmentStatusSchema.safeParse(req.body);

    if (!validation.success) {
      res.status(400).json({
        ok: false,
        message: "Uno o más campos no son validos.",
        errors: validation.error.flatten().fieldErrors,
      });
      return;
    }

    const appointmentData = validation.data;

    if (getAppointment.status !== "SCHEDULED") {
      return res.status(409).json({
        ok: false,
        message: "Solo se pueden modificar citas que estén programadas.",
      });
    }

    const updatedStatus = await prisma.appointment.update({
      where: {
        id: appointmentId,
      },
      data: { status: appointmentData.status },
      select: {
        id: true,
        patient: {
          select: {
            patientName: true,
            patientLastName: true,
          },
        },
        status: true,
      },
    });

    return res.status(200).json({
      ok: true,
      message: `Cita de ID: ${appointmentId} actualizada a: ${appointmentData.status}`,
      data: updatedStatus,
    });
  } catch (error) {
    console.error("Error al actualizar el estado de la cita:", error);
    return res.status(500).json({
      ok: false,
      message: "Error interno del servidor.",
    });
  }
}
