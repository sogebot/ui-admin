<template>
  <v-container
    fluid
    :class="{ 'pa-4': !$vuetify.breakpoint.mobile }"
  >
    <h2 v-if="!$vuetify.breakpoint.mobile">
      {{ translate('menu.event-listeners') }}
    </h2>

    <v-dialog
      v-model="deleteDialog"
    >
      <v-card>
        <v-card-title>
          <span class="headline">Delete {{ selected.length }} Item(s)?</span>
        </v-card-title>

        <v-card-text>
          <v-card v-for="item of selected" :key="item.id" class="my-2">
            <v-card-text>
              <v-row>
                <v-col cols="3">
                  <v-list dense outlined class="dense">
                    <v-subheader>{{ translate('name') }}</v-subheader>
                    <v-list-item>{{ capitalize(translate(item.name)) }}</v-list-item>
                    <v-subheader>
                      {{ translate('events.definitions.filter.label') }}
                    </v-subheader>
                    <v-list-item :key="item.id + item.filter + '0'">
                      <code v-if="item.filter.length > 0" class="ml-2">{{ item.filter }}</code>
                      <span v-else class="grey--text text--darken-2">No filters set for this event</span>
                    </v-list-item>

                    <v-subheader v-if="Object.keys(item.definitions).length > 0">
                      Definitions
                    </v-subheader>
                    <v-list-item v-for="key of Object.keys(item.definitions)" :key="item.id + key + '0'">
                      <strong>{{ translate('events.definitions.' + key + '.label') }}:</strong> <code class="ml-2">{{ item.definitions[key] }}</code>
                    </v-list-item>
                  </v-list>
                </v-col>
                <v-col cols="9">
                  <v-list dense outlined class="dense">
                    <v-list-item v-if="item.operations.length === 0">
                      <span class="grey--text text--darken-2">No operations set for this event</span>
                    </v-list-item>

                    <template v-for="operation of item.operations">
                      <v-subheader :key="item.id + operation.name">
                        {{ capitalize(translate(operation.name)) }}
                      </v-subheader>
                      <v-list-item
                        v-for="key of Object.keys(operation.definitions)"
                        :key="item.id + key + '2'"
                      >
                        <strong>{{ translate('events.definitions.' + key + '.label') }}:</strong>
                        <code class="ml-2">{{ operation.definitions[key] }}</code>
                      </v-list-item>
                    </template>
                  </v-list>
                </v-col>
              </v-row>
            </v-card-text>
          </v-card>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn
            text
            @click="deleteDialog = false"
          >
            Cancel
          </v-btn>
          <v-btn
            color="error"
            text
            @click="deleteSelected"
          >
            Delete
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-sheet
      flat
      color="dark"
      class="my-2 p-2"
    >
      <v-row class="px-2" no-gutters>
        <v-col>
          <v-autocomplete
            v-model="search"
            label="Filter"
            multiple
            :items="eventsItems"
            :return-object="false"
            chips
            deletable-chips
            class="pr-2"
          />
        </v-col>

        <v-col cols="auto" align-self="center">
          <v-dialog
            v-model="newDialog"
            max-width="800px"
          >
            <template #activator="{ on, attrs }">
              <v-btn
                color="primary"
                v-bind="attrs"
                v-on="on"
              >
                New item
              </v-btn>
            </template>

            <v-card>
              <v-card-title>
                <span class="headline">New item</span>
              </v-card-title>

              <v-card-text :key="timestamp">
                <new-item
                  :rules="rules"
                  @close="newDialog = false"
                  @save="saveSuccess"
                />
              </v-card-text>
            </v-card>
          </v-dialog>
        </v-col>
      </v-row>
    </v-sheet>

    <v-card v-for="item of filteredItems" :key="item.id" class="my-2">
      <v-card-text>
        <v-row>
          <v-col cols="12" md="6" lg="3">
            <v-list dense outlined class="dense">
              <v-subheader>{{ translate('name') }}</v-subheader>
              <v-list-item>{{ capitalize(translate(item.name)) }}</v-list-item>
              <v-edit-dialog
                persistent
                large
                :return-value.sync="item.filter"
                @save="update(item, false, 'filter')"
              >
                <v-subheader>
                  {{ translate('events.definitions.filter.label') }}
                </v-subheader>
                <v-list-item :key="item.id + item.filter + '0'">
                  <code v-if="item.filter.length > 0" class="ml-2">{{ item.filter }}</code>
                  <span v-else class="grey--text text--darken-2">No filters set for this event</span>
                </v-list-item>

                <template #input>
                  <v-textarea
                    v-model="item.filter"
                    hide-details="auto"
                    :label="capitalize(translate('systems.customcommands.filter.name'))"
                    :rows="1"
                    counter
                    auto-grow
                    @keydown.enter.prevent
                  >
                    <template #append>
                      <input-variables
                        :filters="['global', ...availableVariables(item.name)]"
                        @input="item.filter = item.filter + $event"
                      />
                    </template>
                  </v-textarea>
                </template>
              </v-edit-dialog>

              <v-edit-dialog
                v-if="Object.keys(item.definitions).length > 0"
                persistent
                large
                @open="backupDefinitions(item.definitions)"
                @close="restoreDefinitions(item)"
                @save="update(item, false, 'definitions')"
              >
                <v-subheader>
                  Definitions
                </v-subheader>
                <v-list-item v-for="key of Object.keys(item.definitions)" :key="item.id + key + '0'">
                  <strong>{{ translate('events.definitions.' + key + '.label') }}:</strong> <code class="ml-2">{{ item.definitions[key] }}</code>
                </v-list-item>

                <template #input>
                  <div
                    v-for="defKey of Object.keys(item.definitions)"
                    :key="timestamp + defKey"
                  >
                    <v-switch
                      v-if="typeof item.definitions[defKey] === 'boolean'"
                      v-model="item.definitions[defKey]"
                      :label="translate(`events.definitions.${defKey}.label`)"
                    />
                    <rewards
                      v-if="defKey === 'titleOfReward'"
                      :value.sync="item.definitions[defKey]"
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
                </template>
              </v-edit-dialog>
            </v-list>
          </v-col>
          <v-col cols="12" md="6" lg="9">
            <operations
              :item="item"
              :operations="item.operations"
              :rules="rules"
              @save="item.operations = $event; update(item, false, 'operations')"
            />
          </v-col>
        </v-row>
      </v-card-text>

      <v-card-actions class="ma-2">
        <v-spacer />
        <v-btn
          :color="item.isEnabled ? 'success' : 'error'"
          @click="item.isEnabled = !item.isEnabled; update(item, true, 'isEnabled')"
        >
          {{ translate(item.isEnabled ? 'enabled' : 'disabled') }}
        </v-btn>

        <v-btn color="error" text @click="selected = [item]; deleteDialog = true;">
          {{ translate('delete') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-container>
</template>

<script lang="ts">
import { mdiDelete, mdiMagnify } from '@mdi/js';
import { ButtonStates } from '@sogebot/ui-helpers/buttonStates';
import { getSocket } from '@sogebot/ui-helpers/socket';
import translate from '@sogebot/ui-helpers/translate';
import {
  computed,
  defineAsyncComponent, defineComponent, onMounted, ref, watch,
} from '@vue/composition-api';
import { capitalize, cloneDeep } from 'lodash-es';

import type { EventInterface, Events } from '.bot/src/bot/database/entity/event';
import { error } from '~/functions/error';
import { EventBus } from '~/functions/event-bus';
import {
  minValue, required, startsWith,
} from '~/functions/validators';

export default defineComponent({
  components: {
    'new-item': defineAsyncComponent({ loader: () => import('~/components/new-item/events-newItem.vue') }),
    operations: defineAsyncComponent({ loader: () => import('~/components/events/operations.vue') }),
  },
  setup () {
    const timestamp = ref(Date.now());

    const search = ref([] as string[]);

    const selected = ref([] as EventInterface[]);
    const deleteDialog = ref(false);
    const newDialog = ref(false);
    const availableEvents = ref([] as Events.SupportedEvent[]);

    const items = ref([] as EventInterface[]);

    const definitions = ref({} as any);
    const eventsItems = computed(() => {
      return availableEvents.value
        .filter((item) => {
          return items.value.map(o => o.name).includes(item.id);
        })
        .map(item => ({
          text:     capitalize(translate(item.id)),
          value:    item.id,
          disabled: false,
        }));
    });

    const backupDefinitions = (value: any) => {
      definitions.value = cloneDeep(value);
      timestamp.value = Date.now();
    };

    const restoreDefinitions = (item: EventInterface) => {
      item.definitions = cloneDeep(definitions.value);
    };

    const filteredItems = computed(() => {
      return items.value.filter((item) => {
        return search.value.length === 0 || search.value.includes(item.name);
      });
    });

    const rules = {
      // event definitions
      fadeOutXCommands:  [required, minValue(0)],
      fadeOutInterval:   [required, minValue(0)],
      runEveryXCommands: [required, minValue(0)],
      runEveryXKeywords: [required, minValue(0)],
      fadeOutXKeywords:  [required, minValue(0)],
      runInterval:       [required, minValue(0)],
      commandToWatch:    [required, startsWith(['!'])],
      keywordToWatch:    [required],
      runAfterXMinutes:  [required, minValue(1)],
      runEveryXMinutes:  [required, minValue(1)],
      viewersAtLeast:    [required, minValue(0)],

      // operation definitions
      messageToSend:        [required],
      commandToRun:         [required],
      emotesToExplode:      [required],
      channel:              [required],
      customVariable:       [required],
      emotesToFirework:     [required],
      numberToDecrement:    [required, minValue(1)],
      numberToIncrement:    [required, minValue(1)],
      durationOfCommercial: [required],
    };

    const state = ref({ loading: ButtonStates.progress } as {
      loading: number;
    });

    watch(newDialog, () => {
      timestamp.value = Date.now();
    });

    const saveSuccess = () => {
      refresh();
      EventBus.$emit('snack', 'success', 'Data updated.');
      newDialog.value = false;
    };

    onMounted(() => {
      refresh();
    });

    const headersDelete = [
      {
        value: 'name', text: '', sortable: false,
      },
      {
        value: 'definitions', text: '', sortable: false,
      },
      {
        value: 'operations', text: '', sortable: false,
      },
    ];

    const refresh = async () => {
      await Promise.all([
        new Promise((resolve) => {
          getSocket('/core/events').emit('generic::getAll', (err: string | null, data: EventInterface[]) => {
            if (err) {
              resolve(false);
              return error(err);
            }
            items.value = data;
            console.groupCollapsed('events::generic::getAll');
            console.debug({ data });
            console.groupEnd();
            resolve(true);
          });
        }),
        new Promise((resolve) => {
          getSocket('/core/events').emit('list.supported.events', (err: string | null, data: Events.SupportedEvent[]) => {
            if (err) {
              error(err);
              resolve(false);
              return;
            }
            availableEvents.value = data;
            resolve(true);
          });
        }),
      ]);
      state.value.loading = ButtonStates.success;
    };
    const update = async (item: typeof items.value[number], multi = false, attr: keyof typeof items.value[number]) => {
      // check validity
      for (const key of Object.keys(rules)) {
        for (const rule of (rules as any)[key]) {
          const ruleStatus = rule((item as any)[key]);
          if (ruleStatus === true || typeof (item as any)[key] === 'undefined') {
            continue;
          } else {
            EventBus.$emit('snack', 'red', `[${key}] - ${ruleStatus}`);
            refresh();
            return;
          }
        }
      }
      if (attr === 'definitions') {
        // check validity of definitions
        for (const key of Object.keys(item.definitions)) {
          if (typeof (rules as any)[key] === 'undefined') {
            continue;
          }
          for (const rule of (rules as any)[key]) {
            const ruleStatus = rule((item as any).definitions[key]);
            if (ruleStatus === true || typeof (item as any).definitions[key] === 'undefined') {
              continue;
            } else {
              EventBus.$emit('snack', 'red', `[${key}] - ${ruleStatus}`);
              refresh();
              return;
            }
          }
        }
      }

      // update all instantly
      for (const i of [item, ...(multi ? selected.value : [])]) {
        (i as any)[attr] = item[attr];
      }

      await Promise.all(
        [item, ...(multi ? selected.value : [])].map((itemToUpdate) => {
          return new Promise((resolve) => {
            console.log('Updating', { itemToUpdate }, { attr, value: item[attr] });
            getSocket('/core/events').emit('events::save', {
              ...itemToUpdate,
              [attr]: item[attr], // save new value for all selected items
            }, () => {
              resolve(true);
            });
          });
        }),
      );
      refresh();
      EventBus.$emit('snack', 'success', 'Data updated.');
    };

    const deleteSelected = async () => {
      deleteDialog.value = false;
      await Promise.all(
        selected.value.map((item) => {
          return new Promise((resolve, reject) => {
            getSocket('/core/events').emit('events::remove', item, (err: string | null) => {
              if (err) {
                reject(error(err));
              }
              resolve(true);
            });
          });
        }),
      );
      refresh();

      EventBus.$emit('snack', 'success', 'Data removed.');
      selected.value = [];
    };

    const isGroupSelected = (group: string) => {
      for (const item of items.value.filter(o => o.name === group)) {
        if (!selected.value.find(o => o.id === item.id)) {
          return false;
        }
      }
      return true;
    };

    const toggleGroupSelection = (group: string) => {
      if (isGroupSelected(group)) {
        // deselect all
        selected.value = selected.value.filter(o => o.name !== group);
      } else {
        for (const item of items.value.filter(o => o.name === group)) {
          if (!selected.value.find(o => o.id === item.id)) {
            selected.value.push(item);
          }
        }
      }
    };

    const availableVariables = (name: string) => {
      const variables = (availableEvents.value.find(o => o.id === name) || { variables: [] }).variables;
      return variables;
    };

    return {
      availableVariables,
      definitions,
      items,
      filteredItems,
      search,
      state,
      headersDelete,
      update,
      deleteSelected,
      translate,

      selected,
      deleteDialog,
      newDialog,

      rules,

      timestamp,
      saveSuccess,

      capitalize,
      mdiMagnify,
      mdiDelete,

      ButtonStates,
      isGroupSelected,
      toggleGroupSelection,
      backupDefinitions,
      restoreDefinitions,
      eventsItems,
    };
  },
});
</script>
