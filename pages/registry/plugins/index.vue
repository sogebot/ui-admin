<template>
  <v-container
    fluid
    :class="{ 'pa-4': !$vuetify.breakpoint.mobile }"
  >
    <v-expand-transition>
      <v-app-bar v-if="selected.length > 0" color="blue-grey darken-4" fixed dense>
        <v-row class="px-2" dense justify="end">
          <v-col cols="auto" align-self="center">
            {{ selected.length }} items selected
          </v-col>

          <v-col cols="auto" align-self="center">
            <v-row dense>
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
                      >
                        <template #[`item.id`]="{ item }">
                          <code>{{ item.id }}</code>
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
              </v-col>
            </v-row>
          </v-col>
        </v-row>
      </v-app-bar>
    </v-expand-transition>

    <v-data-table
      v-model="selected"
      :show-select="true"
      :loading="loading"
      :headers="headers"
      :items-per-page="-1"
      sort-by="value"
      :search="search"
      :items="items"
      @current-items="saveCurrentItems"
      @click:row="addToSelectedItem"
    >
      <template #top>
        <table-search-bar :search.sync="search">
          <v-btn
            color="primary"
            @click="addItem()"
          >
            Add item
          </v-btn>
        </table-search-bar>
      </template>

      <template #[`item`]="{ item }">
        <table-mobile :headers="headers" :selected="selected" :item="item" :add-to-selected-item="addToSelectedItem">
          <template #id>
            <code>{{ item.id }}</code>
          </template>

          <template #actions>
            <v-btn class="primary-hover" icon nuxt :to="`/registry/plugins/${item.id}`">
              <v-icon>
                mdi-pencil
              </v-icon>
            </v-btn>
            <v-btn class="primary-hover" icon :href="'/plugins/' + item.id" @click.stop>
              <v-icon>
                mdi-link
              </v-icon>
            </v-btn>
            <v-btn class="primary-hover" icon :disabled="copied===item.id" @click.stop="copied=item.id">
              <v-icon v-if="copied !== item.id">
                mdi-clipboard
              </v-icon>
              <v-icon v-else>
                mdi-clipboard-check
              </v-icon>
            </v-btn>
            <v-btn class="danger-hover" icon @click="selected = [item]; deleteDialog = true;">
              <v-icon>
                mdi-delete-forever
              </v-icon>
            </v-btn>
          </template>
        </table-mobile>
      </template>

      <template #[`item.actions`]="{ item }">
        <div style="width: max-content;">
          <v-hover v-slot="{ hover }">
            <v-btn
              icon
              :color="hover ? 'primary' : 'secondary lighten-3'"
              :disabled="copied===item.id"
              @click.stop="copied=item.id"
            >
              <v-icon v-if="copied !== item.id">
                mdi-clipboard
              </v-icon>
              <v-icon v-else>
                mdi-clipboard-check
              </v-icon>
            </v-btn>
          </v-hover>
        </div>
      </template>
    </v-data-table>
  </v-container>
</template>

<script lang="ts">
import type { Plugin } from '@entity/plugin';
import { getSocket } from '@sogebot/ui-helpers/socket';
import translate from '@sogebot/ui-helpers/translate';
import shortid from 'shortid';

import { addToSelectedItem } from '~/functions/addToSelectedItem';
import { EventBus } from '~/functions/event-bus';

export default defineComponent({
  setup () {
    const loading = ref(true);

    const router = useRouter();
    const search = ref('');

    const selected = ref([] as Plugin[]);
    const copied = ref('');
    const items = ref([] as Plugin[]);
    const currentItems = ref([] as Plugin[]);
    const saveCurrentItems = (value: Plugin[]) => {
      currentItems.value = value;
    };
    const deleteDialog = ref(false);
    const selectable = ref(false);

    watch(selectable, (val) => {
      if (!val) {
        selected.value = [];
      }
    });

    watch(copied, (val) => {
      if (val.length > 0) {
        EventBus.$emit('snack', 'success', 'Link copied to clipboard.');
        navigator.clipboard.writeText(`${document.location.protocol}//${document.location.host}/plugins/${val}`);
        setTimeout(() => {
          copied.value = '';
        }, 1000);
      }
    });

    const headers = [
      {
        value: 'id', text: 'ID', sortable: false,
      },
      { value: 'name', text: translate('name') },
      {
        value: 'actions', text: '', sortable: false,
      },
    ];

    const headersDelete = [
      {
        value: 'id', text: 'ID', sortable: false,
      },
      { value: 'name', text: translate('name') },
    ];

    onMounted(() => {
      refresh();
    });

    const refresh = () => {
      loading.value = true;

      getSocket('/core/plugins').emit('generic::getAll', (err, d) => {
        if (err) {
          console.error(err);
          return;
        }
        items.value = d;

        // we also need to reset selection values
        if (selected.value.length > 0) {
          selected.value.forEach((selectedItem, index) => {
            selectedItem = d.find(o => o.id === selectedItem.id) || selectedItem;
            selected.value[index] = selectedItem;
          });
        }
        loading.value = false;
      });
    };

    const deleteSelected = async () => {
      deleteDialog.value = false;
      await Promise.all(selected.value.map(async (item) => {
        return new Promise((resolve) => {
          getSocket('/core/plugins').emit('generic::deleteById', item.id, () => resolve(true));
        });
      }));
      selected.value = [];
      EventBus.$emit('snack', 'success', 'Data removed.');
      refresh();
    };

    const addItem = () => {
      router.push(`/registry/plugins/${shortid()}`);
    };

    return {
      // refs
      items,
      search,
      loading,
      headers,
      headersDelete,
      selected,
      deleteSelected,
      selectable,
      deleteDialog,
      translate,
      copied,

      // functions
      addToSelectedItem: addToSelectedItem(selected, 'id', currentItems),
      addItem,

      // external functions
      saveCurrentItems,
    };
  },
});
</script>
