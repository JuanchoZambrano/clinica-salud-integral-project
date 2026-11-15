import { z } from "zod";

export const createAppointmentSchema = z.object({
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

export const updateAppointmentSchema = createAppointmentSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "Debe proporcionar al menos un campo para actualizar.",
  });

export const appointmentStatusSchema = z.enum([
  "SCHEDULED",
  "COMPLETED",
  "CANCELLED",
]);

export const updateAppointmentStatusSchema = z.object({
  status: z.enum(["COMPLETED", "CANCELLED"], {
    message: "El estado debe ser COMPLETED o CANCELLED.",
  }),
});