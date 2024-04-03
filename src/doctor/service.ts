import { DoctorModel } from "../model-exports";
import { DoctorDataDTO } from "./model";
import { Types } from "mongoose";

export const updateDoctor = async(doctorData: DoctorDataDTO) => {
    
    try {
        //todo: Verify if this query is following best practices.
        const updatedDoctorDocument =  await DoctorModel.findOneAndReplace({_id: new Types.ObjectId(doctorData._id)}, doctorData, {
            upsert: true,
            returnNewDocument: true
        });
        return convertDoctorDboToDto(updatedDoctorDocument)
    } catch(error) {
        throw error; // todo: Add proper error handling
    }
}

export const createDoctor = async(doctorData: DoctorDataDTO) => {
    try {
        const newDoctor = new DoctorModel({
            name: doctorData.name,
            password: doctorData.password,
            schedule: doctorData.schedule
        })
        const newDoctorDocument =  await newDoctor.save();
        return convertDoctorDboToDto(newDoctorDocument)
    } catch(error) {
        console.log("Error while creating new doctor in the database : ", error);
        throw error; // todo: Add proper error handling
    }
}

export const fetchDoctorById = async(doctorId: string, includePassword: boolean = false) => {
    try {
        const docterDocument = await DoctorModel.findById(new Types.ObjectId(doctorId));
        if(docterDocument) {
            return convertDoctorDboToDto(docterDocument, includePassword)
        }
        return null;
    } catch(error) {
        throw error; // todo: Add proper error handling
    }
}

// todo: this function assumes that doctor name is unique. We are ensuring this constraint through api. 
//       It needs to be applied to the model as well.
export const fetchDoctorByName = async(doctorName: string) => {
    try {
        const docterDocument =  await DoctorModel.findOne({name: doctorName});
        if(docterDocument) {
            return convertDoctorDboToDto(docterDocument);
        }
        return null;
    } catch(error) {
        throw error; // todo: Add proper error handling
    }
}

export const fetchDoctorsList = async() => {
    try {
        const doctorDocumentsList = await DoctorModel.find();
        // console.log(doctorDocumentsList)
        return doctorDocumentsList.map(doctorDocument => convertDoctorDboToDto(doctorDocument));
    } catch(error) {
        throw error; // todo: Add proper error handling
    }
}

export const getDoctorByIdAndPassword = async(id: string, password: string) => {
    try {
        const doctor = await fetchDoctorById(id, true)
        if(doctor?.password == password) {
            return convertDoctorDboToDto(doctor);
        }
        return null;
    } catch(error) {
        throw error; // todo: Add proper error handling
    }
}

export const convertDoctorDboToDto = (doctorDocument: any, includePassword: boolean = false) => {
    const doctorDataDto: DoctorDataDTO = {
        _id: doctorDocument._id.toString(),
        name: doctorDocument.name,
        schedule: doctorDocument.schedule
    }
    if(includePassword) {
        doctorDataDto.password = doctorDocument.password
    }
    return doctorDataDto
}