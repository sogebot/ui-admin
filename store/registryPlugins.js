export const state = () => ({
  errors: [],
  empty: {
    id:       null,
    name:     '',
    workflow: '',
    enabled:  true,
    settings: [],
  },
  item: {
    id:       null,
    name:     '',
    workflow: '',
    enabled:  true,
    settings: [],
  },
});

export const mutations = {
  errors (storeState, val) {
    storeState.errors = val;
  },
  set (storeState, val) {
    storeState.item = val;
  },
  workflow (storeState, val) {
    storeState.item.workflow = val;
  },
};
