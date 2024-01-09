import express, { Router } from "express";
import * as patientSeenStatusController from "./controller";
const router: Router = express.Router();

export const patientSeenStatusRouter = () => {
    router.post("/update", patientSeenStatusController.updatePatientSeenStatus);
    router.get("", patientSeenStatusController.getPatientSeenStatus);
    return router;
}