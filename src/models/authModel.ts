import { prisma } from "../config/prisma.js";

export const findUserByEmailModel = async (email: string) => {
  return await prisma.user.findUnique({
    where: {
      userEmail: email,
    },
    include: {
      role: true,
    },
  });
};

export const findUserByIdModel = async (userId: number) => {
  return await prisma.user.findUnique({
    where: {
      id: userId,
    },
    include: {
      role: true,
    },
  });
};

export const findUserForAuthModel = async (userId: number) => {
  return await prisma.user.findUnique({
    where: {
      id: userId,
    },
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
};