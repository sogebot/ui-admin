import { getSocket } from '@sogebot/ui-helpers/socket';
import { cloneDeep } from 'lodash-es';
import type { Store } from 'vuex';

import { error } from './error';
import { EventBus } from './event-bus';

import { flatten, unflatten } from '~/functions/flatten';

export const saveSettings = (endpoint: string, store: Store<any>, settings: Record<string, any>) => {
  let clonedSettings = cloneDeep(settings);

  if (clonedSettings.settings) {
    for (const [name, value] of Object.entries(clonedSettings.settings)) {
      delete clonedSettings.settings[name];
      clonedSettings[name] = value;
    }
    delete clonedSettings.settings;
  }

  // flat variables - getting rid of category
  clonedSettings = flatten(clonedSettings);
  for (const key of Object.keys(clonedSettings)) {
    if (key.includes('__permission_based__') || key.includes('commands') || key.includes('_permission')) {
      continue;
    }

    const value = clonedSettings[key];
    const keyWithoutCategory = key.replace(/([\w]*\.)/, '');
    delete clonedSettings[key];
    console.debug(`FROM: ${key}`);
    console.debug(`TO:   ${keyWithoutCategory}`);
    clonedSettings[keyWithoutCategory] = value;
  }
  clonedSettings = unflatten(clonedSettings);

  // flat permission based variables - getting rid of category
  if (clonedSettings.__permission_based__) {
    clonedSettings.__permission_based__ = flatten(clonedSettings.__permission_based__);
    for (const key of Object.keys(clonedSettings.__permission_based__)) {
      const match = key.match(/\./g);
      if (match && match.length > 1) {
        const value = clonedSettings.__permission_based__[key];
        delete clonedSettings.__permission_based__[key];
        const keyWithoutCategory = key.replace(/([\w]*\.)/, '');
        console.debug(`FROM: ${key}`);
        console.debug(`TO:   ${keyWithoutCategory}`);
        clonedSettings.__permission_based__[keyWithoutCategory] = value;
      }
    }
    clonedSettings.__permission_based__ = unflatten(clonedSettings.__permission_based__);
  }

  for (const key of Object.keys(clonedSettings)) {
    clonedSettings[key] = Array.isArray(clonedSettings[key])
      ? clonedSettings[key][0] // select current values
      : clonedSettings[key];
  }

  getSocket(endpoint).emit('settings.update', clonedSettings, (err: string | null) => {
    store.commit('settings/save', false);
    store.commit('settings/pending', false);
    if (err) {
      return error(err);
    } else {
      EventBus.$emit('snack', 'success', 'Configuration updated.');
    }
  });
};
