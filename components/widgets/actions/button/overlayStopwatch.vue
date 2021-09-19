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
              {{ mdiHelp }}
            </template>
            <template v-else>
              {{ isStarted ? mdiPause : mdiPlay }}
            </template>
          </v-icon>
        </v-col>
        <v-col style="align-self: center;" class="text">
          <div style="font-size: 0.8rem;">
            {{ time }}
          </div>
        </v-col>

        <v-col v-if="!editing" cols="auto" class="d-flex">
          <v-icon :color="color" class="plus">
            {{ mdiAlarmPlus }}
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
              <v-icon>{{ mdiCheck }}</v-icon>
            </v-btn>
          </template>
        </v-text-field>
      </div>
    </v-expand-transition>
  </div>
</template>

<script lang="ts">
import {
  mdiAlarmPlus, mdiCheck, mdiHelp, mdiPause, mdiPlay,
} from '@mdi/js';
import { useContext } from '@nuxtjs/composition-api';
import {
  DAY, HOUR, MINUTE, SECOND,
} from '@sogebot/ui-helpers/constants';
import { getSocket } from '@sogebot/ui-helpers/socket';
import {
  computed,
  defineComponent, onMounted, ref, watch,
} from '@vue/composition-api';

import api from '../../../../functions/api';

import type {
  OverlayMapperGroup, OverlayMappers, OverlayMapperStopwatch,
} from '.bot/src/database/entity/overlay';

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
    const { $axios } = useContext();
    const selected = ref(props.item.selected);
    watch(selected, (val) => {
      ctx.emit(val ? 'select' : 'unselect');
    });

    const stopwatch = ref(null as OverlayMapperGroup['opts']['items'][number] | OverlayMapperStopwatch | null);
    const timestamp = ref(0);
    const isStarted = ref(null as boolean | null);
    const showMenu = ref(false);

    const showDialog = () => {
      ctx.emit('update:dialog', true);
    };

    const time = computed(() => {
      if (timestamp.value === null) {
        return '--:--:--';
      }
      const days = Math.floor(timestamp.value / DAY);
      const hours = Math.floor((timestamp.value - days * DAY) / HOUR);
      const minutes = Math.floor((timestamp.value - (days * DAY) - (hours * HOUR)) / MINUTE);
      const seconds = Math.floor((timestamp.value - (days * DAY) - (hours * HOUR) - (minutes * MINUTE)) / SECOND);
      let millis: number | string = Math.floor((timestamp.value - (days * DAY) - (hours * HOUR) - (minutes * MINUTE) - (seconds * SECOND)));

      if (millis < 10) {
        millis = `00${millis}`;
      } else if (millis < 100) {
        millis = `0${millis}`;
      }
      let output = '';
      if (days > 0) {
        output += `${days}d`;
      }

      output += `${hours < 10 ? '0' : ''}${hours}:${minutes < 10 ? '0' : ''}${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
      if (stopwatch.value?.opts.showMilliseconds) {
        output += `.${millis}`;
      }
      return output;
    });

    const refresh = () => {
      api.getOne<OverlayMappers>($axios, `/api/v1/overlay`, props.item.options.stopwatchId)
        .then((response) => {
          stopwatch.value = response.data as OverlayMapperStopwatch;
          timestamp.value = stopwatch.value.opts?.currentTime || 0;
        }).catch((e) => {
          // we need to search for group
          api.get<OverlayMappers[]>($axios, `/api/v1/overlay`)
            .then((response) => {
              for (const overlay of response.data.data) {
                const groupCheck = (item: OverlayMappers): item is OverlayMapperGroup => {
                  return item.value === 'group';
                };
                if (groupCheck(overlay)) {
                  const found = overlay.opts.items.find(o => o.id === props.item.options.stopwatchId && o.type === 'stopwatch');
                  if (found) {
                    stopwatch.value = found;
                  }
                }
              }
            });

          console.log({ e });
        });
    };

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
      refresh();
      setInterval(() => {
        // get actual status of opened overlay
        if (stopwatch.value && !showMenu.value) {
          getSocket('/overlays/stopwatch').emit('stopwatch::check', stopwatch.value.id, (_err: null, data?: { isEnabled: boolean, timestamp: number, time: number }) => {
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
        if (el.tagName === 'path') {
          return (Array.from(el.parentElement?.parentElement?.classList ?? []));
        } if (el.tagName === 'SPAN') {
          return (Array.from(el.classList ?? []));
        } else {
          return (Array.from(el.parentElement?.classList ?? []));
        }
      };

      const mouseOffsetX = ev.offsetX;
      const isText = getClassList(ev.target as Element).includes('text');

      const isDecrement = !getClassList(ev.target as Element).includes('plus')
        && (getClassList(ev.target as Element).includes('minus') || mouseOffsetX < ((isText ? text.clientWidth : card.clientWidth) / 2));

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

      // icons
      mdiPlay,
      mdiPause,
      mdiHelp,
      mdiAlarmPlus,
      mdiCheck,
    };
  },
});
</script>
