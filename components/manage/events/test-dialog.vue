<template>
  <v-expansion-panels>
    <v-expansion-panel>
      <v-expansion-panel-header>Tester</v-expansion-panel-header>
      <v-expansion-panel-content>
        <v-card flat>
          <v-card-text>
            <span v-for="(variable, idx) of selectedEvent.variables" :class="{
              'py-1': !variable.startsWith('is.') || variable.startsWith('recipientis.')
            }" :key="variable + event">
              <v-row  no-gutters v-if="!variable.includes('Name') && !['currency', 'currencyInBot'].includes(variable)">
                <v-col cols="auto" align-self="center">
                  <v-btn icon :color="randomized.includes(variable) ? 'success' : 'error'" @click="randomized = xor(randomized, [variable])">
                    <v-icon>{{ mdiDiceMultiple }}</v-icon>
                  </v-btn>
                </v-col>
                <v-col align-self="center">
                  <v-textarea
                    v-if="['userInput', 'message', 'reason'].includes(variable)"
                    v-model="values[idx]"
                    auto-grow
                    :label="translate('responses.variable.' + variable)"
                    hide-details="auto"
                    :disabled="randomized.includes(variable)"
                  />
                  <v-select
                    v-if="variable === 'source'"
                    v-model="values[idx]"
                    :items="['Twitch', 'Discord']"
                    :label="translate('responses.variable.' + variable)"
                    hide-details="auto"
                    :disabled="randomized.includes(variable)"
                  />
                  <v-select
                    v-if="variable === 'tier'"
                    v-model="values[idx]"
                    :items="['Prime', '0', '1', '2']"
                    :label="translate('responses.variable.' + variable)"
                    hide-details="auto"
                    :disabled="randomized.includes(variable)"
                  />
                  <v-text-field
                    v-if="['duration', 'viewers', 'bits', 'subCumulativeMonths', 'count', 'subStreak', 'amount', 'amountInBotCurrency'].includes(variable)"
                    v-model.number="values[idx]"
                    :label="translate('responses.variable.' + variable)"
                    hide-details="auto"
                    :disabled="randomized.includes(variable)"
                  />
                  <v-text-field
                    v-if="['game', 'oldGame', 'target', 'username', 'recipient', 'command'].includes(variable)"
                    v-model="values[idx]"
                    :label="translate('responses.variable.' + variable)"
                    hide-details="auto"
                    :disabled="randomized.includes(variable)"
                  />
                  <v-checkbox
                    class="mt-0"
                    v-if="variable === 'method'"
                    :label="'Twitch Prime'"
                    v-model="values[idx]"
                    hide-details="auto"
                    :disabled="randomized.includes(variable)"
                  />
                  <v-checkbox
                    class="mt-0"
                    v-if="['subStreakShareEnabled'].includes(variable) || variable.startsWith('is.') || variable.startsWith('recipientis.')"
                    :label="translate('responses.variable.' + variable)"
                    v-model="values[idx]"
                    hide-details="auto"
                    :disabled="randomized.includes(variable)"
                  />
                </v-col>
              </v-row>
            </span>
          </v-card-text>

          <v-divider />

          <v-card-actions>
            <v-spacer />
            <v-btn
              color="success"
              @click="onSubmit"
            >
              Test
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-expansion-panel-content>
    </v-expansion-panel>
  </v-expansion-panels>
</template>

<script lang="ts">
import { mdiDiceMultiple } from '@mdi/js';
import {
  computed, defineComponent, ref, watch,
} from '@nuxtjs/composition-api';
import { getSocket } from '@sogebot/ui-helpers/socket';
import translate from '@sogebot/ui-helpers/translate';
import { capitalize, xor } from 'lodash';

import type { Events } from '~/.bot/src/database/entity/event';

type Props = {
  events: Events.SupportedEvent[]
  event: string,
  eventId: string,
};

export default defineComponent({
  props: {
    events: Array, event: String, eventId: String,
  },
  setup (props: Props) {
    const eventsItems = computed(() => {
      return props.events
        .map(item => ({
          text:     capitalize(translate(item.id)),
          value:    item.id,
          disabled: false,
        }));
    });

    const selectedEvent = computed(() => props.events.find(o => o.id === props.event));

    // generate all randomized buttons
    const randomized = ref([] as string[]);
    const values = ref([] as any[]);
    watch(selectedEvent, (val) => {
      if (val) {
        randomized.value = val.variables ?? [];
        values.value = (val.variables ?? []).map(() => '');
      }
    }, { deep: true, immediate: true });

    const onSubmit = () => {
      console.log({
        id: props.eventId, randomized: randomized.value, values: values.value, variables: selectedEvent.value?.variables ?? [],
      });
      getSocket('/core/events').emit('test.event', {
        id: props.eventId, randomized: randomized.value, values: values.value, variables: selectedEvent.value?.variables ?? [],
      }, () => {
        return true;
      });
    };

    return {
      eventsItems,
      selectedEvent,
      randomized,
      values,

      onSubmit,

      translate,
      xor,
      mdiDiceMultiple,
    };
  },
});
</script>
