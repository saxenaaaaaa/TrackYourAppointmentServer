import { NextFunction, Request, Response } from "express";
import { ClinicDataDTO, SessionCurrentStatus } from "./model";
import { HttpStatusCode } from "../helpers/response-handler";

export const clinicDataDto: ClinicDataDTO = {
    patientSeenStatusList: new Array<{id: number, status: boolean}>(),
    doctorName: "",
    startTime: "",
    currentStatus: SessionCurrentStatus.NOT_STARTED
};

let subscribers: any[] = [];

function sendUpdatesToAll(clinicDataDto: ClinicDataDTO) {
    subscribers.forEach(subscriber => subscriber.response.write(`data: ${JSON.stringify(clinicDataDto)}\n\n`));
}

export const updateClinicData = async function (request: Request, response: Response, next?: NextFunction) {
    // response.promise(async () => {
        populateClinicDataDto(clinicDataDto, request.body);
        sendUpdatesToAll(clinicDataDto);
        response.status(HttpStatusCode.OK).send("Update Sent");
    // });
}

export const getClinicData = async function (request: Request, response: Response, next: NextFunction) {
    // response.promise(async () => {
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
    // });
}

function populateClinicDataDto(clinicDataDto: ClinicDataDTO, requestBody: any) {
    clinicDataDto.currentStatus = requestBody.currentStatus;
    clinicDataDto.doctorName = requestBody.doctorName;
    clinicDataDto.startTime = requestBody.startTime;
    clinicDataDto.patientSeenStatusList = requestBody.patientSeenStatusList;
}
