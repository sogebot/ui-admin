<template>
  <v-row no-gutters>
    <v-col style="text-align: left;" cols="auto">
      <v-time-picker
        :use-seconds="true"
        class="timePicker"
        :value="(change > 0 ? change : Date.now()) | timeToTime"
        @input="value => change = setAttr(change, 'time', value)"
      />
    </v-col>
    <v-col>
      <v-date-picker
        :value="(change > 0 ? change : Date.now()) | timeToDate"
        @input="value => change = setAttr(change, 'date', value)"
      />
    </v-col>
    </div>
  </v-row>
</template>

<script lang="ts">
import {
  defineComponent, ref, watch,
} from '@nuxtjs/composition-api';

import {
  setAttr, timeToDate, timeToTime,
} from '~/functions/time';

export default defineComponent({
  filters: {
    timeToDate,
    timeToTime,
  },
  props: { value: Number },
  setup (props: { value: number }, ctx) {
    const change = ref(props.value);

    watch(change, (val) => {
      ctx.emit('input', Number(val));
    });

    return { change, setAttr };
  },
});
</script>

<style>
.timePicker .v-picker__title {
  padding: 9px;
}

.timePicker .v-time-picker-title__time {
  font-size: 50px !important;
}
</style>
