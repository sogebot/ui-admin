<template>
<div
    @mousedown="mousedown"
    @mouseup="mouseup"
    @contextmenu="show"
    style="position: absolute; cursor: grab; user-select: none;"
    :style="{
      left: `${item.alignX * ratio}px`,
      top: `${item.alignY * ratio}px`,
    }">
  <v-icon style="position: absolute; right: 0; bottom: 0;">{{ mdiResizeBottomRight }}</v-icon>
  <v-sheet
    :color="selectedSync === item.id ? 'primary' : 'grey darken2'"
    :height="item.height * ratio"
    :width="item.width * ratio"
    @click="selectItem"
  >
    <v-menu
      v-model="showMenu"
      :position-x="x"
      :position-y="y"
      absolute
      offset-y
    >
      <v-list>
        <v-list-item>
          <v-list-item-title>Test</v-list-item-title>
        </v-list-item>
        <v-list-item>
          <v-list-item-title>Test 2</v-list-item-title>
        </v-list-item>
      </v-list>
    </v-menu>
    <!--v-slide-x-transition>
      <v-sheet v-if="selectedSync === item.id" color="grey darken-4" style="position: absolute; right: -37px; height: 100%">
        <v-btn icon block>
          <v-icon>{{ mdiWrench }}</v-icon>
        </v-btn>
        <v-btn color="red" icon block>
          <v-icon>{{ mdiDelete }}</v-icon>
        </v-btn>
      </v-sheet>
    </v-slide-x-transition-->
    <div class="text-right pa-1 text-caption" style="position: absolute; bottom: -01px;">
      {{ Math.floor(item.width) }}x{{ Math.floor(item.height) }}<br>
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
</div>
</template>

<script lang="ts">
import {
  mdiFormatHorizontalAlignRight, mdiFormatVerticalAlignBottom, mdiResizeBottomRight,
} from '@mdi/js';
import {
  defineComponent, nextTick, ref, watch,
} from '@vue/composition-api';

export default defineComponent({
  props: {
    item:     Object,
    selected: [Object, String],
    ratio:    Number,
    isMoving: Boolean,
  },
  setup (props, ctx) {
    const showMenu = ref(false);
    const x = ref(0);
    const y = ref(0);

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
      if (!props.isMoving) {
        selectedSync.value = selectedSync.value === props.item?.id ? null : props.item?.id;
      }
    };

    const show = (e: MouseEvent) => {
      e.preventDefault();
      showMenu.value = false;
      x.value = e.clientX;
      y.value = e.clientY;
      nextTick(() => {
        showMenu.value = true;
      });
    };

    return {
      selectedSync,
      showMenu,
      x,
      y,

      // fnc
      mousedown,
      mouseup,
      show,
      selectItem,

      // icons
      mdiResizeBottomRight,
      mdiFormatHorizontalAlignRight,
      mdiFormatVerticalAlignBottom,
    };
  },
});
</script>
