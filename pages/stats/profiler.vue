<template>
  <v-container fluid :class="{ 'pa-4': !$vuetify.breakpoint.mobile }">
    <v-data-table
      :loading="state.loading !== ButtonStates.success"
      :headers="headers"
      :items="items"
      sort-by="day"
    >
      <template #top>
        <line-chart
          class="pa-2"
          :data="generateChartData()"
        />
      </template>

      <template #[`item.min`]="{ item }">
        {{ item.min }} <small class="text-muted">ms</small>
      </template>

      <template #[`item.max`]="{ item }">
        {{ item.max }} <small class="text-muted">ms</small>
      </template>

      <template #[`item.avg`]="{ item }">
        {{ item.avg }} <small class="text-muted">ms</small>
      </template>

      <template #[`item.button`]="{ item }">
        <v-icon
          :class="[!showChartFunctions.includes(item.function) ? 'green--text' : 'red--text']"
          @click="toggleFunctionChart(item.function)"
        >
          {{ !showChartFunctions.includes(item.function) ? 'mdi-plus' : 'mdi-minus' }}
        </v-icon>
      </template>
    </v-data-table>
  </v-container>
</template>

<script lang="ts">
import {
  defineComponent,
  onMounted, ref, watch,
} from '@nuxtjs/composition-api';
import { ButtonStates } from '@sogebot/ui-helpers/buttonStates';
import { getSocket } from '@sogebot/ui-helpers/socket';
import translate from '@sogebot/ui-helpers/translate';
import Chart from 'chart.js';
import { capitalize, orderBy } from 'lodash';
import Vue from 'vue';
import Chartkick from 'vue-chartkick';

import { getPermissionName } from '~/functions/getPermissionName';

Vue.use(Chartkick.use(Chart));

export default defineComponent({
  setup () {
    const showChartFunctions = ref([] as string[]);
    watch(showChartFunctions, () => {
      localStorage.setItem('/stats/profiler/showChartFunctions', JSON.stringify(showChartFunctions.value));
    });
    const items = ref([] as {
      function: string, min: number, max: number, avg: number, samples: number, times: number[],
    }[]);
    const state = ref({ loading: ButtonStates.progress } as {
      loading: number;
    });

    const headers = [
      { value: 'function', text: capitalize('function') },
      { value: 'samples', text: capitalize('samples') },
      { value: 'min', text: capitalize('min time') },
      { value: 'max', text: capitalize('max time') },
      { value: 'avg', text: capitalize('average time') },
      {
        value: 'button', text: '', sortable: false,
      },
    ];

    const refresh = () => {
      showChartFunctions.value = JSON.parse(localStorage.getItem('/stats/profiler/showChartFunctions') || '[]');

      getSocket('/stats/profiler').emit('profiler::load', (err, val) => {
        if (err) {
          return console.error(err);
        }
        for (const item of val) {
          items.value.push({
            function: item[0],
            min:      Number(min(item[1]).toFixed(4)),
            max:      Number(max(item[1]).toFixed(4)),
            avg:      Number(avg(item[1]).toFixed(4)),
            samples:  item[1].length,
            times:    item[1],
          });
        }
        state.value.loading = ButtonStates.success;
      });
    };

    const toggleFunctionChart = (key: string) => {
      if (showChartFunctions.value.includes(key)) {
        showChartFunctions.value = showChartFunctions.value.filter(o => o !== key);
      } else {
        showChartFunctions.value.push(key);
      }
    };

    const avg = (data: number[]) => {
      return data.reduce((a, b) => (a + b)) / data.length;
    };

    const max = (data: number[]) => {
      return Math.max(...data);
    };

    const min = (data: number[]) => {
      return Math.min(...data);
    };

    onMounted(() => {
      refresh();
    });

    const generateChartData = () => {
      const generatedData = [];

      for (const item of items.value) {
        if (showChartFunctions.value.includes(item.function)) {
          generatedData.push({
            name: item.function,
            data: { ...item.times },
          });
        }
      }
      return generatedData;
    };

    return {
      orderBy,
      headers,
      items,
      state,
      getPermissionName,
      translate,
      refresh,
      capitalize,
      toggleFunctionChart,
      showChartFunctions,
      avg,
      max,
      min,
      generateChartData,
      ButtonStates,
    };
  },
});
</script>
