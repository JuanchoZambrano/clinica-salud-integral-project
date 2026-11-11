
import type { RequestHandler } from "express";
import jwt from "jsonwebtoken";
import { prisma } from "../config/prisma.js";

const allowedRoles: string[] = [
  "ADMIN",
  "RECEPTIONIST",
  "MEDIC",
  "MANAGER",
];

export const authMiddleware: RequestHandler = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !/^Bearer\s+\S+$/i.test(authHeader)) {
      res.status(401).json({
        message: "No se proporciona un token válido.",
      });
      return;
    }

    const token = authHeader.replace(/^Bearer\s+/i, "").trim();
    const jwtSecret = process.env.JWT_SECRET;

    if (!jwtSecret) {
      res.status(500).json({
        message: "Error de configuración del servidor.",
      });
      return;
    }

    const decoded = jwt.verify(token, jwtSecret);

    if (typeof decoded === "string" || typeof decoded.sub !== "string") {
      res.status(401).json({
        message: "Token inválido.",
      });
      return;
    }

    const userId = Number(decoded.sub);

    if (!Number.isInteger(userId) || userId <= 0) {
      res.status(401).json({
        message: "Token inválido.",
      });
      return;
    }

    const userActive = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        status: true,
        role: {
          select: {
            roleName: true,
          },
        },
      },
    });

    if (!userActive || !userActive.status) {
      res.status(401).json({
        message: "Usuario inactivo o inexistente.",
      });
      return;
    }

    if (!allowedRoles.includes(userActive.role.roleName)) {
      res.status(401).json({
        message: "Rol de usuario inválido.",
      });
      return;
    }

    res.locals.authUser = {
      id: userActive.id,
      role: userActive.role.roleName,
    };

    next();
  } catch (error) {
    res.status(401).json({
      message: "Token inválido o expirado.",
    });
  }
};