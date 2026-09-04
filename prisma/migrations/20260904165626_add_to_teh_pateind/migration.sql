/*
  Warnings:

  - You are about to drop the column `contactNumber` on the `patients` table. All the data in the column will be lost.
  - Added the required column `address` to the `patients` table without a default value. This is not possible if the table is not empty.
  - Added the required column `bloodGroup` to the `patients` table without a default value. This is not possible if the table is not empty.
  - Added the required column `phoneNo` to the `patients` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "BloodGroup" AS ENUM ('A_POSITIVE', 'A_NEGATIVE', 'B_POSITIVE', 'B_NEGATIVE', 'AB_POSITIVE', 'AB_NEGATIVE', 'O_POSITIVE', 'O_NEGATIVE');

-- CreateEnum
CREATE TYPE "RequestUrgency" AS ENUM ('NORMAL', 'URGENT', 'EMERGENCY');

-- CreateEnum
CREATE TYPE "BloodRequestStatus" AS ENUM ('PENDING', 'MATCHED', 'FULFILLED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "DonationStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('REQUEST', 'RESPONSE', 'DONATION', 'SYSTEM', 'OTHER');

-- DropIndex
DROP INDEX "patients_email_key";

-- AlterTable
ALTER TABLE "patients" DROP COLUMN "contactNumber",
ADD COLUMN     "address" TEXT NOT NULL,
ADD COLUMN     "bloodGroup" "BloodGroup" NOT NULL,
ADD COLUMN     "phoneNo" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "blood_requests" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "bloodGroup" "BloodGroup" NOT NULL,
    "unitsNeeded" INTEGER NOT NULL,
    "hospitalName" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "contactNumber" TEXT NOT NULL,
    "urgency" "RequestUrgency" NOT NULL DEFAULT 'NORMAL',
    "neededAt" TIMESTAMP(3) NOT NULL,
    "description" TEXT,
    "status" "BloodRequestStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "blood_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "donation_history" (
    "id" TEXT NOT NULL,
    "donorId" TEXT NOT NULL,
    "bloodRequestId" TEXT NOT NULL,
    "donationDate" TIMESTAMP(3),
    "status" "DonationStatus" NOT NULL DEFAULT 'PENDING',
    "message" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "donation_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "donors" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phoneNo" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "bloodGroup" "BloodGroup" NOT NULL,
    "lastDonationDate" TIMESTAMP(3),
    "nextDonationDate" TIMESTAMP(3),
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "donors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "donation_history_donorId_bloodRequestId_key" ON "donation_history"("donorId", "bloodRequestId");

-- CreateIndex
CREATE UNIQUE INDEX "donors_userId_key" ON "donors"("userId");

-- AddForeignKey
ALTER TABLE "blood_requests" ADD CONSTRAINT "blood_requests_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "donation_history" ADD CONSTRAINT "donation_history_donorId_fkey" FOREIGN KEY ("donorId") REFERENCES "donors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "donation_history" ADD CONSTRAINT "donation_history_bloodRequestId_fkey" FOREIGN KEY ("bloodRequestId") REFERENCES "blood_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "donors" ADD CONSTRAINT "donors_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
