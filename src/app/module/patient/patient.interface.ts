import type { BloodGroup } from "../../../generated/prisma/enums.js";

export interface IPatientProfile {
  name: string;
  email: string;
  phoneNo: string;
  address: string;
  bloodGroup: BloodGroup;
}