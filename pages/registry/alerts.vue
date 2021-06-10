<template>
  <v-container
    fluid
    :class="{ 'pa-4': !$vuetify.breakpoint.mobile }"
  >
    <h2 v-if="!$vuetify.breakpoint.mobile">
      {{ translate('menu.alerts') }}
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

              <v-btn>
                Tester
              </v-btn>

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
                    <span class="headline">Update item <span class="primary--text pl-1">{{ editItem.name }}</span></span>
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

      <template #[`item.additional`]="{ item }">
        <span :class="{'primary--text': item.follows.length > 0, 'grey--text text--darken-3': item.follows.length === 0}">
          FOLLOW<span v-if="item.follows.length > 0">({{ item.follows.length }})</span>
        </span>
        <span :class="{'primary--text': item.hosts.length > 0, 'grey--text text--darken-3': item.hosts.length === 0}">
          HOSTS<span v-if="item.hosts.length > 0">({{ item.hosts.length }})</span>
        </span>
        <span :class="{'primary--text': item.raids.length > 0, 'grey--text text--darken-3': item.raids.length === 0}">
          RAID<span v-if="item.raids.length > 0">({{ item.raids.length }})</span>
        </span>
        <span :class="{'primary--text': item.cheers.length > 0, 'grey--text text--darken-3': item.cheers.length === 0}">
          CHEERS<span v-if="item.cheers.length > 0">({{ item.cheers.length }})</span>
        </span>
        <span :class="{'primary--text': item.subs.length > 0, 'grey--text text--darken-3': item.subs.length === 0}">
          SUBS<span v-if="item.subs.length > 0">({{ item.subs.length }})</span>
        </span>
        <span :class="{'primary--text': item.resubs.length > 0, 'grey--text text--darken-3': item.resubs.length === 0}">
          RESUBS<span v-if="item.resubs.length > 0">({{ item.resubs.length }})</span>
        </span>
        <span :class="{'primary--text': item.subgifts.length > 0, 'grey--text text--darken-3': item.subgifts.length === 0}">
          SUBGIFTS<span v-if="item.subgifts.length > 0">({{ item.subgifts.length }})</span>
        </span>
        <span :class="{'primary--text': item.subcommunitygifts.length > 0, 'grey--text text--darken-3': item.subcommunitygifts.length === 0}">
          SUBCOMMUNITYGIFTS<span v-if="item.subcommunitygifts.length > 0">({{ item.subcommunitygifts.length }})</span>
        </span>
        <span :class="{'primary--text': item.tips.length > 0, 'grey--text text--darken-3': item.tips.length === 0}">
          TIPS<span v-if="item.tips.length > 0">({{ item.tips.length }})</span>
        </span>
        <span :class="{'primary--text': item.cmdredeems.length > 0, 'grey--text text--darken-3': item.cmdredeems.length === 0}">
          CMDREDEEMS<span v-if="item.cmdredeems.length > 0">({{ item.cmdredeems.length }})</span>
        </span>
        <span :class="{'primary--text': item.rewardredeems.length > 0, 'grey--text text--darken-3': item.rewardredeems.length === 0}">
          RWDREDEEMS<span v-if="item.rewardredeems.length > 0">({{ item.rewardredeems.length }})</span>
        </span>
      </template>

      <template #[`item.actions`]="{ item }">
        <v-hover v-slot="{ hover }">
          <v-btn
            icon
            :color="hover ? 'primary' : 'secondary lighten-3'"
            @click.stop="edit(item)"
          >
            <v-icon>{{ mdiPencil }}</v-icon>
          </v-btn>
        </v-hover>
        <v-hover v-slot="{ hover }">
          <v-btn
            icon
            :color="hover ? 'primary' : 'secondary lighten-3'"
            @click.stop="clone(item)"
          >
            <v-icon>{{ mdiContentCopy }}</v-icon>
          </v-btn>
        </v-hover>
        <v-hover v-slot="{ hover }">
          <v-btn
            icon
            :color="hover ? 'primary' : 'secondary lighten-3'"
            @click.stop="link(item)"
          >
            <v-icon>{{ mdiLink }}</v-icon>
          </v-btn>
        </v-hover>
      </template>
    </v-data-table>
  </v-container>
</template>

<script lang="ts">
import {
  mdiCheckBoxMultipleOutline, mdiContentCopy, mdiLink, mdiMagnify, mdiPencil,
} from '@mdi/js';
import { ButtonStates } from '@sogebot/ui-helpers/buttonStates';
import translate from '@sogebot/ui-helpers/translate';
import {
  computed,
  defineAsyncComponent, defineComponent, onMounted, ref, watch,
} from '@vue/composition-api';

import type { AlertInterface } from '.bot/src/bot/database/entity/alert';
import { addToSelectedItem } from '~/functions/addToSelectedItem';
import api from '~/functions/api';
import { EventBus } from '~/functions/event-bus';
import { required } from '~/functions/validators';

export default defineComponent({
  components: { 'new-item': defineAsyncComponent({ loader: () => import('~/components/new-item/textoverlay-newItem.vue') }) },
  setup (_, ctx) {
    const rules = { name: [required] };

    const items = ref([] as AlertInterface[]);
    const editItem = ref(null as null | AlertInterface);
    const search = ref('');

    const selected = ref([] as AlertInterface[]);
    const currentItems = ref([] as AlertInterface[]);
    const saveCurrentItems = (value: AlertInterface[]) => {
      currentItems.value = value;
    };
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
      { value: 'name', text: translate('registry.alerts.name.name') },
      { value: 'additional', text: translate('registry.customvariables.additional-info') },
      { value: 'actions', text: '' },
    ];

    const headersDelete = [
      { value: 'name', text: '' },
    ];

    onMounted(() => {
      refresh();
    });

    const refresh = () => {
      api.get<AlertInterface[]>(ctx.root.$axios, '/api/v1/alerts/')
        .then((response) => {
          items.value = response.data.data;
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

    const saveSuccess = () => {
      refresh();
      EventBus.$emit('snack', 'success', 'Data updated.');
      editItem.value = null;
      newDialog.value = false;
    };

    const deleteSelected = () => {
      deleteDialog.value = false;
      /* await Promise.all(
        selected.value.map((item) => {
          return new Promise((resolve, reject) => {
            getSocket('/registries/text').emit('text::remove', item, (err: string | null) => {
              if (err) {
                reject(error(err));
              }
              resolve(true);
            });
          });
        }),
      ); */
      refresh();

      EventBus.$emit('snack', 'success', 'Data removed.');
      selected.value = [];
    };

    const clone = (item: AlertInterface) => {
      return item;
    };

    const link = (item: AlertInterface) => {
      navigator.clipboard.writeText(`${location.origin}/overlays/alerts/${item.id}`);
      EventBus.$emit('snack', 'success', 'Link copied to clipboard.');
    };

    const edit = (item: AlertInterface) => {
      editItem.value = item;
    };

    return {
      addToSelectedItem: addToSelectedItem(selected, 'id', currentItems),
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
      mdiPencil,
      mdiLink,
      ButtonStates,
      clone,
      link,
      saveCurrentItems,
    };
  },
});
</script>
