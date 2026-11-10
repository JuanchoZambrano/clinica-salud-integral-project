-- CreateEnum
CREATE TYPE "AppointmentStatus" AS ENUM ('SCHEDULED', 'COMPLETED', 'CANCELLED');

-- CreateTable
CREATE TABLE "roles" (
    "id" SERIAL NOT NULL,
    "roleName" VARCHAR(30) NOT NULL,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "userName" VARCHAR(100) NOT NULL,
    "userEmail" VARCHAR(120) NOT NULL,
    "userPassword" VARCHAR(255) NOT NULL,
    "status" BOOLEAN NOT NULL DEFAULT true,
    "roleId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "patients" (
    "id" SERIAL NOT NULL,
    "patientName" VARCHAR(100) NOT NULL,
    "patientLastName" VARCHAR(100) NOT NULL,
    "personalId" VARCHAR(30) NOT NULL,
    "birthDate" DATE NOT NULL,
    "patientEmail" VARCHAR(120) NOT NULL,
    "patientPhone" VARCHAR(20),
    "patientAddress" VARCHAR(200),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "patients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "specialties" (
    "id" SERIAL NOT NULL,
    "specialtyName" VARCHAR(100) NOT NULL,
    "description" TEXT,

    CONSTRAINT "specialties_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "medics" (
    "id" SERIAL NOT NULL,
    "professionalCode" VARCHAR(50) NOT NULL,
    "medicPhone" VARCHAR(20),
    "userId" INTEGER NOT NULL,
    "specialtyId" INTEGER NOT NULL,

    CONSTRAINT "medics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "appointments" (
    "id" SERIAL NOT NULL,
    "appointmentDate" TIMESTAMP(3) NOT NULL,
    "observation" TEXT,
    "status" "AppointmentStatus" NOT NULL DEFAULT 'SCHEDULED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "patientId" INTEGER NOT NULL,
    "medicId" INTEGER NOT NULL,

    CONSTRAINT "appointments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "roles_roleName_key" ON "roles"("roleName");

-- CreateIndex
CREATE UNIQUE INDEX "users_userName_key" ON "users"("userName");

-- CreateIndex
CREATE UNIQUE INDEX "users_userEmail_key" ON "users"("userEmail");

-- CreateIndex
CREATE INDEX "users_roleId_idx" ON "users"("roleId");

-- CreateIndex
CREATE UNIQUE INDEX "patients_personalId_key" ON "patients"("personalId");

-- CreateIndex
CREATE UNIQUE INDEX "patients_patientEmail_key" ON "patients"("patientEmail");

-- CreateIndex
CREATE UNIQUE INDEX "specialties_specialtyName_key" ON "specialties"("specialtyName");

-- CreateIndex
CREATE UNIQUE INDEX "medics_professionalCode_key" ON "medics"("professionalCode");

-- CreateIndex
CREATE UNIQUE INDEX "medics_userId_key" ON "medics"("userId");

-- CreateIndex
CREATE INDEX "medics_specialtyId_idx" ON "medics"("specialtyId");

-- CreateIndex
CREATE INDEX "appointments_medicId_appointmentDate_idx" ON "appointments"("medicId", "appointmentDate");

-- CreateIndex
CREATE INDEX "appointments_patientId_appointmentDate_idx" ON "appointments"("patientId", "appointmentDate");

-- CreateIndex
CREATE INDEX "appointments_appointmentDate_status_idx" ON "appointments"("appointmentDate", "status");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "medics" ADD CONSTRAINT "medics_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "medics" ADD CONSTRAINT "medics_specialtyId_fkey" FOREIGN KEY ("specialtyId") REFERENCES "specialties"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_medicId_fkey" FOREIGN KEY ("medicId") REFERENCES "medics"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
