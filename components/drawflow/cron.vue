<template>
  <div ref="pointer">
    <v-toolbar dense color="blue-grey darken-4">
      <v-icon color="white" left>
        mdi-ear-hearing
      </v-icon>
      <v-toolbar-title class="text-button white--text">
        {{ $t('registry.plugins.cron.name') }}
      </v-toolbar-title>
    </v-toolbar>
    <v-card dark>
      <v-card-text>
        <v-text-field
          v-model="item"
          :hint="translate('systems.points.settings.resetIntervalCron.help')"
          class="pb-2"
        >
          <template #message="{ message }">
            <!-- html hints -->
            <span v-html="message" />
          </template>
        </v-text-field>

        <v-simple-table dense>
          <template #default>
            <tbody>
              <tr v-for="timestamp of cronIntervals" :key="timestamp">
                <td>{{ new Date(timestamp).toLocaleString() }}</td>
              </tr>
            </tbody>
          </template>
        </v-simple-table>
        <v-alert v-if="cronError.length > 0" dense border="left" text color="error">
          {{ cronError }}
        </v-alert>
      </v-card-text>
    </v-card>
  </div>
</template>

<script setup lang="ts">
import { getSocket } from '@sogebot/ui-helpers/socket';
import translate from '@sogebot/ui-helpers/translate';

import { EventBus } from '~/functions/event-bus';

const item = ref('0 * * * * *');
const data = ref('{}');
const cronIntervals = ref([] as number[]);
const cronError = ref('');

const pointer = ref(null as null | HTMLElement);
const nodeId = ref(null as null | string);

watch(item, (val) => {
  if (val) {
    getSocket(`/systems/points`).emit('parseCron', val, (err, intervals) => {
      if (err) {
        cronIntervals.value = [];
        if (err instanceof Error) {
          cronError.value = err.stack || err.message;
        } else {
          cronError.value = err;
        }
      } else {
        cronError.value = '';
        cronIntervals.value = intervals;
      }
    });
  }
}, { deep: true, immediate: true });

watch(pointer, (value) => {
  nodeId.value = value?.parentElement?.parentElement?.id ?? null;

  if (nodeId.value) {
    EventBus.$emit('drawflow::node::value', nodeId.value, (val, _data) => {
      item.value = val;
      data.value = _data;
    });
  }
});

watch([item, data], (value) => {
  if (nodeId.value) {
    EventBus.$emit('drawflow::node::update', nodeId.value, value[0], value[1]);
  }
});
</script>
