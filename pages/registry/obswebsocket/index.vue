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
      @click:row="addToSelectedItem(selected, 'id', currentItems)"
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
              <v-icon>mdi-pencil</v-icon>
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

<script setup lang="ts">
import type { OBSWebsocketInterface } from '@entity/obswebsocket';
import { getSocket } from '@sogebot/ui-helpers/socket.js';
import translate from '@sogebot/ui-helpers/translate';

import { addToSelectedItem } from '~/functions/addToSelectedItem';
import { error } from '~/functions/error';
import { EventBus } from '~/functions/event-bus';

const loading = ref(true);
const items = ref([] as OBSWebsocketInterface[]);
const refetch = () => {
  getSocket('/').emit('integration::obswebsocket::generic::getAll', (err, data) => {
    if (err) {
      error(err);
    } else {
      // we also need to reset selection values
      if (selected.value.length > 0) {
        selected.value.forEach((selectedItem, index) => {
          selectedItem = data.find(o => o.id === selectedItem.id) || selectedItem;
          selected.value[index] = selectedItem;
        });
      }
      items.value = data;
    }
    loading.value = false;
  });
};

onMounted(() => {
  refetch();
});

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

const deleteSelected = async () => {
  deleteDialog.value = false;
  await Promise.all(selected.value.map((item) => {
    return new Promise<void>((resolve) => {
      getSocket('/').emit('integration::obswebsocket::generic::deleteById', item.id, (err) => {
        if (err) {
          error(err);
        }
        resolve();
      });
    });
  }));
  selected.value = [];
  EventBus.$emit('snack', 'success', 'Data removed.');
  refetch();
};
</script>
