import { setLocale } from '@sogebot/ui-helpers/dayjsHelper';
import { getListOf, populateListOf } from '@sogebot/ui-helpers/getListOf';
import { isBotStarted } from '@sogebot/ui-helpers/isBotStarted';
import { isUserLoggedIn } from '@sogebot/ui-helpers/isUserLoggedIn';
import { getConfiguration, getTranslations } from '@sogebot/ui-helpers/socket';
import { cloneDeep } from 'lodash-es';

export default function ({ store, app }: { store: any, app: any }) {
  (async function init () {
    await isBotStarted(store);
    store.commit('setLoggedUser', await isUserLoggedIn());
    store.commit('setConfiguration', await getConfiguration());

    await populateListOf('core');
    await populateListOf('systems');
    await populateListOf('integrations');

    store.commit('$core', cloneDeep(getListOf('core')));
    store.commit('$systems', cloneDeep(getListOf('systems')));
    store.commit('$integrations', cloneDeep(getListOf('integrations')));

    await getTranslations();
    const configuration = await getConfiguration();
    store.commit('setConfiguration', configuration);
    setLocale(configuration.lang as string);

    store.commit('setUILoaded');
  })();
}
