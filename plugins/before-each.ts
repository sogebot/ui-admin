import { Context } from '@nuxt/types';
import translate from '@sogebot/ui-helpers/translate';
import { validate } from 'uuid';

export default ({ app: { store, router } }: Context) => {
  if (!(router && store)) {
    return;
  }

  router.afterEach((to) => {
    (function init () {
      if (!store.state.isUILoaded) {
        setTimeout(() => init(), 10);
        return;
      }
      const path = to.path.split('/').filter(String);
      store.commit('panel/breadcrumbs',
        path.map((o: string) => {
          return { text: validate(o) ? o : translate(`menu.${o}`) };
        }) ?? [],
      );

      if (!('/' + path.join('/')).includes(store.state.panel.back) || '/' + path.join('/') === store.state.panel.back) {
        store.commit('panel/back', '');
      }

      store.commit('panel/mobile', path.length === 0);
    })();
  });
};
