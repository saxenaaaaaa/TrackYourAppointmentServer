import { NextFunction, Request, Response } from "express";
import { ClinicDataDTO, DoctorsList, clinicDataByName } from "./model";
import { HttpStatusCode } from "../helpers/response-handler";
import { persistUpdatedClinicData } from "./service";

export const subscribersByName: Map<string,any[]> = new Map<string,any[]>();

function sendUpdatesToAll(clinicDataDto: ClinicDataDTO) {
    subscribersByName.get(clinicDataDto.doctorName)!.forEach(subscriber => subscriber.response.write(`data: ${JSON.stringify(clinicDataDto)}\n\n`));
}

export const updateClinicData = async function (request: Request, response: Response, next?: NextFunction) {
    // response.promise(async () => {
    console.log("Got update request")
    const doctorName = request.body.doctorName as string;
    const clinicDataDto = clinicDataByName.get(doctorName)!;
    populateClinicDataDto(clinicDataDto, request.body);
    await persistUpdatedClinicData(clinicDataDto);
    sendUpdatesToAll(clinicDataDto);
    response.status(HttpStatusCode.OK).send("Update Sent");
    // });
}

export const getClinicData = async function (request: Request, response: Response, next: NextFunction) {
    // response.promise(async () => {
    console.log("Received get request.");
    const doctorName = request.query.doctorName as string;
    const headers = {
        'Content-Type': 'text/event-stream',
        'Connection': 'keep-alive',
        'Cache-Control': 'no-cache'
    };
    response.writeHead(200, headers);
    const clinicDataDto = clinicDataByName.get(doctorName);
    const data = `data: ${JSON.stringify(clinicDataDto)}\n\n`;

    response.write(data);

    const subscriberId = Date.now();

    const newSubscriber = {
        id: subscriberId,
        response
    };
    console.log("Subscribers by name : ", subscribersByName);
    console.log("received doctor name ", doctorName);
    // todo: The following line will return undefined if wrong doctor name is passed by the client and the server will 
    // stop with an error. Implement proper error handling here.
    const subscribersForDoctor = subscribersByName.get(doctorName)!;
    subscribersForDoctor.push(newSubscriber);

    request.on('close', () => {
        console.log(`${subscriberId} Connection closed`);
        let subscribersForDoctor = subscribersByName.get(doctorName)!;
        subscribersForDoctor = subscribersForDoctor.filter(subscriber => subscriber.id !== subscriberId);
        subscribersByName.set(doctorName,subscribersForDoctor);
    });
    // response.end();
    // });
}

export const getDoctorsList = async (request: Request, response: Response, next: NextFunction) => {
    response.status(HttpStatusCode.OK).json({ doctorsList: DoctorsList});
}

function populateClinicDataDto(clinicDataDto: ClinicDataDTO, data: any) {
    clinicDataDto.currentStatus = data.currentStatus;
    clinicDataDto.doctorName = data.doctorName;
    clinicDataDto.schedule = data.schedule;
    clinicDataDto.patientSeenStatusList = data.patientSeenStatusList;
    clinicDataDto.date = data.date;
}
