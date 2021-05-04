import { HttpStatus } from '@nestjs/common';
import { ExpectedExceptionMap } from '../app.interface';
import { Deal } from '../entities/deal.entity';
import { isPast, isValid, isFuture, parse, isAfter, endOfDay } from 'date-fns';
import { UserDeal } from '../entities/user-deal.entity';
import { User } from '../entities/user.entity';

export const DealExceptions: ExpectedExceptionMap = {
  dealNotFound: {
    message: 'Error: Deal not found.',
    httpStatus: HttpStatus.NOT_FOUND,
    i18n: { 'es-PR': `Error: Trato no encontrado.` },
    failCondition: (deal: Deal) => !deal || !deal.id,
  },
  dealHasExpired: {
    message: 'Error: Deal has already expired.',
    httpStatus: HttpStatus.GONE,
    i18n: {
      'es-PR': `Error: El trato ya ha expirado. Compruebe para más ofertas más tarde!`,
    },
    failCondition: (deal: Deal) =>
      !deal ||
      !deal.expirationDate ||
      (isValid(parse(deal.expirationDate)) &&
        isAfter(
          new Date(
            new Date().toLocaleString('en-US', {
              timeZone: deal.timezone,
            }),
          ),
          new Date(endOfDay(deal.expirationDate)),
        )),
  },
  dealAlreadyClaimedByUser: {
    message: 'You have already claimed this deal.',
    httpStatus: HttpStatus.GONE,
    i18n: { 'es-PR': `Usted ya ha reclamado este acuerdo.` },
    failCondition: (userDeal: UserDeal) =>
      !!userDeal &&
      !userDeal.deleted &&
      isValid(userDeal.dateClaimed) &&
        isPast(userDeal.dateClaimed) &&
        !userDeal.dateUsed,
    /* TODO add another check if there will a limit on how many times to claim same deal? */
  },
  userHasNoMobileNumber: {
    message:
      'Error: A verified phone number is required before claiming a deal.',
    httpStatus: HttpStatus.FORBIDDEN,
    failCondition: (user: User) => !user.mobileNumber,
    i18n: {
      'es-PR':
        'Error: Se requiere un número de teléfono verificado antes de reclamar un trato.',
    },
  },
  locationsReachedDealLimit: {
    message: 'Error: Assigned company has reached active deals limit.',
    httpStatus: HttpStatus.BAD_REQUEST,
    failCondition: (hasReachedLimit: boolean) => hasReachedLimit,
  },
};
