export const state = () => ({
  empty: {
    id:       null,
    name:     '',
    workflow: '',
    enabled:  true,
  },
  item: {
    id:       null,
    name:     '',
    workflow: '',
    enabled:  true,
  },
});

export const mutations = {
  set (storeState, val) {
    storeState.item = val;
  },
  workflow (storeState, val) {
    storeState.item.workflow = val;
  },
};
