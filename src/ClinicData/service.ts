import { Types } from "mongoose";
import { ClinicDataModel } from "../model-exports";
import { ClinicData, ClinicDataDTO } from "./model";
import { logger } from "../logger";

export const persistUpdatedClinicData = async(clinicDataDto: ClinicDataDTO) => {
    try {
        const clinicDataDbo: ClinicData = {
            patientSeenStatusList: clinicDataDto.patientSeenStatusList,
            doctor: new Types.ObjectId(clinicDataDto.doctorId),
            currentStatus: clinicDataDto.currentStatus,
            date: clinicDataDto.date
        }
        //todo: Verify if this query is following the best practices.
        return await ClinicDataModel.findOneAndReplace({date: clinicDataDto.date, doctor: new Types.ObjectId(clinicDataDto.doctorId)}, clinicDataDbo, {
            upsert: true,
            returnNewDocument: true
        });
    } catch(error) {
        throw error; // todo: Add proper error handling
    }
}

export const fetchClinicDataByDateAndDoctor = async(date: string, doctorId: string) => {
    try {
        // logger.info("Going to fetch clinic data");
        return await ClinicDataModel.findOne(ClinicDataModel.where({ date: date, doctor: new Types.ObjectId(doctorId) }));
    } catch(error) {
        logger.error("Error while fetching clinic data from mongo", error);
        throw error; // todo: Add proper error handling
    }
}