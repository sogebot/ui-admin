<template>
  <v-container fluid :class="{ 'pa-4': !$vuetify.breakpoint.mobile }">
    <v-alert
      v-if="!$store.state.$systems.find(o => o.name === 'alias').enabled"
      color="error"
      class="mb-0"
    >
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
                <alias-batch :length="selected.length" :permission-items="permissionItems" :group-items="groupItems"
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
        <v-sheet
          flat
          color="dark"
          class="my-2 pb-2 mt-0"
        >
          <v-row class="px-2" dense>
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
              <alias-edit
                :rules="rules"
                :permission-items="permissionItems"
                :group-items="groupItems"
                @save="refetch()"
              />
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

      <template #[`item.alias`]="{ item }">
        <table-hover>
          <template #hide>
            <strong>{{ item.alias }}</strong>
            <ul style="list-style-type: none;">
              <li>{{ item.command }}</li>
            </ul>
          </template>
          <template #show>
            <v-row dense>
              <v-col cols="auto">
                <alias-edit
                  :rules="rules"
                  :value="item"
                  :permission-items="permissionItems"
                  :group-items="groupItems"
                  @save="refetch()"
                />
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
          </template>
        </table-hover>
      </template>

      <template #[`item.groupToBeShownInTable`]="{ item }">
        <span :class="{ 'text--lighten-1': item.groupToBeShownInTable === null, 'red--text': item.groupToBeShownInTable === null }">
          {{ item.groupToBeShownInTable === null ? '-- unset --' : item.groupToBeShownInTable }}
        </span>
      </template>

      <template #[`item.permission`]="{ item }">
        <span :class="{ 'text--lighten-1':item.permission === null, 'red--text': item.permission === null }">
          {{ item.permission === null ? '-- unset --' : getPermissionName(item.permission, permissions) }}
        </span>
      </template>

      <template #[`item.enabled`]="{ item }">
        <v-simple-checkbox
          :key="item.id + item.enabled"
          :value="item.enabled"
          disabled
        />
      </template>

      <template #[`item.visible`]="{ item }">
        <v-simple-checkbox
          :key="item.id + item.visible"
          :value="item.visible"
          disabled
        />
      </template>
    </v-data-table>
  </v-container>
</template>

<script lang="ts">
import {
  mdiCheckboxMultipleMarkedOutline, mdiMagnify, mdiMinus, mdiPlus,
} from '@mdi/js';
import {
  computed, defineAsyncComponent, defineComponent, ref, useContext, watch,
} from '@nuxtjs/composition-api';
import translate from '@sogebot/ui-helpers/translate';
import {
  useMutation, useQuery, useResult,
} from '@vue/apollo-composable';
import gql from 'graphql-tag';
import {
  capitalize, isEqual, orderBy,
} from 'lodash';

import type { AliasGroupInterface, AliasInterface } from '.bot/src/database/entity/alias';
import type { PermissionsInterface } from '.bot/src/database/entity/permissions';
import { error as errorLog } from '~/functions/error';
import { EventBus } from '~/functions/event-bus';
import { getPermissionName } from '~/functions/getPermissionName';
import { truncate } from '~/functions/truncate';
import {
  minLength, required, startsWith,
} from '~/functions/validators';
import GET_ALL from '~/queries/alias/getAll.gql';

export type AliasInterfaceUI = AliasInterface & { groupToBeShownInTable: null | string, __typename: string };

export default defineComponent({
  components: {
    'group-config': defineAsyncComponent(() => import('~/components/manage/alias/groupConfig.vue')),
    'alias-edit':   defineAsyncComponent(() => import('~/components/manage/alias/aliasEdit.vue')),
    'alias-batch':  defineAsyncComponent(() => import('~/components/manage/alias/aliasBatch.vue')),
  },
  setup () {
    const { result, loading, error, refetch } = useQuery(GET_ALL);
    const groups = useResult<{aliasGroup: AliasGroupInterface[] }, AliasGroupInterface[], AliasGroupInterface[]>(result, [], data => data.aliasGroup);
    const permissions = useResult<{permissions: PermissionsInterface[] }, PermissionsInterface[], PermissionsInterface[]>(result, [], data => data.permissions);
    const items = useResult<{ aliases: AliasInterfaceUI[] }, AliasInterfaceUI[], AliasInterfaceUI[]>(result, [], (data) => {
      const output = orderBy(data.aliases, 'alias', 'asc');

      for (const item of output) {
        item.groupToBeShownInTable = item.group; // we need this to have group shown even when group-by
      }

      // we also need to reset selection values
      if (selected.value.length > 0) {
        selected.value.forEach((selectedItem, index) => {
          selectedItem = output.find(o => o.id === selectedItem.id) || selectedItem;
          selected.value[index] = selectedItem;
        });
      }
      return output;
    });
    watch(error, val => errorLog(val?.message ?? ''));

    const { mutate: updateGroupMutation, onDone: onDoneUpdateGroup, onError: onErrorUpdateGroup } = useMutation(gql`
      mutation setAliasGroup($name: String!, $data: String!) {
        setAliasGroup(name: $name, data: $data) {
          name
        }
      }`);
    onDoneUpdateGroup(saveSuccess);
    onErrorUpdateGroup(errorLog);
    const { mutate: updateMutation, onDone: onDoneUpdate, onError: onErrorUpdate } = useMutation(gql`
      mutation setAlias($id: String!, $data: AliasInput!) {
        setAlias(id: $id, data: $data) {
          id
        }
      }`);
    function saveSuccess () {
      EventBus.$emit('snack', 'success', 'Data updated.');
      refetch();
    }
    onDoneUpdate(saveSuccess);
    onErrorUpdate(errorLog);

    const { mutate: removeMutation, onDone: onDoneRemove, onError: onErrorRemove } = useMutation(gql`
      mutation removeAlias($id: String!) {
        removeAlias(id: $id)
      }`);
    onDoneRemove(saveSuccess);
    onErrorRemove(errorLog);

    const timestamp = ref(Date.now());

    const selected = ref([] as AliasInterfaceUI[]);
    const currentItems = ref([] as AliasInterfaceUI[]);
    const saveCurrentItems = (value: AliasInterfaceUI[]) => {
      currentItems.value = value;
    };
    const deleteDialog = ref(false);

    const rules = {
      alias:   [startsWith(['!']), required],
      command: [startsWith(['!', '$_']), minLength(2)],
    };

    const search = ref('');

    const truncateLength = computed(() => {
      const breakpoint = useContext().$vuetify.breakpoint;
      if (breakpoint.mobile) {
        return 50;
      } else {
        return 500;
      }
    });

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
      {
        value: 'groupToBeShownInTable', text: translate('group'), width: '8rem',
      },
      {
        value: 'permission', text: translate('permission'), width: '7rem',
      },
      {
        value: 'enabled', text: translate('enabled'), width: '6rem', align: 'center',
      },
      {
        value: 'visible', text: capitalize(translate('visible')), width: '6rem', align: 'center',
      },
    ];

    const headersDelete = [
      {
        value: 'alias', text: translate('alias'),
      },
      {
        value: 'command', text: translate('command'),
      },
    ];
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
        const { __typename, id, groupToBeShownInTable, ...data } = item;
        console.log('Updating', {
          data,
        });
        updateMutation({
          id, data,
        });
      }
    };

    const deleteSelected = () => {
      deleteDialog.value = false;
      selected.value.forEach((item) => {
        removeMutation({
          id: item.id,
        });
      });
      selected.value = [];
    };

    const getGroup = computed<{ [name: string]: AliasGroupInterface }>({
      get () {
        // set empty groups from aliases
        const returnGroups: { [name: string]: AliasGroupInterface } = {
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
      set (value: { [name: string]: AliasGroupInterface }) {
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
      result,
      saveCurrentItems,
      items,
      permissions,
      search,
      headers,
      headersDelete,
      groupItems,
      deleteSelected,
      translate,
      getPermissionName,
      truncate,
      truncateLength,
      loading,
      groups,
      getGroup,
      updateGroup,
      refetch,
      batchUpdate,

      selected,
      deleteDialog,
      permissionItems,

      rules,
      isGroupSelected,
      toggleGroupSelection,

      timestamp,
      saveSuccess,

      mdiPlus,
      mdiMinus,
      mdiMagnify,
      mdiCheckboxMultipleMarkedOutline,
    };
  },
});
</script>
