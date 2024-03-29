<template>
  <v-container fluid :class="{ 'pa-4': !$vuetify.breakpoint.mobile }">
    <v-data-table
      :loading="state.loading !== ButtonStates.success"
      :headers="headers"
      :items="fItems"
      sort-by="cheeredAt"
    >
      <template #top>
        <v-toolbar
          flat
        >
          <v-container
            class="pt-10 px-0"
            fluid
          >
            <v-row>
              <v-col>
                <v-text-field
                  v-model="search"
                  append-icon="mdi-magnify"
                  label="Search"
                  hide-details
                />
              </v-col>
              <v-col cols="auto">
                <v-select
                  :value="selectedYear"
                  :label="capitalize(translate('bot.years').split('|')[0])"
                  :items="yearItems"
                />
              </v-col>
            </v-row>
          </v-container>
        </v-toolbar>
        <column-chart
          class="pa-2"
          :data="generateChartData"
          :ytitle="$store.state.configuration.currency"
        />
      </template>

      <template #[`item.cheeredAt`]="{ item }">
        {{ dayjs(item.cheeredAt).format('LL') }} {{ dayjs(item.cheeredAt).format('LTS') }}
      </template>

      <template #[`item.user`]="{ item }">
        <NuxtLink :to="'/manage/viewers/' + item.userId">
          {{ item.username }}&nbsp;<small class="text-muted">{{ item.userId }}</small>
        </NuxtLink>
      </template>
    </v-data-table>
  </v-container>
</template>

<script lang="ts">
import type { UserBitInterface } from '@entity/user';
import {
  computed,
  defineComponent, onMounted, ref,
} from '@nuxtjs/composition-api';
import { ButtonStates } from '@sogebot/ui-helpers/buttonStates';
import { dayjs } from '@sogebot/ui-helpers/dayjsHelper';
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
    const search = ref('');
    const selectedYear = ref(String((new Date()).getFullYear()));
    const items = ref([] as Required<UserBitInterface & { username: string }>[]);
    const fItems = computed(() => {
      if (search.value === '') {
        return items.value;
      } else {
        return items.value.filter((item) => {
          const message = item.message.toLowerCase().includes(search.value.toLowerCase());
          const userid = item.userId.toLowerCase().includes(search.value.toLowerCase());
          const username = item.username.toLowerCase().includes(search.value.toLowerCase());
          return message || userid || username;
        });
      }
    });

    const state = ref({ loading: ButtonStates.progress } as {
      loading: number;
    });

    const headers = [
      { value: 'cheeredAt', text: capitalize(translate('date')) },
      { value: 'amount', text: capitalize(translate('responses.variable.amount')) },
      {
        value: 'message', text: capitalize(translate('message')), sortable: false,
      },
      { value: 'user', text: capitalize(translate('user')) },
    ];

    const refresh = () => {
      getSocket('/stats/bits').emit('generic::getAll', (err, val) => {
        if (err) {
          return console.error(err);
        }
        items.value = val;
        state.value.loading = ButtonStates.success;
      });
    };

    onMounted(() => {
      refresh();
    });

    const years = computed(() => {
      return Object.keys(bitsByYear.value);
    });
    const bitsByYear = computed(() => {
      const d: { [year: number]: Required<UserBitInterface>[] } = { [new Date().getFullYear()]: [] };
      for (const bit of items.value) {
        const year = new Date(bit.cheeredAt).getFullYear();
        if (d[year]) {
          d[year].push(bit);
        } else {
          d[year] = [bit];
        }
      }
      return d;
    });
    const bitsByMonth = computed(() => {
      const d: { [month: number]: Required<UserBitInterface>[] } = {
        0:  [],
        1:  [],
        2:  [],
        3:  [],
        4:  [],
        5:  [],
        6:  [],
        7:  [],
        8:  [],
        9:  [],
        10: [],
        11: [],
      };
      for (const bit of bitsByYear.value[Number(selectedYear.value)]) {
        const month = new Date(bit.cheeredAt).getMonth();
        if (d[month]) {
          d[month].push(bit);
        } else {
          d[month] = [bit];
        }
      }
      return d;
    });

    const generateChartData = computed(() => {
      const data: [ string, number ][] = [];

      for (const [month, bits] of Object.entries(bitsByMonth.value)) {
        const monthFullName = dayjs().month(Number(month)).format('MMMM');

        data.push([
          monthFullName,
          Number(bits.reduce((a, b) => {
            return a + b.amount;
          }, 0).toFixed(2)),
        ]);
      }
      return data;
    });

    const yearItems = computed(() => {
      return years.value.map((item: any) => ({
        text:  item,
        value: item,
      }));
    });

    return {
      orderBy,
      headers,
      search,
      items,
      state,
      getPermissionName,
      translate,
      refresh,
      capitalize,
      dayjs,
      fItems,
      generateChartData,
      yearItems,
      selectedYear,
      ButtonStates,
    };
  },
});
</script>
