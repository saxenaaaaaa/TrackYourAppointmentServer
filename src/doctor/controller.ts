import { Request, Response, NextFunction } from "express";
import { DoctorDataDTO } from "./model";
import { HttpStatusCode } from "../helpers/response-handler";
import * as doctorService from "./service";
import { updateDoctorInCache } from "../ClinicData/cache";

export const createOrUpdateDoctor = async function (request: Request, response: Response, next?: NextFunction) {
    
    let doctorData: DoctorDataDTO = request.body;
    try {
        if(doctorData._id) {
            // request for update
            const doctorDocumentDto: DoctorDataDTO | null = await doctorService.fetchDoctorById(doctorData._id, true);
            if(doctorDocumentDto) {
                doctorData.schedule = doctorData.schedule ? doctorData.schedule : doctorDocumentDto.schedule;
                doctorData.name = doctorDocumentDto.name;
                // TODO: Ideally, we should allow password updation in a separate api and should update password only
                //       when the old password is passed. But since, only I as admin will be using the Admin app to update this,
                //       I am allowing even password updation from regular api.
                doctorData.password = doctorData.password ? doctorData.password : doctorDocumentDto.password;
                if(doctorData.password == doctorDocumentDto.password && doctorData.schedule == doctorDocumentDto.schedule) {
                    response.status(HttpStatusCode.OK).json({status: 200, message: "Record matches completely. Nothing to update"});
                }
                else {
                    await doctorService.updateDoctor(doctorData);
                    await updateDoctorInCache(doctorData._id);
                    response.status(HttpStatusCode.OK).json({status: 200, message: "Doctor data updated successfully."});
                }
            }
            else {
                console.log("Error occurred while updating doctor: Wrong _id passed");
                response.status(HttpStatusCode.BAD_REQUEST).json({message: 
                    "Error occurred while updating doctor: Wrong _id passed"
                });
            }
        }
        else {
            // request for create
            const existingDoctor: DoctorDataDTO | null = await doctorService.fetchDoctorByName(doctorData.name)
            if(existingDoctor) {
                response.status(HttpStatusCode.BAD_REQUEST).json({message: "Doctor with same name already exists."});
            }
            if(doctorData.name && doctorData.password && doctorData.schedule) {
                const createdDoctorDocumentDto = await doctorService.createDoctor(doctorData);
                await updateDoctorInCache(createdDoctorDocumentDto._id!);
                response.status(HttpStatusCode.OK).json({status: 200, message: "Record created or updated successfully."});
            }
            else {
                console.log("Error occurred while creating doctor: name, password and schedule are required fields.");
                response.status(HttpStatusCode.BAD_REQUEST).json({message: 
                    "Error occurred while creating doctor: name, password and schedule are required fields."
                });
            }
        }
    }
    catch (error) {
        console.log("Error occurred while creating/updating doctor", error);
        response.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({message: "Internal Server Error"});
    }
}

export const getDoctors = async function (request: Request, response: Response, next?: NextFunction) {
    try {
        console.log("Get Doctors called")
        const doctorsList: DoctorDataDTO[] = await doctorService.fetchDoctorsList();
        response.status(HttpStatusCode.OK).json({doctorsList: doctorsList});
    }
    catch (error) {
        console.log("Error occurred while getting the list of doctors", error);
        response.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({message: "Internal Server Error"});
    }
}

export const getDoctorById = async function (request: Request, response: Response, next?: NextFunction) {
    try {
        console.log("getDoctorById called");
        const doctorDocumentDto: DoctorDataDTO | null = await doctorService.fetchDoctorById(request.params.doctorId);
        if(doctorDocumentDto) {
            response.status(HttpStatusCode.OK).json({doctor: doctorDocumentDto});
        }
        else {
            response.status(HttpStatusCode.BAD_REQUEST).json({message: "Invalid doctor Id"});
        }
    } catch (error) {
        console.log("Error occurred while fetching doctor", error);
        response.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({message: "Internal Server Error"});
    }
}

export const login = async function (request: Request, response: Response, next?: NextFunction) {
    try {
        const {_id, password} = request.body;
        console.log("Doctor Login Called.")
        const doctorDocumentDto: DoctorDataDTO | null = await doctorService.fetchDoctorById(_id, true);
        if(doctorDocumentDto?.password == password) {
            response.status(HttpStatusCode.OK).json({doctor: doctorService.convertDoctorDboToDto(doctorDocumentDto)});
        }
        else {
            response.status(HttpStatusCode.UNAUTHORIZED).json({message: "Login failed! Wrong Password"});
        }
    }
    catch (error) {
        console.log("Error occurred while getting the list of doctors", error);
        response.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({message: "Internal Server Error"});
    }
}