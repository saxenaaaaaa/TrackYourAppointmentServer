import express, {Express, Request, Response, NextFunction} from "express";
import dotenv, { populate } from "dotenv"; 
import mongoose from "mongoose";
// import { HttpStatusCode, responsePromisifier } from "./helpers/response-handler";
// import { AppError } from "./helpers/error";
import { clinicDataRouter } from "./ClinicData/route";
import { clinicDataDto } from "./ClinicData/controller";
import { ClinicData, ClinicDataDTO, SessionCurrentStatus } from "./ClinicData/model";
import { fetchClinicDataByDate } from "./ClinicData/service";
import { getTodaysDate } from "./util/util";
import cors from "cors";

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
        clinicDataDto.startTime = "11 am"
        for(let i=0; i<200; i++) {
            clinicDataDto.patientSeenStatusList.push({id: i+1, status: false});
        }
        await mongoose.connect("mongodb://127.0.0.1:27017/trackappointment");
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

app.listen(port, "192.168.1.7", async () => {
    await initializeServer();
    console.log(`Node server is running at port ${port}`);
});

function populateClinicDataDto(clinicDataDto: ClinicDataDTO, data: any) {
    clinicDataDto.currentStatus = data.currentStatus;
    clinicDataDto.doctorName = data.doctorName;
    clinicDataDto.startTime = data.startTime;
    clinicDataDto.patientSeenStatusList = data.patientSeenStatusList;
    clinicDataDto.date = data.date;
}