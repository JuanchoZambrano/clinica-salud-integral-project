import { prisma } from "../config/prisma.js";

export const findPatientForAppointmentModel = async (
  patientId: number,
) => {
  return await prisma.patient.findUnique({
    where: { id: patientId },
  });
};

export const findMedicForAppointmentModel = async (
  medicId: number,
) => {
  return await prisma.medic.findUnique({
    where: { id: medicId },
  });
};

export const findRepeatedAppointmentForMedicModel = async (
  medicId: number,
  previous: Date,
  end: Date,
  appointmentId?: number,
) => {
  return await prisma.appointment.findFirst({
    where: {
      medicId,
      status: "SCHEDULED",
      ...(appointmentId !== undefined
        ? { id: { not: appointmentId } }
        : {}),
      appointmentDate: {
        gt: previous,
        lt: end,
      },
    },
  });
};

export const findRepeatedAppointmentForPatientModel = async (
  patientId: number,
  previous: Date,
  end: Date,
  appointmentId?: number,
) => {
  return await prisma.appointment.findFirst({
    where: {
      patientId,
      status: "SCHEDULED",
      ...(appointmentId !== undefined
        ? { id: { not: appointmentId } }
        : {}),
      appointmentDate: {
        gt: previous,
        lt: end,
      },
    },
  });
};

export const createAppointmentModel = async (data: {
  appointmentDate: Date;
  observation?: string;
  patientId: number;
  medicId: number;
}) => {
  return await prisma.appointment.create({
    data: {
      appointmentDate: data.appointmentDate,
      observation: data.observation,
      patientId: data.patientId,
      medicId: data.medicId,
    },
    select: {
      id: true,
      appointmentDate: true,
      patient: {
        select: {
          patientName: true,
          patientLastName: true,
        },
      },
      medic: {
        select: {
          professionalCode: true,
          specialty: {
            select: {
              specialtyName: true,
            },
          },
        },
      },
      observation: true,
      status: true,
    },
  });
};

export const getAppointmentsModel = async (where: any) => {
  return await prisma.appointment.findMany({
    where,
    orderBy: {
      id: "asc",
    },
    select: {
      id: true,
      appointmentDate: true,
      observation: true,
      patient: {
        select: {
          patientName: true,
          patientLastName: true,
        },
      },
      medic: {
        select: {
          professionalCode: true,
          specialty: {
            select: {
              specialtyName: true,
            },
          },
        },
      },
      status: true,
    },
  });
};

export const findAppointmentByIdModel = async (
  appointmentId: number,
  userId?: number,
) => {
  return await prisma.appointment.findFirst({
    where: {
      id: appointmentId,
      ...(userId !== undefined
        ? {
            medic: {
              is: {
                userId,
              },
            },
          }
        : {}),
    },
    select: {
      id: true,
      appointmentDate: true,
      observation: true,
      status: true,
      patient: {
        select: {
          id: true,
          patientName: true,
          patientLastName: true,
          personalId: true,
        },
      },
      medic: {
        select: {
          id: true,
          professionalCode: true,
          specialty: {
            select: {
              specialtyName: true,
            },
          },
        },
      },
    },
  });
};

export const findAppointmentToUpdateModel = async (
  appointmentId: number,
  userId?: number,
) => {
  return await prisma.appointment.findFirst({
    where: {
      id: appointmentId,
      ...(userId !== undefined
        ? {
            medic: {
              is: {
                userId,
              },
            },
          }
        : {}),
    },
  });
};

export const updateAppointmentModel = async (
  appointmentId: number,
  data: {
    appointmentDate: Date;
    observation?: string | null;
    patientId: number;
    medicId: number;
  },
) => {
  return await prisma.appointment.update({
    where: {
      id: appointmentId,
    },
    data: {
      appointmentDate: data.appointmentDate,
      observation: data.observation,
      patientId: data.patientId,
      medicId: data.medicId,
    },
    select: {
      id: true,
      appointmentDate: true,
      observation: true,
      status: true,
      patient: {
        select: {
          patientName: true,
          patientLastName: true,
        },
      },
      medic: {
        select: {
          professionalCode: true,
          specialty: {
            select: {
              specialtyName: true,
            },
          },
        },
      },
    },
  });
};

export const updateAppointmentStatusModel = async (
  appointmentId: number,
  status: "COMPLETED" | "CANCELLED",
) => {
  return await prisma.appointment.update({
    where: {
      id: appointmentId,
    },
    data: {
      status,
    },
    select: {
      id: true,
      patient: {
        select: {
          patientName: true,
          patientLastName: true,
        },
      },
      status: true,
    },
  });
};