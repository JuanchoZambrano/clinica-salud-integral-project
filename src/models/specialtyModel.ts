import { prisma } from "../config/prisma.js";

export const findSpecialtyByNameModel = async (
  specialtyName: string,
) => {
  return await prisma.specialty.findUnique({
    where: { specialtyName },
  });
};

export const createSpecialtyModel = async (data: {
  specialtyName: string;
  description?: string;
}) => {
  return await prisma.specialty.create({
    data,
  });
};

export const getSpecialtiesModel = async () => {
  return await prisma.specialty.findMany({
    select: {
      id: true,
      specialtyName: true,
      description: true,
    },
    orderBy: {
      id: "asc",
    },
  });
};

export const getSpecialtyByIdModel = async (specialtyId: number) => {
  return await prisma.specialty.findUnique({
    where: {
      id: specialtyId,
    },
    select: {
      id: true,
      specialtyName: true,
      description: true,
      medics: {
        select: {
          id: true,
          professionalCode: true,
          user: {
            select: {
              userName: true,
              userEmail: true,
            },
          },
        },
      },
    },
  });
};

export const findSpecialtyByIdModel = async (specialtyId: number) => {
  return await prisma.specialty.findUnique({
    where: {
      id: specialtyId,
    },
  });
};

export const updateSpecialtyModel = async (
  specialtyId: number,
  data: {
    specialtyName?: string;
    description?: string;
  },
) => {
  return await prisma.specialty.update({
    where: {
      id: specialtyId,
    },
    data,
  });
};

export const findSpecialtyToDeleteModel = async (specialtyId: number) => {
  return await prisma.specialty.findUnique({
    where: {
      id: specialtyId,
    },
    include: {
      _count: {
        select: {
          medics: true,
        },
      },
    },
  });
};

export const deleteSpecialtyModel = async (specialtyId: number) => {
  const deleteData = {
    where: {
      id: specialtyId,
    },
  };

  return await prisma.specialty.delete(deleteData);
};