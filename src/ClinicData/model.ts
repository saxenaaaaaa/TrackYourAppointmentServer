import { plugin, prop } from "@typegoose/typegoose";
import { dateValidator } from "../util/validate";

export enum SessionCurrentStatus {
    NOT_STARTED = "Not Started",
    ONGOING = "On Going",
    ENDED = "Ended"
}

export class ClinicData {
    
    @prop({
        required: true,
        validate: {
            validator: function (date: string) {
                return dateValidator(date);
            }
        }
    })
    public date!: string;

    @prop({
        required: true,
    })
    public doctorName!: string;

    @prop({
        required: true
    })
    public startTime!: string;

    @prop({
        required: true,
        enum: SessionCurrentStatus
    })
    public currentStatus!: SessionCurrentStatus
}

export interface ClinicDataDTO {
    patientSeenStatusList: {
        id: number,
        status: boolean
    }[],
    doctorName: string
    startTime: string
    currentStatus: SessionCurrentStatus
}