import { prisma } from "../config/prisma.js";

export const findUserByEmailModel = async (userEmail: string) => {
  return await prisma.user.findUnique({
    where: { userEmail },
  });
};

export const findMedicByCodeModel = async (professionalCode: string) => {
  return await prisma.medic.findUnique({
    where: { professionalCode },
  });
};

export const findSpecialtyModel = async (specialtyId: number) => {
  return await prisma.specialty.findUnique({
    where: { id: specialtyId },
  });
};

export const findMedicRoleModel = async () => {
  return await prisma.role.findUnique({
    where: { roleName: "MEDIC" },
  });
};

export const createMedicTransactionModel = async (data: {
  userName: string;
  userEmail: string;
  hashedPassword: string;
  professionalCode: string;
  medicPhone?: string;
  specialtyId: number;
  roleId: number;
}) => {
  return await prisma.$transaction(async (tx) => {
    const newUser = await tx.user.create({
      data: {
        userName: data.userName,
        userEmail: data.userEmail,
        userPassword: data.hashedPassword,
        roleId: data.roleId,
      },
    });

    return await tx.medic.create({
      data: {
        professionalCode: data.professionalCode,
        medicPhone: data.medicPhone,
        specialtyId: data.specialtyId,
        userId: newUser.id,
      },
      select: {
        id: true,
        professionalCode: true,
        medicPhone: true,
        user: {
          select: {
            id: true,
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
    });
  });
};

export const getMedicsModel = async (specialtyId?: number) => {
  return await prisma.medic.findMany({
    where: {
      ...(specialtyId !== undefined ? { specialtyId } : {}),
      user: { status: true },
    },
    select: {
      id: true,
      professionalCode: true,
      medicPhone: true,
      user: {
        select: {
          userName: true,
          userEmail: true,
          status: true,
        },
      },
      specialty: {
        select: {
          id: true,
          specialtyName: true,
        },
      },
    },
    orderBy: { id: "asc" },
  });
};

export const getMedicByIdModel = async (medicId: number) => {
  return await prisma.medic.findUnique({
    where: { id: medicId },
    select: {
      id: true,
      professionalCode: true,
      medicPhone: true,
      user: {
        select: {
          userName: true,
          userEmail: true,
          status: true,
        },
      },
      specialty: {
        select: {
          id: true,
          specialtyName: true,
        },
      },
      appointments: {
        orderBy: { appointmentDate: "desc" },
        select: {
          id: true,
          appointmentDate: true,
          observation: true,
          status: true,
          patient: {
            select: {
              patientName: true,
              patientLastName: true,
              personalId: true,
            },
          },
        },
      },
    },
  });
};

export const findMedicToUpdateModel = async (medicId: number) => {
  return await prisma.medic.findUnique({
    where: { id: medicId },
    include: { user: true },
  });
};

export const findUserByEmailForUpdateModel = async (userEmail: string) => {
  return await prisma.user.findUnique({
    where: { userEmail },
  });
};

export const findMedicByCodeForUpdateModel = async (
  professionalCode: string,
) => {
  return await prisma.medic.findUnique({
    where: { professionalCode },
  });
};

export const updateMedicTransactionModel = async (
  medicId: number,
  userId: number,
  data: {
    userName?: string;
    userEmail?: string;
    hashedPassword?: string;
    professionalCode?: string;
    medicPhone?: string;
    specialtyId?: number;
  },
) => {
  return await prisma.$transaction(async (tx) => {
    const {
      userName,
      userEmail,
      hashedPassword,
      professionalCode,
      medicPhone,
      specialtyId,
    } = data;

    if (userName || userEmail || hashedPassword) {
      await tx.user.update({
        where: { id: userId },
        data: {
          ...(userName ? { userName } : {}),
          ...(userEmail ? { userEmail } : {}),
          ...(hashedPassword ? { userPassword: hashedPassword } : {}),
        },
      });
    }

    return await tx.medic.update({
      where: { id: medicId },
      data: {
        ...(professionalCode ? { professionalCode } : {}),
        ...(medicPhone !== undefined ? { medicPhone } : {}),
        ...(specialtyId !== undefined ? { specialtyId } : {}),
      },
      select: {
        id: true,
        professionalCode: true,
        medicPhone: true,
        user: {
          select: {
            userName: true,
            userEmail: true,
          },
        },
        specialty: {
          select: {
            id: true,
            specialtyName: true,
          },
        },
      },
    });
  });
};

export const findMedicToDeleteModel = async (medicId: number) => {
  return await prisma.medic.findUnique({
    where: { id: medicId },
    select: {
      id: true,
      userId: true,
    },
  });
};

export const deactivateMedicModel = async (userId: number) => {
  return await prisma.user.update({
    where: { id: userId },
    data: { status: false },
  });
};