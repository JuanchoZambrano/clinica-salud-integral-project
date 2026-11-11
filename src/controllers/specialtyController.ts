import type { Request, Response } from "express";
import { prisma } from "../config/prisma.js";
import { z } from "zod";

const createSpecialtySchema = z.object({
  specialtyName: z.string().trim().min(1, "El nombre es obligatorio."),
  description: z.string().optional(),
});

const updateSpecialtySchema = createSpecialtySchema.partial();

export async function createSpecialty(req: Request, res: Response) {
  /* 
    #swagger.tags = ['Specialties']
    #swagger.summary = 'Crear especialidad'
    #swagger.description = 'Permite registrar nuevas especialidades. Acceso exclusivo para ADMIN.'
    #swagger.parameters['body'] = {
      in: 'body',
      description: 'Cuerpo para crear una especialidad',
      required: true,
      schema: {
        specialtyName: "",
        description: ""
      }
    }
    #swagger.security = [{
    "bearerAuth": []
    }]
  */
  try {
    const validation = createSpecialtySchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        ok: false,
        message: "Datos inválidos.",
        errors: validation.error.flatten().fieldErrors,
      });
    }

    const { specialtyName, description } = validation.data;

    const existingSpecialty = await prisma.specialty.findUnique({
      where: { specialtyName },
    });

    if (existingSpecialty) {
      return res.status(409).json({
        ok: false,
        message: "La especialidad ya está registrada.",
      });
    }

    const newSpecialty = await prisma.specialty.create({
      data: {
        specialtyName,
        description,
      },
    });

    return res.status(201).json({
      ok: true,
      message: "Especialidad registrada exitosamente.",
      data: newSpecialty,
    });
  } catch (error) {
    console.error("Error al registrar especialidad:", error);

    return res.status(500).json({
      ok: false,
      message: "Error interno del servidor.",
    });
  }
}

export async function getSpecialties(req: Request, res: Response) {
  /* 
    #swagger.tags = ['Specialties']
    #swagger.summary = 'Listar especialidades'
    #swagger.description = 'Permite consultar todas las especialidades. Roles permitidos: ADMIN, RECEPTIONIST, MANAGER y MEDIC.'
    #swagger.security = [{
    "bearerAuth": []
    }]
  */
  try {
    const specialties = await prisma.specialty.findMany({
      select: {
        id: true,
        specialtyName: true,
        description: true,
      },
      orderBy: {
        id: "asc",
      },
    });

    return res.status(200).json({
      ok: true,
      data: specialties,
    });
  } catch (error) {
    console.error("Error al consultar especialidades:", error);

    return res.status(500).json({
      ok: false,
      message: "Error interno del servidor.",
    });
  }
}

export async function getSpecialtyById(req: Request, res: Response) {
  /* 
    #swagger.tags = ['Specialties']
    #swagger.summary = 'Encontrar especialidadpor su ID'
    #swagger.description = 'Permite consultar una especialidad por su ID, incluyendo sus médicos asociados. Roles permitidos: ADMIN, RECEPTIONIST, MANAGER y MEDIC.'
    #swagger.security = [{
    "bearerAuth": []
    }]
  */
  try {
    const specialtyId = Number(req.params.id);

    if (!Number.isInteger(specialtyId) || specialtyId <= 0) {
      return res.status(400).json({
        ok: false,
        message: "El ID de la especialidad no es válido.",
      });
    }

    const specialty = await prisma.specialty.findUnique({
      where: { id: specialtyId },
      select: {
        id: true,
        specialtyName: true,
        description: true,
        medics: {
          select: {
            id: true,
            professionalCode: true,
            user: {
              select: {
                userName: true,
                userEmail: true,
              },
            },
          },
        },
      },
    });

    if (!specialty) {
      return res.status(404).json({
        ok: false,
        message: "No se encontró la especialidad.",
      });
    }

    return res.status(200).json({
      ok: true,
      data: specialty,
    });
  } catch (error) {
    console.error("Error al consultar especialidad:", error);

    return res.status(500).json({
      ok: false,
      message: "Error interno del servidor.",
    });
  }
}

export async function updateSpecialty(req: Request, res: Response) {
  /* 
    #swagger.tags = ['Specialties']
    #swagger.summary = 'Actualizar especialidad'
    #swagger.description = 'Permite actualizar los datos de una especialidad. Acceso exclusivo para ADMIN.'
    #swagger.parameters['body'] = {
      in: 'body',
      description: 'Replace - specialtyName, description',
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
    const specialtyId = Number(req.params.id);

    if (!Number.isInteger(specialtyId) || specialtyId <= 0) {
      return res.status(400).json({
        ok: false,
        message: "El ID de la especialidad no es válido.",
      });
    }

    const validation = updateSpecialtySchema.safeParse(req.body);

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

    const specialty = await prisma.specialty.findUnique({
      where: { id: specialtyId },
    });

    if (!specialty) {
      return res.status(404).json({
        ok: false,
        message: "No se encontró la especialidad.",
      });
    }

    if (data.specialtyName && data.specialtyName !== specialty.specialtyName) {
      const existingSpecialty = await prisma.specialty.findUnique({
        where: { specialtyName: data.specialtyName },
      });

      if (existingSpecialty) {
        return res.status(409).json({
          ok: false,
          message: "El nombre de la especialidad ya está registrado.",
        });
      }
    }

    const updatedSpecialty = await prisma.specialty.update({
      where: { id: specialtyId },
      data,
    });

    return res.status(200).json({
      ok: true,
      message: "Especialidad actualizada exitosamente.",
      data: updatedSpecialty,
    });
  } catch (error) {
    console.error("Error al actualizar especialidad:", error);
    return res.status(500).json({
      ok: false,
      message: "Error interno del servidor.",
    });
  }
}

export async function deleteSpecialty(req: Request, res: Response) {
  /* 
    #swagger.tags = ['Specialties']
    #swagger.summary = 'Desactivar especialidad'
    #swagger.description = 'Permite eliminar una especialidad si no tiene médicos asociados. Acceso exclusivo para ADMIN.'
    #swagger.security = [{
    "bearerAuth": []
    }]
  */
  try {
    const specialtyId = Number(req.params.id);

    if (!Number.isInteger(specialtyId) || specialtyId <= 0) {
      return res.status(400).json({
        ok: false,
        message: "El ID de la especialidad no es válido.",
      });
    }

    const specialty = await prisma.specialty.findUnique({
      where: { id: specialtyId },
      include: {
        _count: {
          select: {
            medics: true,
          },
        },
      },
    });

    if (!specialty) {
      return res.status(404).json({
        ok: false,
        message: "No se encontró la especialidad.",
      });
    }

    if (specialty._count.medics > 0) {
      return res.status(409).json({
        ok: false,
        message:
          "No se puede eliminar una especialidad que tiene médicos asociados.",
      });
    }

    const deleteData = {
      where: {
        id: specialtyId,
      },
    };

    await prisma.specialty.delete(deleteData);

    return res.status(200).json({
      ok: true,
      message: "Especialidad eliminada exitosamente.",
    });
  } catch (error) {
    console.error("Error al eliminar especialidad:", error);

    return res.status(500).json({
      ok: false,
      message: "Error interno del servidor.",
    });
  }
}
