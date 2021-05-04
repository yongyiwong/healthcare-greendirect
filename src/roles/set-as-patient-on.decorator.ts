import { Role } from '../entities/role.entity';
import { UserRole } from '../entities/user-role.entity';
import { RoleEnum } from './roles.enum';
import { RolesService } from './roles.service';
import { UserRoleService } from '../user-role/user-role.service';

/**
 * After running the method, assign the user as patient.
 * Decorated class must have roleService and userRoleService property.
 *
 * @param method The method in the controller to set assignment when called, must return Promise<User>
 */
export function SetAsPatientOn(method: string): ClassDecorator {
  return target => {
    const fn = target.prototype[method];
    const patchedFn = async function(...args) {
      const user = await fn.call(this, ...args);
      const roleService: RolesService = this.rolesService;
      const userRoleService: UserRoleService = this.userRoleService;
      const role = await roleService.findByName(RoleEnum.Patient);
      const userRole = new UserRole();
      userRole.user = user;
      userRole.role = role as Role;
      await userRoleService.create(userRole);
      return user;
    };
    copyMetadata(fn, patchedFn);
    target.prototype[method] = patchedFn;
  };
}

/**
 * Copy metadata from one object to another object.
 * Used to copy metadata from Nest.js decorators to another function.
 *
 * @param from
 * @param to
 */
export function copyMetadata(from: object, to: object) {
  const metadata = Reflect.getMetadataKeys(from).map(key => [
    key,
    Reflect.getMetadata(key, from),
  ]);
  metadata.forEach(([key, value]) => {
    Reflect.defineMetadata(key, value, to);
  });
}
