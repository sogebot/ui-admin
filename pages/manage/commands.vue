<template>
  <v-container
    fluid
    :class="{ 'pa-4': !$vuetify.breakpoint.mobile }"
  >
    <v-alert
      v-if="!$store.state.$systems.find(o => o.name === 'customcommands').enabled"
      dismissible
      prominent
      dense
    >
      <div class="text-caption">
        {{ translate('this-system-is-disabled') }}
      </div>
    </v-alert>

    <h2 v-if="!$vuetify.breakpoint.mobile">
      {{ translate('menu.customcommands') }}
    </h2>

    <v-data-table
      v-model="selected"
      calculate-widths
      :show-select="selectable"
      :search="search"
      :loading="state.loading !== ButtonStates.success && state.loadingPrm !== ButtonStates.success"
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
  mdiCheckBoxMultipleOutline, mdiMagnify, mdiRestore,
} from '@mdi/js';
import {
  defineAsyncComponent, defineComponent, onMounted, ref, useContext, watch,
} from '@nuxtjs/composition-api';
import { ButtonStates } from '@sogebot/ui-helpers/buttonStates';
import { getSocket } from '@sogebot/ui-helpers/socket';
import translate from '@sogebot/ui-helpers/translate';
import { capitalize, orderBy } from 'lodash-es';

import type { CommandsInterface } from '.bot/src/bot/database/entity/commands';
import type { PermissionsInterface } from '.bot/src/bot/database/entity/permissions';
import { addToSelectedItem } from '~/functions/addToSelectedItem';
import api from '~/functions/api';
import { error } from '~/functions/error';
import { EventBus } from '~/functions/event-bus';
import { getPermissionName } from '~/functions/getPermissionName';
import {
  minLength, required, startsWith,
} from '~/functions/validators';

let count: {
  command: string; count: number;
}[] = [];

type CommandsInterfaceUI = CommandsInterface & { count: number };

export default defineComponent({
  components: {
    'new-item': defineAsyncComponent({ loader: () => import('~/components/new-item/command-newItem.vue') }),
    responses:  defineAsyncComponent({ loader: () => import('~/components/responses.vue') }),
  },
  setup () {
    const rules = { command: [startsWith(['!']), required, minLength(2)] };

    const search = ref('');
    const items = ref([] as Required<CommandsInterfaceUI>[]);
    const permissions = ref([] as PermissionsInterface[]);

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
      api.get<PermissionsInterface[]>(useContext().$axios, '/api/v1/settings/permissions')
        .then((response) => {
          permissions.value = response.data.data;
          state.value.loadingPrm = ButtonStates.success;
        });
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
            responses: orderBy(command.responses, 'order', 'asc'),
            count:     count.find(o => o.command === command.command)?.count || 0,
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
      mdiCheckBoxMultipleOutline,
      ButtonStates,
      selectable,
    };
  },
});
</script>
