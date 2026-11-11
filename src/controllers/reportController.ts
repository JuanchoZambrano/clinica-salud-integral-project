import type { Request, Response } from "express";
import { prisma } from "../config/prisma.js";

export async function getAppointmentsBySpecialty(req: Request, res: Response) {
  /*
    #swagger.tags = ['Reports']
    #swagger.summary = 'Consultar citas por especialidad'
    #swagger.description = 'Agrupa todas las citas por especialidad médica. Roles permitidos: ADMIN y MANAGER.'
    #swagger.security = [{ "bearerAuth": [] }]
  */

  try {
    const report = await prisma.$queryRaw`
      SELECT
        s."specialtyName",
        COUNT(a.id)::int AS "totalAppointments"
      FROM specialties s
      LEFT JOIN medics m ON m."specialtyId" = s.id
      LEFT JOIN appointments a ON a."medicId" = m.id
      GROUP BY s.id, s."specialtyName"
      ORDER BY "totalAppointments" DESC;
    `;

    return res.status(200).json({
      ok: true,
      data: report,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      ok: false,
      message: "Error al generar el reporte.",
    });
  }
}

export async function getDailyReport(req: Request, res: Response) {
  /*
    #swagger.tags = ['Reports']
    #swagger.summary = 'Consultar corte operativo diario'
    #swagger.description = 'Cuenta las citas completadas y canceladas de una fecha específica. Roles permitidos: ADMIN y MANAGER.'
    #swagger.security = [{ "bearerAuth": [] }]
  */

  try {
    const date = req.query.date;

    if (typeof date !== "string" || isNaN(Date.parse(date))) {
      return res.status(400).json({
        ok: false,
        message: "Debes proporcionar una fecha válida.",
      });
    }

    const start = new Date(`${date}T00:00:00-05:00`);
    const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);

    const report = await prisma.appointment.groupBy({
      by: ["status"],
      where: {
        appointmentDate: {
          gte: start,
          lt: end,
        },
        status: {
          in: ["COMPLETED", "CANCELLED"],
        },
      },
      _count: true,
    });

    return res.status(200).json({
      ok: true,
      date,
      completed:
        report.find((item) => item.status === "COMPLETED")?._count ?? 0,
      cancelled:
        report.find((item) => item.status === "CANCELLED")?._count ?? 0,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      ok: false,
      message: "Error al generar el reporte.",
    });
  }
}
