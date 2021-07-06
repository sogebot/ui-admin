import { get } from 'lodash';

import { PermissionsInterface } from '~/.bot/src/bot/database/entity/permissions';

export const getPermissionSettingsValue = (permissions: PermissionsInterface[], permId: string, values: { [x: string]: string | null }) => {
  const startingOrder = get(permissions.find(permission => permission.id === permId), 'order', permissions.length);
  for (let i = startingOrder; i <= permissions.length; i++) {
    const value = values[get(permissions.find(permission => permission.order === i), 'id', '0efd7b1c-e460-4167-8e06-8aaf2c170311' /* viewers */)];
    if (typeof value !== 'undefined' && value !== null) {
      return value;
    }
  }

  // if order is last -> mirror viewers values
  console.debug(`Value for ${permId} not found in ${JSON.stringify(values)}`);
  return values['0efd7b1c-e460-4167-8e06-8aaf2c170311' /* viewers */];
};
