<template>
  <v-sheet
    @mousedown="mousedown"
    @mouseup="mouseup"
    :color="selectedSync === item.id ? 'primary' : 'grey darken2'"
    :height="item.height * ratio"
    :width="item.width * ratio"
    style="position: absolute; cursor: grab; user-select: none;"
    :style="{
      left: `${item.alignX * ratio}px`,
      top: `${item.alignY * ratio}px`,
    }"
    @click="selectItem"
  >
    <v-slide-x-transition>
      <v-sheet v-if="selectedSync === item.id" color="grey darken-4" style="position: absolute; right: -37px; height: 100%">
        <v-btn icon block>
          <v-icon>{{ mdiWrench }}</v-icon>
        </v-btn>
        <v-btn color="red" icon block>
          <v-icon>{{ mdiDelete }}</v-icon>
        </v-btn>
      </v-sheet>
    </v-slide-x-transition>
    <div class="text-right pa-1 text-caption">
      {{ item.width }}x{{ item.height }}<br>
      <v-icon x-small>
        {{ mdiFormatHorizontalAlignRight }}
      </v-icon> {{ Math.floor(item.alignX) }}
      <v-icon x-small>
        {{ mdiFormatVerticalAlignBottom }}
      </v-icon> {{ Math.floor(item.alignY) }}
    </div>
    <div class="center text-button text-truncate">
      {{ item.type }}
    </div>
  </v-sheet>
</template>

<script lang="ts">
import {
  mdiCircle, mdiCircleOutline, mdiDelete, mdiEyeOutline, mdiFormatHorizontalAlignRight, mdiFormatVerticalAlignBottom, mdiWrench,
} from '@mdi/js';
import {
  defineComponent, ref, watch,
} from '@vue/composition-api';

export default defineComponent({
  props: {
    item:     Object,
    selected: [Object, String],
    ratio:    Number,
    isMoving: Boolean,
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
      ctx.emit('mousedown', { ev, id: props.item?.id });
    };

    const mouseup = () => {
      ctx.emit('mouseup');
    };

    const selectItem = () => {
      console.log(props.isMoving);
      if (!props.isMoving) {
        selectedSync.value = selectedSync.value === props.item?.id ? null : props.item?.id;
      }
    };

    return {
      selectedSync,

      // fnc
      mousedown,
      mouseup,
      selectItem,

      // icons
      mdiCircle,
      mdiCircleOutline,
      mdiDelete,
      mdiEyeOutline,
      mdiFormatHorizontalAlignRight,
      mdiFormatVerticalAlignBottom,
      mdiWrench,
    };
  },
});
</script>
