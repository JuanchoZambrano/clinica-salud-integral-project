import type { Request, Response } from "express";
import {
  findExistingPatientModel,
  createPatientModel,
  getPatientsModel,
  getPatientByIdModel,
  findPatientToUpdateModel,
  findDuplicatedPatientModel,
  updatePatientModel,
  findPatientAppointmentsModel,
  getPatientAppointmentsModel,
} from "../models/patientModel.js";
import {
  createPatientSchema,
  updatePatientSchema,
} from "../schemas/patientSchema.js";

export async function createPatient(req: Request, res: Response) {
  /*
    #swagger.tags = ['Patients']
    #swagger.summary = 'Registrar un paciente'
    #swagger.description = 'Permite registrar un nuevo paciente. Roles permitidos: ADMIN y RECEPTIONIST.'
    #swagger.parameters['body'] = {
      in: 'body',
      description: 'Cuerpo para crear un paciente.',
      required: true,
      schema: {
        patientName: "",
        patientLastName: "",
        personalId: "",
        birthDate: "YYYY-MM-DDT00:00:00.000Z",
        patientEmail: "example@mail.com",
        patientPhone: "",
        patientAddress: ""
      }
    }
    #swagger.security = [{
      "bearerAuth": []
    }]
  */
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

    const existingPatient = await findExistingPatientModel(
      patientData.personalId,
      patientData.patientEmail,
    );

    if (existingPatient) {
      res.status(409).json({
        ok: false,
        message: "El ID del paciente o email ya existen.",
      });
      return;
    }

    const newPatient = await createPatientModel(patientData);

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
  /*
    #swagger.tags = ['Patients']
    #swagger.summary = 'Listar pacientes'
    #swagger.description = 'Permite consultar el listado de pacientes registrados. Roles permitidos: ADMIN y RECEPTIONIST.'
    #swagger.security = [{
      "bearerAuth": []
    }]
  */
  try {
    const patients = await getPatientsModel();

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
  /*
    #swagger.tags = ['Patients']
    #swagger.summary = 'Consultar paciente por ID'
    #swagger.description = 'Permite consultar la información de un paciente específico mediante su ID. Roles permitidos: ADMIN y RECEPTIONIST.'
    #swagger.security = [{
      "bearerAuth": []
    }]
  */
  try {
    const patientId = Number(req.params.id);
    if (!Number.isInteger(patientId) || patientId <= 0) {
      return res.status(400).json({
        ok: false,
        message: "El ID del paciente no es valido",
      });
    }

    const getPatient = await getPatientByIdModel(patientId);

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
  /*
    #swagger.tags = ['Patients']
    #swagger.summary = 'Consultar citas de un paciente'
    #swagger.description = 'Permite consultar el historial de citas de un paciente específico. Roles permitidos: ADMIN y RECEPTIONIST.'
    #swagger.security = [{
      "bearerAuth": []
    }]
  */
  try {
    const patientId = Number(req.params.id);
    if (!Number.isInteger(patientId) || patientId <= 0) {
      return res.status(400).json({
        ok: false,
        message: "El ID del paciente no es valido",
      });
    }

    const getPatient = await findPatientAppointmentsModel(patientId);

    if (!getPatient) {
      return res.status(404).json({
        ok: false,
        message: `No se encontró un paciente con el ID: ${patientId}`,
      });
    }

    const patientAppointments = await getPatientAppointmentsModel(patientId);

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
  /*
    #swagger.tags = ['Patients']
    #swagger.summary = 'Actualizar un paciente'
    #swagger.description = 'Permite actualizar la información de un paciente existente. Roles permitidos: ADMIN y RECEPTIONIST.'
    #swagger.parameters['body'] = {
      in: 'body',
      description: 'Replace - patientName, patientLastName, personalID, birthDate, patientEmail, patientPhone, patientAddress',
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
    const patientId = Number(req.params.id);
    if (!Number.isInteger(patientId) || patientId <= 0) {
      return res.status(400).json({
        ok: false,
        message: "El ID del paciente no es valido",
      });
    }

    const getPatient = await findPatientToUpdateModel(patientId);

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
      const existingPatient = await findDuplicatedPatientModel(
        patientId,
        duplicatedInfo,
      );

      if (existingPatient) {
        res.status(409).json({
          ok: false,
          message: "El ID del paciente o email ya existen.",
        });
        return;
      }
    }

    const updatePatient = await updatePatientModel(patientId, patientNewData);

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
