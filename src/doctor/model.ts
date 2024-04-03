import { prop } from "@typegoose/typegoose";

export class Doctor {

    @prop({
        required: true, // todo: need to put unique index on name. Or think how to ensure uniqueness. Should there be a displayname ?
    })
    public name!: string;

    @prop({
        required: true,
    })
    public password!: string;
    
    @prop({
        required: true
    })
    public schedule!: string;
}

export interface DoctorDataDTO {
    _id?: string;
    name: string;
    schedule?: string;
    password?: string;
}