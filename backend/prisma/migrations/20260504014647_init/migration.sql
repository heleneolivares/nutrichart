-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Patient" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "sex" TEXT NOT NULL,
    "birthDate" TIMESTAMP(3) NOT NULL,
    "activityLevel" TEXT NOT NULL DEFAULT 'moderado',
    "phone" TEXT,
    "email" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Patient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Consultation" (
    "id" SERIAL NOT NULL,
    "patientId" INTEGER NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "anamnesis" TEXT,
    "weight" DOUBLE PRECISION,
    "height" DOUBLE PRECISION,
    "sittingHeight" DOUBLE PRECISION,
    "armRelaxed" DOUBLE PRECISION,
    "armFlexed" DOUBLE PRECISION,
    "forearm" DOUBLE PRECISION,
    "waistMin" DOUBLE PRECISION,
    "hipMax" DOUBLE PRECISION,
    "medialThigh" DOUBLE PRECISION,
    "maxCalf" DOUBLE PRECISION,
    "humeral" DOUBLE PRECISION,
    "femoral" DOUBLE PRECISION,
    "bistyloid" DOUBLE PRECISION,
    "bimalleolar" DOUBLE PRECISION,
    "triceps" DOUBLE PRECISION,
    "subscapular" DOUBLE PRECISION,
    "biceps" DOUBLE PRECISION,
    "iliacCrest" DOUBLE PRECISION,
    "supraspinal" DOUBLE PRECISION,
    "abdominal" DOUBLE PRECISION,
    "anteriorThigh" DOUBLE PRECISION,
    "medialCalf" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Consultation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- AddForeignKey
ALTER TABLE "Patient" ADD CONSTRAINT "Patient_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Consultation" ADD CONSTRAINT "Consultation_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;
