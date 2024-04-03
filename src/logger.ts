import { createLogger, format } from "winston";
import DailyRotateFile from 'winston-daily-rotate-file';

const logDir = "/var/output/logs/TrackYourAppointment"
const transportAppLogs: DailyRotateFile = new DailyRotateFile({
    dirname: logDir, // directory is automatically created if not present.
    filename: 'application-%DATE%.log',
    level: 'info',
    datePattern: 'YYYY-MM-DD',
    zippedArchive: true,
    maxSize: '20m',
    maxFiles: '14d'
});

const transportErrorLogs: DailyRotateFile = new DailyRotateFile({
    dirname: logDir,
    filename: 'error-%DATE%.log',
    level: 'error',
    datePattern: 'YYYY-MM-DD',
    zippedArchive: true,
    maxSize: '20m',
    maxFiles: '14d',
    handleExceptions: true,
    handleRejections: true
});

export const logger = createLogger({
    level: 'info',
    format: format.combine(
      format.timestamp({
        format: 'YYYY-MM-DD HH:mm:ss'
      }),
      format.errors({ stack: true }),
      format.splat(),
      format.json()
    ),
    defaultMeta: { service: 'TrackYourAppointment' },
    exitOnError: false,
    transports: [
      transportAppLogs, transportErrorLogs
    ]
  });