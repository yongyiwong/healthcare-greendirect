import {
  Injectable,
  PipeTransform,
  ArgumentMetadata,
  HttpException,
} from '@nestjs/common';
import { RolesExceptions } from './roles.exceptions';
import { GDExpectedException } from '../gd-expected.exception';

@Injectable()
export class RoleValidationPipe implements PipeTransform {
  transform(value, metadata: ArgumentMetadata) {
    if (metadata.type === 'body') {
      const { role } = value;
      if (RolesExceptions.invalidRole.failCondition(role)) {
        GDExpectedException.throw(RolesExceptions.invalidRole);
      }
    }

    return value;
  }
}
