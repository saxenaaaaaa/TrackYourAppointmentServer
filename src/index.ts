import express, {Express, Request, Response, NextFunction} from "express";
import dotenv from "dotenv"; 
import mongoose from "mongoose";
// import { HttpStatusCode, responsePromisifier } from "./helpers/response-handler";
// import { AppError } from "./helpers/error";
import { patientSeenStatusRouter } from "./PatientSeenStatus/route";
import { patientSeenStatusGrid } from "./PatientSeenStatus/controller";

dotenv.config();

const app: Express = express();
const port = process.env.PORT ?? 8000;

app.use(express.urlencoded()); // To parse URL-encoded bodies
app.use(express.json());
// app.use(responsePromisifier)

// const resourceNotFoundHandler = (request: Request, response: Response, next?: NextFunction) => {
//     response.promise(new AppError("Invalid URL path.",HttpStatusCode.NOT_FOUND));
// }

// const errorHandler = (error: Error, request: Request, response: Response, next?: NextFunction) => {
//     response.promise(() => {throw error;});
// }

app.use("/patientSeenStatus", patientSeenStatusRouter());
// app.use(resourceNotFoundHandler);
// app.use(errorHandler);

function initializeServer() {
    for(let i=0; i<200; i++) {
        patientSeenStatusGrid.patientSeenStatusList.push({id: i+1, status: false});
    }
}

app.listen(port, async () => {
    initializeServer();
    console.log(`Node server is running at port ${port}`);
});


