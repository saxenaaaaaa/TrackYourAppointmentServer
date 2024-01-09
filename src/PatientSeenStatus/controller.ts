import { NextFunction, Request, Response } from "express";
import { PatientSeenStatusGridDTO } from "./model";
import { HttpStatusCode } from "../helpers/response-handler";

export const patientSeenStatusGrid: PatientSeenStatusGridDTO = {
    patientSeenStatusList: new Array<{id: number, status: boolean}>()
};

let subscribers: any[] = [];

function sendUpdatesToAll() {
    subscribers.forEach(subscriber => subscriber.response.write(`data: ${JSON.stringify(patientSeenStatusGrid)}\n\n`));
}

export const updatePatientSeenStatus = async function (request: Request, response: Response, next?: NextFunction) {
    // response.promise(async () => {
        patientSeenStatusGrid.patientSeenStatusList = request.body.patientSeenStatusTable;
        sendUpdatesToAll();
        response.status(HttpStatusCode.OK).send("Update Sent");
    // });
}

export const getPatientSeenStatus = async function (request: Request, response: Response, next: NextFunction) {
    // response.promise(async () => {
        const headers = {
            'Content-Type': 'text/event-stream',
            'Connection': 'keep-alive',
            'Cache-Control': 'no-cache'
          };
          response.writeHead(200, headers);
        
          const data = `data: ${JSON.stringify(patientSeenStatusGrid)}\n\n`;
        
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
