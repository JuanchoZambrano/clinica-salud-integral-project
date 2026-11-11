
import type { Request, Response } from "express";
import { prisma } from "../config/prisma.js";
import { z } from "zod";
import bcrypt from "bcrypt";

const createMedicSchema = z.object({
  userName: z.string().trim().min(1, "El nombre es obligatorio."),
  userEmail: z.string().email("Correo electrónico inválido."),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres."),
  professionalCode: z.string().trim().min(1, "El código profesional es obligatorio."),
  medicPhone: z.string().optional(),
  specialtyId: z.number().int().positive(),
});

const updateMedicSchema = createMedicSchema
  .omit({ password: true })
  .partial()
  .extend({
    password: z.string().min(6).optional(),
  });

export async function createMedic(req: Request, res: Response) {
  /*
    #swagger.tags = ['Medics']
    #swagger.summary = 'Registrar un médico'
    #swagger.description = 'Permite registrar un nuevo médico y crear su usuario de acceso. Rol permitido: ADMIN.'
    #swagger.security = [{
      "bearerAuth": []
    }]
  */
  try {
    const validation = createMedicSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        ok: false,
        message: "Datos inválidos.",
        errors: validation.error.flatten().fieldErrors,
      });
    }

    const {
      userName,
      userEmail,
      password,
      professionalCode,
      medicPhone,
      specialtyId,
    } = validation.data;

    const existingUser = await prisma.user.findUnique({
      where: { userEmail },
    });

    if (existingUser) {
      return res.status(409).json({
        ok: false,
        message: "El correo electrónico ya está registrado.",
      });
    }

    const existingMedic = await prisma.medic.findUnique({
      where: { professionalCode },
    });

    if (existingMedic) {
      return res.status(409).json({
        ok: false,
        message: "El código profesional ya está registrado.",
      });
    }

    const specialty = await prisma.specialty.findUnique({
      where: { id: specialtyId },
    });

    if (!specialty) {
      return res.status(404).json({
        ok: false,
        message: "La especialidad no existe.",
      });
    }

    const role = await prisma.role.findUnique({
      where: { roleName: "MEDIC" },
    });

    if (!role) {
      return res.status(500).json({
        ok: false,
        message: "No existe el rol MEDIC en la base de datos.",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newMedic = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          userName,
          userEmail,
          userPassword: hashedPassword,
          roleId: role.id,
        },
      });

      return tx.medic.create({
        data: {
          professionalCode,
          medicPhone,
          specialtyId,
          userId: newUser.id,
        },
        select: {
          id: true,
          professionalCode: true,
          medicPhone: true,
          user: {
            select: {
              id: true,
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
      });
    });

    return res.status(201).json({
      ok: true,
      message: "Médico registrado exitosamente.",
      data: newMedic,
    });
  } catch (error) {
    console.error("Error al registrar médico:", error);
    return res.status(500).json({
      ok: false,
      message: "Error interno del servidor.",
    });
  }
}

export async function getMedics(req: Request, res: Response) {
  /*
    #swagger.tags = ['Medics']
    #swagger.summary = 'Listar médicos'
    #swagger.description = 'Permite consultar el listado de médicos registrados. Roles permitidos: ADMIN, RECEPTIONIST y MANAGER.'
    #swagger.security = [{
      "bearerAuth": []
    }]
  */
  try {
    const medics = await prisma.medic.findMany({
      select: {
        id: true,
        professionalCode: true,
        medicPhone: true,
        user: {
          select: {
            userName: true,
            userEmail: true,
            status: true,
          },
        },
        specialty: {
          select: {
            id: true,
            specialtyName: true,
          },
        },
      },
      orderBy: {
        id: "asc",
      },
    });

    return res.status(200).json({
      ok: true,
      data: medics,
    });
  } catch (error) {
    console.error("Error al consultar médicos:", error);
    return res.status(500).json({
      ok: false,
      message: "Error interno del servidor.",
    });
  }
}

export async function getMedicById(req: Request, res: Response) {
  /*
    #swagger.tags = ['Medics']
    #swagger.summary = 'Consultar médico por ID'
    #swagger.description = 'Permite consultar la información y el historial de citas de un médico específico. Roles permitidos: ADMIN, RECEPTIONIST, MANAGER y MEDIC.'
    #swagger.security = [{
      "bearerAuth": []
    }]
  */
  try {
    const medicId = Number(req.params.id);

    if (!Number.isInteger(medicId) || medicId <= 0) {
      return res.status(400).json({
        ok: false,
        message: "El ID del médico no es válido.",
      });
    }

    const medic = await prisma.medic.findUnique({
      where: { id: medicId },
      select: {
        id: true,
        professionalCode: true,
        medicPhone: true,
        user: {
          select: {
            userName: true,
            userEmail: true,
            status: true,
          },
        },
        specialty: {
          select: {
            id: true,
            specialtyName: true,
          },
        },
        appointments: {
          orderBy: {
            appointmentDate: "desc",
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
                personalId: true,
              },
            },
          },
        },
      },
    });

    if (!medic) {
      return res.status(404).json({
        ok: false,
        message: "No se encontró un médico con ese ID.",
      });
    }

    return res.status(200).json({
      ok: true,
      data: medic,
    });
  } catch (error) {
    console.error("Error al consultar médico:", error);

    return res.status(500).json({
      ok: false,
      message: "Error interno del servidor.",
    });
  }
}

export async function updateMedic(req: Request, res: Response) {
  /*
    #swagger.tags = ['Medics']
    #swagger.summary = 'Actualizar un médico'
    #swagger.description = 'Permite actualizar la información personal, profesional o de acceso de un médico. Rol permitido: ADMIN.'
    #swagger.security = [{
      "bearerAuth": []
    }]
  */
  try {
    const medicId = Number(req.params.id);

    if (!Number.isInteger(medicId) || medicId <= 0) {
      return res.status(400).json({
        ok: false,
        message: "El ID del médico no es válido.",
      });
    }

    const validation = updateMedicSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        ok: false,
        message: "Datos inválidos.",
        errors: validation.error.flatten().fieldErrors,
      });
    }

    const data = validation.data;

    if (Object.keys(data).length === 0) {
      return res.status(400).json({
        ok: false,
        message: "Debes enviar al menos un campo para actualizar.",
      });
    }

    const medic = await prisma.medic.findUnique({
      where: { id: medicId },
      include: { user: true },
    });

    if (!medic) {
      return res.status(404).json({
        ok: false,
        message: "No se encontró el médico.",
      });
    }

    if (data.userEmail && data.userEmail !== medic.user.userEmail) {
      const existingEmail = await prisma.user.findUnique({
        where: { userEmail: data.userEmail },
      });

      if (existingEmail) {
        return res.status(409).json({
          ok: false,
          message: "El correo electrónico ya está registrado.",
        });
      }
    }

    if (
      data.professionalCode &&
      data.professionalCode !== medic.professionalCode
    ) {
      const existingCode = await prisma.medic.findUnique({
        where: { professionalCode: data.professionalCode },
      });

      if (existingCode) {
        return res.status(409).json({
          ok: false,
          message: "El código profesional ya está registrado.",
        });
      }
    }

    if (data.specialtyId) {
      const specialty = await prisma.specialty.findUnique({
        where: { id: data.specialtyId },
      });

      if (!specialty) {
        return res.status(404).json({
          ok: false,
          message: "La especialidad no existe.",
        });
      }
    }

    const { userName, userEmail, password, ...medicData } = data;

    const updatedMedic = await prisma.$transaction(async (tx) => {
      if (userName || userEmail || password) {
        await tx.user.update({
          where: { id: medic.userId },
          data: {
            ...(userName ? { userName } : {}),
            ...(userEmail ? { userEmail } : {}),
            ...(password ? { userPassword: await bcrypt.hash(password, 10) } : {}),
          },
        });
      }

      return tx.medic.update({
        where: { id: medicId },
        data: medicData,
        select: {
          id: true,
          professionalCode: true,
          medicPhone: true,
          user: {
            select: {
              userName: true,
              userEmail: true,
            },
          },
          specialty: {
            select: {
              id: true,
              specialtyName: true,
            },
          },
        },
      });
    });

    return res.status(200).json({
      ok: true,
      message: "Médico actualizado exitosamente.",
      data: updatedMedic,
    });
  } catch (error) {
    console.error("Error al actualizar médico:", error);
    return res.status(500).json({
      ok: false,
      message: "Error interno del servidor.",
    });
  }
}

export async function deleteMedic(req: Request, res: Response) {
  /*
    #swagger.tags = ['Medics']
    #swagger.summary = 'Desactivar un médico'
    #swagger.description = 'Permite desactivar el usuario de un médico sin eliminar su historial ni sus registros asociados. Rol permitido: ADMIN.'
    #swagger.security = [{
      "bearerAuth": []
    }]
  */
  try {
    const medicId = Number(req.params.id);

    if (!Number.isInteger(medicId) || medicId <= 0) {
      return res.status(400).json({
        ok: false,
        message: "El ID del médico no es válido.",
      });
    }

    const medic = await prisma.medic.findUnique({
      where: { id: medicId },
    });

    if (!medic) {
      return res.status(404).json({
        ok: false,
        message: "No se encontró el médico.",
      });
    }

    await prisma.user.update({
      where: { id: medic.userId },
      data: { status: false },
    });

    return res.status(200).json({
      ok: true,
      message: "Médico desactivado exitosamente.",
    });
  } catch (error) {
    console.error("Error al desactivar médico:", error);
    return res.status(500).json({
      ok: false,
      message: "Error interno del servidor.",
    });
  }
}