import { Ref } from '@vue/composition-api';

function addToSelectedItem<T> (selected: Ref<T[]>, key: keyof T) {
  return function (item: T) {
    const idx = selected.value.findIndex(o => o[key] === item[key]);

    let isCtrl = false;
    if (window.event) {
      isCtrl = !!(window.event as any).ctrlKey; // typecast to boolean
    }
    if (isCtrl) {
      // add to current select
      if (idx === -1) {
        selected.value.push(item);
      } else {
        selected.value.splice(idx, 1);
      }
    } else if (idx === -1 || selected.value.length > 1) {
      // select only one if not in select or if select is multiple
      selected.value = [item];
    } else {
      selected.value = [];
    }
  };
}

export { addToSelectedItem };
