import type { Request, Response } from "express";

export async function getReports(
  req: Request,
  res: Response
) {
  try {
    res.status(200).json({
      message: "Módulo de reportes funcionando",
    });
  } catch (error) {
    console.error("Error al obtener reportes:", error);

    res.status(500).json({
      message: "Error interno del servidor",
    });
  }
}