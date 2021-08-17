<template>
  <v-container fluid :class="{ 'pa-4': !$vuetify.breakpoint.mobile }">
    <v-responsive ref="responsive" style="overflow: inherit" :aspect-ratio="16/9" :max-height="height" :max-width="(height / 9) * 16">
      <v-card height="100%" width="100%">
        <v-card-text>
          <item
            style="resize: both; overflow: hidden"
            v-for="item of items"
            :key="item.id"
            :is-moving="positions.moved"
            :item="item"
            :selected.sync="selected"
            :ratio="ratio"
            @mousedown="startMove"
            @mouseup="stopMove"
          />
        </v-card-text>
      </v-card>
      <v-btn
        fab
        absolute
        right
        bottom
        color="primary"
        dark
        small
        style="z-index: 999"
      >
        <v-icon>{{ mdiPlus }}</v-icon>
      </v-btn>
    </v-responsive>
  </v-container>
</template>

<script lang="ts">
import { mdiPlus } from '@mdi/js';
import {
  defineAsyncComponent, defineComponent, nextTick, onMounted, onUnmounted, ref, watch,
} from '@nuxtjs/composition-api';
import { ButtonStates } from '@sogebot/ui-helpers/buttonStates';
import translate from '@sogebot/ui-helpers/translate';

export default defineComponent({
  components: { item: defineAsyncComponent(() => import('~/components/registry/overlays/item.vue')) },
  setup () {
    const items = ref([{
      id:     '1',
      type:   'eventlist',
      alignX: 180,
      alignY: 880,
      width:  1600,
      height: 100,
    }, {
      id:     '2',
      type:   'eventlist',
      alignX: 200,
      alignY: 300,
      width:  200,
      height: 200,
    }]);

    const positions = ref({
      clientX:   0,
      clientY:   0,
      movementX: 0,
      movementY: 0,
      moved:     false,
    });

    const selected = ref(null as null | string);
    const moveItem = ref(null as null | typeof items.value[number]);
    const responsive = ref(null as null | { '$el': HTMLElement });
    const ratio = ref(0);
    const height = ref(1920);

    const keydownHandler: EventListener = (event) => {
      const item = items.value.find(o => o.id === selected.value);
      if (!item) {
        return;
      }
      const key = (event as KeyboardEvent).key;
      const shiftKey = (event as KeyboardEvent).shiftKey;
      const ctrlKey = (event as KeyboardEvent).ctrlKey;
      const offset = 1 * (ctrlKey ? 10 : 1) * (shiftKey ? 10 : 1);
      if (key === 'ArrowRight') {
        item.alignX += offset;
      } else if (key === 'ArrowLeft') {
        item.alignX -= offset;
      } else if (key === 'ArrowUp') {
        item.alignY -= offset;
      } else if (key === 'ArrowDown') {
        item.alignY += offset;
      }
    };

    watch(selected, (val) => {
      window.removeEventListener('keydown', keydownHandler);
      if (val) {
        window.addEventListener('keydown', keydownHandler);
      }
    });

    function mouseMoveResize (event: MouseEvent) {
      event = event || window.event;
      event.preventDefault();

      if (moveItem.value) {
        positions.value.moved = true;
        positions.value.movementX = positions.value.clientX - event.clientX;
        positions.value.movementY = positions.value.clientY - event.clientY;
        positions.value.clientX = event.clientX;
        positions.value.clientY = event.clientY;

        // set the element's new position:
        moveItem.value.width = moveItem.value.width - positions.value.movementX / ratio.value;
        moveItem.value.height = moveItem.value.height - positions.value.movementY / ratio.value;
      }
    }

    function mouseMove (event: MouseEvent) {
      event = event || window.event;
      event.preventDefault();

      if (moveItem.value) {
        positions.value.moved = true;
        positions.value.movementX = positions.value.clientX - event.clientX;
        positions.value.movementY = positions.value.clientY - event.clientY;
        positions.value.clientX = event.clientX;
        positions.value.clientY = event.clientY;

        // set the element's new position:
        moveItem.value.alignX = moveItem.value.alignX - positions.value.movementX / ratio.value;
        moveItem.value.alignY = moveItem.value.alignY - positions.value.movementY / ratio.value;
      }
    }

    const resize = (responsiveRef: typeof responsive.value) => {
      if (!responsiveRef) {
        return;
      }
      height.value = window.innerHeight - 100;
      nextTick(() => {
        ratio.value = responsiveRef.$el.clientHeight / 1080;
      });
    };

    const resizeListener = () => {
      resize(responsive.value);
    };
    onMounted(() => {
      window.addEventListener('resize', resizeListener);
      nextTick(() => {
        resize(responsive.value);
      });
    });

    onUnmounted(() => {
      window.removeEventListener('resize', resizeListener);
    });

    const startMove = (event: { ev: MouseEvent, id: string}) => {
      // determinate if we are resizing
      const item = items.value.find(o => o.id === event.id);

      // get the mouse cursor position at startup:
      positions.value.clientX = event.ev.clientX;
      positions.value.clientY = event.ev.clientY;
      positions.value.moved = false;

      if (item) {
        // don't do anything on resize
        moveItem.value = item;
        if (event.ev.offsetX < (item.width * ratio.value) - 15 && event.ev.offsetY < (item.height * ratio.value) - 15) {
          document.onmousemove = mouseMove;
        } else {
          document.onmousemove = mouseMoveResize;
        }
      }
    };

    const stopMove = () => {
      if (moveItem.value) {
        moveItem.value.width = Math.floor(moveItem.value.width);
        moveItem.value.height = Math.floor(moveItem.value.height);
        moveItem.value.alignX = Math.floor(moveItem.value.alignX);
        moveItem.value.alignY = Math.floor(moveItem.value.alignY);
      }
      setTimeout(() => {
        moveItem.value = null;
        document.onmousemove = null;
      }, 1);
    };

    return {
      // refs
      translate,
      items,
      selected,
      ButtonStates,
      responsive,
      ratio,
      height,
      moveItem,
      positions,

      // functions
      startMove,
      stopMove,

      // icons
      mdiPlus,
    };
  },
});
</script>
