<template>
  <v-container fluid :class="{ 'pa-4': !$vuetify.breakpoint.mobile }">
    <alert-disabled system="ranks" />

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
                        <template #[`item.type`]="{item}">
                          {{ getGroup[item.type].name }} time
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
      show-select
      calculate-widths
      group-by="type"
      :search="search"
      :loading="state.loading"
      :headers="headers"
      :items-per-page="-1"
      :items="items"
      @current-items="saveCurrentItems"
    >
      <template #top>
        <table-search-bar :search.sync="search">
          <ranks-edit
            :rules="rules"
            :types="getGroup"
            @save="refresh()"
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
          group-key="type"
          no-filter
          no-permission
          :items="items"
        >
          <template #headerText="{ group }">
            {{ getGroup[group].name }} time
          </template>
        </table-group-header>
      </template>

      <template #[`item`]="{ item }">
        <table-mobile :headers="headers" :selected="selected" :item="item" :add-to-selected-item="addToSelectedItem">
          <template #actions>
            <ranks-edit
              :rules="rules"
              :value="item"
              :types="getGroup"
              @save="refresh()"
            />
            <v-btn class="danger-hover" icon @click="selected = [item]; deleteDialog = true;">
              <v-icon>
                mdi-delete-forever
              </v-icon>
            </v-btn>
          </template>

          <template #value>
            {{ item.value }} {{ $t(item.type === 'viewer' ? 'hours' : 'months') }}
          </template>
        </table-mobile>
      </template>
    </v-data-table>
  </v-container>
</template>

<script lang="ts">
import type { Rank } from '@entity/rank';
import {
  defineAsyncComponent, defineComponent, onMounted, ref, watch,
} from '@nuxtjs/composition-api';
import { ButtonStates } from '@sogebot/ui-helpers/buttonStates';
import translate from '@sogebot/ui-helpers/translate';
import axios from 'axios';
import { capitalize } from 'lodash';

import { addToSelectedItem } from '~/functions/addToSelectedItem';
import { error } from '~/functions/error';
import { EventBus } from '~/functions/event-bus';
import { minValue, required } from '~/functions/validators';

export default defineComponent({
  components: {
    'ranks-edit':         defineAsyncComponent(() => import('~/components/manage/ranks/ranksEdit.vue')),
    'table-group-header': defineAsyncComponent(() => import('~/components/table/groupHeader.vue')),
    'table-search-bar':   defineAsyncComponent(() => import('~/components/table/searchBar.vue')),
    'table-mobile':       defineAsyncComponent(() => import('~/components/table/tableMobile.vue')),
  },
  setup () {
    const rules = { value: [required, minValue(0)], rank: [required] };

    const items = ref([] as Rank[]);
    const search = ref('');

    const selected = ref([] as Rank[]);
    const currentItems = ref([] as Rank[]);
    const saveCurrentItems = (value: Rank[]) => {
      currentItems.value = value;
    };
    const selectable = ref(false);
    watch(selectable, (val) => {
      if (!val) {
        selected.value = [];
      }
    });
    const deleteDialog = ref(false);

    const state = ref({ loading: true } as {
      loading: boolean;
    });

    const headers = [
      { value: 'value', text: capitalize(translate('responses.variable.value')) },
      { value: 'rank', text: translate('rank') },
    ];

    const headersDelete = [
      { value: 'rank', text: '' },
      { value: 'type', text: '' },
    ];

    onMounted(() => {
      refresh();
    });

    const refresh = () => {
      state.value.loading = true;
      axios.get(`/api/systems/ranks`, { headers: { authorization: `Bearer ${localStorage.accessToken}` } })
        .then(({ data }) => {
          items.value = [...data.data, ...JSON.parse(sessionStorage.getItem('ranks-pending') ?? '[]')];
          console.debug('Loaded', items.value);

          // we also need to reset selection values
          if (selected.value.length > 0) {
            selected.value.forEach((selectedItem, index) => {
              selectedItem = items.value.find(o => o.id === selectedItem.id) || selectedItem;
              selected.value[index] = selectedItem;
            });
          }
          state.value.loading = false;
        });
    };

    const deleteSelected = async () => {
      deleteDialog.value = false;
      await Promise.all(
        selected.value.map((item) => {
          return new Promise((resolve, reject) => {
            if (!item.id) {
              reject(error('Missing item id'));
              return;
            }
            axios.delete(`/api/systems/ranks/${item.id}`, { headers: { authorization: `Bearer ${localStorage.accessToken}` } })
              .finally(() => {
                resolve(true);
              });
          });
        }),
      );
      refresh();

      EventBus.$emit('snack', 'success', 'Data removed.');
      selected.value = [];
    };

    const isGroupSelected = (group: string) => {
      for (const item of items.value.filter(o => o.type === group)) {
        if (!selected.value.find(o => o.id === item.id)) {
          return false;
        }
      }
      return true;
    };
    const toggleGroupSelection = (group: string) => {
      if (isGroupSelected(group)) {
        // deselect all
        selected.value = selected.value.filter(o => o.type !== group);
      } else {
        for (const item of items.value.filter(o => o.type === group)) {
          if (!selected.value.find(o => o.id === item.id)) {
            selected.value.push(item);
          }
        }
      }
    };

    const getGroup: Record<string, any> = {};
    for (const group of ['viewer', 'subscriber']) {
      let name = 'Watch';
      if (group === 'subscriber') {
        name = 'Sub';
      }

      getGroup[group] = {
        name,
        options: { filter: null, permission: null },
      };
    }

    return {
      addToSelectedItem: addToSelectedItem(selected, 'id', currentItems),
      items,
      search,
      state,
      headers,
      headersDelete,
      selected,
      selectable,
      deleteSelected,
      deleteDialog,
      translate,
      rules,
      ButtonStates,
      saveCurrentItems,
      isGroupSelected,
      toggleGroupSelection,
      getGroup,
      refresh,
    };
  },
});
</script>
