<template>
  <div>
    <v-card-text
      v-ripple
      class="text-button pa-1 mb-1 text-center"
      style="font-size: 12px !important; display: block;"
      :style="{ 'color': color }"
      @click="!editing ? trigger($event) : showDialog()"
    >
      <v-row v-if="stopwatch" no-gutters ripple>
        <v-slide-x-transition>
          <v-col v-if="editing" cols="auto" class="d-flex">
            <v-simple-checkbox v-if="color !== 'white'" v-model="selected" light />
            <v-simple-checkbox v-else v-model="selected" dark />
          </v-col>
        </v-slide-x-transition>
        <v-col v-if="!editing" cols="auto" class="d-flex">
          <v-icon class="minus" :color="color">
            <template v-if="isStarted === null">
              mdi-help
            </template>
            <template v-else>
              {{ isStarted ? 'mdi-pause' : 'mdi-play' }}
            </template>
          </v-icon>
        </v-col>
        <v-col style="align-self: center;" class="text">
          <div style="font-size: 0.8rem;" v-html="time" />
        </v-col>

        <v-col v-if="!editing" cols="auto" class="d-flex">
          <v-icon :color="color" class="plus">
            mdi-alarm-plus
          </v-icon>
        </v-col>
      </v-row>
    </v-card-text>

    <v-expand-transition>
      <div v-if="showMenu && stopwatch">
        <v-text-field
          v-model.lazy="timeInput"
          label="Stopwatch"
          hide-details="auto"
          solo
          dense
          @keydown="keydownHandler"
        >
          <template #append>
            <v-btn icon @click="updateTime">
              <v-icon>mdi-check</v-icon>
            </v-btn>
          </template>
        </v-text-field>
      </div>
    </v-expand-transition>
  </div>
</template>

<script lang="ts">
import type { OverlayMapperStopwatch } from '@entity/overlay';
import {
  DAY, HOUR, MINUTE, SECOND,
} from '@sogebot/ui-helpers/constants';
import { getSocket } from '@sogebot/ui-helpers/socket';
import { useQuery, useResult } from '@vue/apollo-composable';
import {
  computed,
  defineComponent, onMounted, ref, watch,
} from '@vue/composition-api';

import GET from '~/queries/overlays/get.gql';

export default defineComponent({
  props: {
    item: Object, dialog: Boolean, color: String, editing: Boolean,
  },
  setup (props: {
    item: Record<string, any>,
    dialog: boolean,
    color: string,
    editing: boolean,
  }, ctx) {
    const selected = ref(props.item.selected);
    watch(selected, (val) => {
      ctx.emit(val ? 'select' : 'unselect');
    });

    const timestamp = ref(0);
    const isStarted = ref(null as boolean | null);
    const showMenu = ref(false);

    const showDialog = () => {
      ctx.emit('update:dialog', true);
    };

    const time = computed(() => {
      if (timestamp.value === null || !stopwatch.value) {
        return '--:--:--';
      }
      const days = Math.floor(timestamp.value / DAY);
      const hours = Math.floor((timestamp.value - days * DAY) / HOUR);
      const minutes = Math.floor((timestamp.value - (days * DAY) - (hours * HOUR)) / MINUTE);
      const seconds = Math.floor((timestamp.value - (days * DAY) - (hours * HOUR) - (minutes * MINUTE)) / SECOND);
      let millis: number | string = Math.floor((timestamp.value - (days * DAY) - (hours * HOUR) - (minutes * MINUTE) - (seconds * SECOND)) / 10);

      if (millis < 10) {
        millis = `0${millis}`;
      }

      let output = '';
      if (days > 0) {
        output += `${days}d`;
      }

      output += `${hours < 10 ? '0' : ''}${hours}:${minutes < 10 ? '0' : ''}${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
      const opts = typeof stopwatch.value.opts === 'string' ? JSON.parse(stopwatch.value.opts) : stopwatch.value.opts;
      if (opts.showMilliseconds) {
        output += `<small>.${millis}</small>`;
      }
      return output;
    });

    const { result, refetch } = useQuery(GET, { id: props.item.options.stopwatchId });
    const items = useResult<{ overlays: Record<string, any> }, OverlayMapperStopwatch[], OverlayMapperStopwatch[]>(result, [], data => [...data.overlays.stopwatch]);
    const stopwatch = ref(null as null | OverlayMapperStopwatch);

    watch(items, (val) => {
      if (val.length > 0) {
        stopwatch.value = val[0];
      }
    }, { immediate: true, deep: true });

    const timeInput = computed({
      get () {
        const days = Math.floor(timestamp.value / DAY);
        const hours = Math.floor((timestamp.value - days * DAY) / HOUR);
        const minutes = Math.floor((timestamp.value - (days * DAY) - (hours * HOUR)) / MINUTE);
        const seconds = Math.floor((timestamp.value - (days * DAY) - (hours * HOUR) - (minutes * MINUTE)) / SECOND);
        return `${days}d ${hours}h ${minutes}m ${seconds}s`;
      },
      set (value: string) {
        const regex = /((?<days>\d+)d)? ?((?<hours>\d+)h)? ?((?<minutes>\d+)m)? ?((?<seconds>\d+)s)?/g;
        const exec = regex.exec(value);
        if (exec?.groups) {
          let newTime = 0;
          for (const key of Object.keys(exec.groups)) {
            if (key === 'days') {
              newTime += Number(exec.groups[key] ?? 0) * DAY;
            } else if (key === 'hours') {
              newTime += Number(exec.groups[key] ?? 0) * HOUR;
            } else if (key === 'minutes') {
              newTime += Number(exec.groups[key] ?? 0) * MINUTE;
            } else if (key === 'seconds') {
              newTime += Number(exec.groups[key] ?? 0) * SECOND;
            }
          }
          timestamp.value = newTime;
        }
      },
    });

    onMounted(() => {
      refetch();
      setInterval(() => {
        // get actual status of opened overlay
        if (stopwatch.value && !showMenu.value) {
          getSocket('/overlays/stopwatch').emit('stopwatch::check', stopwatch.value.id, (_err, data) => {
            if (data && stopwatch.value) {
              isStarted.value = data.isEnabled;
              timestamp.value = data.time;
            }
          });
        }
      }, 1000);
    });

    const updateTime = () => {
      if (stopwatch.value) {
        getSocket('/overlays/stopwatch').emit('stopwatch::update::set', {
          isEnabled: null,
          time:      timestamp.value,
          id:        stopwatch.value.id,
        });
      }
      showMenu.value = false;
    };

    const trigger = (ev: MouseEvent) => {
      if (!stopwatch.value) {
        return;
      }
      // determinate which part of button is pushed
      const card = document.getElementById(`quickaction-${props.item.id}`) as HTMLElement;
      const text = document.getElementsByClassName(`text`)[0] as HTMLElement;

      const getClassList = (el: Element) => {
        if (el.tagName === 'SPAN' || el.tagName === 'I') {
          return (Array.from(el.classList ?? []));
        } else {
          return (Array.from(el.parentElement?.classList ?? []));
        }
      };

      const mouseOffsetX = ev.offsetX;
      const classList = getClassList(ev.target as Element);
      const isText = classList.includes('text');

      const isDecrement = !classList.includes('plus')
        && (classList.includes('minus') || mouseOffsetX < ((isText ? text.clientWidth : card.clientWidth) / 2));
      debugger;
      if (isDecrement) {
        isStarted.value = !isStarted.value;
        getSocket('/overlays/stopwatch').emit('stopwatch::update::set', {
          isEnabled: isStarted.value,
          time:      null,
          id:        stopwatch.value.id,
        });
      } else {
        showMenu.value = !showMenu.value;
      }
    };

    const keydownHandler: EventListener = (event) => {
      const key = (event as KeyboardEvent).key;
      const shiftKey = (event as KeyboardEvent).shiftKey;
      const ctrlKey = (event as KeyboardEvent).ctrlKey;

      let offset = SECOND;
      if (shiftKey && ctrlKey) {
        offset = HOUR;
      } else if (shiftKey) {
        offset = MINUTE;
      } else if (ctrlKey) {
        offset = 15 * SECOND;
      }

      if (key === 'ArrowUp') {
        timestamp.value += offset;
      } else if (key === 'ArrowDown') {
        timestamp.value -= offset;
      }
    };

    return {
      // refs
      stopwatch,
      selected,
      timestamp,
      time,
      timeInput,
      isStarted,
      showMenu,

      // functions
      trigger,
      showDialog,
      updateTime,
      keydownHandler,
    };
  },
});
</script>
