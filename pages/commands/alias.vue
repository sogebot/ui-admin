<template>
  <v-container fluid :class="{ 'pa-4': !$vuetify.breakpoint.mobile }">
    <alert-disabled system="alias" />

    <v-expand-transition>
      <v-app-bar v-if="selected.length > 0" color="blue-grey darken-4" fixed dense>
        <v-row class="px-2" dense justify="end">
          <v-col cols="auto" align-self="center">
            {{ selected.length }} items selected
          </v-col>

          <v-col cols="auto" align-self="center">
            <v-row dense>
              <v-col v-if="selected.length > 0" cols="auto" class="pr-1">
                <manage-alias-batch
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
      calculate-widths
      group-by="group"
      :search="search"
      :loading="loading"
      :headers="headers"
      :items-per-page="-1"
      :items="items"
      @current-items="saveCurrentItems"
    >
      <template #top>
        <table-search-bar :search.sync="search">
          <manage-alias-edit
            :rules="rules"
            :permission-items="permissionItems"
            :group-items="groupItems"
            @save="refetch()"
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
            <manage-alias-group-config
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
            <manage-alias-edit
              :rules="rules"
              :value="item"
              :permission-items="permissionItems"
              :group-items="groupItems"
              @save="refetch()"
            />
            <v-btn class="danger-hover" icon @click="selected = [item]; deleteDialog = true;">
              <v-icon>
                mdi-delete-forever
              </v-icon>
            </v-btn>
          </template>

          <template #alias>
            <strong>{{ item.alias }}</strong>
            <ul
              style="list-style-type: none;"
              class="text-truncate"
              :style="{
                'max-width': $vuetify.breakpoint.mobile ? '400px' : 'inherit'
              }"
            >
              <li style="white-space: pre-wrap;">
                {{ item.command }}
              </li>
            </ul>
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
import type { PermissionsInterface } from '@entity/permissions';
import { Alias, AliasGroup } from '@sogebot/backend/src/database/entity/alias';
import { getSocket } from '@sogebot/ui-helpers/socket';
import translate from '@sogebot/ui-helpers/translate';
import {
  capitalize, isEqual, orderBy,
} from 'lodash';

import { addToSelectedItem } from '~/functions/addToSelectedItem';
import { EventBus } from '~/functions/event-bus';
import { getPermissionName } from '~/functions/getPermissionName';
import {
  minLength, required, startsWith,
} from '~/functions/validators';

const loading = ref(true);
const items = ref([] as Alias[]);
const groups = ref([] as AliasGroup[]);
const permissions = ref([] as PermissionsInterface[]);

onMounted(() => refetch());

const refetch = async () => {
  await Promise.all([
    new Promise<void>((resolve) => {
      getSocket('/systems/alias').emit('generic::getAll', (err, res) => {
        if (err) {
          resolve();
          return console.error(err);
        }
        items.value = orderBy(res, 'alias', 'asc');

        // we also need to reset selection values
        if (selected.value.length > 0) {
          selected.value.forEach((selectedItem, index) => {
            selectedItem = res.find(o => o.id === selectedItem.id) || selectedItem;
            selected.value[index] = selectedItem;
          });
        }
        resolve();
      });
    }),
    new Promise<void>((resolve) => {
      getSocket('/systems/alias').emit('generic::groups::getAll', (err, res) => {
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

const selected = ref([] as Alias[]);
const deleteDialog = ref(false);

const currentItems = ref([] as Alias[]);
const saveCurrentItems = (value: Alias[]) => {
  currentItems.value = value;
};

const rules = {
  alias:   [startsWith(['!']), required],
  command: [startsWith(['!', '$_']), minLength(2)],
};

const search = ref('');

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
  return [
    '-- unset --', ...new Set(items.value.filter(o => o.group !== null).map(o => o.group).sort())].map(item => ({
    text:     item,
    value:    item === '-- unset --' ? null : item,
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

const headers = [
  {
    value: 'alias', text: translate('alias'), width: '15rem',
  },
  { value: 'permission', text: translate('permission') },
  {
    value: 'enabled', text: translate('enabled'), align: 'center',
  },
  {
    value: 'visible', text: capitalize(translate('visible')), align: 'center',
  },
  { value: 'actions', sortable: false },
];

const headersDelete = [
  { value: 'alias', text: translate('alias') },
  { value: 'command', text: translate('command') },
];
const batchUpdate = async (value: Record<string, any>) => {
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

      await new Promise<void>((resolve) => {
        getSocket('/systems/alias').emit('generic::save', item, (err) => {
          if (err) {
            console.error(err);
          } else {
            saveSuccess();
          }
          resolve();
        });
      });
    }
  }
};

const deleteSelected = () => {
  deleteDialog.value = false;
  selected.value.forEach((item) => {
    getSocket('/systems/alias').emit('generic::deleteById', item.id, () => {
      saveSuccess();
    });
  });
  saveSuccess();
  selected.value = [];
};

const saveSuccess = () => {
  refetch();
  EventBus.$emit('snack', 'success', 'Data updated.');
};

const getGroup = computed<{ [name: string]: AliasGroup }>({
  get () {
    // set empty groups from aliases
    const returnGroups: { [name: string]: AliasGroup } = {};
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
  set (value: { [name: string]: AliasGroup }) {
    // go through groups and save only changed
    for (const groupName of Object.keys(getGroup.value)) {
      if (!isEqual(getGroup.value[groupName], value[groupName])) {
        getSocket('/systems/alias').emit('generic::groups::save', value[groupName], (err) => {
          if (err) {
            console.error(err);
          }
          refetch();
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
</script>
