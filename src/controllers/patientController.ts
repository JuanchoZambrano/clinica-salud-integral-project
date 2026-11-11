import type { Request, Response } from "express";
import { prisma } from "../config/prisma";
import { z } from "zod";

const createPatientSchema = z.object({
  patientName: z
    .string()
    .trim()
    .min(1, "Por favor ingrese el nombre del paciente."),
  patientLastName: z
    .string()
    .trim()
    .min(1, "Por favor ingrese el apellido del paciente"),
  personalId: z
    .string()
    .trim()
    .min(1, "El ID personal del paciente es obligatorio.")
    .max(30, "El ID personalno puede tener más de 30 caracteres."),
  birthDate: z.coerce // configurar mejor para solo validar el dia
    .date({ message: "Introduce una fecha y hora válidas." })
    .refine((date) => date <= new Date(), {
      message: "La fecha y hora no pueden ser mayores a la actual",
    }),
  patientEmail: z.string().trim().email("Correo electronico invalido."),
  patientPhone: z
    .string()
    .max(20, "El telefono no puede tener mas de 20 caracteres.")
    .optional(),
  patientAddress: z
    .string()
    .max(200, "La dirección no puede tener más de 200 caracteres.")
    .optional(),
});

const updatePatientSchema = createPatientSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "Debe proporcionar al menos un campo para actualizar.",
  });

export async function createPatient(req: Request, res: Response) {
  try {
    const validation = createPatientSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({
        message: "Uno o más campos no son validos.",
        errors: validation.error.flatten().fieldErrors,
      });
      return;
    }

    const patientData = validation.data;

    const existingPatient = await prisma.patient.findFirst({
      where: {
        OR: [
          { personalId: patientData.personalId },
          { patientEmail: patientData.patientEmail },
        ],
      },
    });

    if (existingPatient) {
      res.status(409).json({
        ok: false,
        message: "El ID del paciente o email ya existen.",
      });
      return;
    }

    const newPatient = await prisma.patient.create({
      data: {
        patientName: patientData.patientName,
        patientLastName: patientData.patientLastName,
        personalId: patientData.personalId,
        birthDate: patientData.birthDate,
        patientEmail: patientData.patientEmail,
        patientPhone: patientData.patientPhone,
        patientAddress: patientData.patientAddress,
      },
      select: {
        id: true,
        personalId: true,
        patientEmail: true,
      },
    });

    res.status(201).json({
      ok: true,
      message: "Paciente registrado exitosamente.",
      data: newPatient,
    });
  } catch (error) {
    console.error("Error al crear paciente: ", error);

    res.status(500).json({
      message: "Error interno del servidor",
    });
  }
}

export async function getPatients(req: Request, res: Response) {
  try {
    const patients = await prisma.patient.findMany({
      select: {
        id: true,
        patientName: true,
        patientLastName: true,
        personalId: true,
        patientEmail: true,
      },
      orderBy: {
        id: 'asc'
      },
    });

    res.status(200).json({
      ok: true,
      data: patients,
    });
  } catch (error) {
    console.error("Error al cargar pacientes");
    res.status(500).json({
      ok: false,
      message: "Error interno del servidor",
    });
  }
}

export async function getPatientById(req: Request, res: Response) {
  try {
    const patientId = Number(req.params.id);
    if (!Number.isInteger(patientId) || patientId <= 0) {
      return res.status(400).json({
        ok: false,
        message: "El ID del paciente no es valido",
      });
    }

    const getPatient = await prisma.patient.findUnique({
      where: { id: patientId },
      include: {
        appointments: {
          orderBy: {
            appointmentDate: "desc",
          },
          include: {
            medic: {
              include: {
                user: {
                  select: {
                    userName: true,
                    userEmail: true,
                  },
                },
                specialty: {
                  select: {
                    specialtyName: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!getPatient) {
      return res.status(404).json({
        ok: false,
        message: `No se encontró un paciente con el ID: ${patientId}`,
      });
    }

    res.status(200).json({
      ok: true,
      message: "Paciente encontrado",
      data: getPatient,
    });
  } catch (error) {
    console.error("Error al obtener paciente: ", error);
    res.status(500).json({
      ok: false,
      message: "Error interno del servidor",
    });
  }
}

export async function getPatientAppointments(req: Request, res: Response) {
  try {
    const patientId = Number(req.params.id);
    if (!Number.isInteger(patientId) || patientId <= 0) {
      return res.status(400).json({
        ok: false,
        message: "El ID del paciente no es valido",
      });
    }

    const getPatient = await prisma.patient.findUnique({
      where: { id: patientId },
    });

    if (!getPatient) {
      return res.status(404).json({
        ok: false,
        message: `No se encontró un paciente con el ID: ${patientId}`,
      });
    }

    const patientAppointments = await prisma.appointment.findMany({
      where: { patientId }, //abrev. de {patientId: patientId}
      include: {
        medic: {
          include: {
            user: {
              select: {
                userName: true,
              },
            },
            specialty: {
              select: {
                specialtyName: true,
              },
            },
          },
        },
      },
    });

    res.status(200).json({
      ok: true,
      message: `Citas del paciente ${getPatient.patientName} ${getPatient.patientLastName} encontradas`,
      data: patientAppointments,
    });
  } catch (error) {
    console.error("Error al obtener citas del paciente: ", error);
    res.status(500).json({
      ok: false,
      message: "Error interno del servidor",
    });
  }
}

export async function updatePatient(req: Request, res: Response) {
  try {
    const patientId = Number(req.params.id);
    if (!Number.isInteger(patientId) || patientId <= 0) {
      return res.status(400).json({
        ok: false,
        message: "El ID del paciente no es valido",
      });
    }

    const getPatient = await prisma.patient.findUnique({
      where: { id: patientId },
    });

    if (!getPatient) {
      return res.status(404).json({
        ok: false,
        message: `No se encontró un paciente con el ID: ${patientId}`,
      });
    }

    const validation = updatePatientSchema.safeParse(req.body);

    if (!validation.success) {
      res.status(400).json({
        message: "Uno o más campos no son validos.",
        errors: validation.error.flatten().fieldErrors,
      });
      return;
    }

    const patientNewData = validation.data;
    const duplicatedInfo = [];

    if (patientNewData.personalId) {
      duplicatedInfo.push({ personalId: patientNewData.personalId });
    }

    if (patientNewData.patientEmail) {
      duplicatedInfo.push({ patientEmail: patientNewData.patientEmail });
    }

    if (duplicatedInfo.length > 0) {
      const existingPatient = await prisma.patient.findFirst({
        where: {
          id: { not: patientId }, // uso not para saltarme al paciente que estoy actualizando
          OR: duplicatedInfo, //busca coincidencias por personalId o email
        },
      });
      if (existingPatient) {
        res.status(409).json({
          ok: false,
          message: "El ID del paciente o email ya existen.",
        });
        return;
      }
    }

    const updatePatient = await prisma.patient.update({
      where: { id: patientId },
      data: patientNewData,
    });

    res.status(200).json({
      ok: true,
      message: `Paciente con ID: ${patientId} actualizado.`,
      data: updatePatient,
    });
  } catch (error) {
    console.error("Error al actualizar paciente: ", error);
    res.status(500).json({
      ok: false,
      message: "Error interno del servidor",
    });
  }
}
