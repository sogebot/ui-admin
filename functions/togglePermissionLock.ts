import { getPermissionSettingsValue } from './getPermissionSettingsValue';

import { PermissionsInterface } from '~/.bot/src/bot/database/entity/permissions';

export const togglePermissionLock = (permissions: PermissionsInterface[], permissionId: string, currentValue: { [x: string]: string | null }) => {
  if (currentValue[permissionId] === null) {
    return getPermissionSettingsValue(permissions, permissionId, currentValue);
  } else {
    return null;
  }
};
