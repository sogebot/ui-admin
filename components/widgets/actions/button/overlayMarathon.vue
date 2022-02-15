<template>
  <div>
    <v-card-text
      v-ripple
      class="text-button pa-1 mb-1 text-center"
      style="font-size: 12px !important; display: block;"
      :style="{ 'color': color }"
      @click="!editing ? trigger($event) : showDialog()"
    >
      <v-row no-gutters ripple>
        <v-slide-x-transition>
          <v-col v-if="editing" cols="auto" class="d-flex">
            <v-simple-checkbox v-if="color !== 'white'" v-model="selected" light />
            <v-simple-checkbox v-else v-model="selected" dark />
          </v-col>
        </v-slide-x-transition>
        <v-col v-if="!editing" cols="auto" class="d-flex" />
        <v-col :key="tick" style="align-self: center;" class="text">
          <div style="font-size: 0.8rem;" v-html="time()" />
        </v-col>

        <v-col v-if="!editing" cols="auto" class="d-flex">
          <v-icon :color="color" class="plus">
            mdi-alarm-plus
          </v-icon>
        </v-col>
      </v-row>
    </v-card-text>

    <v-expand-transition>
      <div v-if="showMenu && marathon">
        <v-text-field
          v-model.lazy="timeInput"
          label="Countdown"
          hide-details="auto"
          solo
          dense
          @keydown="keydownHandler"
        >
          <template #append>
            <v-btn icon @click="updateTime">
              <v-icon>mdi-plus</v-icon>
            </v-btn>
          </template>
        </v-text-field>
      </div>
    </v-expand-transition>
  </div>
</template>

<script lang="ts">
import {
  DAY, HOUR, MINUTE, SECOND,
} from '@sogebot/ui-helpers/constants';
import { getSocket } from '@sogebot/ui-helpers/socket';
import { useQuery, useResult } from '@vue/apollo-composable';
import {
  computed,
  defineComponent, onMounted, onUnmounted, ref, watch,
} from '@vue/composition-api';

import type {
  OverlayMapperGroup, OverlayMapperMarathon, OverlayMappers,
} from '@entity/overlay';
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
    let interval = 0;
    const selected = ref(props.item.selected);
    const tick = ref(0);
    const newTime = ref(0);
    watch(selected, (val) => {
      ctx.emit(val ? 'select' : 'unselect');
    });

    const timestamp = ref(0);
    const showMenu = ref(false);

    watch(showMenu, (val) => {
      if (!val) {
        newTime.value = 0;
      }
    });

    const showDialog = () => {
      ctx.emit('update:dialog', true);
    };

    const time = () => {
      if (timestamp.value === 0 || !marathon.value) {
        return '--:--:--';
      }

      const _time = Math.max(timestamp.value - Date.now(), 0);
      const days = Math.floor(_time / DAY);
      const hours = Math.floor((_time - days * DAY) / HOUR);
      const minutes = Math.floor((_time - (days * DAY) - (hours * HOUR)) / MINUTE);
      const seconds = Math.floor((_time - (days * DAY) - (hours * HOUR) - (minutes * MINUTE)) / SECOND);
      let millis: number | string = Math.floor((_time - (days * DAY) - (hours * HOUR) - (minutes * MINUTE) - (seconds * SECOND)) / 10);

      if (millis < 10) {
        millis = `0${millis}`;
      }

      let output = '';
      if (days > 0) {
        output += `${days}d`;
      }

      output += `${hours < 10 ? '0' : ''}${hours}:${minutes < 10 ? '0' : ''}${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
      const opts = typeof marathon.value.opts === 'string' ? JSON.parse(marathon.value.opts) : marathon.value.opts;
      if (opts.showMilliseconds) {
        output += `<small>.${millis}</small>`;
      }
      return output;
    };

    const { result, refetch } = useQuery(GET);
    const items = useResult<{ overlays: Record<string, any> }, (OverlayMapperMarathon | OverlayMapperGroup)[], (OverlayMapperMarathon | OverlayMapperGroup)[]>(result, [], data => [...data.overlays.marathon, ...data.overlays.group]);

    const groupCheck = (item: OverlayMappers): item is OverlayMapperGroup => {
      return item.value === 'group';
    };
    const marathon = computed(() => {
      for (const item of items.value) {
        if (groupCheck(item)) {
          const found = item.opts.items.find(o => o.id === props.item.options.marathonId && o.type === 'marathon');
          if (found) {
            found.opts = JSON.parse(found.opts);
            return found;
          }
        } else if (item.id === props.item.options.marathonId) {
          return item;
        }
      }
      return null;
    });

    const timeInput = computed({
      get () {
        const days = Math.floor(newTime.value / DAY);
        const hours = Math.floor((newTime.value - days * DAY) / HOUR);
        const minutes = Math.floor((newTime.value - (days * DAY) - (hours * HOUR)) / MINUTE);
        const seconds = Math.floor((newTime.value - (days * DAY) - (hours * HOUR) - (minutes * MINUTE)) / SECOND);
        return `${days}d ${hours}h ${minutes}m ${seconds}s`;
      },
      set (value: string) {
        const regex = /((?<days>\d+)d)? ?((?<hours>\d+)h)? ?((?<minutes>\d+)m)? ?((?<seconds>\d+)s)?/g;
        const exec = regex.exec(value);
        if (exec?.groups) {
          let _newTime = 0;
          for (const key of Object.keys(exec.groups)) {
            if (key === 'days') {
              _newTime += Number(exec.groups[key] ?? 0) * DAY;
            } else if (key === 'hours') {
              _newTime += Number(exec.groups[key] ?? 0) * HOUR;
            } else if (key === 'minutes') {
              _newTime += Number(exec.groups[key] ?? 0) * MINUTE;
            } else if (key === 'seconds') {
              _newTime += Number(exec.groups[key] ?? 0) * SECOND;
            }
          }
          newTime.value = _newTime;
        }
      },
    });

    onMounted(() => {
      refetch();
      interval = window.setInterval(() => {
        tick.value = Date.now();
        // get actual status of opened overlay
        if (marathon.value && !showMenu.value) {
          getSocket('/overlays/marathon').emit('marathon::check', marathon.value.id, (_err: null, data?: OverlayMapperMarathon) => {
            if (data && data.opts && marathon.value) {
              timestamp.value = Math.max(data.opts.endTime, Date.now());
            }
          });
        }
      }, 1000);
    });

    onUnmounted(() => {
      clearInterval(interval);
    });

    const updateTime = () => {
      if (marathon.value) {
        getSocket('/overlays/marathon').emit('marathon::update::set', {
          time: newTime.value,
          id:   marathon.value.id,
        });
      }
      showMenu.value = false;
    };

    const trigger = () => {
      if (!marathon.value) {
        return;
      }
      showMenu.value = !showMenu.value;
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
        newTime.value += offset;
      } else if (key === 'ArrowDown') {
        newTime.value -= offset;
      }
    };

    return {
      // refs
      marathon,
      selected,
      timestamp,
      newTime,
      time,
      timeInput,
      showMenu,
      tick,

      // functions
      trigger,
      showDialog,
      updateTime,
      keydownHandler,
    };
  },
});
</script>
