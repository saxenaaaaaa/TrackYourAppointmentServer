import express, {Express, Request, Response, NextFunction} from "express";
import dotenv, { populate } from "dotenv"; 
import mongoose from "mongoose";
// import { HttpStatusCode, responsePromisifier } from "./helpers/response-handler";
// import { AppError } from "./helpers/error";
import { clinicDataRouter } from "./ClinicData/route";
import { clinicDataDto } from "./ClinicData/controller";
import { ClinicDataDTO, SessionCurrentStatus } from "./ClinicData/model";
import { fetchClinicDataByDate } from "./ClinicData/service";
import { getTodaysDate } from "./util/util";
import cors from "cors";
import fs from "fs";
import https from "https";

dotenv.config();

const app: Express = express();
const port = parseInt(process.env.PORT ?? "8000");

app.use(express.urlencoded()); // To parse URL-encoded bodies
app.use(express.json());

// even if both server and client are running on localhost, they are considered to be different origins because they are running on different ports.
// They are running on same domain, but NOT same origin. Hence we need to use cors middleware to enable cors. This middleware set approapriate headers in the 
// response to enable cors.
app.use(cors()); 
// app.use(responsePromisifier)

// const resourceNotFoundHandler = (request: Request, response: Response, next?: NextFunction) => {
//     response.promise(new AppError("Invalid URL path.",HttpStatusCode.NOT_FOUND));
// }

// const errorHandler = (error: Error, request: Request, response: Response, next?: NextFunction) => {
//     response.promise(() => {throw error;});
// }
app.get("/health", (request: Request, response: Response, next: NextFunction) => {
    response.status(200).json({status: 'ok', message: "Server is running healthy"});
})

app.use("/clinicData", clinicDataRouter());
// app.use(resourceNotFoundHandler);
// app.use(errorHandler);

async function initializeServer() {
    try {
        clinicDataDto.currentStatus = SessionCurrentStatus.NOT_STARTED;
        clinicDataDto.doctorName = "Madnani"
        clinicDataDto.schedule = "12pm to 3pm, Everyday"
        for(let i=0; i<200; i++) {
            clinicDataDto.patientSeenStatusList.push({id: i+1, status: false});
        }
        await mongoose.connect(`mongodb://${process.env.MONGO_URI}/trackappointment`);
        console.log("Successfully connected with mongodb");
        const clinicData = await fetchClinicDataByDate(getTodaysDate());
        console.log("Fetched clinic data from mongo");
        if(clinicData) {
            populateClinicDataDto(clinicDataDto, clinicData);
        }
        // console.log("Clinic Data Dto : ", clinicDataDto);
    } catch(err) {
        console.log(`Error while connecting to mongodb: ${err}`);
    }
    
}

const privateKey = fs.readFileSync('/usr/src/app/certs/privkey.pem', 'utf8');
const certificate = fs.readFileSync('/usr/src/app/certs/fullchain.pem', 'utf8');
// const ca = fs.readFileSync('/path/to/your/ca.pem', 'utf8'); // Optional: Include CA certificate

const credentials = { key: privateKey, cert: certificate};
const httpsServer = https.createServer(credentials, app);

httpsServer.listen(port, async () => {
    await initializeServer();
    console.log(`Node server is running at port ${port}`);
});

// app.listen(port, async () => {
//     await initializeServer();
//     console.log(`Node server is running at port ${port}`);
// });

function populateClinicDataDto(clinicDataDto: ClinicDataDTO, data: any) {
    clinicDataDto.currentStatus = data.currentStatus;
    clinicDataDto.doctorName = data.doctorName;
    clinicDataDto.schedule = data.schedule;
    clinicDataDto.patientSeenStatusList = data.patientSeenStatusList;
    clinicDataDto.date = data.date;
}