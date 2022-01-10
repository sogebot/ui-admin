<template>
  <v-container fluid :class="{ 'pa-4': !$vuetify.breakpoint.mobile }">
    <v-alert v-if="!$store.state.$systems.find(o => o.name === 'keywords').enabled" color="error" class="mb-0">
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
                <keyword-batch :length="selected.length" :permission-items="permissionItems" :group-items="groupItems"
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
      :items="items" @current-items="saveCurrentItems" >
      <template #top>
        <v-sheet flat color="dark" class="my-2 pb-2 mt-0">
          <v-row class="px-2" dense>
            <v-col align-self="center">
              <v-text-field v-model="search" :append-icon="mdiMagnify" label="Search" single-line hide-details
                class="pa-0 ma-2" />
            </v-col>
            <v-col cols="auto" align-self="center">
              <keyword-edit :rules="rules" :permission-items="permissionItems" :permissions="permissions"
                :group-items="groupItems" @save="refresh()" />
            </v-col>
          </v-row>
        </v-sheet>
      </template>

      <template #[`group.header`]="{ items, isOpen, toggle }">
        <th colspan="3">
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
        <tr :class="{ 'v-data-table__selected': selected.some(o => o.id === item.id) }" @mouseover="selectItem(item)"
          @mouseleave="unSelectItem()">
          <td>
            <v-simple-checkbox :value="selected.some(o => o.id === item.id)" @click="addToSelectedItem(item)" />
          </td>
          <td class="my-1">
            <strong>{{ item.keyword }}</strong>
            <responses :permissions="permissions" :responses="item.responses" :name="item.command" />
          </td>

          <td v-show="selectedItem && selectedItem.id == item.id" colspan="4">
            <v-row dense justify="end" align="center">
              <v-col cols="auto">
                <keyword-edit :rules="rules" :value="item" :permission-items="permissionItems"
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
          </template>
        </tr>
      </template>
    </v-data-table>
  </v-container>
</template>

<script lang="ts">
import {
  mdiCheckboxMultipleMarkedOutline, mdiMagnify, mdiMinus, mdiPlus,
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

import type { KeywordGroupInterface, KeywordInterface } from '.bot/src/database/entity/keyword';
import type { PermissionsInterface } from '.bot/src/database/entity/permissions';
import { addToSelectedItem } from '~/functions/addToSelectedItem';
import { error } from '~/functions/error';
import { EventBus } from '~/functions/event-bus';
import { getPermissionName } from '~/functions/getPermissionName';
import {
  isValidRegex, minLength, required,
} from '~/functions/validators';
import GET_ALL from '~/queries/keyword/getAll.gql';

export type KeywordInterfaceUI = KeywordInterface & { groupToBeShownInTable: null | string };

export default defineComponent({
  components: {
    'keyword-edit':  defineAsyncComponent(() => import('~/components/manage/keywords/keywordsEdit.vue')),
    'keyword-batch': defineAsyncComponent(() => import('~/components/manage/keywords/keywordsBatch.vue')),
    responses:       defineAsyncComponent({
      loader: () => import('~/components/responses.vue'),
    }),
    'group-config': defineAsyncComponent(() => import('~/components/manage/alias/groupConfig.vue')),
  },
  setup () {
    const { result, loading } = useQuery(GET_ALL);
    const permissions = useResult<{permissions: PermissionsInterface[] }, PermissionsInterface[], PermissionsInterface[]>(result, [], data => data.permissions);
    const groups = useResult<{keywordGroup: KeywordGroupInterface[] }, KeywordGroupInterface[], KeywordGroupInterface[]>(result, [], (data) => {
      console.log({
        data,
      }); return data.keywordGroup;
    });

    const search = ref('');
    const items = ref([] as Required<KeywordInterfaceUI>[]);
    const selectedItem = ref(null as Required<KeywordInterfaceUI> | null);

    const { mutate: updateGroupMutation, onDone: onDoneUpdateGroup, onError: onErrorUpdateGroup } = useMutation(gql`
      mutation setKeywordGroup($name: String!, $data: String!) {
        setKeywordGroup(name: $name, data: $data) {
          name
        }
      }`);
    onDoneUpdateGroup(() => { EventBus.$emit('snack', 'success', 'Data updated.'); });
    onErrorUpdateGroup(error);

    const selected = ref([] as KeywordInterfaceUI[]);
    const deleteDialog = ref(false);

    const currentItems = ref([] as KeywordInterfaceUI[]);
    const saveCurrentItems = (value: KeywordInterfaceUI[]) => {
      currentItems.value = value;
    };

    const rules = {
      keyword: [
        minLength(2), required, isValidRegex,
      ],
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
        value: 'keyword', text: translate('keyword'),
      },
      {
        value: 'groupToBeShownInTable', text: translate('group'), width: '8rem',
      },
      {
        value: 'enabled', text: translate('enabled'), width: '6rem', align: 'center',
      },
    ];

    const headersDelete = [
      {
        value: 'keyword', text: translate('keyword'),
      },
    ];

    const refresh = () => {
      getSocket('/systems/keywords').emit('generic::getAll', (err: string | null, keywordsGetAll: Required<KeywordInterface>[]) => {
        if (err) {
          return error(err);
        }
        items.value.length = 0;
        for (const keyword of keywordsGetAll) {
          items.value.push({
            ...keyword,
            groupToBeShownInTable: keyword.group, // we need this to have group shown even when group-by
            responses:             orderBy(keyword.responses, 'order', 'asc'),
          });
        }
        console.debug({
          keywordsGetAll, items: items.value,
        });

        // we also need to reset selection values
        if (selected.value.length > 0) {
          selected.value.forEach((selItem, index) => {
            selItem = items.value.find(o => o.id === selItem.id) || selItem;
            selected.value[index] = selItem;
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
            getSocket('/systems/keywords').emit('generic::deleteById', item.id, (err: string | null) => {
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
          console.log('Updating', {
            item,
          });
          getSocket('/systems/keywords').emit('generic::setById', {
            id: item.id,
            item,
          }, () => {
            EventBus.$emit('snack', 'success', 'Data updated.');
          });
        }
      }
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

    const getGroup = computed<{ [name: string]: KeywordGroupInterface }>({
      get () {
        // set empty groups from aliases
        const returnGroups: { [name: string]: KeywordGroupInterface } = {
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
      set (value: { [name: string]: KeywordGroupInterface }) {
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

    const toggleItemSelection = (item: typeof items.value[number]) => {
      if (selected.value.find(o => o.id === item.id)) {
        // deselect
        selected.value = selected.value.filter(o => o.id !== item.id);
      } else {
        selected.value.push(item);
      }
    };

    return {
      addToSelectedItem: addToSelectedItem(selected, 'id', currentItems),
      saveCurrentItems,
      selectItem,
      batchUpdate,
      selectedItem,
      unSelectItem,
      toggleItemSelection,
      orderBy,
      search,
      headers,
      items,
      state,
      permissions,
      getPermissionName,
      translate,
      deleteDialog,
      updateGroup,
      deleteSelected,
      selected,
      capitalize,
      rules,
      refresh,
      headersDelete,
      mdiMagnify,
      mdiCheckboxMultipleMarkedOutline,
      ButtonStates,
      loading,

      permissionItems,
      groups,
      groupItems,
      getGroup,
      isGroupSelected,
      toggleGroupSelection,
      mdiMinus,
      mdiPlus,
    };
  },
});
</script>
