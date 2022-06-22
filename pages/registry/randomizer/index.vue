<template>
  <v-container fluid :class="{ 'pa-4': !$vuetify.breakpoint.mobile }">
    <v-data-table
      v-model="selected"
      :show-select="selectable"
      :search="search"
      :loading="loading"
      :headers="headers"
      :items-per-page="-1"
      :items="items"
      sort-by="name"
      @current-items="saveCurrentItems"
      @click:row="addToSelectedItem"
    >
      <template #top>
        <v-sheet flat color="dark" class="my-2 pb-2 mt-0">
          <v-row class="px-2" no-gutters>
            <v-col cols="auto" align-self="center" class="pr-2">
              <v-btn icon :color="selectable ? 'primary' : 'secondary'" @click="selectable = !selectable">
                <v-icon>
                  mdi-checkbox-multiple-marked-outline
                </v-icon>
              </v-btn>
            </v-col>
            <v-col align-self="center">
              <v-text-field
                v-model="search"
                append-icon="mdi-magnify"
                label="Search"
                single-line
                hide-details
                class="pa-0 ma-2"
              />
            </v-col>
            <v-col cols="auto" align-self="center">
              <template v-if="selected.length > 0">
                <v-dialog v-model="deleteDialog" max-width="500px">
                  <template #activator="{ on, attrs }">
                    <v-btn color="error" class="mr-1" v-bind="attrs" v-on="on">
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
                      >
                        <template #[`item.items`]="{ item }">
                          {{ item.items.map(o => o.name). join(', ') }}
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
              </template>

              <v-btn color="primary" to="/registry/randomizer/new" nuxt>
                New Item
              </v-btn>
            </v-col>
          </v-row>
        </v-sheet>
      </template>

      <template #[`item.items`]="{ item }">
        {{ Array.from(new Set(orderBy(item.items, 'order').map(o => o.name))).join(', ') }}
      </template>

      <template #[`item.permissionId`]="{ item }">
        {{ getPermissionName(item.permissionId, permissions) }}
      </template>

      <template #[`item.actions`]="{ item }">
        <div style="width: max-content;">
          <v-hover v-slot="{ hover }">
            <v-btn icon :color="hover ? 'primary' : 'secondary lighten-3'" nuxt :to="'/registry/randomizer/' + item.id" @click.stop>
              <v-icon>mdi-pencil</v-icon>
            </v-btn>
          </v-hover>

          <v-hover v-slot="{ hover }">
            <v-btn icon :color="hover ? 'primary' : 'secondary lighten-3'" @click.stop="toggleVisibility(item)">
              <v-icon>{{ item.isShown ? 'mdi-eye' : 'mdi-eye-off' }}</v-icon>
            </v-btn>
          </v-hover>

          <v-hover v-slot="{ hover }">
            <v-btn icon :color="hover ? 'primary' : 'secondary lighten-3'" :disabled="spin" @click.stop="startSpin">
              <v-icon v-if="!spin">
                mdi-play
              </v-icon>
              <v-progress-circular v-else indeterminate size="20" />
            </v-btn>
          </v-hover>

          <v-hover v-slot="{ hover }">
            <v-btn icon :color="hover ? 'primary' : 'secondary lighten-3'" @click.stop="clone(item)">
              <v-icon>mdi-content-copy</v-icon>
            </v-btn>
          </v-hover>
        </div>
      </template>
    </v-data-table>
  </v-container>
</template>

<script lang="ts">
import { PermissionsInterface } from '@entity/permissions';
import type { RandomizerInterface } from '@entity/randomizer';
import { getSocket } from '@sogebot/ui-helpers/socket';
import translate from '@sogebot/ui-helpers/translate';
import gql from 'graphql-tag';
import { cloneDeep, orderBy } from 'lodash';
import { v4 } from 'uuid';

import { addToSelectedItem } from '~/functions/addToSelectedItem';
import { error } from '~/functions/error';
import { EventBus } from '~/functions/event-bus';
import { getPermissionName } from '~/functions/getPermissionName';
import GET_ALL from '~/queries/randomizer/getAll.gql';
import REMOVE from '~/queries/randomizer/remove.gql';
import SAVE from '~/queries/randomizer/save.gql';

export default defineComponent({
  setup () {
    const loading = ref(true);
    const items = ref([] as RandomizerInterface[]);
    const permissions = ref([] as PermissionsInterface[]);
    const { $graphql } = useNuxtApp();

    const refetch = async () => {
      await new Promise<void>((resolve) => {
        getSocket('/core/permissions').emit('generic::getAll', (err, res) => {
          if (err) {
            return console.error(err);
          }
          permissions.value = res;
          resolve();
        });
      });

      const request = await $graphql.default.request(GET_ALL);
      if (selected.value.length > 0) {
        selected.value.forEach((selectedItem, index) => {
          selectedItem = request.randomizers.find(o => o.id === selectedItem.id) || selectedItem;
          selected.value[index] = selectedItem;
        });
      }

      items.value = cloneDeep(request.randomizers);
      loading.value = false;
    };

    const search = ref('');

    const selected = ref([] as RandomizerInterface[]);
    const currentItems = ref([] as RandomizerInterface[]);
    const deleteDialog = ref(false);
    const spin = ref(false);
    const selectable = ref(false);
    const saveCurrentItems = (value: RandomizerInterface[]) => {
      currentItems.value = value;
    };
    watch(selectable, (val) => {
      if (!val) {
        selected.value = [];
      }
    });

    const headers = [
      { value: 'name', text: translate('timers.dialog.name') },
      { value: 'command', text: translate('registry.randomizer.form.command') },
      { value: 'permissionId', text: translate('registry.randomizer.form.permission') },
      {
        value: 'items', text: translate('registry.randomizer.form.options'), sortable: false,
      },
      {
        value: 'actions', text: '', sortable: false,
      },
      { text: '', value: 'data-table-expand' },
    ];

    const headersDelete = [
      { value: 'name', text: translate('timers.dialog.name') },
      { value: 'command', text: translate('registry.randomizer.form.command') },
      { value: 'items', text: 'Items' },
    ];

    onMounted(() => {
      refetch();
    });

    const deleteSelected = async () => {
      deleteDialog.value = false;
      await Promise.all(selected.value.map(async (item) => {
        await $graphql.default.request(REMOVE, { id: item.id });
      }));
      selected.value.forEach(item => $graphql.default.request(REMOVE, { id: item.id }));
      selected.value = [];
      EventBus.$emit('snack', 'success', 'Data removed.');
      refetch();
    };

    const clone = (item: Required<RandomizerInterface>) => {
      const clonedItemId = v4();

      const clonedItemsRemapId = new Map();
      // remap items ids
      const clonedItems = item.items.map((o) => {
        clonedItemsRemapId.set(o.id, v4());
        return { ...o, id: clonedItemsRemapId.get(o.id) };
      });

      const clonedItem = {
        ...item,
        isShown: false, // forcefully hide
        id:      clonedItemId,
        name:    item.name + ' (clone)',
        command: `!${Math.random().toString(36).substr(2, 5)}`,
        // we need to do another .map as we need to find groupId
        items:   clonedItems.map(o => ({ ...o, groupId: o.groupId === null ? o.groupId : clonedItemsRemapId.get(o.groupId) })),
      };

      $graphql.default.request(SAVE, { data_json: JSON.stringify(clonedItem) })
        .then(() => EventBus.$emit('snack', 'success', 'Data saved.'))
        .catch((e: any) => error(e))
        .finally(() => refetch());
    };

    const toggleVisibility = (item: Required<RandomizerInterface>) => {
      item.isShown = !item.isShown;

      $graphql.default.request(gql`mutation randomizerSetVisibility($id: String!, $value: Boolean!) { randomizerSetVisibility(id: $id, value: $value) }`, {
        id:    item.id,
        value: item.isShown,
      })
        .then(() => EventBus.$emit('snack', 'success', 'Visibility changed.'))
        .catch((e: any) => error(e))
        .finally(() => refetch());
    };

    const startSpin = () => {
      spin.value = true;
      getSocket('/registries/randomizer').emit('randomizer::startSpin');
      setTimeout(() => {
        spin.value = false;
      }, 5000);
    };

    return {
      // refs
      items,
      search,
      headers,
      headersDelete,
      selected,
      deleteSelected,
      selectable,
      deleteDialog,
      translate,
      currentItems,
      permissions,
      spin,
      loading,

      // functions
      addToSelectedItem: addToSelectedItem(selected, 'id', currentItems),
      clone,
      saveCurrentItems,
      getPermissionName,
      toggleVisibility,
      startSpin,

      // others
      orderBy,
    };
  },
});
</script>
