<template>
  <v-container
    fluid
    :class="{ 'pa-4': !$vuetify.breakpoint.mobile }"
  >
    <v-data-table
      v-model="selected"
      calculate-widths
      :show-select="selectable"
      :search="search"
      :loading="loading"
      :headers="headers"
      :items-per-page="-1"
      :items="items"
      sort-by="name"
      @current-items="saveCurrentItems"
      @click:row="addToSelectedItem(selected, 'id', currentItems)"
    >
      <template #top>
        <v-sheet
          flat
          color="dark"
          class="my-2 pb-2 mt-0"
        >
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

              <registry-alerts-test-dialog />

              <v-btn color="primary" to="/registry/alerts/new" nuxt>
                New Item
              </v-btn>
            </v-col>
          </v-row>
        </v-sheet>
      </template>

      <template #[`item.additional`]="{ item }">
        <span :class="{'primary--text': computeLength(item, 'follow') > 0, 'grey--text text--darken-3': computeLength(item, 'follow') === 0}">
          FOLLOW<span v-if="computeLength(item, 'follow') > 0">({{ computeLength(item, 'follow') }})</span>
        </span>
        <span :class="{'primary--text': computeLength(item, 'raid') > 0, 'grey--text text--darken-3': computeLength(item, 'raid') === 0}">
          RAID<span v-if="computeLength(item, 'raid') > 0">({{ computeLength(item, 'raid') }})</span>
        </span>
        <span :class="{'primary--text': computeLength(item, 'cheer') > 0, 'grey--text text--darken-3': computeLength(item, 'cheer') === 0}">
          CHEERS<span v-if="computeLength(item, 'cheer') > 0">({{ computeLength(item, 'cheer') }})</span>
        </span>
        <span :class="{'primary--text': computeLength(item, 'sub') > 0, 'grey--text text--darken-3': computeLength(item, 'sub') === 0}">
          SUBS<span v-if="computeLength(item, 'sub') > 0">({{ computeLength(item, 'sub') }})</span>
        </span>
        <span :class="{'primary--text': computeLength(item, 'resub') > 0, 'grey--text text--darken-3': computeLength(item, 'resub') === 0}">
          RESUBS<span v-if="computeLength(item, 'resub') > 0">({{ computeLength(item, 'resub') }})</span>
        </span>
        <span :class="{'primary--text': computeLength(item, 'subgift') > 0, 'grey--text text--darken-3': computeLength(item, 'subgift') === 0}">
          SUBGIFTS<span v-if="computeLength(item, 'subgift') > 0">({{ computeLength(item, 'subgift') }})</span>
        </span>
        <span :class="{'primary--text': computeLength(item, 'subcommunitygift') > 0, 'grey--text text--darken-3': computeLength(item, 'subcommunitygift') === 0}">
          SUBCOMMUNITYGIFTS<span v-if="computeLength(item, 'subcommunitygift') > 0">({{ computeLength(item, 'subcommunitygift') }})</span>
        </span>
        <span :class="{'primary--text': computeLength(item, 'tip') > 0, 'grey--text text--darken-3': computeLength(item, 'tip') === 0}">
          TIPS<span v-if="computeLength(item, 'tip') > 0">({{ computeLength(item, 'tip') }})</span>
        </span>
        <span :class="{'primary--text': computeLength(item, 'custom') > 0, 'grey--text text--darken-3': computeLength(item, 'custom') === 0}">
          CUSTOM<span v-if="computeLength(item, 'custom') > 0">({{ computeLength(item, 'custom') }})</span>
        </span>
        <span :class="{'primary--text': computeLength(item, 'rewardredeem') > 0, 'grey--text text--darken-3': computeLength(item, 'rewardredeem') === 0}">
          RWDREDEEMS<span v-if="computeLength(item, 'rewardredeem') > 0">({{ computeLength(item, 'rewardredeem') }})</span>
        </span>
        <span :class="{'primary--text': computeLength(item, 'promo') > 0, 'grey--text text--darken-3': computeLength(item, 'promo') === 0}">
          PROMO<span v-if="computeLength(item, 'promo') > 0">({{ computeLength(item, 'promo') }})</span>
        </span>
      </template>

      <template #[`item.actions`]="{ item }">
        <v-hover v-slot="{ hover }">
          <v-btn icon :color="hover ? 'primary' : 'secondary lighten-3'" nuxt :to="'/registry/alerts/' + item.id" @click.stop>
            <v-icon>mdi-pencil</v-icon>
          </v-btn>
        </v-hover>
        <v-hover v-slot="{ hover }">
          <v-btn
            :loading="cloning.includes(item.id)"
            icon
            :color="hover ? 'primary' : 'secondary lighten-3'"
            @click.stop="clone(item.id)"
          >
            <v-icon>mdi-content-copy</v-icon>
          </v-btn>
        </v-hover>
        <v-hover v-slot="{ hover }">
          <v-btn
            icon
            :color="hover ? 'primary' : 'secondary lighten-3'"
            :href="`/overlays/alerts/${item.id}`"
          >
            <v-icon>mdi-link</v-icon>
          </v-btn>
        </v-hover>
      </template>
    </v-data-table>
  </v-container>
</template>

<script setup lang="ts">
import type { Alert } from '@entity/alert';
import translate from '@sogebot/ui-helpers/translate';
import axios from 'axios';
import { cloneDeep } from 'lodash';
import { v4 } from 'uuid';

import { addToSelectedItem } from '~/functions/addToSelectedItem';
import { EventBus } from '~/functions/event-bus';

const loading = ref(true);
const cloning = ref([] as string[]);
const items = ref([] as Alert[]);
const refetch = async () => {
  const res = await axios.get(`/api/registries/alerts`, { headers: { authorization: `Bearer ${localStorage.accessToken}` } });
  items.value = res.data;
  loading.value = false;
};

const computeLength = (item: Alert, type: Alert['items'][number]['type']) => {
  return item.items.filter(o => o.type === type).length;
};

const search = ref('');

const selected = ref([] as Alert[]);
const currentItems = ref([] as Alert[]);
const saveCurrentItems = (value: Alert[]) => {
  currentItems.value = value;
};
const deleteDialog = ref(false);
const selectable = ref(false);
watch(selectable, (val) => {
  if (!val) {
    selected.value = [];
  }
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
  refetch();
});

const deleteSelected = async () => {
  deleteDialog.value = false;
  for (const item of selected.value) {
    try {
      await axios.delete(`/api/registries/alerts/${item.id}`, { headers: { authorization: `Bearer ${localStorage.accessToken}` } });
    } catch {}
  }
  selected.value = [];
  refetch();
  EventBus.$emit('snack', 'success', 'Data removed.');
};

const clone = async (id: string) => {
  const c = cloneDeep(items.value.find(o => o.id === id));
  console.log('Cloning', id, c);
  if (c) {
    c.id = v4();
    c.name = c.name + ' (clone)';
    await axios.post(`/api/registries/alerts`,
      c,
      { headers: { authorization: `Bearer ${localStorage.accessToken}` } });
    refetch();
  }
};
</script>
