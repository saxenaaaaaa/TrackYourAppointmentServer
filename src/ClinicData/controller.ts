import { NextFunction, Request, Response } from "express";
import { ClinicDataDTO, SessionCurrentStatus } from "./model";
import { HttpStatusCode } from "../helpers/response-handler";
import { getTodaysDate } from "../util/util";
import { persistUpdatedClinicData } from "./service";

export let clinicDataDto: ClinicDataDTO = {
    patientSeenStatusList: new Array<{ id: number, status: boolean }>(),
    doctorName: "",
    schedule: "",
    currentStatus: SessionCurrentStatus.NOT_STARTED,
    date: getTodaysDate()
};

let subscribers: any[] = [];

function sendUpdatesToAll(clinicDataDto: ClinicDataDTO) {
    subscribers.forEach(subscriber => subscriber.response.write(`data: ${JSON.stringify(clinicDataDto)}\n\n`));
}

export const updateClinicData = async function (request: Request, response: Response, next?: NextFunction) {
    // response.promise(async () => {
    console.log("Got update request")
    populateClinicDataDto(clinicDataDto, request.body);
    await persistUpdatedClinicData(clinicDataDto);
    sendUpdatesToAll(clinicDataDto);
    response.status(HttpStatusCode.OK).send("Update Sent");
    // });
}

export const getClinicData = async function (request: Request, response: Response, next: NextFunction) {
    // response.promise(async () => {
    console.log("Received get request.");
    const headers = {
        'Content-Type': 'text/event-stream',
        'Connection': 'keep-alive',
        'Cache-Control': 'no-cache'
    };
    response.writeHead(200, headers);

    const data = `data: ${JSON.stringify(clinicDataDto)}\n\n`;

    response.write(data);

    const subscriberId = Date.now();

    const newSubscriber = {
        id: subscriberId,
        response
    };

    subscribers.push(newSubscriber);

    request.on('close', () => {
        console.log(`${subscriberId} Connection closed`);
        subscribers = subscribers.filter(subscriber => subscriber.id !== subscriberId);
    });
    // response.end();
    // });
}

function populateClinicDataDto(clinicDataDto: ClinicDataDTO, data: any) {
    clinicDataDto.currentStatus = data.currentStatus;
    clinicDataDto.doctorName = data.doctorName;
    clinicDataDto.schedule = data.schedule;
    clinicDataDto.patientSeenStatusList = data.patientSeenStatusList;
    clinicDataDto.date = data.date;
}
