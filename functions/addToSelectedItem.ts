import { Ref } from '@nuxtjs/composition-api';

function addToSelectedItem<T> (selected: Ref<T[]>, key: keyof T, currentItems: Ref<T[]>) {
  let lastSelected: T[typeof key] | null = null;
  let lastOp: 'select' | 'unselect' = 'select';

  return function (item: T) {
    const idx = selected.value.findIndex(o => o[key] === item[key]);

    let isShift = false;
    if (window.event) {
      isShift = !!(window.event as any).shiftKey; // typecast to boolean
    }
    if (isShift) {
      // get index of last selected value
      const prevIdx = currentItems.value.findIndex(o => o[key] === lastSelected);
      const curIdx = currentItems.value.findIndex(o => o[key] === item[key]);

      // add/remove all to selected between those two values
      if (lastOp === 'select') {
        for (let i = Math.min(prevIdx, curIdx); i <= Math.max(prevIdx, curIdx); i++) {
          selected.value.push(currentItems.value[i]);
        }
      } else {
        selected.value = selected.value.filter((o) => {
          let notFound = true;
          for (let i = Math.min(prevIdx, curIdx); i <= Math.max(prevIdx, curIdx); i++) {
            if (o === currentItems.value[i]) {
              notFound = false;
              break;
            }
          }
          return notFound;
        });
      }
    } else {
      // add to current select
      // eslint-disable-next-line no-lonely-if
      lastSelected = item[key];
      if (idx === -1) {
        selected.value.push(item);
        lastOp = 'select';
      } else {
        selected.value.splice(idx, 1);
        lastOp = 'unselect';
      }
    }
    selected.value = Array.from(new Set([...selected.value]));
    console.log(selected.value);
  };
}

export { addToSelectedItem };
