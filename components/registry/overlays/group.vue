<template>
  <div>
    <v-row no-gutters>
      <v-col cols="2">
        <v-list dense>
          <v-subheader>Display order</v-subheader>
          <v-fade-transition group>
            <v-list-item
              v-for="(item, idx) of [...items].reverse()"
              :key="'list-' + item.id"
              class="overlayItem"
              :input-value="selected === item.id"
              @click="selected = item.id"
            >
              <v-list-item-action style="align-items: baseline; margin:0; margin-right: 10px;align-self: center;">
                <v-btn
                  icon
                  :disabled="idx === 0"
                  height="20"
                  width="20"
                  @click.stop="moveDown((items.length - 1) - idx)"
                >
                  <v-icon>{{ mdiMenuUp }}</v-icon>
                </v-btn>
                <v-btn
                  icon
                  :disabled="!(idx !== items.length - 1)"
                  height="20"
                  width="20"
                  @click.stop="moveUp((items.length - 1) - idx)"
                >
                  <v-icon>{{ mdiMenuDown }}</v-icon>
                </v-btn>
              </v-list-item-action>
              <v-list-item-title>
                {{ item.type }}
              </v-list-item-title>
              <v-list-item-avatar size="20">
                <v-sheet :color="generateColorFromString(item.id)" height="40" width="40" />
              </v-list-item-avatar>
            </v-list-item>
          </v-fade-transition>
        </v-list>
      </v-col>
      <v-col>
        <v-responsive
          ref="responsive"
          style="overflow: inherit"
          :aspect-ratio="16/9"
          :max-height="height"
          :max-width="(height / 9) * 16"
        >
          <v-card height="100%" width="100%" :loading="!initialResize" color="blue-grey darken-4">
            <v-card-text v-if="initialResize">
              <v-fade-transition v-for="item of items" :key="item.id">
                <item
                  v-click-outside="{
                    handler: () => selected = null,
                    include: include,
                  }"
                  :is-moving="positions.moved"
                  :item="item"
                  :selected.sync="selected"
                  :ratio="ratio"
                  class="overlayItem"
                  :color="generateColorFromString(item.id)"
                  @mousedown="startMove"
                  @delete="deleteItem(item.id)"
                />
              </v-fade-transition>
            </v-card-text>
          </v-card>
          <v-menu
            v-model="dialog"
            :close-on-content-click="false"
            :nudge-width="300"
            offset-x
          >
            <template #activator="{ on, attrs }">
              <v-btn
                v-bind="attrs"
                fab
                absolute
                right
                bottom
                color="primary"
                dark
                small
                style="z-index: 2"
                v-on="on"
              >
                <v-icon>{{ mdiPlus }}</v-icon>
              </v-btn>
            </template>
            <v-card>
              <v-card-text>
                <v-select
                  v-model="itemToAdd"
                  style="width: 300px;"
                  :items="overlayOptions"
                >
                  <template #append-outer>
                    <v-btn
                      dark
                      text
                      @click="addItem()"
                    >
                      Add
                    </v-btn>
                  </template>
                </v-select>
              </v-card-text>
            </v-card>
          </v-menu>
        </v-responsive>
      </v-col>
    </v-row>

    <v-fade-transition>
      <div v-if="selectedItem && haveAnyOptions(selectedItem.type)">
        <v-subheader>Settings</v-subheader>
        <component
          :is="selectedItem.type"
          v-model="selectedItem.opts"
          class="overlayItem"
          @update="selectedItem.opts = $event;"
        />
      </div>
    </v-fade-transition>
  </div>
</template>

<script lang="ts">
import {
  mdiMenuDown, mdiMenuUp, mdiPlus,
} from '@mdi/js';
import {
  computed,
  defineAsyncComponent, defineComponent, nextTick, onMounted, onUnmounted, ref, watch,
} from '@nuxtjs/composition-api';
import { ButtonStates } from '@sogebot/ui-helpers/buttonStates';
import translate from '@sogebot/ui-helpers/translate';
import {
  cloneDeep,
  isEqual,
} from 'lodash';
import { v4 } from 'uuid';

import { haveAnyOptions } from '~/pages/registry/overlays/_id.vue';

export default defineComponent({
  props:      { value: [Object, Array] },
  components: {
    alerts:          () => import('~/components/registry/overlays/alerts.vue'),
    emotes:          () => import('~/components/registry/overlays/emotes.vue'),
    emotesexplode:   () => import('~/components/registry/overlays/emotesexplode.vue'),
    emotesfireworks: () => import('~/components/registry/overlays/emotesfireworks.vue'),
    emotescombo:     () => import('~/components/registry/overlays/emotescombo.vue'),
    clipscarousel:   () => import('~/components/registry/overlays/clipscarousel.vue'),
    clips:           () => import('~/components/registry/overlays/clips.vue'),
    credits:         () => import('~/components/registry/overlays/credits.vue'),
    obswebsocket:    () => import('~/components/registry/overlays/obswebsocket.vue'),
    tts:             () => import('~/components/registry/overlays/tts.vue'),
    polls:           () => import('~/components/registry/overlays/polls.vue'),
    eventlist:       () => import('~/components/registry/overlays/eventlist.vue'),
    item:            defineAsyncComponent(() => import('~/components/registry/overlays/item.vue')),
  },
  setup (props, ctx) {
    const generateColorFromString = (stringInput: string) => {
      const stringUniqueHash = [...stringInput].reduce((acc, char) => {
        return char.charCodeAt(0) + ((acc << 5) - acc);
      }, 0);
      return `hsl(${stringUniqueHash % 360}, 30%, 30%)`;
    };

    const itemToAdd = ref(null as null | string);
    const initialResize = ref(false);
    const dialog = ref(false);

    const items = ref(
      (Array.isArray(props.value) ? props.value : []) as {
        id: string,
        type: string,
        alignX: number,
        alignY: number,
        width: number,
        height: number,
        opts: null | Record<string, any>
      }[]);

    watch(items, (val) => {
      if (!isEqual(props.value, items.value)) {
        ctx.emit('input', val);
      }
    }, { deep: true, immediate: true });

    const positions = ref({
      clientX:   0,
      clientY:   0,
      movementX: 0,
      movementY: 0,
      moved:     false,
    });

    const overlayOptions = [
      { value: null, text: 'Please select an option' },
      { value: 'alerts', text: 'alerts' },
      { value: 'bets', text: 'bets' },
      { value: 'carousel', text: 'carousel' },
      { value: 'clips', text: 'clips' },
      { value: 'clipscarousel', text: 'clipscarousel' },
      { value: 'credits', text: 'credits' },
      { value: 'emotes', text: 'emotes' },
      { value: 'emotescombo', text: 'emotescombo' },
      { value: 'emotesfireworks', text: 'emotesfireworks' },
      { value: 'emotesexplode', text: 'emotesexplode' },
      { value: 'eventlist', text: 'eventlist' },
      { value: 'obswebsocket', text: 'obswebsocket' },
      { value: 'polls', text: 'polls' },
      { value: 'randomizer', text: 'randomizer' },
      { value: 'stats', text: 'stats' },
      { value: 'tts', text: 'tts' },
    ];

    const selected = ref(null as null | string);
    const moveItem = ref(null as null | typeof items.value[number]);
    const responsive = ref(null as null | { '$el': HTMLElement });
    const ratio = ref(0);
    const height = ref(1920);

    const selectedItem = computed(() => {
      return items.value.find(o => o.id === selected.value);
    });

    watch(dialog, (val) => {
      if (val) {
        itemToAdd.value = null;
      }
    });

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
      return [...document.querySelectorAll('.overlayItem'), ...document.querySelectorAll('.v-list-item')];
    };

    const moveUp = (idx: number) => {
      [items.value[idx - 1], items.value[idx]] = [items.value[idx], items.value[idx - 1]];
      items.value = cloneDeep(items.value); // triggers watchers
    };

    const moveDown = (idx: number) => {
      [items.value[idx + 1], items.value[idx]] = [items.value[idx], items.value[idx + 1]];
      items.value = cloneDeep(items.value); // triggers watchers
    };

    const addItem = () => {
      if (itemToAdd.value) {
        items.value.push({
          id:     v4(),
          type:   itemToAdd.value,
          width:  200,
          height: 200,
          alignX: 0,
          alignY: 0,
          opts:   null,
        });
        dialog.value = false;
      }
    };

    const deleteItem = (id: string) => {
      const idx = items.value.findIndex(o => o.id === id);
      if (idx >= 0) {
        items.value.splice(idx, 1);
      }
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
      overlayOptions,
      dialog,
      itemToAdd,
      selectedItem,

      // functions
      startMove,
      stopMove,
      include,
      addItem,
      deleteItem,
      moveUp,
      moveDown,
      generateColorFromString,
      haveAnyOptions,

      // icons
      mdiPlus,
      mdiMenuUp,
      mdiMenuDown,
    };
  },
});
</script>
