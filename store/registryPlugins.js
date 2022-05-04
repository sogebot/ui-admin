export const state = () => ({
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
