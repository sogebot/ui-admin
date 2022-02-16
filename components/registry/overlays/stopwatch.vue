<template>
  <v-expansion-panels v-model="model" multiple>
    <slot />
    <v-expansion-panel>
      <v-expansion-panel-header>Settings</v-expansion-panel-header>
      <v-expansion-panel-content>
        <v-text-field v-model.lazy="time" label="Current time" hide-details="auto" @keydown="keydownHandler" />

        <v-switch v-model="options.isPersistent" label="Persistent" :persistent-hint="true" :hint="(options.isPersistent ? 'Countdown will keep value on browser source load, you will need to reset by dashboard\'s action button.' : 'Countdown will reset on browser source load.')" />
        <v-switch v-model="options.isStartedOnSourceLoad" label="Start automatically" :persistent-hint="true" :hint="(options.isStartedOnSourceLoad ? 'Countdown will start automatically on browser source load.' : 'Countdown won\'t start on browser source load, you will need to start it by dashboard\'s action button.')" />
        <v-switch v-model="options.showMilliseconds" label="Show milliseconds" />
      </v-expansion-panel-content>
    </v-expansion-panel>
    <v-expansion-panel>
      <v-expansion-panel-header>Stopwatch font</v-expansion-panel-header>
      <v-expansion-panel-content>
        <font v-model="options.stopwatchFont" />
      </v-expansion-panel-content>
    </v-expansion-panel>
  </v-expansion-panels>
</template>

<script lang="ts">
import {
  computed,
  defineAsyncComponent,
  defineComponent, ref, watch,
} from '@nuxtjs/composition-api';
import {
  DAY, HOUR, MINUTE, SECOND,
} from '@sogebot/ui-helpers/constants';
import translate from '@sogebot/ui-helpers/translate';
import {
  defaultsDeep, isEqual, pick,
} from 'lodash';

export default defineComponent({
  components: {
    font: defineAsyncComponent(() => import('~/components/form/expansion/font.vue')),
  },
  props: {
    value: [Object, Array],
  },
  setup (props, ctx) {
    const model = ref([0]);
    const options = ref(
      pick(
        defaultsDeep(props.value, {
          currentTime:           0,
          isPersistent:          false,
          isStartedOnSourceLoad: true,
          showMilliseconds:      true,
          stopwatchFont:         {
            family:      'PT Sans',
            size:        50,
            borderPx:    1,
            borderColor: '#000000',
            weight:      '500',
            color:       '#ffffff',
            shadow:      [],
          },
        }),
        [
          'currentTime', 'stopwatchFont', 'isPersistent', 'isStartedOnSourceLoad', 'showMilliseconds',
        ],
      ));

    watch(() => options.value.currentTime, (val) => {
      if (val < 0) {
        options.value.currentTime = 0;
      }
    });

    const time = computed({
      get () {
        const days = Math.floor(options.value.currentTime / DAY);
        const hours = Math.floor((options.value.currentTime - days * DAY) / HOUR);
        const minutes = Math.floor((options.value.currentTime - (days * DAY) - (hours * HOUR)) / MINUTE);
        const seconds = Math.floor((options.value.currentTime - (days * DAY) - (hours * HOUR) - (minutes * MINUTE)) / SECOND);
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
          options.value.currentTime = newTime;
        }
      },
    });

    const keydownHandler: EventListener = (event) => {
      options.value.time = Number(options.value.time);

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
        options.value.currentTime += offset;
      } else if (key === 'ArrowDown') {
        options.value.currentTime -= offset;
      }
    };

    watch(options, (val) => {
      if (!isEqual(props.value, options.value)) {
        ctx.emit('input', val);
      }
    }, {
      deep: true, immediate: true,
    });

    return {
      model,
      options,
      time,
      translate,
      keydownHandler,
    };
  },
});
</script>
