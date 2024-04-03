import express, {Express, Request, Response, NextFunction} from "express";
import dotenv, { populate } from "dotenv"; 
import mongoose from "mongoose";
// import { HttpStatusCode, responsePromisifier } from "./helpers/response-handler";
// import { AppError } from "./helpers/error";
import { clinicDataRouter } from "./ClinicData/route";
import cors from "cors";
import { doctorRouter } from "./doctor/route";
import { clinicDataByDoctorId, doctorList, initializeCache, subscribersByDoctorId } from "./ClinicData/cache";
import fs from "fs";
import https from "https";

dotenv.config();

const app: Express = express();
const port = parseInt(process.env.PORT ?? "8000");
// const serverIp = "192.168.1.5"

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

app.use("/doctor", doctorRouter());

async function initializeServer() {
    try {
        
        await mongoose.connect(`mongodb://${process.env.MONGO_URI}/trackappointment`);
        // await mongoose.connect("mongodb://127.0.0.1:27017/trackappointment")
        console.log("Successfully connected with mongodb");
        // initialize clinic data cache from mongo
        await initializeCache();
        console.log("Cache initialized with - ");
        console.log("doctorsList : ", doctorList);
        console.log("ClinicDataByDoctorId: ", clinicDataByDoctorId)
        console.log("SubscribersByDoctorId: ", subscribersByDoctorId)

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

// app.listen(port, "0.0.0.0", async () => {
//     await initializeServer();
//     console.log(`Node server is running at port ${port}`);
// });