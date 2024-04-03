import { Ref, plugin, prop } from "@typegoose/typegoose";
import { dateValidator } from "../util/validate";
import { Doctor, DoctorDataDTO } from "../doctor/model";

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
    public date!: string; // date is stored in dd/mm/yyyy format

    @prop({
        required: true,
        ref: () => Doctor
    })
    public doctor!: Ref<Doctor>

    @prop({
        required: true,
        enum: SessionCurrentStatus
    })
    public currentStatus!: SessionCurrentStatus

    @prop({
        required: true,
        type: () => PatientSeenStatus
    })
    public patientSeenStatusList!: PatientSeenStatus[]
}

export class PatientSeenStatus {
    @prop({
        required: true
    })
    public id!: number;

    @prop({
        required: true,
        default: false
    })
    public status!: boolean;
}

export interface ClinicDataDTO {
    doctorId: string,
    patientSeenStatusList: {
        id: number,
        status: boolean
    }[],
    currentStatus: SessionCurrentStatus,
    date: string
}