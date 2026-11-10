import type { Response, Request } from "express";
import { prisma } from "../config/prisma.js";
import { z } from "zod";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const loginSchema = z.object({
  email: z.string().email("Correo electrónico inválido"),
  password: z.string().min(1, "La contraseña es obligatoria"),
});

export async function login(req: Request, res: Response) {
  try {
    const validation = loginSchema.safeParse(req.body);

    if (!validation.success) {
      res.status(400).json({
        message: "Datos de inicio de sesión inválidos",
        errors: validation.error.flatten().fieldErrors,
      });
      return;
    }

    const { email, password } = validation.data;

    const findUser = await prisma.user.findUnique({
      where: { userEmail: email },
      include: { role: true },
    });

    if (!findUser || !findUser.status) {
      res.status(401).json({
        message: "Credenciales incorrectas",
      });
      return;
    }

    const matchPassword = await bcrypt.compare(password, findUser.userPassword);

    if (!matchPassword) {
      res.status(401).json({
        message: "Credenciales incorrectas",
      });
      return;
    }

    const jwtSecret = process.env.JWT_SECRET;

    if (!jwtSecret) {
      throw new Error("JWT_SECRET sin configurar");
    }

    const token = jwt.sign(
      {
        sub: String(findUser.id),
        role: findUser.role.roleName,
      },
      jwtSecret,
      {
        expiresIn: 86400,
      },
    );

    res.status(200).json({
      message: "Inicio de sesión exitoso",
      token,
      user: {
        id: findUser.id,
        userName: findUser.userName,
        userEmail: findUser.userEmail,
        role: findUser.role.roleName,
      },
    });
  } catch (error) {
    console.error("Error en login:", error);

    res.status(500).json({
      message: "Error interno del servidor",
    });
  }
}

export async function me(req: Request, res: Response) {
  try {

    const authUser = res.locals.authUser as {
      id: number;
      role: string;
    };

    const user = await prisma.user.findUnique({
      where: {
        id: authUser.id,
      },
      include: {
        role: true,
      },
    });

    if (!user || !user.status) {
      res.status(401).json({
        message: "Usuario no autorizado",
      });
      return;
    }
    
    res.status(200).json({
      message: "Usuario autenticado correctamente",
      user: {
        id: user.id,
        userName: user.userName,
        userEmail: user.userEmail,
        role: user.role.roleName,
      },
    });
  } catch (error) {
    console.error("Error al obtener usuario:", error);

    res.status(500).json({
      message: "Error interno del servidor",
    });
  }
}