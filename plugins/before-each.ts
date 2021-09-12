import { Context } from '@nuxt/types';
import translate from '@sogebot/ui-helpers/translate';
import { validate } from 'uuid';

const haveTranslation = (o: string) => {
  return !translate(`menu.${o}`).startsWith('{');
};

export default ({ app: { store, router } }: Context) => {
  if (!(router && store)) {
    return;
  }

  router.beforeEach((_to, _from, next) => {
    if (store.state.settings.pending) {
      const isOK = confirm('You will lose your pending changes. Do you want to continue?');
      if (!isOK) {
        return next(false);
      }
    }
    store.commit('settings/pending', false);
    next();
  });

  router.afterEach((to) => {
    (function init () {
      if (!store.state.isUILoaded) {
        setTimeout(() => init(), 10);
        return;
      }
      const path = to.path.split('/').filter(String);
      store.commit('panel/breadcrumbs',
        path.map((o: string) => {
          return { text: validate(o) || !haveTranslation(o) ? o : translate(`menu.${o}`) };
        }) ?? [],
      );

      if (!('/' + path.join('/')).includes(store.state.panel.back) || '/' + path.join('/') === store.state.panel.back) {
        store.commit('panel/back', '');
      }

      store.commit('panel/mobile', path.length === 0);
    })();
  });
};
