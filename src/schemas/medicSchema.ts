import { z } from "zod";

export const createMedicSchema = z.object({
  userName: z.string().trim().min(1, "El nombre es obligatorio."),
  userEmail: z.string().email("Correo electrónico inválido."),
  password: z
    .string()
    .min(6, "La contraseña debe tener al menos 6 caracteres."),
  professionalCode: z
    .string()
    .trim()
    .min(1, "El código profesional es obligatorio."),
  medicPhone: z.string().optional(),
  specialtyId: z.number().int().positive(),
});

export const updateMedicSchema = createMedicSchema
  .omit({ password: true })
  .partial()
  .extend({
    password: z.string().min(6).optional(),
  });