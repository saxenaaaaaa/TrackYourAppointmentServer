import { Request, Response, NextFunction } from "express";
import { DoctorDataDTO } from "./model";
import { HttpStatusCode } from "../helpers/response-handler";
import * as doctorService from "./service";
import { updateDoctorInCache } from "../ClinicData/cache";
import { logger } from "../logger";
import fs from "fs";
import QRCode from "qrcode";
import { SERVER_URI } from "../index";

export const createOrUpdateDoctor = async function (request: Request, response: Response, next?: NextFunction) {
    
    let doctorData: DoctorDataDTO = request.body;
    try {
        if(doctorData._id) {
            // request for update
            const doctorDocumentDto: DoctorDataDTO | null = await doctorService.fetchDoctorById(doctorData._id, true);
            if(doctorDocumentDto) {
                doctorData.schedule = doctorData.schedule ? doctorData.schedule : doctorDocumentDto.schedule;
                doctorData.name = doctorData.name ? doctorData.name : doctorDocumentDto.name;
                // TODO: Ideally, we should allow password updation in a separate api and should update password only
                //       when the old password is passed. But since, only I as admin will be using the Admin app to update this,
                //       I am allowing even password updation from regular api.
                doctorData.password = doctorData.password ? doctorData.password : doctorDocumentDto.password;
                if(doctorData.password == doctorDocumentDto.password && doctorData.schedule == doctorDocumentDto.schedule
                    && doctorData.name == doctorDocumentDto.name) {
                    response.status(HttpStatusCode.OK).json({status: 200, message: "Record matches completely. Nothing to update"});
                }
                else {
                    const existingDoctor: DoctorDataDTO | null = await doctorService.fetchDoctorByName(doctorData.name);
                    if(existingDoctor && existingDoctor._id !== doctorDocumentDto._id) {
                        response.status(HttpStatusCode.BAD_REQUEST).json({status: 200, message: "Doctor with same name already exists."});
                    }
                    else {
                        await doctorService.updateDoctor(doctorData);
                        await updateDoctorInCache(doctorData._id);
                        response.status(HttpStatusCode.OK).json({status: 200, message: "Doctor data updated successfully."});
                    }
                }
            }
            else {
                logger.error(`Error occurred while updating doctor. Wrong _id passed: ${doctorData._id}`);
                response.status(HttpStatusCode.BAD_REQUEST).json({message: 
                    `Error occurred while updating doctor: Wrong _id passed: ${doctorData._id}`
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
                logger.error("Error occurred while creating doctor: name, password and schedule are required fields.");
                response.status(HttpStatusCode.BAD_REQUEST).json({message: 
                    "Error occurred while creating doctor: name, password and schedule are required fields."
                });
            }
        }
    }
    catch (error) {
        logger.error("Error occurred while creating/updating doctor", error);
        response.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({message: "Internal Server Error"});
    }
}

export const getDoctors = async function (request: Request, response: Response, next?: NextFunction) {
    try {
        logger.info("Get Doctors called")
        const doctorsList: DoctorDataDTO[] = await doctorService.fetchDoctorsList();
        response.status(HttpStatusCode.OK).json({doctorsList: doctorsList});
    }
    catch (error) {
        logger.error("Error occurred while getting the list of doctors", error);
        response.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({message: "Internal Server Error"});
    }
}

export const getDoctorById = async function (request: Request, response: Response, next?: NextFunction) {
    try {
        logger.info(`getDoctorById called for doctorId: ${request.params.doctorId}`);
        const doctorDocumentDto: DoctorDataDTO | null = await doctorService.fetchDoctorById(request.params.doctorId);
        if(doctorDocumentDto) {
            response.status(HttpStatusCode.OK).json({doctor: doctorDocumentDto});
        }
        else {
            response.status(HttpStatusCode.BAD_REQUEST).json({message: "Invalid doctor Id"});
        }
    } catch (error) {
        logger.error("Error occurred while fetching doctor", error);
        response.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({message: "Internal Server Error"});
    }
}

export const login = async function (request: Request, response: Response, next?: NextFunction) {
    try {
        const {_id, password} = request.body;
        logger.info(`Doctor Login Called for doctorId: ${_id}`);
        const doctorDocumentDto: DoctorDataDTO | null = await doctorService.fetchDoctorById(_id, true);
        if(doctorDocumentDto?.password == password) {
            response.status(HttpStatusCode.OK).json({doctor: doctorService.convertDoctorDboToDto(doctorDocumentDto)});
        }
        else {
            response.status(HttpStatusCode.UNAUTHORIZED).json({message: "Login failed! Wrong Password"});
        }
    }
    catch (error) {
        logger.error("Error occurred while getting the list of doctors", error);
        response.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({message: "Internal Server Error"});
    }
}

export const generateQRCode = async function (request: Request, response: Response, next?: NextFunction) {
    const doctorId = request.params.doctorId;
    try {
        // const doctorDocumentDto: DoctorDataDTO | null = await doctorService.fetchDoctorById(doctorId);
        // if(doctorDocumentDto) {
            const webLink = `${SERVER_URI}/track/${doctorId}`
            const dirName = `assets/${doctorId}`
            const fileName = `${dirName}/qrcode.png`
            const qrCodeData: string = await QRCode.toDataURL(webLink);

            // Save QR code image to a file
            fs.mkdirSync(dirName, {recursive: true})
            fs.writeFileSync(fileName, qrCodeData.replace(/^data:image\/png;base64,/, ''), 'base64');
            logger.info(`QR Code generated successfully at ${fileName}`);


            response.status(HttpStatusCode.OK).json({message: `Succefully generated QR for doctor : ${doctorId}`});
        // }
        // else {
        //     response.status(HttpStatusCode.BAD_REQUEST).json({message: "Invalid doctor Id"});
        // }
    } catch (error) {
        logger.error(`Error occurred while generating QR for doctor : ${doctorId}`, error);
        response.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({message: "Internal Server Error"});
    }
}