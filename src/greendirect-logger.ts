import {WinstonModule} from 'nest-winston';
import * as winston from 'winston';
import {LoggerService} from '@nestjs/common';

export class GreenDirectLogger implements LoggerService {
    private readonly logger: LoggerService;
    constructor(private context: string) {
        this.logger = WinstonModule.createLogger({
            transports: [
                new winston.transports.Console({
                    format: winston.format.combine(
                        winston.format.timestamp(),
                        winston.format.printf((info) => {
                            const {
                                timestamp, level, message, ...args
                            } = info;

                            const ts = timestamp.slice(0, 19);
                            const { contextInner, ...body } = args;
                            return `${ts} [${level}] [${this.context}] ${message}`;
                        }),
                    ),
                }),
                // other transports...
            ],
        });
    }

    error(message: string, trace?: string) {
        this.logger.error(message, trace, this.context);
    }

    log(message: string) {
        this.logger.log(message, this.context);
    }

    warn(message: string) {
        this.logger.warn(message, this.context);
    }

}
