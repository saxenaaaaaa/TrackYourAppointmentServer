import { getModelForClass } from "@typegoose/typegoose";
import { ClinicData } from "./ClinicData/model";

export const ClinicDataModel = getModelForClass(ClinicData);