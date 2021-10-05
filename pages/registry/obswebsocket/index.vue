<template>
  <v-container fluid :class="{ 'pa-4': !$vuetify.breakpoint.mobile }">
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
      @click:row="addToSelectedItem"
    >
      <template #top>
        <v-sheet flat color="dark" class="my-2 pb-2 mt-0">
          <v-row class="px-2" no-gutters>
            <v-col cols="auto" align-self="center" class="pr-2">
              <v-btn icon :color="selectable ? 'primary' : 'secondary'" @click="selectable = !selectable">
                <v-icon>
                  {{ mdiCheckboxMultipleMarkedOutline }}
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
                          {{ item.goals.map(o => o.name). join(', ') }}
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

              <v-btn color="primary" to="/registry/obswebsocket/new" nuxt>
                New Item
              </v-btn>
            </v-col>
          </v-row>
        </v-sheet>
      </template>

      <template #[`item.command`]="{ item }">
        <code>{{ command }} {{ item.id }}</code>
      </template>

      <template #[`item.actions`]="{ item }">
        <div style="width: max-content;">
          <v-hover v-slot="{ hover }">
            <v-btn icon :color="hover ? 'primary' : 'secondary lighten-3'" :to="'/registry/obswebsocket/' + item.id">
              <v-icon>{{ mdiPencil }}</v-icon>
            </v-btn>
          </v-hover>
          <v-hover v-slot="{ hover }">
            <v-btn
              icon
              :color="hover ? 'primary' : 'secondary lighten-3'"
              :disabled="copied===item.id"
              @click.stop="copied=item.id"
            >
              <v-icon v-if="copied !== item.id">
                {{ mdiClipboard }}
              </v-icon>
              <v-icon v-else>
                {{ mdiClipboardCheck }}
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
  mdiCheckboxMultipleMarkedOutline, mdiClipboard, mdiClipboardCheck, mdiMagnify, mdiPencil,
} from '@mdi/js';
import {
  defineComponent, onMounted, ref, watch,
} from '@nuxtjs/composition-api';
import { ButtonStates } from '@sogebot/ui-helpers/buttonStates';
import translate from '@sogebot/ui-helpers/translate';
import { useMutation, useQuery } from '@vue/apollo-composable';

import type { OBSWebsocketInterface } from '.bot/src/database/entity/obswebsocket';
import { addToSelectedItem } from '~/functions/addToSelectedItem';
import { error } from '~/functions/error';
import { EventBus } from '~/functions/event-bus';
import GET_ALL from '~/queries/obsWebsocket/getAll.gql';
import REMOVE from '~/queries/obsWebsocket/remove.gql';

export default defineComponent({
  setup () {
    const { result, loading, onError, refetch } = useQuery(GET_ALL);
    onError(error);
    watch(result, (value) => {
      items.value = value.OBSWebsocket;

      // we also need to reset selection values
      if (selected.value.length > 0) {
        selected.value.forEach((selectedItem, index) => {
          selectedItem = items.value.find(o => o.id === selectedItem.id) || selectedItem;
          selected.value[index] = selectedItem;
        });
      }
    });

    const { mutate: removeMutation, onError: onErrorRemove } = useMutation(REMOVE);
    onErrorRemove(error);

    const items = ref([] as OBSWebsocketInterface[]);
    const search = ref('');

    const command = ref('!obsws run');
    const selected = ref([] as OBSWebsocketInterface[]);
    const currentItems = ref([] as OBSWebsocketInterface[]);
    const deleteDialog = ref(false);
    const copied = ref('');
    const selectable = ref(false);
    const saveCurrentItems = (value: OBSWebsocketInterface[]) => {
      currentItems.value = value;
    };
    watch(selectable, (val) => {
      if (!val) {
        selected.value = [];
      }
    });

    watch(copied, (val) => {
      if (val.length > 0) {
        EventBus.$emit('snack', 'success', 'Command copied to clipboard.');
        navigator.clipboard.writeText(`${command.value} ${val}`);
        setTimeout(() => {
          copied.value = '';
        }, 1000);
      }
    });

    const headers = [
      { value: 'name', text: translate('timers.dialog.name') },
      { value: 'command', text: translate('integrations.obswebsocket.command') },
      {
        value: 'actions', text: '', sortable: false,
      },
    ];

    const headersDelete = [
      { value: 'name', text: 'Name' },
    ];

    onMounted(() => {
      EventBus.$on('integrations::obswebsocket::refresh', refetch);
    });

    const deleteSelected = () => {
      deleteDialog.value = false;
      selected.value.forEach((item) => {
        removeMutation({ id: item.id }, {
          refetchQueries: [
            'OBSWebsocketGetAll',
          ],
        });
      });

      EventBus.$emit('snack', 'success', 'Data removed.');
      selected.value = [];
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
      currentItems,
      copied,
      command,

      // functions
      addToSelectedItem: addToSelectedItem(selected, 'id', currentItems),
      saveCurrentItems,

      // icons
      mdiMagnify,
      mdiCheckboxMultipleMarkedOutline,
      mdiPencil,
      mdiClipboard,
      mdiClipboardCheck,

      // others
      ButtonStates,
    };
  },
});
</script>
