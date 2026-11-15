import { z } from "zod";

export const createUserSchema = z.object({
  userName: z.string().trim().min(1, "El nombre es obligatorio."),
  userEmail: z.string().trim().email("Correo electrónico inválido."),
  password: z.string().min(8, "La contraseña debe tener mínimo 8 caracteres."),
  roleName: z
    .string()
    .trim()
    .transform((value) => value.toUpperCase())
    .pipe(z.enum(["RECEPTIONIST", "MANAGER"])),
});

export const updateUserSchema = createUserSchema.partial();

export const updateUserStatusSchema = z.object({
  status: z.boolean({
    message: "El estado debe ser true o false.",
  }),
});