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
          CUSTOM<span v-if="item.cmdredeems.length > 0">({{ item.cmdredeems.length }})</span>
        </span>
        <span :class="{'primary--text': item.rewardredeems.length > 0, 'grey--text text--darken-3': item.rewardredeems.length === 0}">
          RWDREDEEMS<span v-if="item.rewardredeems.length > 0">({{ item.rewardredeems.length }})</span>
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
import type { AlertInterface } from '@entity/alert';
import translate from '@sogebot/ui-helpers/translate';

import { addToSelectedItem } from '~/functions/addToSelectedItem';
import { EventBus } from '~/functions/event-bus';
import CLONE from '~/queries/alert/clone.gql';
import GET_ALL from '~/queries/alert/getAll.gql';
import REMOVE from '~/queries/alert/remove.gql';

const { $graphql } = useNuxtApp();

const loading = ref(true);
const cloning = ref([] as string[]);
const items = ref([] as AlertInterface[]);
const refetch = async () => {
  const data = await $graphql.default.request(GET_ALL);
  items.value = data.alerts;
  loading.value = false;
};

const search = ref('');

const selected = ref([] as AlertInterface[]);
const currentItems = ref([] as AlertInterface[]);
const saveCurrentItems = (value: AlertInterface[]) => {
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

const deleteSelected = () => {
  deleteDialog.value = false;
  selected.value.forEach((item) => {
    $graphql.default.request(REMOVE, { id: item.id });
  });
  selected.value = [];
  EventBus.$emit('snack', 'success', 'Data removed.');
};

const clone = (id: string) => {
  cloning.value = [...cloning.value, id];
  $graphql.default.request(CLONE, { id }).then(() => {
    EventBus.$emit('snack', 'success', 'Data cloned.');
    refetch();
    cloning.value = cloning.value.filter(o => o !== id);
  });
};
</script>
