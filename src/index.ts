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

app.use("/clinicData", clinicDataRouter());
// app.use(resourceNotFoundHandler);
// app.use(errorHandler);

async function initializeServer() {
    try {
        await mongoose.connect("mongodb://127.0.0.1:27017/trackappointment");
        console.log("Successfully connected with mongodb");
        const clinicData = await fetchClinicDataByDate(getTodaysDate());
        if(clinicData) {
            populateClinicDataDto(clinicDataDto, clinicData);
        }
        else {
            clinicDataDto.currentStatus = SessionCurrentStatus.NOT_STARTED;
            clinicDataDto.doctorName = "Dr Madnani"
            clinicDataDto.startTime = "11 am"
            for(let i=0; i<200; i++) {
                clinicDataDto.patientSeenStatusList.push({id: i+1, status: false});
            }
        }
        // console.log("Clinic Data Dto : ", clinicDataDto);
    } catch(err) {
        console.log(`Error while connecting to mongodb: ${err}`);
    }
    
}

app.listen(port, async () => {
    await initializeServer();
    console.log(`Node server is running at port ${port}`);
});


function populateClinicDataDto(clinicDataDto: ClinicDataDTO, clinicData: mongoose.Document<unknown, import("@typegoose/typegoose/lib/types").BeAnObject, ClinicData> & Omit<ClinicData & { _id: mongoose.Types.ObjectId; }, "typegooseName"> & import("@typegoose/typegoose/lib/types").IObjectWithTypegooseFunction) {
    throw new Error("Function not implemented.");
}

