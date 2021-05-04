import {
    IsInt,
    IsNotEmpty,
    Length,
    IsOptional,
    IsString,
    IsNumber,
    IsEnum,
    IsDate,
    IsEmail,
    IsUUID,
    IsBoolean,
  } from 'class-validator';

export class UserIdentificationUpdateDto {
    @IsNotEmpty()
    @IsInt()
    id: number;

    @IsNotEmpty()
    @IsInt()
    userId: string;

    @IsInt()
    posId: number;

    @IsString()
    type: string;

    @IsString()
    number: string;

    @IsString()
    state: string;

    @IsBoolean()
    isActive: boolean;

    @IsInt()
    fileId: number;

    @IsDate()
    expires: Date;

    @IsDate()
    deleted: Date;

    @IsDate()
    created: Date;

    @IsInt()
    createdBy: number;

    @IsDate()
    modified: Date;

    @IsInt()
    modifiedBy: number;

    @IsEmail()
    email: string;

    @IsNotEmpty()
    @IsInt()
    locationId: string;
}