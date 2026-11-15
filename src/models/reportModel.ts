import { prisma } from "../config/prisma.js";

export const getAppointmentsBySpecialtyModel = async () => {
  return await prisma.$queryRaw`
    SELECT
      s."specialtyName",
      COUNT(a.id)::int AS "totalAppointments"
    FROM specialties s
    LEFT JOIN medics m ON m."specialtyId" = s.id
    LEFT JOIN appointments a ON a."medicId" = m.id
    GROUP BY s.id, s."specialtyName"
    ORDER BY "totalAppointments" DESC;
  `;
};

export const getDailyReportModel = async (
  start: Date,
  end: Date,
) => {
  return await prisma.appointment.groupBy({
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
};