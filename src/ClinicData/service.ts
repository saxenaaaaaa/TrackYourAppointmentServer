import { ClinicDataModel } from "../model-exports";
import { ClinicData, ClinicDataDTO } from "./model";

export const persistUpdatedClinicData = async(clinicDataDto: ClinicDataDTO) => {
    try {
        return await ClinicDataModel.findOneAndReplace({date: clinicDataDto.date, doctorName: clinicDataDto.doctorName}, clinicDataDto, {
            upsert: true,
            returnNewDocument: true
        });
    } catch(error) {
        throw error; // todo: Add proper error handling
    }
}

export const fetchClinicDataByDateAndName = async(date: string, doctorName: string) => {
    try {
        console.log("Going to fetch clinic data");
        return await ClinicDataModel.findOne(ClinicDataModel.where({ date: date, doctorName: doctorName }));
    } catch(error) {
        console.error("Error while fetching clinic data from mongo", error);
        throw error; // todo: Add proper error handling
    }
}