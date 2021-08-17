<template>
  <v-container fluid :class="{ 'pa-4': !$vuetify.breakpoint.mobile }">
    <v-row no-gutters>
      <v-col cols="2">
        <v-list dense style="border-right: 2px solid #1a1a1a;">
          <v-subheader>Display order</v-subheader>
          <v-list-item
            class="overlayItem"
            :input-value="selected === item.id"
            @click="selected = item.id"
            v-for="(item, idx) of [...items].reverse()"
            :key="'list-' + item.id">
            <v-list-item-action style="align-items: baseline; margin:0; margin-right: 10px;">
              <v-btn @click.stop="moveDown((items.length - 1) - idx)" v-if="idx !== 0" icon height="20" width="20"><v-icon>{{ mdiMenuUp }}</v-icon></v-btn>
              <v-btn @click.stop="moveUp((items.length - 1) - idx)" v-if="idx !== items.length - 1" icon height="20" width="20"><v-icon>{{ mdiMenuDown }}</v-icon></v-btn>
            </v-list-item-action>
            <v-list-item-title>
              {{ item.type }}
            </v-list-item-title>
          </v-list-item>
        </v-list>
      </v-col>
      <v-col>
        <v-responsive ref="responsive" style="overflow: inherit" :aspect-ratio="16/9" :max-height="height" :max-width="(height / 9) * 16">
          <v-card height="100%" width="100%" :loading="!initialResize">
            <v-card-text v-if="initialResize">
              <item
                v-for="item of items"
                :key="item.id"
                v-click-outside="{
                  handler: () => selected = null,
                  include: include,
                }"
                :is-moving="positions.moved"
                :item="item"
                :selected.sync="selected"
                :ratio="ratio"
                class="overlayItem"
                @mousedown="startMove"
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
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts">
import {
  mdiMenuDown, mdiMenuUp, mdiPlus,
} from '@mdi/js';
import {
  defineAsyncComponent, defineComponent, nextTick, onMounted, onUnmounted, ref, watch,
} from '@nuxtjs/composition-api';
import { ButtonStates } from '@sogebot/ui-helpers/buttonStates';
import translate from '@sogebot/ui-helpers/translate';
import { cloneDeep } from 'lodash';

export default defineComponent({
  components: { item: defineAsyncComponent(() => import('~/components/registry/overlays/item.vue')) },
  setup () {
    const initialResize = ref(false);
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
    }, {
      id:     '3',
      type:   'clipscarousel',
      alignX: 500,
      alignY: 100,
      width:  800,
      height: 600,
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
        setTimeout(() => {
          initialResize.value = true;
          resize(responsive.value);
        }, 1000);
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
        const isIcon = ['path', 'svg'].includes((event.ev as any).path[0].tagName);
        window.addEventListener('mouseup', stopMove);
        if (!isIcon && (event.ev.offsetX < (item.width * ratio.value) - 15 || event.ev.offsetY < (item.height * ratio.value) - 15)) {
          document.onmousemove = mouseMove;
        } else {
          document.onmousemove = mouseMoveResize;
        }
      }
    };

    const stopMove = () => {
      if (moveItem.value) {
        moveItem.value.width = Math.max(Math.floor(moveItem.value.width), 1);
        moveItem.value.height = Math.max(Math.floor(moveItem.value.height), 1);
        moveItem.value.alignX = Math.floor(moveItem.value.alignX);
        moveItem.value.alignY = Math.floor(moveItem.value.alignY);
      }
      setTimeout(() => {
        moveItem.value = null;
        document.onmousemove = null;
        window.removeEventListener('mouseup', stopMove);
      }, 1);
    };

    const include = () => {
      return [...document.querySelectorAll('.overlayItem')];
    };

    const moveUp = (idx: number) => {
      console.log({ idx });
      [items.value[idx - 1], items.value[idx]] = [items.value[idx], items.value[idx - 1]];
      items.value = cloneDeep(items.value); // triggers watchers
      console.log(items.value);
    };

    const moveDown = (idx: number) => {
      console.log({ idx });
      [items.value[idx + 1], items.value[idx]] = [items.value[idx], items.value[idx + 1]];
      items.value = cloneDeep(items.value); // triggers watchers
      console.log(items.value);
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
      initialResize,

      // functions
      startMove,
      stopMove,
      include,
      moveUp,
      moveDown,

      // icons
      mdiPlus,
      mdiMenuUp,
      mdiMenuDown,
    };
  },
});
</script>
