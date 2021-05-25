<template>
  <v-container
    fluid
    :class="{ 'pa-4': !$vuetify.breakpoint.mobile }"
  >
    <v-alert
      v-if="!$store.state.$systems.find(o => o.name === 'alias').enabled"
      dismissible
      prominent
      dense
    >
      <div class="text-caption">
        {{ translate('this-system-is-disabled') }}
      </div>
    </v-alert>

    <h2 v-if="!$vuetify.breakpoint.mobile">
      {{ translate('menu.alias') }}
    </h2>

    <v-data-table
      v-model="selected"
      calculate-widths
      group-by="group"
      :show-select="selectable"
      :search="search"
      :loading="state.loadingAls !== ButtonStates.success && state.loadingPrm !== ButtonStates.success"
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
          class="my-2 p-2"
        >
          <v-row class="px-2" no-gutters>
            <v-col cols="auto" align-self="center" class="pr-2">
              <v-btn icon :color="selectable ? 'primary' : 'secondary'" @click="selectable = !selectable">
                <v-icon>
                  {{ mdiCheckBoxMultipleOutline }}
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
      </template>

      <template #[`group.header`]="{ items, isOpen, toggle }">
        <th colspan="7">
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
          </span>
        </th>
      </template>

      <template #[`item.alias`]="{ item }">
        <v-edit-dialog
          persistent
          large
          :return-value.sync="item.alias"
          @save="update(item, false, 'alias')"
        >
          {{ item.alias }}
          <template #input>
            <v-text-field
              v-model="item.alias"
              :rules="rules.alias"
              single-line
              :clearable="true"
              counter
            />
          </template>
        </v-edit-dialog>
      </template>

      <template #[`item.command`]="{ item }">
        <v-edit-dialog
          :return-value.sync="item.command"
          persistent
          large
          @save="update(item, false, 'command')"
        >
          {{ truncate(item.command, truncateLength) }}
          <template #input>
            <v-lazy>
              <v-textarea
                v-model="item.command"
                :rows="1"
                :rules="rules.command"
                single-line
                counter
                :clearable="true"
                auto-grow
                autofocus
                @keydown.enter.prevent
              />
            </v-lazy>
          </template>
        </v-edit-dialog>
      </template>

      <template #[`item.groupToBeShownInTable`]="{ item }">
        <v-edit-dialog
          persistent
          large
          :return-value.sync="item.groupToBeShownInTable"
          @save="update(item, true, 'group')"
        >
          <span :class="{ 'text--lighten-1': item.groupToBeShownInTable === null, 'red--text': item.groupToBeShownInTable === null }">
            {{ item.groupToBeShownInTable === null ? 'unset' : item.groupToBeShownInTable }}
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

      <template #[`item.permission`]="{ item }">
        <v-edit-dialog
          persistent
          large
          :return-value.sync="item.permission"
          @save="update(item, true, 'permission')"
        >
          {{ getPermissionName(item.permission, permissions) }}
          <template #input>
            <v-select
              v-model="item.permission"
              :items="permissionItems"
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
    </v-data-table>
  </v-container>
</template>

<script lang="ts">
import {
  mdiCheckBoxMultipleOutline, mdiMagnify, mdiMinus, mdiPlus,
} from '@mdi/js';
import { ButtonStates } from '@sogebot/ui-helpers/buttonStates';
import { getSocket } from '@sogebot/ui-helpers/socket';
import translate from '@sogebot/ui-helpers/translate';
import {
  computed, defineAsyncComponent, defineComponent, onMounted, ref, watch,
} from '@vue/composition-api';
import { capitalize, orderBy } from 'lodash-es';

import type { AliasInterface } from '.bot/src/bot/database/entity/alias';
import type { PermissionsInterface } from '.bot/src/bot/database/entity/permissions';
import { addToSelectedItem } from '~/functions/addToSelectedItem';
import { error } from '~/functions/error';
import { EventBus } from '~/functions/event-bus';
import { getPermissionName } from '~/functions/getPermissionName';
import { truncate } from '~/functions/truncate';
import {
  minLength, required, startsWith,
} from '~/functions/validators';

type AliasInterfaceUI = AliasInterface & { groupToBeShownInTable: null | string };

export default defineComponent({
  components: { 'new-item': defineAsyncComponent({ loader: () => import('~/components/new-item/alias-newItem.vue') }) },
  setup (_, ctx) {
    const timestamp = ref(Date.now());

    const selected = ref([] as AliasInterfaceUI[]);
    const currentItems = ref([] as AliasInterfaceUI[]);
    const saveCurrentItems = (value: AliasInterfaceUI[]) => {
      currentItems.value = value;
    };
    const deleteDialog = ref(false);
    const newDialog = ref(false);
    const selectable = ref(false);
    watch(selectable, (val) => {
      if (!val) {
        selected.value = [];
      }
    });

    const items = ref([] as AliasInterfaceUI[]);
    const permissions = ref([] as PermissionsInterface[]);

    const rules = {
      alias:   [startsWith(['!']), required],
      command: [startsWith(['!', '$_']), minLength(2)],
    };

    const search = ref('');
    const state = ref({
      loadingAls: ButtonStates.progress,
      loadingPrm: ButtonStates.idle,
    } as {
      loadingAls: number;
      loadingPrm: number;
    });

    watch(newDialog, () => {
      timestamp.value = Date.now();
    });

    const saveSuccess = () => {
      refresh();
      EventBus.$emit('snack', 'success', 'Data updated.');
      newDialog.value = false;
    };

    const truncateLength = computed(() => {
      const breakpoint = (ctx.root as any).$vuetify.breakpoint;
      if (breakpoint.mobile) {
        return 50;
      } else {
        return 500;
      }
    });

    const permissionItems = computed(() => {
      return permissions.value.map(item => ({
        text:     item.name,
        value:    item.id,
        disabled: false,
      }));
    });
    const groupItems = computed(() => {
      return [...new Set(items.value.filter(o => o.group !== null).map(o => o.group).sort())].map(item => ({
        text:     item,
        value:    item,
        disabled: false,
      }));
    });

    onMounted(() => {
      refresh();
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
      { value: 'command', text: translate('command') },
    ];

    const headersDelete = [
      { value: 'alias', text: translate('alias') },
      { value: 'command', text: translate('command') },
    ];

    const refresh = () => {
      getSocket('/core/permissions').emit('permissions', (err: string | null, data: Readonly<Required<PermissionsInterface>>[]) => {
        if (err) {
          return error(err);
        }
        permissions.value = data;
        state.value.loadingPrm = ButtonStates.success;
      });
      getSocket('/systems/alias').emit('generic::getAll', (err: string | null, itemsGetAll: typeof items.value) => {
        if (err) {
          error(err);
          return;
        }
        items.value = orderBy(itemsGetAll, 'alias', 'asc');
        for (const item of items.value) {
          item.groupToBeShownInTable = item.group; // we need this to have group shown even when group-by
        }

        // we also need to reset selection values
        if (selected.value.length > 0) {
          selected.value.forEach((selectedItem, index) => {
            selectedItem = items.value.find(o => o.id === selectedItem.id) || selectedItem;
            selected.value[index] = selectedItem;
          });
        }
        state.value.loadingAls = ButtonStates.success;
      });
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
            getSocket('/systems/alias').emit('generic::setById', {
              id:   itemToUpdate.id,
              item: {
                ...itemToUpdate,
                [attr]: item[attr], // save new value for all selected items
              },
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
            getSocket('/systems/alias').emit('generic::deleteById', item.id, (err: string | null) => {
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

    return {
      addToSelectedItem: addToSelectedItem(selected, 'id', currentItems),
      saveCurrentItems,
      items,
      permissions,
      search,
      state,
      headers,
      headersDelete,
      groupItems,
      update,
      deleteSelected,
      translate,
      getPermissionName,
      truncate,
      truncateLength,
      selectable,

      selected,
      deleteDialog,
      newDialog,
      permissionItems,

      rules,
      isGroupSelected,
      toggleGroupSelection,

      timestamp,
      saveSuccess,

      mdiPlus,
      mdiMinus,
      mdiMagnify,
      mdiCheckBoxMultipleOutline,

      ButtonStates,
    };
  },
});
</script>
