import { prisma } from "../config/prisma.js";

export const findExistingPatientModel = async (
  personalId: string,
  patientEmail: string,
) => {
  return await prisma.patient.findFirst({
    where: {
      OR: [
        { personalId },
        { patientEmail },
      ],
    },
  });
};

export const createPatientModel = async (data: {
  patientName: string;
  patientLastName: string;
  personalId: string;
  birthDate: Date;
  patientEmail: string;
  patientPhone?: string;
  patientAddress?: string;
}) => {
  return await prisma.patient.create({
    data,
    select: {
      id: true,
      personalId: true,
      patientEmail: true,
    },
  });
};

export const getPatientsModel = async () => {
  return await prisma.patient.findMany({
    select: {
      id: true,
      patientName: true,
      patientLastName: true,
      personalId: true,
      patientEmail: true,
    },
    orderBy: {
      id: "asc",
    },
  });
};

export const getPatientByIdModel = async (id: number) => {
  return await prisma.patient.findUnique({
    where: { id },
    include: {
      appointments: {
        orderBy: {
          appointmentDate: "desc",
        },
        include: {
          medic: {
            include: {
              user: {
                select: {
                  userName: true,
                  userEmail: true,
                },
              },
              specialty: {
                select: {
                  specialtyName: true,
                },
              },
            },
          },
        },
      },
    },
  });
};

export const findPatientAppointmentsModel = async (patientId: number) => {
  return await prisma.patient.findUnique({
    where: { id: patientId },
    select: {
      patientName: true,
      patientLastName: true,
    },
  });
};

export const getPatientAppointmentsModel = async (patientId: number) => {
  return await prisma.appointment.findMany({
    where: { patientId },
    include: {
      medic: {
        include: {
          user: {
            select: {
              userName: true,
            },
          },
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

export const findPatientToUpdateModel = async (id: number) => {
  return await prisma.patient.findUnique({
    where: { id },
  });
};

export const findDuplicatedPatientModel = async (
  id: number,
  duplicatedInfo: (
    | { personalId: string }
    | { patientEmail: string }
  )[],
) => {
  return await prisma.patient.findFirst({
    where: {
      id: { not: id },
      OR: duplicatedInfo,
    },
  });
};

export const updatePatientModel = async (
  id: number,
  data: {
    patientName?: string;
    patientLastName?: string;
    personalId?: string;
    birthDate?: Date;
    patientEmail?: string;
    patientPhone?: string | null;
    patientAddress?: string | null;
  },
) => {
  return await prisma.patient.update({
    where: { id },
    data,
  });
};