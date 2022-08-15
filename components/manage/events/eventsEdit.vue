<template>
  <div>
    <v-dialog
      v-model="menu"
      persistent
      scrollable
      :fullscreen="$vuetify.breakpoint.mobile"
      :loading="!isFormReset"
    >
      <template #activator="{ on, attrs }">
        <v-btn v-if="item.id !== undefined" icon v-bind="attrs" class="primary-hover" v-on="on">
          <v-icon>
            mdi-pencil
          </v-icon>
        </v-btn>
        <v-btn v-else v-bind="attrs" color="primary" v-on="on">
          New item
        </v-btn>
      </template>
      <v-card outlined class="pt-3" :key="(item.id || '') + isFormReset">
        <v-card-text>
          <v-form ref="form" v-model="valid" lazy-validation>
            <v-row dense>
              <v-col cols="4">
                <v-autocomplete
                  v-model="item.name"
                  :label="capitalize(translate('event'))"
                  :items="eventsItems"
                  :return-object="false"
                  hide-details="auto"
                  hide-selected
                />

                <v-text-field
                  v-model="item.filter"
                  hide-details="auto"
                  :label="capitalize(translate('systems.customcommands.filter.name'))"
                  @keydown.enter.prevent
                >
                  <template #append>
                    <input-variables
                      :filters="availableVariables"
                      @input="item.filter = item.filter + $event"
                    />
                  </template>
                </v-text-field>

                <v-switch
                  v-model="item.isEnabled"
                  :label="translate('enabled')"
                  persistent-hint
                  hide-details="auto"
                  class="pb-2"
                  :hint="(item.isEnabled
                    ? 'Event is enabled'
                    : 'Event is disabled')"
                />

                <div
                  v-for="defKey of Object.keys(item.definitions)"
                  :key="defKey"
                >
                  <v-switch
                    v-if="typeof item.definitions[defKey] === 'boolean'"
                    v-model="item.definitions[defKey]"
                    :label="translate(`events.definitions.${defKey}.label`)"
                  />
                  <rewards
                    v-if="defKey === 'rewardId'"
                    v-model="item.definitions[defKey]"
                    :rules="rules"
                  />
                  <v-text-field
                    v-else-if="typeof item.definitions[defKey] === 'string'"
                    v-model="item.definitions[defKey]"
                    :rules="rules[defKey]"
                    :label="translate(`events.definitions.${defKey}.label`)"
                    :hint="translate('events.definitions.' + defKey + '.placeholder')"
                    persistent-hint
                  />
                  <v-text-field
                    v-else-if="typeof item.definitions[defKey] === 'number'"
                    v-model.number="item.definitions[defKey]"
                    :rules="rules[defKey]"
                    type="number"
                    min="0"
                    :label="translate(`events.definitions.${defKey}.label`)"
                    :hint="translate('events.definitions.' + defKey + '.placeholder')"
                    persistent-hint
                  />
                </div>
                <v-text-field
                  v-if="item.id"
                  readonly
                  :value="'$triggerOperation(' + item.id +')'"
                  persistent-hint
                  title="Response filter"
                  hint="Be careful, not all variables may be available if triggered by response filter"
                />
              </v-col>
              <v-col>
                <operations
                  :item="item"
                  :operations.sync="item.operations"
                  :events="availableEvents"
                  :variables="availableEvents.find(o => o.id === item.name) || { variables: []}.variables"
                  :rules="rules"
                  :filters="availableVariables"
                  @save="item.operations = $event; update(item, false, 'operations')"
                />
              </v-col>
            </v-row>

            <tester :event="item.name" :events="availableEvents" :event-id="item.id" class="pt-6" />
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer />

          <v-btn text @click="menu = false">
            Cancel
          </v-btn>
          <v-btn color="primary" :loading="saving" text :disabled="!valid" @click="save()">
            Save &amp; Close
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script lang="ts">
import type { EventInterface, Events } from '@entity/event';
import { getSocket } from '@sogebot/ui-helpers/socket';
import translate from '@sogebot/ui-helpers/translate';
import {
  computed,
  defineAsyncComponent,
  defineComponent, onMounted, ref, watch,
} from '@vue/composition-api';
import capitalize from 'lodash/capitalize';
import cloneDeep from 'lodash/cloneDeep';
import { v4 } from 'uuid';

import { error } from '~/functions/error';
import { EventBus } from '~/functions/event-bus';

type Props = {
  value: EventInterface;
  rules: [];
};

const newItem: EventInterface = {
  name:        'clearchat',
  operations:  [],
  isEnabled:   true,
  triggered:   {},
  definitions: {},
  filter:      '',
};

export default defineComponent({
  components: {
    operations: defineAsyncComponent(() => import('./operations.vue')),
    tester:     defineAsyncComponent(() => import('./test-dialog.vue')),
  },
  props: {
    value:           Object,
    rules:           Object,
    permissionItems: Array,
    groupItems:      Array,
  },
  setup (props: Props, ctx) {
    const saving = ref(false);
    const menu = ref(false);
    const item = ref(cloneDeep(props.value || newItem));
    const valid = ref(true);
    const form = ref(null);
    const group = ref('');
    const isFormReset = ref(false);

    const availableEvents = ref([] as Events.SupportedEvent[]);

    watch(() => item.value.name, (val) => {
      // set definitions
      const defaultEvent = availableEvents.value.find(o => o.id === val);
      if (defaultEvent) {
        item.value = {
          ...item.value,
          definitions: defaultEvent.definitions
            ? cloneDeep(defaultEvent.definitions)
            : {},
        };
      }
    });

    const eventsItems = computed(() => {
      return availableEvents.value.map(availableEvent => ({
        text:     capitalize(translate(availableEvent.id)),
        value:    availableEvent.id,
        disabled: false,
      }));
    });

    const haveEventDefinitions = computed(() => {
      return Object.keys(availableEvents.value.find(o => o.id === item.value.name)?.definitions ?? {}).length > 0;
    });

    onMounted(() => {
      getSocket('/core/events').emit('list.supported.events', (err, data: Events.SupportedEvent[]) => {
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

    const resetForm = () => {
      valid.value = true;
      if (form.value as unknown) {
        (form.value as unknown as HTMLFormElement).resetValidation();
        item.value = cloneDeep(props.value || newItem);
        isFormReset.value = true;
      } else {
        setTimeout(() => {
          resetForm();
        }, 100);
      }
    };

    watch(menu, (val) => {
      isFormReset.value = false;
      if (val) {
        resetForm();
      }
    });

    const save = () => {
      if ((form.value as unknown as HTMLFormElement).validate()) {
        // check validity
        for (const key of Object.keys(props.rules)) {
          for (const rule of (props.rules as any)[key]) {
            const ruleStatus = rule((item.value as any)[key]);
            if (ruleStatus === true || typeof (item as any)[key] === 'undefined') {
              continue;
            } else {
              EventBus.$emit('snack', 'red', `[${key}] - ${ruleStatus}`);
              return;
            }
          }
        }

        saving.value = true;

        console.log('Updating', item.value);
        getSocket('/core/events').emit('events::save', {
          ...item.value,
          id: item.value.id ?? v4(),
        }, () => {
          menu.value = false;
          ctx.emit('save');
          saving.value = false;
        });
      }
    };

    const availableVariables = computed(() => {
      const variables = (availableEvents.value.find(o => o.id === item.value.name) || { variables: [] }).variables;
      return variables;
    });

    return {
      menu,
      item,
      save,
      translate,
      capitalize,
      valid,
      saving,
      form,
      group,
      isFormReset,

      availableVariables,
      availableEvents,
      eventsItems,
      haveEventDefinitions,
    };
  },
});
</script>
