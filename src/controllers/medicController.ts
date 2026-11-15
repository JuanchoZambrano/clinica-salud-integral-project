import type { Request, Response } from "express";
import bcrypt from "bcrypt";
import {
  findUserByEmailModel,
  findMedicByCodeModel,
  findSpecialtyModel,
  findMedicRoleModel,
  createMedicTransactionModel,
  getMedicsModel,
  getMedicByIdModel,
  findMedicToUpdateModel,
  findUserByEmailForUpdateModel,
  findMedicByCodeForUpdateModel,
  updateMedicTransactionModel,
  findMedicToDeleteModel,
  deactivateMedicModel,
} from "../models/medicModel.js";
import {
  createMedicSchema,
  updateMedicSchema,
} from "../schemas/medicSchema.js";

export async function createMedic(req: Request, res: Response) {
  /*
    #swagger.tags = ['Medics']
    #swagger.summary = 'Registrar un médico'
    #swagger.description = 'Permite registrar un nuevo médico y crear su usuario de acceso. Rol permitido: ADMIN.'
    #swagger.parameters['body'] = {
      in: 'body',
      description: 'Cuerpo para crear un medico.',
      required: true,
      schema: {
        userName: "",
        userEmail: "example@mail.com",
        password: "",
        professionalCode: "",
        medicPhone: "",
        specialtyId: 1
      }
    }
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

    const existingUser = await findUserByEmailModel(userEmail);

    if (existingUser) {
      return res.status(409).json({
        ok: false,
        message: "El correo electrónico ya está registrado.",
      });
    }

    const existingMedic = await findMedicByCodeModel(professionalCode);

    if (existingMedic) {
      return res.status(409).json({
        ok: false,
        message: "El código profesional ya está registrado.",
      });
    }

    const specialty = await findSpecialtyModel(specialtyId);

    if (!specialty) {
      return res.status(404).json({
        ok: false,
        message: "La especialidad no existe.",
      });
    }

    const role = await findMedicRoleModel();

    if (!role) {
      return res.status(500).json({
        ok: false,
        message: "No existe el rol MEDIC en la base de datos.",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newMedic = await createMedicTransactionModel({
      userName,
      userEmail,
      hashedPassword,
      professionalCode,
      medicPhone,
      specialtyId,
      roleId: role.id,
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
    #swagger.summary = 'Listar y filtrar médicos'
    #swagger.description = 'Permite consultar todos los médicos o filtrarlos por especialidad mediante specialtyId. Roles permitidos: ADMIN, RECEPTIONIST y MANAGER.'
    #swagger.security = [{
      "bearerAuth": []
    }]
  */

  try {
    const specialtyId = req.query.specialtyId;

    if (
      specialtyId !== undefined &&
      (typeof specialtyId !== "string" || !/^[1-9]\d*$/.test(specialtyId))
    ) {
      return res.status(400).json({
        ok: false,
        message: "El ID de la especialidad no es válido.",
      });
    }

    const medics = await getMedicsModel(
      specialtyId !== undefined ? Number(specialtyId) : undefined,
    );

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

    const medic = await getMedicByIdModel(medicId);

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
    #swagger.parameters['body'] = {
      in: 'body',
      description: 'Replace - userName, userEmail, password, professionalCode, medicPhone, specialtyId',
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

    const medic = await findMedicToUpdateModel(medicId);

    if (!medic) {
      return res.status(404).json({
        ok: false,
        message: "No se encontró el médico.",
      });
    }

    if (data.userEmail && data.userEmail !== medic.user.userEmail) {
      const existingEmail = await findUserByEmailForUpdateModel(data.userEmail);

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
      const existingCode = await findMedicByCodeForUpdateModel(
        data.professionalCode,
      );

      if (existingCode) {
        return res.status(409).json({
          ok: false,
          message: "El código profesional ya está registrado.",
        });
      }
    }

    if (data.specialtyId) {
      const specialty = await findSpecialtyModel(data.specialtyId);
      
      if (!specialty) {
        return res.status(404).json({
          ok: false,
          message: "La especialidad no existe.",
        });
      }
    }

    const { userName, userEmail, password, ...medicData } = data;

    const updatedMedic = await updateMedicTransactionModel(
      medicId,
      medic.userId,
      {
        userName,
        userEmail,
        hashedPassword: password ? await bcrypt.hash(password, 10) : undefined,
        ...medicData,
      },
    );

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

    const medic = await findMedicToDeleteModel(medicId);

    if (!medic) {
      return res.status(404).json({
        ok: false,
        message: "No se encontró el médico.",
      });
    }

    await deactivateMedicModel(medic.userId);

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
