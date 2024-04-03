import express, { Router } from "express";
import * as doctorController from "./controller";
const router: Router = express.Router();

export const doctorRouter = () => {
    router.get("/", doctorController.getDoctors);
    router.post("/", doctorController.createOrUpdateDoctor);
    router.get("/:doctorId", doctorController.getDoctorById);
    router.post("/login", doctorController.login)
    return router;
}