<template>
  <v-container fluid :class="{ 'pa-4': !$vuetify.breakpoint.mobile }">
    <alert-disabled system="customcommands" />

    <v-expand-transition>
      <v-app-bar v-if="selected.length > 0" color="blue-grey darken-4" fixed dense>
        <v-row class="px-2" dense justify="end">
          <v-col cols="auto" align-self="center">
            {{ selected.length }} items selected
          </v-col>

          <v-col cols="auto" align-self="center">
            <v-row dense>
              <v-col v-if="selected.length > 0" cols="auto" class="pr-1">
                <manage-commands-batch
                  :length="selected.length"
                  :permission-items="permissionItems"
                  :group-items="groupItems"
                  @save="batchUpdate($event)"
                />
              </v-col>
              <v-col v-if="selected.length > 0" cols="auto">
                <v-dialog v-model="deleteDialog" max-width="500px">
                  <template #activator="{ on, attrs }">
                    <v-btn class="error" small v-bind="attrs" v-on="on">
                      <v-icon left>
                        mdi-delete-forever
                      </v-icon>
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
                      />
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
      group-by="group"
      calculate-widths
      :search="search"
      :loading="state.loading !== ButtonStates.success || loading"
      :headers="headers"
      :items-per-page="-1"
      :items="items"
      @current-items="saveCurrentItems"
    >
      <template #top>
        <table-search-bar :search.sync="search">
          <manage-commands-edit
            :rules="rules"
            :permission-items="permissionItems"
            :permissions="permissions"
            :group-items="groupItems"
            @save="refresh()"
          />
        </table-search-bar>
      </template>

      <template #[`group.header`]="{ items, isOpen, toggle }">
        <table-group-header
          :is-open="isOpen"
          :toggle="toggle"
          :get-group="getGroup"
          :is-group-selected="isGroupSelected"
          :toggle-group-selection="toggleGroupSelection"
          :items="items"
        >
          <template #config>
            <alias-group-config
              v-if="items[0].group"
              :key="items[0].group"
              :permission-items="permissionItems"
              :permission="getGroup[items[0].group].options.permission"
              :filter="getGroup[items[0].group].options.filter"
              @save="updateGroup(items[0].group, $event)"
            />
          </template>
        </table-group-header>
      </template>

      <template #[`item`]="{ item }">
        <table-mobile :headers="headers" :selected="selected" :item="item" :add-to-selected-item="addToSelectedItem(selected, 'id', currentItems)">
          <template #actions>
            <manage-commands-edit
              :rules="rules"
              :value="item"
              :permission-items="permissionItems"
              :permissions="permissions"
              :group-items="groupItems"
              @save="refresh()"
            />
            <v-btn class="danger-hover" icon @click="selected = [item]; deleteDialog = true;">
              <v-icon>
                mdi-delete-forever
              </v-icon>
            </v-btn>
          </template>

          <template #command>
            <strong>{{ item.command }}</strong>
            <responses :permissions="permissions" :responses="item.responses" :name="item.command" />
          </template>

          <template #permission>
            <span :class="{ 'text--lighten-1':item.permission === null, 'red--text': item.permission === null }">
              {{ item.permission === null ? '-- unset --' : getPermissionName(item.permission, permissions) }}
            </span>
          </template>
        </table-mobile>
      </template>
    </v-data-table>
  </v-container>
</template>

<script setup lang="ts">
import type { CommandsGroupInterface, CommandsInterface } from '@entity/commands';
import type { PermissionsInterface } from '@entity/permissions';
import { ButtonStates } from '@sogebot/ui-helpers/buttonStates';
import { getSocket } from '@sogebot/ui-helpers/socket';
import translate from '@sogebot/ui-helpers/translate';
import {
  capitalize, isEqual, orderBy,
} from 'lodash';

import { addToSelectedItem } from '~/functions/addToSelectedItem';
import { error } from '~/functions/error';
import { EventBus } from '~/functions/event-bus';
import { getPermissionName } from '~/functions/getPermissionName';
import {
  minLength, minValue, required, startsWith,
} from '~/functions/validators';

let count: {
  command: string; count: number;
}[] = [];

export type CommandsInterfaceUI = CommandsInterface & { count: number };

const loading = ref(true);
const items = ref([] as CommandsInterfaceUI[]);
const groups = ref([] as CommandsGroupInterface[]);
const permissions = ref([] as PermissionsInterface[]);
const refetch = async () => {
  await Promise.all([
    new Promise<void>((resolve) => {
      getSocket('/systems/customcommands').emit('generic::groups::getAll', (err, res) => {
        if (err) {
          resolve();
          return console.error(err);
        }
        console.log({ res });
        groups.value = res;
        resolve();
      });
    }),
    new Promise<void>((resolve) => {
      getSocket('/core/permissions').emit('generic::getAll', (err, res) => {
        if (err) {
          return console.error(err);
        }
        permissions.value = res;
        resolve();
      });
    }),
  ]);
  loading.value = false;
};

const rules = {
  command: [startsWith(['!']), required, minLength(2)],
  count:   [required, minValue(0)],
};

const search = ref('');

const selected = ref([] as CommandsInterfaceUI[]);
const deleteDialog = ref(false);

const currentItems = ref([] as CommandsInterfaceUI[]);
const saveCurrentItems = (value: CommandsInterfaceUI[]) => {
  currentItems.value = value;
};

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
    value: 'enabled', text: translate('enabled'), align: 'center',
  },
  {
    value: 'visible', text: capitalize(translate('visible')), align: 'center',
  },
  {
    value: 'count', text: capitalize(translate('count')), align: 'right',
  },
  { value: 'actions', sortable: false },
];

const headersDelete = [
  { value: 'command', text: translate('command') },
];

const refresh = () => {
  refetch();
  getSocket('/systems/customcommands').emit('generic::getAll', (err, commands, countArg) => {
    if (err) {
      return error(err);
    }
    console.debug({ commands, count });
    count = countArg || [];
    items.value.length = 0;
    for (const command of commands) {
      items.value.push({
        ...command,
        responses: orderBy(command.responses, 'order', 'asc'),
        count:     count.find(o => o.command === command.command)?.count || 0,
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
        getSocket('/systems/customcommands').emit('generic::deleteById', item.id, (err) => {
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
const batchUpdate = (value: Record<string, any>) => {
  // check validity
  for (const toUpdate of selected.value) {
    const item = items.value.find(o => o.id === toUpdate.id);
    if (!item) {
      continue;
    }

    let isValid = true;
    for (const key of Object.keys(rules)) {
      for (const rule of (rules as any)[key]) {
        const ruleStatus = rule((toUpdate as any)[key]);
        if (ruleStatus === true) {
          continue;
        } else {
          EventBus.$emit('snack', 'red', `[${key}] - ${ruleStatus}`);
          isValid = false;
        }
      }
    }

    if (isValid) {
      for (const key of Object.keys(value)) {
        if (typeof value[key] !== 'undefined') {
          (item as any)[key] = value[key];
        }
      }
      console.log('Updating', { item });
      getSocket('/systems/customcommands').emit('generic::setById', {
        id: item.id,
        item,
      }, () => {
        EventBus.$emit('snack', 'success', 'Data updated.');
      });
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
        getSocket('/systems/customcommands').emit('generic::groups::save', value[groupName], (err) => {
          if (err) {
            console.error(err);
          }
          refetch();
        });
      }
    }
    refresh();
    EventBus.$emit('snack', 'success', 'Data updated.');
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
</script>
