import { Ref } from '@nuxtjs/composition-api';

function addToSelectedItem<T> (selected: Ref<T[]>, key: keyof T, currentItems: Ref<T[]>) {
  let lastSelected: T[typeof key] | null = null;

  return function (item: T) {
    const idx = selected.value.findIndex(o => o[key] === item[key]);

    let isCtrl = false;
    let isShift = false;
    if (window.event) {
      isCtrl = !!(window.event as any).ctrlKey; // typecast to boolean
    }
    if (window.event) {
      isShift = !!(window.event as any).shiftKey; // typecast to boolean
    }
    if (isShift) {
      // get index of last selected value
      const prevIdx = currentItems.value.findIndex(o => o[key] === lastSelected);
      const curIdx = currentItems.value.findIndex(o => o[key] === item[key]);
      // add all to selected between those two values
      for (let i = Math.min(prevIdx, curIdx); i <= Math.max(prevIdx, curIdx); i++) {
        selected.value.push(currentItems.value[i]);
      }
    } else if (isCtrl) {
      // add to current select
      if (idx === -1) {
        selected.value.push(item);
        lastSelected = item[key];
      } else {
        selected.value.splice(idx, 1);
      }
    } else if (idx === -1 || selected.value.length > 1) {
      // select only one if not in select or if select is multiple
      selected.value = [item];
      lastSelected = item[key];
    } else {
      selected.value = [];
    }
  };
}

export { addToSelectedItem };
