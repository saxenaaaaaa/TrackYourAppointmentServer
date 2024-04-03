import { getModelForClass } from "@typegoose/typegoose";
import { ClinicData } from "./ClinicData/model";
import { Doctor } from "./doctor/model";

export const ClinicDataModel = getModelForClass(ClinicData);
export const DoctorModel = getModelForClass(Doctor);