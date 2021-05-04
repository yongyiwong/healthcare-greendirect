export interface OverrideMethodRolesMap {
  [method: string]: string[];
}

export function OverrideRoles(
  overrideMap: OverrideMethodRolesMap = {},
): ClassDecorator {
  return target => {
    // Get a list of properties that have @Roles(...) declared
    const properties = Reflect.getMetadata('role:properties', target);

    for (const override of Object.keys(overrideMap)) {
      const property = properties.find(prop => prop.key === override);
      const targetProperty = target.prototype[property.key];
      const newRoles = overrideMap[property.key];
      if (newRoles) {
        Reflect.defineMetadata('roles', newRoles, targetProperty);
      }
    }
  };
}
