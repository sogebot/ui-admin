<template>
  <v-data-table
    class="middle-align"
    dense
    :headers="headers"
    :items-per-page="-1"
    :items="model"
    disable-sort
    hide-default-footer
  >
    <template #[`item.name`]="{ item }">
      <v-text-field
        v-model="item.name"
        class="pa-2"
        hide-details
        :rules="rules.name"
        dense
      />
    </template>
    <template #[`item.numOfDuplicates`]="{ item }">
      <v-text-field
        v-if="!item.groupId"
        v-model="item.numOfDuplicates"
        class="pa-2"
        min="1"
        type="number"
        :rules="rules.numOfDuplicates"
        hide-details
        dense
      />
      <v-alert v-else color="info" class="pa-1 text-center ma-0" dense style="line-height: 14px;">
        <small>{{ translate('registry.randomizer.form.groupedWithOptionAbove') }}</small>
      </v-alert>
    </template>
    <template #[`item.color`]="{ item }">
      <color
        v-model="item.color"
        class="pa-2"
        randomizer
        hide-details
        dense
      />
    </template>
    <template #[`item.minimalSpacing`]="{ item }">
      <v-text-field
        v-if="!item.groupId"
        v-model="item.minimalSpacing"
        class="pa-2"
        min="0"
        type="number"
        :rules="rules.minimalSpacing"
        hide-details
        dense
      />
      <v-alert v-else color="info" class="pa-1 text-center ma-0" dense style="line-height: 14px;">
        <small>{{ translate('registry.randomizer.form.groupedWithOptionAbove') }}</small>
      </v-alert>
    </template>
    <template #[`item.groupBtn`]="{ item }">
      <div v-if="item.order > 0" class="pa-2">
        <v-btn v-if="!item.groupId" small class="secondary" @click="item.groupId = model.find(o=>o.order === item.order - 1).id">
          {{ translate('registry.randomizer.form.groupUp') }}
        </v-btn>
        <v-btn v-else small class="secondary" @click="item.groupId = null">
          {{ translate('registry.randomizer.form.ungroup') }}
        </v-btn>
      </div>
    </template>
    <template #[`item.delBtn`]="{ item }">
      <v-btn class="pa-2" small color="error" icon @click="rmOption(item.id)">
        <v-icon>mdi-delete-forever</v-icon>
      </v-btn>
    </template>
    <template #[`item.drag`]="{ item }">
      <div :id="`drag|${item.id}`">
        <v-icon v-if="item.groupId === null" :disabled="isDragging" @mousedown.prevent="handleDragStart($event, item.id, model)">
          mdi-drag
        </v-icon>
      </div>
    </template>
    <template #[`body.append`]>
      <tr v-if="isDragging">
        <td colspan="10" style="height: 10px;" />
      </tr>
    </template>
  </v-data-table>
</template>

<script lang="ts">
import type { Randomizer } from '@entity/randomizer';
import {
  defineAsyncComponent, defineComponent, onMounted, ref, watch,
} from '@nuxtjs/composition-api';
import translate from '@sogebot/ui-helpers/translate';
import { orderBy } from 'lodash';

import { EventBus } from '~/functions/event-bus';
import {
  isHexColor, minValue, required,
} from '~/functions/validators';

const originalWidths: string[] = [];
const originalHeight: number[] = []; // needed for grouped elements

function handleDragStart (_e: DragEvent, id: string, items: Required<Randomizer['items'][number]>[]) {
  EventBus.$emit(`randomizer::dragstart`);

  const getChildren = (parentId: string) => {
    const groupedChildren: Required<Randomizer['items'][number]>[] = [];

    const children = items.filter(o => o.groupId === parentId);
    if (children.length === 0) {
      return [];
    } else {
      // add children
      groupedChildren.push(...children);
      for (const child of children) {
        groupedChildren.push(...getChildren(child.id));
      }
      return groupedChildren;
    }
  };

  // get parent and children items
  const parent = items.find(o => o.id === id);
  if (!parent) {
    return;
  }
  const children = getChildren(parent.id);
  const elements: HTMLElement[] = [];

  const getTRParent = (element: HTMLElement | null): HTMLElement | null => {
    if (element === null) {
      return null;
    }

    if (element.tagName === 'TR') {
      return element;
    } else {
      return getTRParent(element.parentElement);
    }
  };

  originalWidths.length = 0;
  originalHeight.length = 0;
  let calculatedHeight = 0;
  for (const item of [parent, ...children]) {
    const dragElement = document.getElementById(`drag|${item.id}`);
    const parentEl = getTRParent(dragElement);
    if (parentEl) {
      // set widths (original width is enough)
      if (originalWidths.length === 0) {
        for (const cell of parentEl.children) {
          originalWidths.push(`${parseInt(window.getComputedStyle(cell).width)}px`);
        }
      }
      calculatedHeight += Number(window.getComputedStyle(parentEl).height.replace('px', '')) + 10;
      originalHeight.push(calculatedHeight);
      elements.push(parentEl);
    }
  }
  document.onmouseup = handleDragEnd;

  // enable mouse move listener
  function elementDrag (ev: MouseEvent) {
    for (const [idx, element] of elements.entries()) {
      for (let i = 0; i < element.children.length; i++) {
        // Set the width as the original cell
        (element.children[i] as HTMLElement).style.maxWidth = originalWidths[i];
        (element.children[i] as HTMLElement).style.minWidth = originalWidths[i];
        (element.children[i] as HTMLElement).style.overflow = 'hidden';
      }
      element.style.opacity = '0.8';
      element.style.zIndex = String(9999);
      element.style.position = 'fixed';
      element.style.top = ((ev.clientY + originalHeight[idx] - 100)) + 'px';
      element.style.left = (ev.clientX + 5) + 'px';
    }
  }

  function handleDragEnd (ev: MouseEvent) {
    let parent2: null | HTMLElement = null;
    let elFromPoint = document.elementFromPoint(ev.clientX, ev.clientY);
    if (elFromPoint) {
      while (!parent2) {
        const parentElement: HTMLElement | null = elFromPoint?.parentElement;
        if (parentElement) {
          if (parentElement.tagName === 'TR') {
            parent2 = parentElement;
          } else {
            elFromPoint = parentElement;
          }
        } else {
          break;
        }
      }
    }
    if (parent2) {
      try {
        const offsetId = parent2.children[0].children[0].id.replace('drag|', '');
        EventBus.$emit(`randomizer::dragdrop`, { items: [parent, ...children], offsetId });
      } catch {
        EventBus.$emit(`randomizer::dragdrop`, { items: [parent, ...children] });
      }
    }
    for (const element of elements) {
      element.style.position = 'inherit';
      element.style.opacity = '1';
    }
    document.onmousemove = null;
    document.onmouseup = null;
    EventBus.$emit(`randomizer::dragstop`);
  }
  document.onmousemove = elementDrag;
}

export default defineComponent({
  props:      { value: Array },
  components: { color: defineAsyncComponent({ loader: () => import('~/components/form/color.vue') }) },
  setup (props: { value: Randomizer['items'][number][] }, ctx) {
    const model = ref(props.value);
    const isDragging = ref(false);

    const rules = {
      name:            [required],
      color:           [isHexColor],
      numOfDuplicates: [required, minValue(1)],
      minimalSpacing:  [required, minValue(0)],
    };

    const headers = [
      { value: 'drag', text: '' },
      { value: 'name', text: translate('registry.randomizer.form.name') },
      { value: 'color', text: translate('registry.randomizer.form.color') },
      { value: 'numOfDuplicates', text: translate('registry.randomizer.form.numOfDuplicates') },
      { value: 'minimalSpacing', text: translate('registry.randomizer.form.minimalSpacing') },
      { value: 'groupBtn', text: '' },
      { value: 'delBtn', text: '' },
    ];

    const rmOption = (id: string) => {
      if (!model.value) {
        return;
      }
      model.value = orderBy(model.value.filter(o => o.id !== id), 'order');
      for (const item of model.value.filter(o => o.groupId !== id)) {
        item.groupId = null;
      }
      // reorder
      for (let i = 0; i < model.value.length; i++) {
        model.value[i].order = i;
      }
    };

    onMounted(() => {
      EventBus.$off(`randomizer::dragdrop`).$off(`randomizer::dragstart`);
      EventBus.$on(`randomizer::dragstart`, () => {
        isDragging.value = true;
      });
      EventBus.$on(`randomizer::dragstop`, () => {
        isDragging.value = false;
      });
      EventBus.$on(`randomizer::dragdrop`, (data: {items: Randomizer['items'][number][], offsetId?: string}) => {
        // reorder model
        // remove id
        for (const item of data.items) {
          model.value = model.value.filter(o => o.id !== item.id);
        }

        if (data.offsetId) {
          const getParentIdx = (id: string): number => {
            const item = model.value.find(o => o.id === id);
            if (!item) {
              return 0;
            }

            if (item.groupId === null) {
              return model.value.findIndex(o => o.id === id);
            } else {
              return getParentIdx(item.groupId);
            }
          };
          // search idx of offset id
          const idx = getParentIdx(data.offsetId);
          //
          if (idx >= 0) {
            model.value.splice(idx, 0, ...data.items);
          }
        } else {
          // save as last item
          for (const item of data.items) {
            model.value.push({ ...item, order: model.value.length });
          }
        }
        // reorder
        for (let i = 0; i < model.value.length; i++) {
          model.value[i].order = i;
        }
      });
    });

    watch(model, (val) => {
      ctx.emit('input', val);
    }, { deep: true });

    return {
      // ref
      headers,
      model,
      rules,
      isDragging,

      // functions
      rmOption,

      // others
      translate,
      handleDragStart,
    };
  },
});
</script>

<style scoped>
.middle-align >>> table tbody tr td {
  vertical-align: middle !important;
}
</style>
