import type { Request, Response } from "express";
import { z } from "zod";
import {
  findSpecialtyByNameModel,
  createSpecialtyModel,
  getSpecialtiesModel,
  getSpecialtyByIdModel,
  findSpecialtyByIdModel,
  updateSpecialtyModel,
  findSpecialtyToDeleteModel,
  deleteSpecialtyModel,
} from "../models/specialtyModel.js";
import {
  createSpecialtySchema,
  updateSpecialtySchema,
} from "../schemas/specialtySchema.js";

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

    const existingSpecialty = await findSpecialtyByNameModel(specialtyName);

    if (existingSpecialty) {
      return res.status(409).json({
        ok: false,
        message: "La especialidad ya está registrada.",
      });
    }

    const newSpecialty = await createSpecialtyModel({
      specialtyName,
      description,
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
    const specialties = await getSpecialtiesModel();

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

    const specialty = await getSpecialtyByIdModel(specialtyId);

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

    const specialty = await findSpecialtyByIdModel(specialtyId);

    if (!specialty) {
      return res.status(404).json({
        ok: false,
        message: "No se encontró la especialidad.",
      });
    }

    if (data.specialtyName && data.specialtyName !== specialty.specialtyName) {
      const existingSpecialty = await findSpecialtyByNameModel(
        data.specialtyName,
      );

      if (existingSpecialty) {
        return res.status(409).json({
          ok: false,
          message: "El nombre de la especialidad ya está registrado.",
        });
      }
    }

    const updatedSpecialty = await updateSpecialtyModel(specialtyId, data);

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

    const specialty = await findSpecialtyToDeleteModel(specialtyId);

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

    await deleteSpecialtyModel(specialtyId);

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
