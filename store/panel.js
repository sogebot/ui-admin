export const state = () => ({
  breadcrumbs:           [],
  breadcrumbsOnlyMobile: false,
  back:                  '',
});

export const mutations = {
  breadcrumbs (storeState, val) {
    storeState.breadcrumbs = val;
  },
  back (storeState, val) {
    storeState.back = val;
  },
  mobile (storeState, val) {
    storeState.breadcrumbsOnlyMobile = val;
  },
};
