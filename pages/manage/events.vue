<template>
  <v-container fluid :class="{ 'pa-4': !$vuetify.breakpoint.mobile }">
    <v-expand-transition>
      <v-app-bar v-if="selected.length > 0" color="blue-grey darken-4" fixed dense>
        <v-row class="px-2" dense justify="end">
          <v-col cols="auto" align-self="center">
            {{ selected.length }} items selected
          </v-col>

          <v-col cols="auto" align-self="center">
            <v-row dense>
              <v-col v-if="selected.length > 0" cols="auto">
                <v-dialog v-model="deleteDialog" max-width="800px">
                  <template #activator="{ on, attrs }">
                    <v-btn class="error" small v-bind="attrs" v-on="on">
                      Delete
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
                        <template #[`item.definitions`]="{item}">
                          <span v-if="Object.keys(item.definitions).length === 0" class="grey--text text--lighten-1" />
                          <div v-for="key of Object.keys(item.definitions)" :key="item.id + key + '0'">
                            {{ translate('events.definitions.' + key + '.label') }}:<code class="ml-2">{{ item.definitions[key] }}</code>
                          </div>
                        </template>

                        <template #[`item.operations`]="{item}">
                          <span v-if="item.operations.length === 0" class="grey--text text--lighten-1">No operations set for this event</span>
                          <template v-for="operation of item.operations">
                            <div :key="operation.id + operation.name" class="pa-0 ma-0 grey--text text--lighten-1" style="line-height: 1rem;">
                              {{ capitalize(translate(operation.name)) }}
                            </div>
                            <ul
                              :key="operation.id + key + 'ul'"
                              style="list-style-type: none;"
                              class="text-truncate"
                              :style="{
                                'max-width': $vuetify.breakpoint.mobile ? '400px' : 'inherit'
                              }"
                            >
                              <li
                                v-for="key of Object.keys(operation.definitions)"
                                :key="operation.id + key + 'li'"
                              >
                                aa
                                {{ translate('events.definitions.' + key + '.label') }}
                                <code class="ml-2">{{ operation.definitions[key] }}</code>
                              </li>
                            </ul>
                          </template>
                        </template>
                      </v-data-table>
                    </v-card-text>
                    <v-card-actions>
                      <v-spacer />
                      <v-btn text @click="deleteDialog = false">
                        Cancel
                      </v-btn>
                      <v-btn color="error" text @click="deleteSelected">
                        Delete
                      </v-btn>
                    </v-card-actions>
                  </v-card>
                </v-dialog>
              </v-col>
            </v-row>
          </v-col>
        </v-row>
      </v-app-bar>
    </v-expand-transition>

    <v-data-table
      v-model="selected"
      show-select
      calculate-widths
      group-by="name"
      :loading="state.loading !== 2"
      :headers="headers"
      :items-per-page="-1"
      :items="filteredItems"
      @current-items="saveCurrentItems"
    >
      <template #top>
        <v-sheet
          flat
          color="dark"
          class="my-2 pb-2 mt-0"
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
              <events-edit
                :rules="rules"
                @save="refresh()"
              />
            </v-col>
          </v-row>
        </v-sheet>
      </template>

      <template #[`group.header`]="{ items, isOpen, toggle }">
        <table-group-header
          group-key="name"
          no-filter
          no-permission
          :is-open="isOpen"
          :toggle="toggle"
          :get-group="getGroup"
          :is-group-selected="isGroupSelected"
          :toggle-group-selection="toggleGroupSelection"
          :items="items"
        >
          <template #headerText="{ group }">
            {{ capitalize(translate(group)) }}
          </template>
        </table-group-header>
      </template>

      <template #[`item`]="{ item }">
        <table-mobile :headers="headers" :selected="selected" :item="item" :add-to-selected-item="addToSelectedItem">
          <template #actions>
            <events-edit
              :rules="rules"
              :value="item"
              @save="refresh()"
            />
            <v-btn class="danger-hover" icon @click="selected = [item]; deleteDialog = true;">
              <v-icon>
                mdi-delete-forever
              </v-icon>
            </v-btn>
          </template>

          <template #definitions>
            <span v-if="Object.keys(item.definitions).length === 0" class="grey--text text--lighten-1" />
            <div v-for="key of Object.keys(item.definitions)" :key="item.id + key + '0'">
              <template v-if="key === 'rewardId'">
                {{ translate('events.definitions.reward.label') }}:
                <code class="ml-2" v-html="getReward(item.definitions[key])" />
              </template>
              <template v-else>
                {{ translate('events.definitions.' + key + '.label') }}:<code class="ml-2">{{ item.definitions[key] }}</code>
              </template>
            </div>

            <div v-if="item.filter.length > 0">
              <v-icon left small>
                mdi-filter
              </v-icon>
              <text-with-tags
                class="d-inline-block"
                :value="item.filter"
              />
            </div>
          </template>

          <template #operations>
            <span v-if="item.operations.length === 0" class="grey--text text--lighten-1">No operations set for this event</span>
            <template v-for="operation of item.operations">
              <div :key="operation.id + operation.name" class="pa-0 ma-0 grey--text text--lighten-1" style="line-height: 1rem;">
                {{ capitalize(translate(operation.name)) }}
              </div>
              <ul
                :key="operation.id + operation.name + 'ul'"
                style="list-style-type: none;"
                class="text-truncate"
                :style="{
                  'max-width': $vuetify.breakpoint.mobile ? '400px' : 'inherit'
                }"
              >
                <li
                  v-for="key of Object.keys(operation.definitions)"
                  :key="operation.id + key + 'li'"
                >
                  {{ translate('events.definitions.' + key + '.label') }}
                  <code class="ml-2">
                    <template v-if="operation.name === 'run-command' && key === 'timeout'">
                      <span v-if="operation.definitions[key] === 0">immediate</span>
                      <span v-else>{{ operation.definitions[key] | time }}</span>
                    </template>
                    <template v-else>
                      {{ operation.definitions[key] }}
                    </template>
                  </code>
                </li>
              </ul>
            </template>
          </template>
        </table-mobile>
      </template>
    </v-data-table>
  </v-container>
</template>

<script lang="ts">
import type { EventInterface, Events } from '@entity/event';
import {
  computed,
  defineAsyncComponent, defineComponent, onMounted, ref,
} from '@nuxtjs/composition-api';
import { ButtonStates } from '@sogebot/ui-helpers/buttonStates';
import { getSocket } from '@sogebot/ui-helpers/socket';
import translate from '@sogebot/ui-helpers/translate';
import { capitalize, cloneDeep } from 'lodash';

import { addToSelectedItem } from '~/functions/addToSelectedItem';
import { error } from '~/functions/error';
import { EventBus } from '~/functions/event-bus';
import {
  minValue, required, startsWith,
} from '~/functions/validators';

export default defineComponent({
  components: {
    'table-group-header': defineAsyncComponent(() => import('~/components/table/groupHeader.vue')),
    'table-mobile':       defineAsyncComponent(() => import('~/components/table/tableMobile.vue')),
    'events-edit':        defineAsyncComponent(() => import('~/components/manage/events/eventsEdit.vue')),
  },
  setup () {
    const redeemRewards = ref([] as { id: string, title: string }[]);

    const currentItems = ref([] as any[]);
    const saveCurrentItems = (value: any[]) => {
      currentItems.value = value;
    };

    const search = ref([] as string[]);

    const selected = ref([] as EventInterface[]);
    const deleteDialog = ref(false);
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
      taskId:               [required],
    };

    const state = ref({ loading: ButtonStates.progress } as {
      loading: number;
    });

    const saveSuccess = () => {
      refresh();
      EventBus.$emit('snack', 'success', 'Data updated.');
    };

    onMounted(() => {
      refresh();
    });

    const headers = [
      {
        value: 'definitions', text: '', sortable: false,
      },
      {
        value: 'operations', text: '', sortable: false,
      },
      {
        value: 'isEnabled', text: translate('enabled'), align: 'center',
      },
      { value: 'actions', sortable: false },
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
        new Promise<void>((resolve) => {
          getSocket('/core/events').emit('events::getRedeemedRewards', (err, redeems: string[]) => {
            if (err) {
              return error(err);
            }
            redeemRewards.value = redeems;
            resolve();
          });
        }),
        new Promise((resolve) => {
          getSocket('/core/events').emit('generic::getAll', (err, data: EventInterface[]) => {
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
          getSocket('/core/events').emit('list.supported.events', (err, data: Events.SupportedEvent[]) => {
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
            if (!item.id) {
              reject(error('Missing item id'));
              return;
            }
            getSocket('/core/events').emit('events::remove', item.id, (err) => {
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

    const getGroup = computed(() => {
      // set empty groups from aliases
      const returnGroups: { [name: string]: any } = {};
      for (const item of items.value) {
        if (item.name && !returnGroups[item.name]) {
          returnGroups[item.name] = {
            name:    item.name,
            options: {
              filter:     null,
              permission: null,
            },
          };
        }
      }
      return returnGroups;
    });

    const getReward = (rewardId: string) => {
      const reward = redeemRewards.value.find(o => o.id === rewardId);
      return reward?.name ?? '<strong class="red--text">!!! unknown reward !!!</strong>';
    }

    return {
      saveCurrentItems,
      addToSelectedItem: addToSelectedItem(selected, 'id', currentItems),
      getGroup,

      headers,

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
      availableEvents,
      getReward,

      selected,
      deleteDialog,

      rules,

      saveSuccess,
      refresh,

      capitalize,

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
