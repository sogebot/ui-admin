import { Context } from '@nuxt/types';

export default ({ app: { store, router } }: Context) => {
  if (!(router && store)) {
    return;
  }

  router.beforeEach((_to, _from, next) => {
    store.commit('panel/breadcrumbs', []);
    store.commit('panel/mobile', false);
    store.commit('panel/back', '');
    next();
  });
};
