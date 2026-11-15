import { prisma } from "../config/prisma.js";

export const findExistingUserModel = async (
  userName: string,
  userEmail: string,
) => {
  return await prisma.user.findFirst({
    where: {
      OR: [{ userName }, { userEmail }],
    },
  });
};

export const findRoleByNameModel = async (roleName: string) => {
  return await prisma.role.findUnique({
    where: { roleName },
  });
};

export const createUserModel = async (data: {
  userName: string;
  userEmail: string;
  hashedPassword: string;
  roleId: number;
}) => {
  return await prisma.user.create({
    data: {
      userName: data.userName,
      userEmail: data.userEmail,
      userPassword: data.hashedPassword,
      roleId: data.roleId,
    },
    select: {
      id: true,
      userName: true,
      userEmail: true,
      status: true,
      role: {
        select: {
          roleName: true,
        },
      },
    },
  });
};

export const getUsersModel = async () => {
  return await prisma.user.findMany({
    select: {
      id: true,
      userName: true,
      userEmail: true,
      status: true,
      createdAt: true,
      role: {
        select: {
          roleName: true,
        },
      },
    },
    orderBy: {
      id: "asc",
    },
  });
};

export const findUserByIdModel = async (userId: number) => {
  return await prisma.user.findUnique({
    where: { id: userId },
    include: {
      role: true,
    },
  });
};

export const findDuplicateUserModel = async (
  userId: number,
  userName?: string,
  userEmail?: string,
) => {
  return await prisma.user.findFirst({
    where: {
      id: { not: userId },
      OR: [
        ...(userName ? [{ userName }] : []),
        ...(userEmail ? [{ userEmail }] : []),
      ],
    },
  });
};

export const updateUserModel = async (
  userId: number,
  data: {
    userName?: string;
    userEmail?: string;
    hashedPassword?: string;
    roleId?: number;
  },
) => {
  return await prisma.user.update({
    where: { id: userId },
    data: {
      ...(data.userName ? { userName: data.userName } : {}),
      ...(data.userEmail ? { userEmail: data.userEmail } : {}),
      ...(data.hashedPassword
        ? { userPassword: data.hashedPassword }
        : {}),
      ...(data.roleId ? { roleId: data.roleId } : {}),
    },
    select: {
      id: true,
      userName: true,
      userEmail: true,
      status: true,
      role: {
        select: {
          roleName: true,
        },
      },
    },
  });
};

export const findUserWithRoleModel = async (userId: number) => {
  return await prisma.user.findUnique({
    where: { id: userId },
    include: {
      role: true,
    },
  });
};

export const updateUserStatusModel = async (
  userId: number,
  status: boolean,
) => {
  return await prisma.user.update({
    where: { id: userId },
    data: {
      status,
    },
    select: {
      id: true,
      userName: true,
      userEmail: true,
      status: true,
      role: {
        select: {
          roleName: true,
        },
      },
    },
  });
};