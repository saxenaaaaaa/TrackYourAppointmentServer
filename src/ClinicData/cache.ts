import { DoctorDataDTO } from "../doctor/model";
import { ClinicDataDTO, SessionCurrentStatus } from "./model";
import * as doctorService from "../doctor/service";
import { fetchClinicDataByDateAndDoctor } from "./service";
import { getTodaysDate } from "../util/util";
import { MAX_SESSION_SIZE } from "../constants";
import { logger } from "../logger";

export const doctorList: DoctorDataDTO[] = []
export const clinicDataByDoctorId = new Map<string, ClinicDataDTO>();
export const subscribersByDoctorId: Map<string,any[]> = new Map<string,any[]>();

export async function initializeCache() {
    logger.info("Going to initialize cache")
    const fetchedDoctorsList = await doctorService.fetchDoctorsList();
    doctorList.splice(0, doctorList.length)
    doctorList.push(...fetchedDoctorsList)
    for(let doctorListItem of doctorList) {
        const clinicDataDocument = await fetchClinicDataByDateAndDoctor(getTodaysDate(), doctorListItem._id!);
        const clinicDataDto = populateClinicDataDto(clinicDataDocument, doctorListItem._id!);
        clinicDataByDoctorId.set(doctorListItem._id!, clinicDataDto)
        subscribersByDoctorId.set(doctorListItem._id!, [])
    }
}

export async function updateDoctorInCache(doctorId: string) {
    if(doctorList.find(doctor => doctor._id === doctorId) === undefined) {
        const doctorDataDto: DoctorDataDTO | null = await doctorService.fetchDoctorById(doctorId)
        doctorList.push(doctorDataDto!)
    }
    const clinicDataDocument = await fetchClinicDataByDateAndDoctor(getTodaysDate(), doctorId);
    const clinicDataDto = clinicDataByDoctorId.get(doctorId);
    const populatedClinicDataDto = populateClinicDataDto(clinicDataDocument, doctorId, clinicDataDto);
    if(clinicDataDto == undefined) {
        // todo: At this point, should we also reset all the client connections so that they attempt to try to reconnect,
        //       and receive updated data ? 
        //       In real scenarios, updating doctor need not be reflected in real time so we can rely on next push to user.
        clinicDataByDoctorId.set(doctorId, populatedClinicDataDto)
    }
    if(subscribersByDoctorId.get(doctorId) === undefined) {
        subscribersByDoctorId.set(doctorId, [])
    }
}

export function populateClinicDataDto(clinicDataDocument: any, doctorId: string, clinicDataDto?: ClinicDataDTO): ClinicDataDTO {
    let patientSeenStatusList = [], currentStatus, date;
    if(clinicDataDocument) {
        patientSeenStatusList = clinicDataDocument.patientSeenStatusList;
        currentStatus = clinicDataDocument.currentStatus;
        date = clinicDataDocument.date;
    }
    else {
        for(let i=0; i<MAX_SESSION_SIZE; i++) {
            patientSeenStatusList.push({id: i+1, status: false});
        }
        currentStatus  = SessionCurrentStatus.NOT_STARTED;
        date = getTodaysDate();
    }
    let clinicDataDtoCopy = clinicDataDto;
    if(clinicDataDtoCopy === undefined || clinicDataDtoCopy === null) {
        clinicDataDtoCopy = {
            doctorId: doctorId,
            patientSeenStatusList: patientSeenStatusList,
            currentStatus: currentStatus,
            date: date
        }
    }
    else {
        clinicDataDtoCopy.doctorId = doctorId
        clinicDataDtoCopy.date = date
        clinicDataDtoCopy.currentStatus = currentStatus
        clinicDataDtoCopy.patientSeenStatusList = patientSeenStatusList
    }
    return clinicDataDtoCopy
}

export function cacheResetAt3AmEveryNight() {
    
    let nowDate = new Date();
    let millisTill3Am = new Date(nowDate.getFullYear(), nowDate.getMonth(), nowDate.getDate(), 3, 0, 0, 0).getTime() - nowDate.getTime();
    if (millisTill3Am < 0) {
        millisTill3Am += 86400000; // it's after 3am, try 3am tomorrow.
    }
    setTimeout(async () => {
        await initializeCache();
        logger.info("Successfully refreshed the cache");
        cacheResetAt3AmEveryNight();
    }, millisTill3Am);
}