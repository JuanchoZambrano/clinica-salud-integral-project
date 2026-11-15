import { z } from "zod";

export const createPatientSchema = z.object({
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

  birthDate: z.coerce
    .date({ message: "Introduce una fecha y hora válidas." })
    .refine(
      (date) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return date <= today;
      },
      {
        message: "La fecha y hora no pueden ser mayores a la actual",
      },
    ),

  patientEmail: z
    .string()
    .trim()
    .email("Correo electronico invalido."),

  patientPhone: z
    .string()
    .max(20, "El telefono no puede tener mas de 20 caracteres.")
    .optional(),

  patientAddress: z
    .string()
    .max(200, "La dirección no puede tener más de 200 caracteres.")
    .optional(),
});

export const updatePatientSchema = createPatientSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "Debe proporcionar al menos un campo para actualizar.",
  });