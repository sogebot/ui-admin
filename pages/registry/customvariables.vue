<template>
  <v-container
    fluid
    :class="{ 'pa-4': !$vuetify.breakpoint.mobile }"
  >
    <h2 v-if="!$vuetify.breakpoint.mobile">
      {{ translate('menu.custom-variables') }}
    </h2>

    <v-data-table
      v-model="selected"
      calculate-widths
      :show-select="selectable"
      :search="search"
      :loading="state.loading !== ButtonStates.success"
      :headers="headers"
      :items-per-page="-1"
      :items="items"
      sort-by="name"
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
                fullscreen
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

              <v-dialog
                v-model="editDialog"
                fullscreen
              >
                <v-card v-if="editItem">
                  <v-card-title>
                    <span class="headline">Update item <code>{{ editItem.name }}</code></span>
                  </v-card-title>

                  <v-card-text :key="timestamp">
                    <new-item
                      :item="editItem"
                      :rules="rules"
                      @close="editItem = null"
                      @save="saveSuccess"
                    />
                  </v-card-text>
                </v-card>
              </v-dialog>
            </v-col>
          </v-row>
        </v-sheet>
      </template>

      <template #[`item.description`]="{ item }">
        <span
          v-if="item.description.length === 0"
          class="grey--text"
          :class="{
            'text--darken-3': $vuetify.theme.dark,
            'text--lighten-1': !$vuetify.theme.dark,
          }"
        >No description set</span>
        {{ item.description }}
      </template>

      <template #[`item.type`]="{ item }">
        {{ translate('registry.customvariables.types.' + item.type) }}
      </template>

      <template #[`item.additionalInfo`]="{ item }">
        <span v-if="item.type === 'eval'">
          <strong>{{ translate('registry.customvariables.run-script') }}:</strong>
          <template v-if="item.runEveryTypeValue > 0">
            {{ item.runEvery / item.runEveryTypeValue }} {{ translate('registry.customvariables.runEvery.' + item.runEveryType) }}
          </template>
          <template v-else>
            {{ translate('registry.customvariables.runEvery.' + item.runEveryType) }}
          </template>
          <div>
            {{ translate('registry.customvariables.last-run') }} <strong>{{ item.runAt ? new Date(item.runAt).toLocaleString() : translate('commons.never') }}</strong>
          </div>
        </span>
        <span v-if="item.type === 'options'">
          <strong>{{ translate('registry.customvariables.usableOptions.name') }}:</strong>
          {{ item.usableOptions.join(', ') }}
        </span>
        <div v-if="item.readOnly">
          <strong>{{ translate('registry.customvariables.isReadOnly') | capitalize }}</strong>
        </div>

        <div>
          <strong>{{ translate('registry.customvariables.response.name') }}:</strong>
          <span v-if="item.responseType === 0">{{ translate('registry.customvariables.response.default') }}</span>
          <span v-if="item.responseType === 1">{{ translate('registry.customvariables.response.custom') }}</span>
          <span v-if="item.responseType === 2">{{ translate('registry.customvariables.response.command') }}</span>
          <i v-if="item.responseType === 1">{{ item.responseText }}</i>
        </div>
        <div>
          <strong> {{ translate('registry.customvariables.permissionToChange') }}:</strong>
          <span v-if="getPermissionName(item.permission, permissions)">{{ getPermissionName(item.permission, permissions) }}</span>
          <span
            v-else
            class="red--text  text--lighten-1"
          ><v-icon>{{ mdiExclamationThick }}</v-icon>  Permission not found</span>
        </div>
      </template>

      <template #[`item.actions`]="{ item }">
        <div style="width: max-content;">
          <v-hover v-slot="{ hover }">
            <v-btn
              icon
              :color="hover ? 'primary' : 'secondary lighten-3'"
              @click="edit(item)"
            >
              <v-icon>{{ mdiPencil }}</v-icon>
            </v-btn>
          </v-hover>
          <v-hover v-slot="{ hover }">
            <v-btn
              icon
              :color="hover ? 'primary' : 'secondary lighten-3'"
              @click="clone(item)"
            >
              <v-icon>{{ mdiContentCopy }}</v-icon>
            </v-btn>
          </v-hover>
          <v-hover v-if="item.type === 'eval'" v-slot="{ hover }">
            <v-btn
              icon
              :color="hover ? 'primary' : 'secondary lighten-3'"
              @click="runScript(item.id)"
            >
              <v-icon
                :class="{
                  'spin': runningScripts.includes(item.id)
                }"
              >
                {{ runningScripts.includes(item.id) ? mdiCog : mdiCogRefresh }}
              </v-icon>
            </v-btn>
          </v-hover>
        </div>
      </template>
    </v-data-table>
  </v-container>
</template>

<script lang="ts">
import {
  mdiCheckBoxMultipleOutline, mdiCog, mdiCogRefresh, mdiContentCopy, mdiExclamationThick, mdiMagnify, mdiPencil,
} from '@mdi/js';
import { ButtonStates } from '@sogebot/ui-helpers/buttonStates';
import { getSocket } from '@sogebot/ui-helpers/socket';
import translate from '@sogebot/ui-helpers/translate';
import {
  computed,
  defineAsyncComponent, defineComponent, onMounted, ref, watch,
} from '@vue/composition-api';
import { v4 } from 'uuid';

import type { PermissionsInterface } from '.bot/src/bot/database/entity/permissions';
import { VariableInterface } from '.bot/src/bot/database/entity/variable';
import { addToSelectedItem } from '~/functions/addToSelectedItem';
import { error } from '~/functions/error';
import { EventBus } from '~/functions/event-bus';
import { getPermissionName } from '~/functions/getPermissionName';
import { required } from '~/functions/validators';

export default defineComponent({
  components: { 'new-item': defineAsyncComponent({ loader: () => import('~/components/new-item/textoverlay-newItem.vue') }) },
  setup () {
    const rules = { name: [required] };

    const items = ref([] as VariableInterface[]);
    const editItem = ref(null as null | VariableInterface);
    const search = ref('');
    const permissions = ref([] as PermissionsInterface[]);

    const runningScripts = ref([] as string[]);

    const selected = ref([] as VariableInterface[]);
    const deleteDialog = ref(false);
    const newDialog = ref(false);
    const selectable = ref(false);
    const editDialog = computed({
      get () {
        return !!editItem.value;
      },
      set (value) {
        if (!value) {
          editItem.value = null;
        }
      },
    });
    watch(selectable, (val) => {
      if (!val) {
        selected.value = [];
      }
    });

    const timestamp = ref(Date.now());

    watch(newDialog, () => {
      timestamp.value = Date.now();
    });

    const state = ref({ loading: ButtonStates.progress } as {
      loading: number;
    });

    const headers = [
      { value: 'variableName', text: '$_' },
      { value: 'description', text: translate('registry.customvariables.description.name') },
      {
        value: 'type', sortable: true, text: translate('registry.customvariables.type.name'),
      },
      {
        value: 'additionalInfo', text: translate('registry.customvariables.additional-info'), sortable: false,
      },
      { value: 'currentValue', text: translate('registry.customvariables.currentValue.name') },
      {
        value: 'actions', text: '', sortable: false,
      },

    ];

    const headersDelete = [
      { value: 'variableName', text: '' },
      { value: 'type', text: '' },
    ];

    onMounted(() => {
      refresh();
    });

    const refresh = async () => {
      await Promise.all([
        new Promise<void>((resolve, reject) => {
          getSocket('/core/customvariables').emit('customvariables::list', (err: string | null, itemsGetAll: VariableInterface[]) => {
            if (err) {
              reject(err);
              return error(err);
            }
            console.debug('Loaded', itemsGetAll);
            items.value = itemsGetAll;
            // we also need to reset selection values
            if (selected.value.length > 0) {
              selected.value.forEach((selectedItem, index) => {
                selectedItem = items.value.find(o => o.id === selectedItem.id) || selectedItem;
                selected.value[index] = selectedItem;
              });
            }
            resolve();
          });
        }),
        new Promise<void>((resolve, reject) => {
          getSocket('/core/permissions').emit('permissions', (err: string | null, data: Readonly<Required<PermissionsInterface>>[]) => {
            if (err) {
              reject(err);
              return error(err);
            }
            permissions.value = data;
            resolve();
          });
        }),
      ]);
      state.value.loading = ButtonStates.success;
    };

    const saveSuccess = () => {
      refresh();
      EventBus.$emit('snack', 'success', 'Data updated.');
      editItem.value = null;
      newDialog.value = false;
    };

    const deleteSelected = async () => {
      deleteDialog.value = false;
      await Promise.all(
        selected.value.map((item) => {
          return new Promise((resolve, reject) => {
            getSocket('/core/customvariables').emit('customvariables::delete', item.id, (err: string | null) => {
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

    const clone = (item: VariableInterface) => {
      getSocket('/core/customvariables').emit('customvariables::save', {
        ...item, history: [], urls: [], id: v4(), description: '(clone) of ' + item.variableName, variableName: `$_${Math.random().toString(36).substr(2, 5)}`,
      }, (err: string | null) => {
        if (err) {
          console.error(err);
        } else {
          EventBus.$emit('snack', 'success', 'Data cloned.');
        }
        refresh();
      });
    };

    const edit = (item: VariableInterface) => {
      editItem.value = item;
    };

    const runScript = (id: string) => {
      if (runningScripts.value.includes(id)) {
        return;
      }
      runningScripts.value.push(id);
      EventBus.$emit('snack', 'success', 'Script triggered.');
      getSocket('/core/customvariables').emit('customvariables::runScript', id, (err: string | null) => {
        if (err) {
          EventBus.$emit('snack', 'error', 'Script error. ' + err);
        } else {
          refresh();
        }
        runningScripts.value.splice(runningScripts.value.indexOf(id), 1);
      });
    };

    return {
      addToSelectedItem: addToSelectedItem(selected, 'id'),
      edit,
      editItem,
      items,
      search,
      state,
      headers,
      headersDelete,
      selected,
      deleteSelected,
      selectable,
      newDialog,
      deleteDialog,
      translate,
      saveSuccess,
      editDialog,
      timestamp,
      rules,
      mdiMagnify,
      mdiCheckBoxMultipleOutline,
      mdiContentCopy,
      mdiCog,
      mdiCogRefresh,
      mdiPencil,
      mdiExclamationThick,
      ButtonStates,
      clone,
      getPermissionName,
      permissions,
      runScript,
      runningScripts,
    };
  },
});
</script>
