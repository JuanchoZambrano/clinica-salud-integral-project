import type { RequestHandler } from "express";
import jwt from "jsonwebtoken";

export const authMiddleware: RequestHandler = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    console.log("AUTH MIDDLEWARE EJECUTADO: ", authHeader);

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({
        message: "No se proporciona token de autenticación.",
      });
      return;
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
      res.status(401).json({
        message: "Token no proporcionado",
      });
      return;
    }

    const jwtSecret = process.env.JWT_SECRET;

    if (!jwtSecret) {
      res.status(500).json({
        message: "Error al procesar el token.",
      });
      return;
    }

    const decodeToken = jwt.verify(token, jwtSecret);

    if (
      typeof decodeToken === "string" ||
      typeof decodeToken.sub !== "string" ||
      typeof decodeToken.role !== "string"
    ) {
      res.status(401).json({
        message: "Token inválido",
      });
      return;
    }

    res.locals.authUser = {
      id: Number(decodeToken.sub),
      role: decodeToken.role,
    };

    next();

  } catch (error) {
    res.status(401).json({
      message: "Token inválido o expirado",
    });
  }
};