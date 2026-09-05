import {
  BloodGroup,
  RequestUrgency,
} from "../../../generated/prisma/enums.js";

export interface ICreateBloodRequest {
  bloodGroup: BloodGroup;
  unitsNeeded: number;
  hospitalName: string;
  location: string;
  contactNumber: string;
  urgency?: RequestUrgency;
  neededAt: string;
  description?: string;
}

export interface IUpdateBloodRequest {
  bloodGroup?: BloodGroup;
  unitsNeeded?: number;
  hospitalName?: string;
  location?: string;
  contactNumber?: string;
  urgency?: RequestUrgency;
  neededAt?: string;
  description?: string;
}