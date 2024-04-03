import express, { Router } from "express";
import * as clinicDataController from "./controller";
const router: Router = express.Router();

export const clinicDataRouter = () => {
    router.post("/update", clinicDataController.updateClinicData);
    router.get("/", clinicDataController.getClinicData);
    return router;
}