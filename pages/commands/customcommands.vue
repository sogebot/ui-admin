<template>
  <v-container fluid :class="{ 'pa-4': !$vuetify.breakpoint.mobile }">
    <v-alert v-if="!$store.state.$systems.find(o => o.name === 'customcommands').enabled" color="error" class="mb-0">
      {{ translate('this-system-is-disabled') }}
    </v-alert>

    <v-expand-transition>
      <v-app-bar v-if="selected.length > 0" color="blue-grey darken-4" fixed dense>
        <v-row class="px-2" dense justify="end">
          <v-col cols="auto" align-self="center">
            {{ selected.length }} items selected
          </v-col>

          <v-col cols="auto" align-self="center">
            <v-row dense>
              <v-col v-if="selected.length > 0" cols="auto" class="pr-1">
                <command-batch :length="selected.length" :permission-items="permissionItems" :group-items="groupItems"
                  @save="batchUpdate($event)" />
              </v-col>
              <v-col v-if="selected.length > 0" cols="auto">
                <v-dialog v-model="deleteDialog" max-width="500px">
                  <template #activator="{ on, attrs }">
                    <v-btn small color="red" v-bind="attrs" v-on="on">
                      <v-icon left>
                        mdi-delete
                      </v-icon>
                      Delete
                    </v-btn>
                  </template>

                  <v-card>
                    <v-card-title>
                      <span class="headline">Delete {{ selected.length }} Item(s)?</span>
                    </v-card-title>

                    <v-card-text>
                      <v-data-table dense :items="selected" :headers="headersDelete" :items-per-page="-1"
                        hide-default-header hide-default-footer />
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

    <v-data-table v-model="selected" show-select group-by="group" calculate-widths :search="search"
      :loading="state.loading !== ButtonStates.success || loading" :headers="headers" :items-per-page="-1"
      :items="items" @current-items="saveCurrentItems">
      <template #top>
        <v-sheet flat color="dark" class="my-2 pb-2 mt-0">
          <v-row class="px-2" dense>
            <v-col align-self="center">
              <v-text-field v-model="search" :append-icon="mdiMagnify" label="Search" single-line hide-details
                class="pa-0 ma-2" />
            </v-col>
            <v-col cols="auto" align-self="center">
              <command-edit :rules="rules" :permission-items="permissionItems" :permissions="permissions"
                :group-items="groupItems" @save="refresh()" />
            </v-col>
          </v-row>
        </v-sheet>
      </template>

      <template #[`group.header`]="{ items, isOpen, toggle }">
        <th colspan="5">
          <v-icon @click="toggle">
            {{ isOpen ? mdiMinus : mdiPlus }}
          </v-icon>

          <v-simple-checkbox class="d-inline-block px-4" style="transform: translateY(5px);" inline
            :value="isGroupSelected(items[0].group)" @click="toggleGroupSelection(items[0].group)" />

          <span v-if="items[0].group === null" class="red--text text--lighten-1">Ungrouped</span>
          <span v-else>
            {{ items[0].group }}

            <span class="px-4" :class="!getGroup[items[0].group].options.permission ? 'red--text' : ''">
              {{
                getGroup[items[0].group].options.permission
                  ? getPermissionName(getGroup[items[0].group].options.permission, permissions)
                  : '-- unset --'
              }}
            </span>

            <span class="px-4">
              <template v-if="getGroup[items[0].group].options.filter">
                <v-icon>mdi-filter</v-icon>
                <code>
                  {{ getGroup[items[0].group].options.filter }}
                </code>
              </template>
              <template v-else>
                <v-icon>mdi-filter-off</v-icon>
                <span class="grey--text text--darken-2">No filters set</span>
              </template>
            </span>
          </span>
        </th>
        <th colspan="1" style="text-align-last: right;">
          <group-config v-if="items[0].group" :key="items[0].group" :permission-items="permissionItems"
            :permission="getGroup[items[0].group].options.permission" :filter="getGroup[items[0].group].options.filter"
            @save="updateGroup(items[0].group, $event)" />
        </th>
      </template>

      <template #[`item`]="{ item }">
        <tr :class="{ 'v-data-table__selected': !!selected.find(o => o.id === item.id) }" @mouseover="selectItem(item)"
          @mouseleave="unSelectItem()">
          <td>
            <v-simple-checkbox :value="selected.find(o => o.id === item.id)" @click="toggleItemSelection(item)" />
          </td>
          <td class="my-1">
            <strong>{{ item.command }}</strong>
            <responses :permissions="permissions" :responses="item.responses" :name="item.command" />
          </td>

          <td v-show="selectedItem && selectedItem.id == item.id" colspan="4">
            <v-row dense justify="end" align="center">
              <v-col cols="auto">
                <command-edit :rules="rules" :value="item" :permission-items="permissionItems"
                  :permissions="permissions" :group-items="groupItems" @save="refresh()" />
              </v-col>
              <v-col cols="auto">
                <v-btn color="red" small @click="selected = [item]; deleteDialog = true;">
                  <v-icon left>
                    mdi-delete
                  </v-icon>
                  Delete
                </v-btn>
              </v-col>
            </v-row>
          </td>
          <template v-if="!(selectedItem && selectedItem.id == item.id)">
            <td>
              <span
                :class="{ 'text--lighten-1': item.groupToBeShownInTable === null, 'red--text': item.groupToBeShownInTable === null }">
                {{ item.groupToBeShownInTable === null ? '-- unset --' : item.groupToBeShownInTable }}
              </span>
            </td>
            <td>
              <v-simple-checkbox v-model="item.enabled" disabled />
            </td>
            <td>
              <v-simple-checkbox v-model="item.visible" disabled />
            </td>
            <td>{{ item.count }} </td>
          </template>
        </tr>
      </template>
    </v-data-table>
  </v-container>
</template>

<script lang="ts">
import {
  mdiMagnify,
  mdiMinus, mdiPlus,
} from '@mdi/js';
import {
  computed,
  defineAsyncComponent, defineComponent, onMounted, ref,
} from '@nuxtjs/composition-api';
import { ButtonStates } from '@sogebot/ui-helpers/buttonStates';
import { getSocket } from '@sogebot/ui-helpers/socket';
import translate from '@sogebot/ui-helpers/translate';
import {
  useMutation, useQuery, useResult,
} from '@vue/apollo-composable';
import gql from 'graphql-tag';
import {
  capitalize, isEqual, orderBy,
} from 'lodash';

import type { CommandsGroupInterface, CommandsInterface } from '.bot/src/database/entity/commands';
import type { PermissionsInterface } from '.bot/src/database/entity/permissions';
import { error } from '~/functions/error';
import { EventBus } from '~/functions/event-bus';
import { getPermissionName } from '~/functions/getPermissionName';
import {
  minLength, minValue, required, startsWith,
} from '~/functions/validators';
import GET_ALL from '~/queries/customCommands/getAll.gql';

let count: {
  command: string; count: number;
}[] = [];

export type CommandsInterfaceUI = CommandsInterface & { count: number, groupToBeShownInTable: null | string };

export default defineComponent({
  components: {
    'command-edit':  defineAsyncComponent(() => import('~/components/manage/commands/commandsEdit.vue')),
    'command-batch': defineAsyncComponent(() => import('~/components/manage/commands/commandsBatch.vue')),
    responses:       defineAsyncComponent({
      loader: () => import('~/components/responses.vue'),
    }),
    'group-config': defineAsyncComponent(() => import('~/components/manage/alias/groupConfig.vue')),
  },
  setup () {
    const { result, loading } = useQuery(GET_ALL);
    const permissions = useResult<{permissions: PermissionsInterface[] }, PermissionsInterface[], PermissionsInterface[]>(result, [], data => data.permissions);
    const groups = useResult<{customCommandsGroup: CommandsGroupInterface[] }, CommandsGroupInterface[], CommandsGroupInterface[]>(result, [], data => data.customCommandsGroup);

    const { mutate: updateGroupMutation, onDone: onDoneUpdateGroup, onError: onErrorUpdateGroup } = useMutation(gql`
      mutation setCustomCommandsGroup($name: String!, $data: String!) {
        setCustomCommandsGroup(name: $name, data: $data) {
          name
        }
      }`);
    onDoneUpdateGroup(() => { EventBus.$emit('snack', 'success', 'Data updated.'); });
    onErrorUpdateGroup(error);

    const rules = {
      command: [startsWith(['!']), required, minLength(2)],
      count:   [required, minValue(0)],
    };

    const search = ref('');
    const items = ref([] as Required<CommandsInterfaceUI>[]);
    const selectedItem = ref(null as Required<CommandsInterfaceUI> | null);

    const selected = ref([] as CommandsInterfaceUI[]);
    const currentItems = ref([] as CommandsInterfaceUI[]);
    const saveCurrentItems = (value: CommandsInterfaceUI[]) => {
      currentItems.value = value;
    };
    const deleteDialog = ref(false);

    const state = ref({
      loadingPrm: ButtonStates.progress,
      loading:    ButtonStates.progress,
    } as {
      loadingPrm: number;
      loading: number;
    });

    const headers = [
      {
        value: 'command', text: translate('command'), width: '15rem',
      },
      {
        value: 'groupToBeShownInTable', text: translate('group'), width: '8rem',
      },
      {
        value: 'enabled', text: translate('enabled'), width: '6rem', align: 'center',
      },
      {
        value: 'visible', text: capitalize(translate('visible')), width: '6rem', align: 'center',
      },
      {
        value: 'count', text: capitalize(translate('count')), width: '6rem',
      },
    ];

    const headersDelete = [
      {
        value: 'command', text: translate('command'),
      },
    ];

    const refresh = () => {
      getSocket('/systems/customcommands').emit('generic::getAll', (err: string | null, commands: Required<CommandsInterface>[], countArg: { command: string; count: number }[]) => {
        if (err) {
          return error(err);
        }
        console.debug({
          commands, count,
        });
        count = countArg;
        items.value.length = 0;
        for (const command of commands) {
          items.value.push({
            ...command,
            groupToBeShownInTable: command.group, // we need this to have group shown even when group-by
            responses:             orderBy(command.responses, 'order', 'asc'),
            count:                 count.find(o => o.command === command.command)?.count || 0,
          });
        }
        // we also need to reset selection values
        if (selected.value.length > 0) {
          selected.value.forEach((_selectedItem, index) => {
            _selectedItem = items.value.find(o => o.id === _selectedItem.id) || _selectedItem;
            selected.value[index] = _selectedItem;
          });
        }
        state.value.loading = ButtonStates.success;
      });
    };

    onMounted(() => {
      refresh();
    });

    const deleteSelected = async () => {
      deleteDialog.value = false;
      await Promise.all(
        selected.value.map((item) => {
          return new Promise((resolve, reject) => {
            getSocket('/systems/customcommands').emit('generic::deleteById', item.id, (err: string | null) => {
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

    const permissionItems = computed(() => {
      return [
        {
          text:     '-- unset --',
          value:    null,
          disabled: false,
        },
        ...permissions.value.map(item => ({
          text:     item.name,
          value:    item.id,
          disabled: false,
        })),
      ];
    });

    const groupItems = computed(() => {
      return [...new Set(items.value.filter(o => o.group !== null).map(o => o.group).sort())].map(item => ({
        text:     item,
        value:    item,
        disabled: false,
      }));
    });

    const isGroupSelected = (group: string) => {
      for (const item of items.value.filter(o => o.group === group)) {
        if (!selected.value.find(o => o.id === item.id)) {
          return false;
        }
      }
      return true;
    };
    const toggleItemSelection = (item: typeof items.value[number]) => {
      if (selected.value.find(o => o.id === item.id)) {
        // deselect
        selected.value = selected.value.filter(o => o.id !== item.id);
      } else {
        selected.value.push(item);
      }
    };
    const toggleGroupSelection = (group: string) => {
      if (isGroupSelected(group)) {
        // deselect all
        selected.value = selected.value.filter(o => o.group !== group);
      } else {
        for (const item of items.value.filter(o => o.group === group)) {
          if (!selected.value.find(o => o.id === item.id)) {
            selected.value.push(item);
          }
        }
      }
    };

    function selectItem (item: typeof items.value[number]) {
      selectedItem.value = item;
    }
    function unSelectItem () {
      selectedItem.value = null;
    }
    const batchUpdate = (value: Record<string, any>) => {
      // check validity
      for (const toUpdate of selected.value) {
        const item = items.value.find(o => o.id === toUpdate.id);
        if (!item) {
          continue;
        }

        for (const key of Object.keys(rules)) {
          for (const rule of (rules as any)[key]) {
            const ruleStatus = rule((toUpdate as any)[key]);
            if (ruleStatus === true) {
              continue;
            } else {
              EventBus.$emit('snack', 'red', `[${key}] - ${ruleStatus}`);
              return;
            }
          }
        }

        for (const key of Object.keys(value)) {
          if (typeof value[key] !== 'undefined') {
            (item as any)[key] = value[key];
          }
        }

        console.log('Updating', {
          item,
        });
        getSocket('/systems/customcommands').emit('generic::setById', {
          id: item.id,
          item,
        }, () => {
          EventBus.$emit('snack', 'success', 'Data updated.');
        });
      }
    };
    const getGroup = computed<{ [name: string]: CommandsGroupInterface }>({
      get () {
        // set empty groups from aliases
        const returnGroups: { [name: string]: CommandsGroupInterface } = {
        };
        for (const item of items.value) {
          if (item.group && !returnGroups[item.group]) {
            const group = groups.value.find(o => o.name === item.group);
            returnGroups[item.group] = {
              name:    item.group,
              options: group?.options ?? {
                filter:     null,
                permission: null,
              },
            };
          }
        }
        return returnGroups;
      },
      set (value: { [name: string]: CommandsGroupInterface }) {
        // go through groups and save only changed
        for (const groupName of Object.keys(getGroup.value)) {
          if (!isEqual(getGroup.value[groupName], value[groupName])) {
            updateGroupMutation({
              name: groupName,
              data: JSON.stringify(value[groupName].options),
            }, {
              refetchQueries: [{
                query: GET_ALL,
              }],
            });
          }
        }
        return true;
      },
    });
    function updateGroup (groupName: string, options: { permission: null | string, filter: null | string }) {
      getGroup.value = {
        ...getGroup.value,
        [groupName]: {
          name: groupName,
          options,
        },
      };
    }

    return {
      selectItem,
      selectedItem,
      unSelectItem,
      saveCurrentItems,
      orderBy,
      toggleItemSelection,
      headers,
      search,
      items,
      state,
      permissions,
      getPermissionName,
      deleteDialog,
      selected,
      loading,
      translate,
      rules,
      headersDelete,
      deleteSelected,
      refresh,
      capitalize,
      mdiMagnify,
      batchUpdate,
      ButtonStates,

      permissionItems,
      groups,
      groupItems,
      getGroup,
      isGroupSelected,
      toggleGroupSelection,
      mdiMinus,
      mdiPlus,
      updateGroup,
    };
  },
});
</script>
