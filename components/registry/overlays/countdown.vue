<template>
  <div>
    <v-expansion-panels v-model="model" multiple>
      <v-expansion-panel>
        <v-expansion-panel-header>Settings</v-expansion-panel-header>
        <v-expansion-panel-content>
          <v-text-field v-model.lazy="time" label="Countdown" @keydown.up="options.time += 1000" @keydown.down="options.time -= 1000" />
          <v-row>
            <v-col cols="auto" align-self="center">
              <v-simple-checkbox v-model="options.showMessageWhenReachedZero" />
            </v-col>
            <v-col>
              <v-text-field v-model="options.messageWhenReachedZero" label="Message to show, when countdown reaches zero" :disabled="!options.showMessageWhenReachedZero" />
            </v-col>
          </v-row>
        </v-expansion-panel-content>
      </v-expansion-panel>
      <v-expansion-panel>
        <v-expansion-panel-header>Countdown font</v-expansion-panel-header>
        <v-expansion-panel-content>
          <font v-model="options.countdownFont" />
        </v-expansion-panel-content>
      </v-expansion-panel>
      <v-expansion-panel>
        <v-expansion-panel-header>Message font</v-expansion-panel-header>
        <v-expansion-panel-content>
          <font v-model="options.messageFont" />
        </v-expansion-panel-content>
      </v-expansion-panel>
    </v-expansion-panels>
  </div>
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
  components: { font: defineAsyncComponent(() => import('~/components/form/expansion/font.vue')) },
  props:      { value: [Object, Array] },
  setup (props, ctx) {
    const model = ref([0]);
    const options = ref(
      pick(
        defaultsDeep(props.value, {
          time:                       60000,
          messageWhenReachedZero:     '',
          showMessageWhenReachedZero: false,
          countdownFont:              {
            family:      'PT Sans',
            size:        16,
            borderPx:    1,
            borderColor: '#000000',
            weight:      '500',
            color:       '#ffffff',
            shadow:      [],
          },
          messageFont: {
            family:      'PT Sans',
            size:        16,
            borderPx:    1,
            borderColor: '#000000',
            weight:      '500',
            color:       '#ffffff',
            shadow:      [],
          },
        }),
        ['time', 'countdownFont', 'messageFont', 'messageWhenReachedZero', 'showMessageWhenReachedZero'],
      ));

    watch(() => options.value.time, (val) => {
      if (val < 0) {
        options.value.time = 0;
      }
    });

    const time = computed({
      get () {
        const days = Math.floor(options.value.time / DAY);
        const hours = Math.floor((options.value.time - days * DAY) / HOUR);
        const minutes = Math.floor((options.value.time - (days * DAY) - (hours * HOUR)) / MINUTE);
        const seconds = Math.floor((options.value.time - (days * DAY) - (hours * HOUR) - (minutes * MINUTE)) / SECOND);
        return `${days}d ${hours}h ${minutes}m ${seconds}s`;
      },
      set (value: string) {
        const regex = /((?<days>\d+)d)? ?((?<hours>\d+)h)? ?((?<minutes>\d+)m)? ?((?<seconds>\d+)s)?/g;
        const exec = regex.exec(value);
        let newTime = 0;
        if (exec?.groups) {
          for (const key of Object.keys(exec.groups)) {
            if (key === 'days') {
              newTime += Number(exec.groups[key]) * DAY;
            } else if (key === 'hours') {
              newTime += Number(exec.groups[key]) * HOUR;
            } else if (key === 'minutes') {
              newTime += Number(exec.groups[key]) * MINUTE;
            } else if (key === 'seconds') {
              newTime += Number(exec.groups[key]) * SECOND;
            }
          }
        }
        options.value.time = newTime;
      },
    });

    watch(options, (val) => {
      if (!isEqual(props.value, options.value)) {
        ctx.emit('input', val);
      }
    }, { deep: true, immediate: true });

    return {
      model,
      options,
      time,
      translate,
    };
  },
});
</script>
