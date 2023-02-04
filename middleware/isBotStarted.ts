import { setLocale } from '@sogebot/ui-helpers/dayjsHelper';
import { getListOf, populateListOf } from '@sogebot/ui-helpers/getListOf';
import { isBotStarted } from '@sogebot/ui-helpers/isBotStarted';
import { getConfiguration, getTranslations } from '@sogebot/ui-helpers/socket';
import { cloneDeep } from 'lodash';
import { isUserLoggedIn } from '~/functions/isUserLoggedIn';

let lastCheck = 0;

export default async function ({ store }: { store: any, app: any }) {
  try {
    if (Date.now() - lastCheck < 60 * 1000 * 5) {
      return;
    }
    lastCheck = Date.now();
    await isBotStarted(store);
    store.commit('setLoggedUser', await isUserLoggedIn());

    await populateListOf('core');
    await populateListOf('systems');
    await populateListOf('services');
    await populateListOf('integrations');

    store.commit('$core', cloneDeep(getListOf('core')));
    store.commit('$services', cloneDeep(getListOf('services')));
    store.commit('$systems', cloneDeep(getListOf('systems')));
    store.commit('$integrations', cloneDeep(getListOf('integrations')));

    await getTranslations();
    const configuration = await getConfiguration();
    store.commit('setConfiguration', configuration);
    setLocale(configuration.lang as string);

    store.commit('setUILoaded');
  } catch (e) {
    console.error(e)
  }
}
