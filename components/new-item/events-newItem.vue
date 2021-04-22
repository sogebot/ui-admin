<template>
  <v-form
    ref="form"
    v-model="valid"
    lazy-validation
  >
    <v-stepper v-model="e1">
      <v-stepper-header>
        <v-stepper-step
          :complete="e1 > 1"
          step="1"
          editable
        >
          Select event to track
        </v-stepper-step>

        <v-divider />

        <v-stepper-step
          :complete="e1 > 2"
          step="2"
          :editable="haveEventDefinitions"
          :rules="[() => valid]"
        >
          Set definitions
          <small v-if="!haveEventDefinitions" class="red--text text--lighten-2">Not available for this event</small>
        </v-stepper-step>

        <v-divider />

        <v-stepper-step
          :complete="e1 > 3"
          editable
          step="3"
        >
          Set filter
          <small>Optional</small>
        </v-stepper-step>
      </v-stepper-header><v-stepper-items>
        <v-stepper-content :step="1">
          <v-autocomplete
            v-model="event"
            :label="capitalize(translate('event'))"
            :items="eventsItems"
            :return-object="false"
            hide-selected
          />

          <v-btn
            class="mr-4 mt-2"
            @click="haveEventDefinitions ? e1 = 2 : e1 = 3"
          >
            continue
          </v-btn>

          <v-btn
            class="mr-4 mt-2"
            @click="closeDlg"
          >
            close
          </v-btn>
        </v-stepper-content>

        <v-stepper-content step="2">
          <div
            v-for="defKey of Object.keys(definitions)"
            :key="defKey"
          >
            <v-switch
              v-if="typeof definitions[defKey] === 'boolean'"
              v-model="definitions[defKey]"
              :label="translate(`events.definitions.${defKey}.label`)"
            />
            <rewards
              v-if="defKey === 'titleOfReward'"
              :rules="rules"
              :value.sync="definitions[defKey]"
            />
            <v-text-field
              v-else-if="typeof definitions[defKey] === 'string'"
              v-model="definitions[defKey]"
              :rules="rules[defKey]"
              :label="translate(`events.definitions.${defKey}.label`)"
              :hint="translate('events.definitions.' + defKey + '.placeholder')"
              persistent-hint
            />
            <v-text-field
              v-else-if="typeof definitions[defKey] === 'number'"
              v-model.number="definitions[defKey]"
              :rules="rules[defKey]"
              type="number"
              min="0"
              :label="translate(`events.definitions.${defKey}.label`)"
              :hint="translate('events.definitions.' + defKey + '.placeholder')"
              persistent-hint
            />
          </div>

          <v-btn
            class="mr-4 mt-2"
            :disabled="!valid"
            @click="validateForm(3);"
          >
            continue
          </v-btn>

          <v-btn
            class="mr-4 mt-2"
            @click="closeDlg"
          >
            close
          </v-btn>
        </v-stepper-content>

        <v-stepper-content step="3">
          <v-lazy>
            <v-textarea
              v-model="filter"
              hide-details="auto"
              :label="capitalize(translate('systems.customcommands.filter.name'))"
              :rows="1"
              counter
              auto-grow
              @keydown.enter.prevent
            >
              <template #append>
                <input-variables
                  :filters="['global', ...availableVariables]"
                  @input="filter = filter + $event"
                />
              </template>
            </v-textarea>
          </v-lazy>

          <v-btn
            class="mr-4 mt-2"
            :loading="newItemSaving"
            :disabled="!valid"
            @click="newItem"
          >
            submit
          </v-btn>

          <v-btn
            class="mr-4 mt-2"
            @click="closeDlg"
          >
            close
          </v-btn>
        </v-stepper-content>
      </v-stepper-items>
    </v-stepper>
  </v-form>
</template>

<script lang="ts">
import { getSocket } from '@sogebot/ui-helpers/socket';
import translate from '@sogebot/ui-helpers/translate';
import {
  computed,
  defineAsyncComponent,
  defineComponent, onMounted, ref, watch,
} from '@vue/composition-api';
import { capitalize } from 'lodash-es';
import { v4 as uuid } from 'uuid';

import { EventInterface, Events } from '~/.bot/src/bot/database/entity/event';
import { error } from '~/functions/error';

export default defineComponent({
  props:      { rules: Object },
  components: {
    rewards:           defineAsyncComponent({ loader: () => import('~/components/rewards.vue') }),
    'input-variables': defineAsyncComponent({ loader: () => import('~/components/inputVariables.vue') }),
  },
  setup (_, ctx) {
    const e1 = ref(1);
    const event = ref('clearchat');
    const filter = ref('');
    const definitions = ref({});
    const availableEvents = ref([] as Events.SupportedEvent[]);
    const newItemSaving = ref(false);
    const valid = ref(true);

    const form = ref(null);

    watch(event, (val) => {
      // set definitions
      const defaultEvent = availableEvents.value.find(o => o.id === val);
      if (defaultEvent) {
        if (defaultEvent.definitions) {
          definitions.value = defaultEvent.definitions;
        }
      }
    });

    const eventsItems = computed(() => {
      return availableEvents.value.map(item => ({
        text:     capitalize(translate(item.id)),
        value:    item.id,
        disabled: false,
      }));
    });

    const haveEventDefinitions = computed(() => {
      return Object.keys(availableEvents.value.find(o => o.id === event.value)?.definitions ?? {}).length > 0;
    });

    onMounted(() => {
      getSocket('/core/events').emit('list.supported.events', (err: string | null, data: Events.SupportedEvent[]) => {
        if (err) {
          error(err);
          return;
        }

        for (const d of data) {
          // sort variables
          if (d.variables) {
            d.variables = d.variables.sort((A, B) => {
              if (A < B) { // sort string ascending
                return -1;
              }
              if (A > B) {
                return 1;
              }
              return 0; // default return value (no sorting)
            });
          } else {
            d.variables = [];
          }
        }
        availableEvents.value = data.sort((a, b) => {
          const A = translate(a.id).toLowerCase();
          const B = translate(b.id).toLowerCase();
          if (A < B) { // sort string ascending
            return -1;
          }
          if (A > B) {
            return 1;
          }
          return 0; // default return value (no sorting)
        });
      });
    });

    const newItem = async () => {
      if ((form.value as unknown as HTMLFormElement).validate()) {
        newItemSaving.value = true;
        await new Promise(() => {
          const item: EventInterface = {
            id:          uuid(),
            name:        event.value,
            isEnabled:   true,
            operations:  [],
            triggered:   {},
            definitions: definitions.value,
            filter:      filter.value,
          };
          console.log('Saving', { item });
          getSocket('/core/events').emit('events::save', item, () => {
            ctx.emit('save');
            newItemSaving.value = false;
          });
        });
      }
    };

    const closeDlg = () => {
      ctx.emit('close');
    };

    const validateForm = (nextPage: number) => {
      if ((form.value as unknown as HTMLFormElement).validate()) {
        e1.value = nextPage;
      }
    };

    const availableVariables = computed(() => {
      const variables = (availableEvents.value.find(o => o.id === event.value) || { variables: [] }).variables;
      return variables;
    });

    return {
      availableVariables,
      capitalize,
      definitions,
      eventsItems,
      e1,
      translate,
      event,
      newItemSaving,
      newItem,
      valid,
      closeDlg,
      form,
      haveEventDefinitions,
      validateForm,
      filter,
    };
  },
});
</script>
