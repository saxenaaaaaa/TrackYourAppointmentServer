import { NextFunction, Request, Response } from "express";
import { ClinicDataDTO } from "./model";
import { HttpStatusCode } from "../helpers/response-handler";
import { persistUpdatedClinicData } from "./service";
import { clinicDataByDoctorId, doctorList, populateClinicDataDto, subscribersByDoctorId } from "./cache";
import { logger } from "../logger";

function sendUpdatesToAll(doctorId: string, clinicDataDto: ClinicDataDTO) {
    logger.info("Subscribers by doctorId : ", subscribersByDoctorId.get(doctorId))
    subscribersByDoctorId.get(doctorId)!.forEach(subscriber => subscriber.response.write(`data: ${JSON.stringify(clinicDataDto)}\n\n`));
}

export const updateClinicData = async function (request: Request, response: Response, next?: NextFunction) {
    // response.promise(async () => {
    logger.info("Got update request")
    const doctorId = request.body.doctorId as string;
    if(doctorList.find(doctorDataDto => doctorDataDto._id == doctorId) === undefined) {
        response.status(HttpStatusCode.BAD_REQUEST).json({message: "Invalid doctor Id"});
    }
    else {
        const clinicDataDto = clinicDataByDoctorId.get(doctorId);
        const populatedClinicDataDto = populateClinicDataDto(request.body, doctorId, clinicDataDto);
        if(clinicDataDto === undefined) {
            clinicDataByDoctorId.set(doctorId, populatedClinicDataDto)
        }
        await persistUpdatedClinicData(populatedClinicDataDto);
        sendUpdatesToAll(doctorId, populatedClinicDataDto);
        response.status(HttpStatusCode.OK).send("Update Sent");
    }
    // });
}

export const getClinicData = async function (request: Request, response: Response, next: NextFunction) {
    // response.promise(async () => {
    logger.info("Received get request.");
    const doctorId = request.query.doctorId as string;
    const headers = {
        'Content-Type': 'text/event-stream',
        'Connection': 'keep-alive',
        'Cache-Control': 'no-cache'
    };
    response.writeHead(200, headers);
    // Todo: This should not have stale data because we reset the cache every night at 3am. Test this in action.
    const clinicDataDto = clinicDataByDoctorId.get(doctorId);
    const data = `data: ${JSON.stringify(clinicDataDto)}\n\n`;

    response.write(data);

    const subscriberId = Date.now();

    const newSubscriber = {
        id: subscriberId,
        response
    };
    logger.info("Subscribers by doctorId : ", subscribersByDoctorId.get(doctorId));
    logger.info("received doctor id ", doctorId);
    // todo: The following line will return undefined if wrong doctor name is passed by the client and the server will 
    // stop with an error. Implement proper error handling here.
    const subscribersForDoctor = subscribersByDoctorId.get(doctorId)!;
    subscribersForDoctor.push(newSubscriber);

    request.on('close', () => {
        logger.info(`${subscriberId} Connection closed`);
        let subscribersForDoctor = subscribersByDoctorId.get(doctorId)!;
        subscribersForDoctor = subscribersForDoctor.filter(subscriber => subscriber.id !== subscriberId);
        subscribersByDoctorId.set(doctorId,subscribersForDoctor);
    });
    // response.end();
    // });
}
