<template>
  <v-container fluid :class="{ 'pa-4': !$vuetify.breakpoint.mobile }">
    <v-data-table
      :loading="true"
      :headers="headers"
      :search="search"
      :items="selectedData"
      sort-by="day"
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
                  v-model="selected"
                  :label="translate('menu.api')"
                  :items="apiItems"
                />
              </v-col>
            </v-row>
          </v-container>
        </v-toolbar>

        <area-chart
          class="pa-2"
          :data="graphData"
        />
      </template>

      <template #[`item.time`]="{ item }">
        {{ dayjs(item.timestamp).format('LTS') }}
      </template>

      <template #[`item.endpoint`]="{ item }">
        <strong>{{ item.method }}</strong> {{ item.endpoint }} {{ item.code }}
      </template>

      <template #[`item.remaining`]="{ item }">
        <pre>{{ parseJSON(item.remaining) }}</pre>
      </template>

      <template #[`item.data`]="{ item }">
        <pre
          v-if="item.request"
          class="pt-1"
          style="word-wrap: break-word; font-family: monospace;
          overflow-y: auto; overflow-x: hidden; max-height: 200px;
          width: fit-content;"
        >{{ parseJSON(item.request) }}</pre>
        <pre
          class="pt-3"
          style="word-wrap: break-word; font-family: monospace;
          overflow-y: auto; overflow-x: hidden; max-height: 200px;
          width: fit-content;"
        >{{ parseJSON(item.data) }}</pre>
      </template>
    </v-data-table>
  </v-container>
</template>

<script lang="ts">
import {
  computed, defineComponent,
  onMounted, ref,
} from '@nuxtjs/composition-api';
import { ButtonStates } from '@sogebot/ui-helpers/buttonStates';
import { dayjs } from '@sogebot/ui-helpers/dayjsHelper';
import { getSocket } from '@sogebot/ui-helpers/socket';
import translate from '@sogebot/ui-helpers/translate';
import Chart from 'chart.js';
import {
  capitalize, get, groupBy, isNil, orderBy,
} from 'lodash';
import Vue from 'vue';
import Chartkick from 'vue-chartkick';

Vue.use(Chartkick.use(Chart));

export default defineComponent({
  setup () {
    const selected = ref('helix');
    const apiItems = computed(() => {
      return [
        {
          value: 'helix', text: `helix (${items.value.filter(o => o.api === 'helix').length})`,
        },
        {
          value: 'unofficial', text: `unofficial (${items.value.filter(o => o.api === 'unofficial').length})`,
        },
        {
          value: 'other', text: `other (${items.value.filter(o => o.api === 'other').length})`,
        },
      ];
    });

    const selectedData = computed(() => {
      return items.value.filter(o => o.api === selected.value).sort((a, b) => b.timestamp - a.timestamp);
    });

    const graphData = computed(() => {
      const success = items.value.filter(o => o.api === selected.value && String(o.code).startsWith('2'));
      const errors = items.value.filter(o => o.api === selected.value && !String(o.code).startsWith('2'));

      const successPerMinute: any = {
      };
      const _successPerMinute = groupBy(success, (o) => {
        return (new Date(o.timestamp)).getHours() + ':' + (new Date(o.timestamp)).getMinutes();
      });
      for (const minute of Object.keys(_successPerMinute)) {
        const timestamp = String(new Date(_successPerMinute[minute][0].timestamp));
        successPerMinute[timestamp] = _successPerMinute[minute].length;
      }

      const errorsPerMinute: any = {
      };
      const _errorsPerMinute = groupBy(errors, (o) => {
        return (new Date(o.timestamp)).getMinutes();
      });
      for (const minute of Object.keys(_errorsPerMinute)) {
        const timestamp = String(new Date(_errorsPerMinute[minute][0].timestamp));
        errorsPerMinute[timestamp] = _errorsPerMinute[minute].length;
      }

      // we need to have same datas for timestamps if errors are 0
      for (const [timestamp] of Object.entries(successPerMinute)) {
        if (!errorsPerMinute[timestamp]) {
          errorsPerMinute[timestamp] = 0;
        }
      }

      return [
        {
          name: 'Success', data: successPerMinute,
        },
        {
          name: 'Errors', data: errorsPerMinute,
        },
      ];
    });

    const search = ref('');

    const items = ref([] as any[]);

    const headers = [
      {
        value: 'time', text: capitalize(translate('date')),
      },
      {
        value: 'call', text: capitalize('name'),
      },
      {
        value: 'endpoint', text: capitalize('endpoint'),
      },
      {
        value: 'remaining', text: capitalize('remaining API calls'),
      },
      {
        value: 'data', text: capitalize('data'), sortable: false,
      },
    ];

    const refresh = () => {
      getSocket('/').off('api.stats').on('api.stats', (c) => {
        c.code = get(c, 'code', 200); // set default to 200
        c.data = !isNil(c.data) ? JSON.stringify(c.data) : 'n/a';
        c.remaining = !isNil(c.remaining) ? c.remaining : 'n/a';
        items.value.push(c);
      });
    };

    onMounted(() => {
      refresh();
    });

    function parseJSON (JSONString: string) {
      try {
        return JSON.stringify(JSON.parse(JSONString), null, 2);
      } catch (e) {
        return JSONString;
      }
    }

    return {
      orderBy,
      headers,
      search,
      items,
      translate,
      refresh,
      capitalize,
      selected,
      parseJSON,
      graphData,
      dayjs,
      selectedData,
      apiItems,
      ButtonStates,
    };
  },
});
</script>
