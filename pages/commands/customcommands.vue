<template>
  <v-container fluid :class="{ 'pa-4': !$vuetify.breakpoint.mobile }">
    <v-alert
      v-if="!$store.state.$systems.find(o => o.name === 'customcommands').enabled"
      color="error"
      class="mb-0"
    >
      {{ translate('this-system-is-disabled') }}
    </v-alert>

    <v-data-table
      v-model="selected"
      group-by="group"
      calculate-widths
      :show-select="selectable"
      :search="search"
      :loading="state.loading !== ButtonStates.success || loading"
      :headers="headers"
      :items-per-page="-1"
      :items="items"
      @current-items="saveCurrentItems"
      @click:row="addToSelectedItem"
    >
      <template #top>
        <v-sheet
          flat
          color="dark"
          class="my-2 pb-2 mt-0"
        >
          <v-row class="px-2" no-gutters>
            <v-col cols="auto" align-self="center" class="pr-2">
              <v-btn icon :color="selectable ? 'primary' : 'secondary'" @click="selectable = !selectable">
                <v-icon>
                  {{ mdiCheckboxMultipleMarkedOutline }}
                </v-icon>
              </v-btn>
            </v-col>
            <v-col align-self="center">
              <v-text-field
                v-model="search"
                :append-icon="mdiMagnify"
                label="Search"
                single-line
                hide-details
                class="pa-0 ma-2"
              />
            </v-col>
            <v-col cols="auto" align-self="center">
              <template v-if="selected.length > 0">
                <v-dialog
                  v-model="deleteDialog"
                  max-width="500px"
                >
                  <template #activator="{ on, attrs }">
                    <v-btn
                      color="error"
                      class="mr-1"
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
                      />
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
                max-width="500px"
              >
                <template #activator="{ on, attrs }">
                  <v-btn
                    color="primary"
                    v-bind="attrs"
                    v-on="on"
                  >
                    New Item
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
      </template>

      <template #[`group.header`]="{ items, isOpen, toggle }">
        <th colspan="5">
          <v-icon
            @click="toggle"
          >
            {{ isOpen ? mdiMinus : mdiPlus }}
          </v-icon>

          <v-simple-checkbox
            v-if="selectable"
            class="d-inline-block px-4"
            style="transform: translateY(5px);"
            inline
            :value="isGroupSelected(items[0].group)"
            @click="toggleGroupSelection(items[0].group)"
          />

          <span
            v-if="items[0].group === null"
            class="red--text text--lighten-1"
          >Ungrouped</span>
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
          <group-config
            v-if="items[0].group"
            :key="items[0].group"
            :permission-items="permissionItems"
            :permission="getGroup[items[0].group].options.permission"
            :filter="getGroup[items[0].group].options.filter"
            @save="updateGroup(items[0].group, $event)"
          />
        </th>
      </template>

      <template #[`item.groupToBeShownInTable`]="{ item }">
        <v-edit-dialog
          persistent
          large
          :return-value.sync="item.groupToBeShownInTable"
          @save="update(item, true, 'group')"
        >
          <span :class="{ 'text--lighten-1': item.groupToBeShownInTable === null, 'red--text': item.groupToBeShownInTable === null }">
            {{ item.groupToBeShownInTable === null ? '-- unset --' : item.groupToBeShownInTable }}
          </span>
          <template #input>
            <v-combobox
              v-model="item.groupToBeShownInTable"
              clearable
              solo
              :search-input.sync="item.groupToBeShownInTable"
              :return-object="false"
              :items="groupItems"
            >
              <template #no-data>
                <v-list-item>
                  <span class="subheading">Create</span>
                  <strong class="pl-2">{{ item.groupToBeShownInTable }}</strong>
                </v-list-item>
              </template>
            </v-combobox>
          </template>
        </v-edit-dialog>
      </template>

      <template #[`item.command`]="{ item }">
        <v-edit-dialog
          persistent
          large
          :return-value.sync="item.command"
          @save="update(item, false, 'command')"
        >
          {{ item.command }}
          <template #input>
            <v-text-field
              v-model="item.command"
              :rules="rules.command"
              single-line
              counter
            />
          </template>
        </v-edit-dialog>
      </template>

      <template #[`item.count`]="{ item }">
        <v-edit-dialog
          persistent
          large
          :return-value.sync="item.count"
          @save="update(item, true, 'count')"
        >
          {{ item.count }}
          <template #input>
            <v-text-field
              :value="item.count"
              type="number"
              :rules="rules.count"
              single-line
              :readonly="true"
              :append-outer-icon="mdiRestore"
              @click:append-outer="item.count = 0"
            />
          </template>
        </v-edit-dialog>
      </template>

      <template #[`item.enabled`]="{ item }">
        <v-simple-checkbox
          v-model="item.enabled"
          @click="update(item, true, 'enabled')"
        />
      </template>

      <template #[`item.visible`]="{ item }">
        <v-simple-checkbox
          v-model="item.visible"
          @click="update(item, true, 'visible')"
        />
      </template>

      <template #[`item.response`]="{ item }">
        <responses
          :permissions="permissions"
          :responses="item.responses"
          :name="item.command"
          @save="item.responses = $event; update(item, false, 'responses')"
        />
      </template>
    </v-data-table>
  </v-container>
</template>

<script lang="ts">
import {
  mdiCheckboxMultipleMarkedOutline, mdiMagnify,
  mdiMinus, mdiPlus, mdiRestore,
} from '@mdi/js';
import {
  computed,
  defineAsyncComponent, defineComponent, onMounted, ref, watch,
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
import { addToSelectedItem } from '~/functions/addToSelectedItem';
import { error } from '~/functions/error';
import { EventBus } from '~/functions/event-bus';
import { getPermissionName } from '~/functions/getPermissionName';
import {
  minLength, required, startsWith,
} from '~/functions/validators';
import GET_ALL from '~/queries/customCommands/getAll.gql';

let count: {
  command: string; count: number;
}[] = [];

type CommandsInterfaceUI = CommandsInterface & { count: number, groupToBeShownInTable: null | string };

export default defineComponent({
  components: {
    'new-item':     defineAsyncComponent({ loader: () => import('~/components/new-item/command-newItem.vue') }),
    responses:      defineAsyncComponent({ loader: () => import('~/components/responses.vue') }),
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

    const rules = { command: [startsWith(['!']), required, minLength(2)] };

    const search = ref('');
    const items = ref([] as Required<CommandsInterfaceUI>[]);

    const selected = ref([] as CommandsInterfaceUI[]);
    const currentItems = ref([] as CommandsInterfaceUI[]);
    const saveCurrentItems = (value: CommandsInterfaceUI[]) => {
      currentItems.value = value;
    };
    const selectable = ref(false);
    watch(selectable, (val) => {
      if (!val) {
        selected.value = [];
      }
    });
    const deleteDialog = ref(false);
    const newDialog = ref(false);

    const timestamp = ref(Date.now());

    const state = ref({
      loadingPrm: ButtonStates.progress,
      loading:    ButtonStates.progress,
    } as {
      loadingPrm: number;
      loading: number;
    });

    watch(newDialog, () => {
      timestamp.value = Date.now();
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
      {
        value: 'response', text: translate('response'), sortable: false,
      },
    ];

    const headersDelete = [
      { value: 'command', text: translate('command') },
    ];

    const refresh = () => {
      getSocket('/systems/customcommands').emit('generic::getAll', (err: string | null, commands: Required<CommandsInterface>[], countArg: { command: string; count: number }[]) => {
        if (err) {
          return error(err);
        }
        console.debug({ commands, count });
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
          selected.value.forEach((selectedItem, index) => {
            selectedItem = items.value.find(o => o.id === selectedItem.id) || selectedItem;
            selected.value[index] = selectedItem;
          });
        }
        state.value.loading = ButtonStates.success;
      });
    };

    onMounted(() => {
      refresh();
    });

    const saveSuccess = () => {
      refresh();
      EventBus.$emit('snack', 'success', 'Data updated.');
      newDialog.value = false;
    };

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
    const update = async (item: typeof items.value[number], multi = false, attr: keyof typeof items.value[number]) => {
      if (attr === 'group') {
        item.group = item.groupToBeShownInTable;
      }
      // check validity
      for (const key of Object.keys(rules)) {
        for (const rule of (rules as any)[key]) {
          const ruleStatus = rule((item as any)[key]);
          if (ruleStatus === true) {
            continue;
          } else {
            EventBus.$emit('snack', 'red', `[${key}] - ${ruleStatus}`);
            refresh();
            return;
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

            if (attr === 'responses' && itemToUpdate.responses) {
              // reorder by array
              for (let i = 0; i < itemToUpdate.responses.length; i++) {
                console.log(itemToUpdate.responses[i].response + ' --- ' + itemToUpdate.responses[i].order + ' => ' + i);
                itemToUpdate.responses[i].order = i;
              }
            }

            if (attr === 'count') {
              getSocket('/systems/customcommands').emit('commands::resetCountByCommand', itemToUpdate.command, () => {
                resolve(true);
              });
            } else {
              getSocket('/systems/customcommands').emit('generic::setById', {
                id:   itemToUpdate.id,
                item: {
                  ...itemToUpdate,
                  [attr]: item[attr], // save new value for all selected items
                },
              }, () => {
                resolve(true);
              });
            }
          });
        }),
      );
      refresh();
      EventBus.$emit('snack', 'success', 'Data updated.');
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

    const getGroup = computed<{ [name: string]: CommandsGroupInterface }>({
      get () {
        // set empty groups from aliases
        const returnGroups: { [name: string]: CommandsGroupInterface } = {};
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
            }, { refetchQueries: [{ query: GET_ALL }] });
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
      addToSelectedItem: addToSelectedItem(selected, 'id', currentItems),
      saveCurrentItems,
      orderBy,
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
      timestamp,
      rules,
      headersDelete,
      newDialog,
      saveSuccess,
      deleteSelected,
      update,
      refresh,
      capitalize,
      mdiMagnify,
      mdiRestore,
      mdiCheckboxMultipleMarkedOutline,
      ButtonStates,
      selectable,

      permissionItems,
      groups,
      groupItems,
      getGroup,
      updateGroup,
      isGroupSelected,
      toggleGroupSelection,
      mdiMinus,
      mdiPlus,
    };
  },
});
</script>
