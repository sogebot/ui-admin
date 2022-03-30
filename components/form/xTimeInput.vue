<template>
  <v-text-field v-model.lazy="time" :label="label" :hint="hint" :rules="rules" hide-details="auto" @keydown="keydownHandler" />
</template>

<script lang="ts">
import { DAY, HOUR, MINUTE, SECOND } from '@sogebot/ui-helpers/constants';
import { computed, defineComponent } from '@vue/composition-api';

export default defineComponent({
  props: { value: Number, label: String, hint: String, rules: [Object, Array] },
  setup (props: { value: number }, ctx) {
    const time = computed({
      get () {
        const days = Math.floor(props.value / DAY);
        const hours = Math.floor((props.value - days * DAY) / HOUR);
        const minutes = Math.floor((props.value - (days * DAY) - (hours * HOUR)) / MINUTE);
        const seconds = Math.floor((props.value - (days * DAY) - (hours * HOUR) - (minutes * MINUTE)) / SECOND);
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
          ctx.emit('input', newTime);
        }
      },
    });

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
        ctx.emit('input', props.value + offset);
      } else if (key === 'ArrowDown') {
        ctx.emit('input', props.value - offset);
      }
    };

    return { time, keydownHandler };
  },
});
</script>
