export const state = () => ({
  save:    false,
  pending: false,
});

export const mutations = {
  save (storeState, val) {
    storeState.save = val;
  },
  pending (storeState, val) {
    storeState.pending = val;
  },
};
