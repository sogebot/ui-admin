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
            <v-btn icon :color="hover ? 'primary' : 'secondary lighten-3'" :disabled="spin" @click.stop="() => startSpin(item.id)">
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
import { Permissions } from '@entity/permissions';
import { Randomizer } from '@sogebot/backend/dest/database/entity/randomizer';
import { getSocket } from '@sogebot/ui-helpers/socket';
import translate from '@sogebot/ui-helpers/translate';

import { addToSelectedItem } from '~/functions/addToSelectedItem';

import axios from 'axios';

import { error } from '~/functions/error';

import { orderBy } from 'lodash';

import { EventBus } from '~/functions/event-bus';

import { v4 } from 'uuid';

import { getPermissionName } from '~/functions/getPermissionName';

export default defineComponent({
  setup () {
    const loading = ref(true);
    const items = ref([] as Randomizer[]);
    const permissions = ref([] as Permissions[]);

    const refetch = () => {
      getSocket('/core/permissions').emit('generic::getAll', (err, res) => {
        if (err) {
          return console.error(err);
        }
        permissions.value = res;
      });
      axios.get('/api/registries/randomizer', { headers: { authorization: `Bearer ${localStorage.accessToken}` } })
        .then(({ data }) => {
          items.value = data.data;
          console.debug(data);

          // we also need to reset selection values
          if (selected.value.length > 0) {
            selected.value.forEach((val, index) => {
              val = items.value.find(o => o.id === val.id) || val;
              selected.value[index] = val;
            });
          }

          loading.value = false;
        }).catch(e => error(e));
    };

    const search = ref('');

    const selected = ref([] as Randomizer[]);
    const currentItems = ref([] as Randomizer[]);
    const deleteDialog = ref(false);
    const spin = ref(false);
    const selectable = ref(false);
    const saveCurrentItems = (value: Randomizer[]) => {
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
      await Promise.all(
        selected.value.map((item) => {
          return new Promise<void>((resolve, reject) => {
            if (!item.id) {
              reject(error('Missing item id'));
              return;
            }
            axios.delete('/api/registries/randomizer/' + item.id, { headers: { authorization: `Bearer ${localStorage.accessToken}` } })
              .finally(() => resolve());
          });
        }),
      );
      selected.value = [];
      EventBus.$emit('snack', 'success', 'Data removed.');
      refetch();
    };

    const clone = (item: Required<Randomizer>) => {
      const clonedItem = {
        ...item,
        isShown: false, // forcefully hide
        id:      v4(),
        name:    item.name + ' (clone)',
        command: `!${Math.random().toString(36).substr(2, 5)}`,
      };

      axios.post(`/api/registries/randomizer`,
        clonedItem,
        { headers: { authorization: `Bearer ${localStorage.accessToken}` } },
      )
        .then(() => {
          EventBus.$emit('snack', 'success', 'Data saved.');
          refetch();
        });
    };

    const toggleVisibility = (item: Required<Randomizer>) => {
      item.isShown = !item.isShown;

      if (item.isShown) {
        axios.post(`/api/registries/randomizer/${item.id}/show`, null, { headers: { authorization: `Bearer ${localStorage.accessToken}` } })
          .then(refetch);
      } else {
        axios.post(`/api/registries/randomizer/hide`, null, { headers: { authorization: `Bearer ${localStorage.accessToken}` } })
          .then(refetch);
      }
    };

    const startSpin = (id: string) => {
      spin.value = true;
      axios.post(`/api/registries/randomizer/${id}/spin`, null, { headers: { authorization: `Bearer ${localStorage.accessToken}` } })
        .then(() => {
          setTimeout(() => {
            spin.value = false;
          }, 5000);
        });
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
