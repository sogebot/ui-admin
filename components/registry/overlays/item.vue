<template>
<div
    @mousedown="mousedown"
    style="position: absolute; cursor: grab; user-select: none;"
    :style="{
      left: `${item.alignX * ratio}px`,
      top: `${item.alignY * ratio}px`,
      'z-index': selectedSync === item.id ? 2 : 1,
    }">
  <v-fab-transition>
    <v-btn @click="deleteItem" v-if="selectedSync === item.id" fab right top absolute x-small style="right: 10px;" color="red"><v-icon>mdi-delete-forever</v-icon></v-btn>
  </v-fab-transition>
  <v-icon style="position: absolute; right: 0; bottom: 0;">mdi-resize-bottom-right</v-icon>

    <div class="text-caption grey darken-4 px-1" style="position: absolute; top: -20px;; z-index: -1; width: max-content;">
      {{ Math.max(Math.floor(item.width), 1) }}x{{ Math.max(Math.floor(item.height), 1) }}<br>
    </div>
    <div class="px-1 text-caption grey darken-4 " style="position: absolute; bottom: -20px; z-index: -1; width: max-content;">
      <v-icon x-small>
        mdi-format-horizontal-align-right
      </v-icon> {{ Math.floor(item.alignX) }}
      <v-icon x-small>
        mdi-format-horizontal-align-bottom
      </v-icon> {{ Math.floor(item.alignY) }}
    </div>
  <v-sheet
    :color="selectedSync === item.id ? 'primary' : color"
    :height="item.height * ratio"
    :width="item.width * ratio"
    @click="selectItem"
  >
    <div class="center text-button text-truncate">
      {{ type }}
    </div>
  </v-sheet>
</div>
</template>

<script lang="ts">
import {
  defineComponent, ref, watch,
} from '@vue/composition-api';

export default defineComponent({
  props: {
    color:    String,
    item:     Object,
    selected: [Object, String],
    ratio:    Number,
    isMoving: Boolean,
    type:     String,
  },
  setup (props, ctx) {
    const selectedSync = ref(props.selected);
    watch(() => props.selected, (val) => {
      selectedSync.value = val;
    });
    watch(selectedSync, (val) => {
      ctx.emit('update:selected', val);
    });

    const mousedown = (ev: MouseEvent) => {
      ctx.emit('mousedown', {
        ev, id: props.item?.id,
      });
    };

    const selectItem = () => {
      if (!props.isMoving) {
        selectedSync.value = selectedSync.value === props.item?.id ? null : props.item?.id;
      }
    };

    const deleteItem = () => {
      ctx.emit('delete');
    };

    return {
      selectedSync,

      // fnc
      mousedown,
      selectItem,
      deleteItem,
    };
  },
});
</script>
