import { NextFunction, Request, Response } from "express";
import { ClinicDataDTO } from "./model";
import { HttpStatusCode } from "../helpers/response-handler";
import { persistUpdatedClinicData } from "./service";
import { clinicDataByDoctorId, doctorList, populateClinicDataDto, subscribersByDoctorId, updateDoctorInCache } from "./cache";
import { logger } from "../logger";
import { getTodaysDate } from "../util/util";

function sendUpdatesToAll(doctorId: string, clinicDataDto: ClinicDataDTO) {
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
    const doctorId = request.query.doctorId as string;
    logger.info(`Received get request for doctorId : ${doctorId}`);
    const headers = {
        'Content-Type': 'text/event-stream',
        'Connection': 'keep-alive',
        'Cache-Control': 'no-cache'
    };
    response.writeHead(200, headers);

    // validate doctorId
    if(doctorList.findIndex(doctorDataDto => doctorId === doctorDataDto._id) == -1) {
        logger.info(`Invalid doctorid : ${doctorId}`);
        // the client will close the eventSource connection upon receiving the following response
        // because retrying connection with the same invalid doctorId doesn't make any sense.
        response.write(`event: error404\ndata: ${JSON.stringify({message: `Invalid doctorId : ${doctorId}`})}\n\n`);
        return;
    }
    
    // This should not have stale data because we reset the cache every night at 3am. 
    let clinicDataDto = clinicDataByDoctorId.get(doctorId);
    // but, still if the data is stale of the cache is empty for a valid doctor, we need to manage this
    if(clinicDataDto === undefined || (clinicDataDto.date !== getTodaysDate())) {
        logger.info(`Found stale clinic data for doctorId: ${doctorId}, clinicData: ${JSON.stringify(clinicDataDto)}`);
        //TODO: this is happening when we update clinicData without any subscribers. An incoming subscriber will receive stale data.
        //      Reproduce by creating a new doctor and updating its data by logging in. Then open its url in digitracker, it will
        //      show stale data. Now again update something in the clinic app. Then it will update correctly in digitracker.
        //      Root cause and fix this issue.
        await updateDoctorInCache(doctorId);
        clinicDataDto = clinicDataByDoctorId.get(doctorId);
    }

    const data = `data: ${JSON.stringify(clinicDataDto)}\n\n`;

    response.write(data);

    const subscriberId = Date.now();

    const newSubscriber = {
        id: subscriberId,
        response
    };
    logger.info(`Subscribers by doctorId : ${subscribersByDoctorId.get(doctorId)?.length}`);
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
