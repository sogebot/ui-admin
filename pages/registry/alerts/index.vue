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
      :loading="loading || cloning"
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

              <test-dialog />

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
          CMDREDEEMS<span v-if="item.cmdredeems.length > 0">({{ item.cmdredeems.length }})</span>
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

<script lang="ts">
import {
  defineAsyncComponent, defineComponent, onMounted, ref, watch,
} from '@nuxtjs/composition-api';
import { ButtonStates } from '@sogebot/ui-helpers/buttonStates';
import translate from '@sogebot/ui-helpers/translate';
import {
  useMutation, useQuery, useResult,
} from '@vue/apollo-composable';

import type { AlertInterface } from '.bot/src/database/entity/alert';
import { addToSelectedItem } from '~/functions/addToSelectedItem';
import { error } from '~/functions/error';
import { EventBus } from '~/functions/event-bus';
import { required } from '~/functions/validators';
import CLONE from '~/queries/alert/clone.gql';
import GET_ALL from '~/queries/alert/getAll.gql';
import REMOVE from '~/queries/alert/remove.gql';

export default defineComponent({
  components: {
    'test-dialog': defineAsyncComponent({
      loader: () => import('~/components/registry/alerts/test-dialog.vue'),
    }),
  },
  setup () {
    const { result, loading, refetch } = useQuery(GET_ALL);
    const items = useResult<{alerts: AlertInterface[] }, AlertInterface[], AlertInterface[]>(result, [], (data) => {
      if (selected.value.length > 0) {
        selected.value.forEach((selectedItem, index) => {
          selectedItem = data.alerts.find(o => o.id === selectedItem.id) || selectedItem;
          selected.value[index] = selectedItem;
        });
      }
      return data.alerts;
    });
    const { mutate: cloneMutation, onError: onErrorClone, onDone: onDoneClone, loading: cloning } = useMutation(CLONE, {
      refetchQueries: ['AlertGetAll'],
    });
    onDoneClone(() => EventBus.$emit('snack', 'success', 'Data cloned.'));
    onErrorClone(error);

    const { mutate: removeMutation, onError: onErroRemove, onDone: onDoneRemove } = useMutation(REMOVE, {
      refetchQueries: ['AlertGetAll'],
    });
    onDoneRemove(() => EventBus.$emit('snack', 'success', 'Data removed.'));
    onErroRemove(error);

    const rules = {
      name: [required],
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
      {
        value: 'name', text: translate('registry.alerts.name.name'),
      },
      {
        value: 'additional', text: translate('registry.customvariables.additional-info'),
      },
      {
        value: 'actions', text: '',
      },
    ];

    const headersDelete = [
      {
        value: 'name', text: '',
      },
    ];

    onMounted(() => {
      refetch();
    });

    const saveSuccess = () => {
      EventBus.$emit('snack', 'success', 'Data updated.');
    };

    const deleteSelected = () => {
      deleteDialog.value = false;
      selected.value.forEach(item => removeMutation({
        id: item.id,
      }));
      selected.value = [];
    };

    const clone = (id: string) => {
      cloneMutation({
        id,
      });
    };

    return {
      addToSelectedItem: addToSelectedItem(selected, 'id', currentItems),
      loading,
      cloning,
      items,
      search,
      headers,
      headersDelete,
      selected,
      deleteSelected,
      selectable,
      deleteDialog,
      translate,
      saveSuccess,
      rules,
      ButtonStates,
      clone,
      saveCurrentItems,
    };
  },
});
</script>
