import type { RequestHandler } from "express";

type RoleName = "ADMIN" | "RECEPTIONIST" | "MEDIC" | "MANAGER";

export const roleMiddleware = (...allowedRoles: RoleName[]): RequestHandler => {
  return (req, res, next) => {

    const authUser = res.locals.authUser as
      | { id: number; role: string }
      | undefined;

    if (!authUser) {
      res.status(401).json({
        message: "No estás autenticado",
      });
      return;
    }

    if (!allowedRoles.includes(authUser.role as RoleName)) {
      res.status(403).json({
        message: "No tienes permisos para realizar esta acción",
      });
      return;
    }
    next();
  };
};