<template>
  <v-container
    fluid
    :class="{ 'pa-4': !$vuetify.breakpoint.mobile }"
  >
    <h2 v-if="!$vuetify.breakpoint.mobile">
      {{ translate('menu.event-listeners') }}
    </h2>

    <v-data-table
      v-model="selected"
      calculate-widths
      show-select
      :search="search"
      :loading="state.loading !== ButtonStates.success"
      :headers="headers"
      group-by="name"
      :items-per-page="-1"
      :items="items"
    >
      <template #top>
        <v-toolbar
          flat
        >
          <v-text-field
            v-model="search"
            :append-icon="mdiMagnify"
            label="Search"
            single-line
            hide-details
            :clearable="true"
            class="pr-2"
          />

          <template v-if="selected.length > 0">
            <v-dialog
              v-model="deleteDialog"
            >
              <template #activator="{ on, attrs }">
                <v-btn
                  color="error"
                  class="mb-2 mr-1"
                  v-bind="attrs"
                  v-on="on"
                >
                  Delete {{ selected.length }} Item(s)
                </v-btn>
              </template>

              <v-card>
                <v-card-title>
                  <span class="headline">Delete {{ selected.length }} Item(s)?</span>
                </v-card-title>

                <v-card-text>
                  <v-data-table
                    dense
                    :items="selected"
                    :headers="headersDelete"
                    :items-per-page="-1"
                    hide-default-header
                    hide-default-footer
                  >
                    <template #[`item.name`]="{ item }">
                      {{ capitalize(translate(item.name)) }}
                    </template>

                    <template #[`item.definitions`]="{ item }">
                      <v-list dense outlined class="ma-2 dense" style="background-color: transparent !important;">
                        <v-list-item v-if="item.filter.length === 0 && Object.keys(item.definitions).length === 0">
                          No definition or filters set
                        </v-list-item>
                        <template v-if="item.filter.length > 0">
                          <v-subheader>{{ translate('events.definitions.filter.label') }}</v-subheader>
                          <v-list-item v-if="item.filter.length > 0" :key="item.id + item.filter + '0'">
                            <code class="ml-2">{{ item.filter }}</code>
                          </v-list-item>
                        </template>
                        <v-subheader v-if="Object.keys(item.definitions).length > 0">
                          Definitions
                        </v-subheader>
                        <v-list-item v-for="key of Object.keys(item.definitions)" :key="item.id + key + '0'">
                          <strong>{{ translate('events.definitions.' + key + '.label') }}:</strong> <code class="ml-2">{{ item.definitions[key] }}</code>
                        </v-list-item>
                      </v-list>
                    </template>

                    <template #[`item.operations`]="{ item }">
                      <v-list dense outlined class="ma-2 dense" style="background-color: transparent !important;">
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
                    </template>
                  </v-data-table>
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
          </template>

          <v-dialog
            v-model="newDialog"
            max-width="800px"
          >
            <template #activator="{ on, attrs }">
              <v-btn
                color="primary"
                class="mb-2"
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
        </v-toolbar>
      </template>

      <template #[`group.header`]="{ items, isOpen, toggle }">
        <th colspan="7">
          <v-icon
            @click="toggle"
          >
            {{ isOpen ? mdiMinus : mdiPlus }}
          </v-icon>

          <v-simple-checkbox
            class="d-inline-block px-4"
            style="transform: translateY(5px);"
            inline
            :value="isGroupSelected(items[0].name)"
            @click="toggleGroupSelection(items[0].name)"
          />
          {{ capitalize(translate(items[0].name)) }}
        </th>
      </template>

      <template #[`item.definitions`]="{ item }">
        <v-list dense outlined class="ma-2 dense" style="background-color: transparent !important;">
          <v-edit-dialog
            persistent
            large
            :return-value.sync="item.filter"
            @save="update(item, false, 'filter')"
          >
            <v-subheader>
              {{ translate('events.definitions.filter.label') }}
            </v-subheader>
            <v-list-item v-if="item.filter.length > 0" :key="item.id + item.filter + '0'">
              <code class="ml-2">{{ item.filter }}</code>
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
            persistent
            large
            @open="backupDefinitions(item.definitions)"
            @close="restoreDefinitions(item)"
            @save="update(item, false, 'definitions')"
          >
            <v-subheader v-if="Object.keys(item.definitions).length > 0">
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
                  :rules="rules"
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
      </template>

      <template #[`item.operations`]="{ item }">
        <v-list dense outlined class="ma-2 dense" style="background-color: transparent !important;">
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
      </template>

      <template #[`item.isEnabled`]="{ item }">
        <v-simple-checkbox
          v-model="item.isEnabled"
          @click="update(item, true, 'isEnabled')"
        />
      </template>
    </v-data-table>
  </v-container>
</template>

<script lang="ts">
import {
  mdiFilter, mdiMagnify, mdiMinus, mdiPlus,
} from '@mdi/js';
import { ButtonStates } from '@sogebot/ui-helpers/buttonStates';
import { getSocket } from '@sogebot/ui-helpers/socket';
import translate from '@sogebot/ui-helpers/translate';
import {
  defineAsyncComponent, defineComponent, onMounted, ref, watch,
} from '@vue/composition-api';
import { capitalize, cloneDeep } from 'lodash-es';

import type { EventInterface, Events } from '.bot/src/bot/database/entity/event';
import { error } from '~/functions/error';
import { EventBus } from '~/functions/event-bus';
import {
  minValue, required, startsWithExclamation,
} from '~/functions/validators';

export default defineComponent({
  components: { 'new-item': defineAsyncComponent({ loader: () => import('~/components/new-item/events-newItem.vue') }) },
  setup () {
    const timestamp = ref(Date.now());

    const selected = ref([] as EventInterface[]);
    const deleteDialog = ref(false);
    const newDialog = ref(false);
    const availableEvents = ref([] as Events.SupportedEvent[]);

    const items = ref([] as EventInterface[]);

    const definitions = ref({} as any);

    const backupDefinitions = (value: any) => {
      definitions.value = cloneDeep(value);
      timestamp.value = Date.now();
    };

    const restoreDefinitions = (item: EventInterface) => {
      item.definitions = cloneDeep(definitions.value);
    };

    const rules = {
      fadeOutXCommands:  [required, minValue(0)],
      fadeOutInterval:   [required, minValue(0)],
      runEveryXCommands: [required, minValue(0)],
      runEveryXKeywords: [required, minValue(0)],
      fadeOutXKeywords:  [required, minValue(0)],
      runInterval:       [required, minValue(0)],
      commandToWatch:    [required, startsWithExclamation],
      keywordToWatch:    [required],
      runAfterXMinutes:  [required, minValue(1)],
      runEveryXMinutes:  [required, minValue(1)],
      viewersAtLeast:    [required, minValue(0)],
      titleOfReward:     [required],
    };

    const search = ref('');
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

    const headers = [
      { value: 'name', text: '' },
      {
        value: 'definitions', text: '', sortable: false,
      },
      {
        value: 'operations', text: '', sortable: false,
      },
      {
        value: 'isEnabled', text: '', width: '6rem', sortable: false,
      },
    ];

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
      // check validity of definitions
      for (const key of Object.keys(item.definitions)) {
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
      search,
      state,
      headers,
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
      mdiMinus,
      mdiPlus,
      mdiFilter,

      ButtonStates,
      isGroupSelected,
      toggleGroupSelection,
      backupDefinitions,
      restoreDefinitions,
    };
  },
});
</script>

<style>
tr:nth-of-type(odd) {
  background-color: rgba(0, 0, 0, 0.05);
}

.v-small-dialog__activator__content {
  word-break: break-word;
}
</style>

<style scoped>
.dense .v-list-item {
  min-height: 25px !important;
}
</style>
