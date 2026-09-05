import { BloodGroup } from "../../../generated/prisma/enums.js";

export interface IDonorProfile {
  name: string;
  email: string;
  phoneNo: string;
  address: string;
  bloodGroup: BloodGroup;
  lastDonationDate?: string;
  nextDonationDate?: string;
  isAvailable?: boolean;
}

export interface IUpdateDonorProfile {
  name?: string;
  email?: string;
  phoneNo?: string;
  address?: string;
  bloodGroup?: BloodGroup;
  lastDonationDate?: string;
  nextDonationDate?: string;
  isAvailable?: boolean;
}