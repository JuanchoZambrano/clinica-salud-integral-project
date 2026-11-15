import { z } from "zod";

export const createSpecialtySchema = z.object({
  specialtyName: z.string().trim().min(1, "El nombre es obligatorio."),
  description: z.string().optional(),
});

export const updateSpecialtySchema = createSpecialtySchema.partial();