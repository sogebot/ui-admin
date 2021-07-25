<template>
  <v-container
    fluid
    :class="{ 'pa-4': !$vuetify.breakpoint.mobile }"
  >
    <v-data-table
      v-model="selected"
      :show-select="selectable"
      :loading="state.loading !== ButtonStates.success || state.saving"
      :headers="headers"
      :items-per-page="-1"
      hide-default-footer
      hide-default-header
      :items="items"
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
                  {{ mdiCheckBoxMultipleOutline }}
                </v-icon>
              </v-btn>
            </v-col>
            <v-col cols="auto" align-self="center" class="ml-auto mt-2">
              <v-row no-gutters>
                <v-col>
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
                            :headers="headers"
                            :items-per-page="-1"
                            hide-default-footer
                            hide-default-header
                            :items="selected"
                          >
                            <template #[`item.arrow`]="{ }">
                              <v-icon>{{ mdiChevronRight }}</v-icon>
                            </template>
                            <template #[`item.overlay`]="{ item }">
                              {{ item.value }}
                            </template>
                          </v-data-table>
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
                </v-col>
                <v-col align-self="end">
                  <v-btn
                    color="primary"
                    @click="addItem()"
                  >
                    Add item
                  </v-btn>
                </v-col>
              </v-row>
            </v-col>
          </v-row>
        </v-sheet>
      </template>

      <template #[`item.id`]="{ item }">
        <code>{{ item.id }}</code>
      </template>

      <template #[`item.overlay`]="{ item }">
        {{ item.value }}
      </template>

      <template #[`item.arrow`]="{ }">
        <v-icon>{{ mdiChevronRight }}</v-icon>
      </template>

      <template #[`item.actions`]="{ item }">
        <div style="width: max-content;">
          <v-hover v-slot="{ hover }">
            <v-btn
              icon
              :color="hover ? 'primary' : 'secondary lighten-3'"
              nuxt
              :to="`/registry/overlays/${item.id}`"
            >
              <v-icon>
                {{ mdiPencil }}
              </v-icon>
            </v-btn>
          </v-hover>
          <v-hover v-slot="{ hover }">
            <v-btn
              icon
              :color="hover ? 'primary' : 'secondary lighten-3'"
              :href="'/overlays/' + item.id"
            >
              <v-icon>{{ mdiLink }}</v-icon>
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
  mdiCheckBoxMultipleOutline, mdiChevronRight, mdiClipboard, mdiClipboardCheck, mdiLink, mdiPencil,
} from '@mdi/js';
import {
  defineComponent, onMounted, ref, useContext, useRouter, watch,
} from '@nuxtjs/composition-api';
import { ButtonStates } from '@sogebot/ui-helpers/buttonStates';
import translate from '@sogebot/ui-helpers/translate';
import { cloneDeep } from 'lodash';
import { v4 } from 'uuid';

import type { OverlayMappers } from '.bot/src/database/entity/overlay';
import { addToSelectedItem } from '~/functions/addToSelectedItem';
import api from '~/functions/api';
import { EventBus } from '~/functions/event-bus';

export default defineComponent({
  setup () {
    const { $axios } = useContext();
    const router = useRouter();
    const items = ref([] as OverlayMappers[]);
    const cacheItems = ref([] as OverlayMappers[]);

    const selected = ref([] as OverlayMappers[]);
    const copied = ref('');
    const currentItems = ref([] as OverlayMappers[]);
    const saveCurrentItems = (value: OverlayMappers[]) => {
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
        navigator.clipboard.writeText(`${document.location.protocol}//${document.location.host}/overlays/${val}`);
        setTimeout(() => {
          copied.value = '';
        }, 1000);
      }
    });

    const state = ref({ saving: false, loading: ButtonStates.progress } as {
      loading: number;
      saving: boolean;
    });

    const headers = [
      {
        value: 'id', text: '', sortable: false,
      },
      {
        value: 'arrow', text: '', sortable: false,
      },
      {
        value: 'overlay', text: '', sortable: false,
      },
      {
        value: 'actions', text: '', sortable: false,
      },
    ];

    onMounted(() => {
      refresh();
    });

    const refresh = () => {
      api.get<OverlayMappers[]>($axios, `/api/v1/overlay/`)
        .then((response) => {
          items.value = cloneDeep(response.data.data);
          cacheItems.value = cloneDeep(response.data.data);
        })
        .then(() => (state.value.loading = ButtonStates.success));
    };

    const deleteSelected = () => {
      deleteDialog.value = false;
      selected.value.forEach((item) => {
        api.delete($axios, `/api/v1/overlay/${item.id}`).catch(() => {
          return true;
        });
      });
      refresh();

      EventBus.$emit('snack', 'success', 'Data removed.');
      selected.value = [];
    };

    const addItem = () => {
      router.push(`/registry/overlays/${v4()}`);
    };

    return {
      // refs
      items,
      state,
      headers,
      selected,
      deleteSelected,
      selectable,
      deleteDialog,
      translate,
      ButtonStates,
      copied,

      // functions
      addToSelectedItem: addToSelectedItem(selected, 'id', currentItems),
      addItem,

      // icons
      mdiCheckBoxMultipleOutline,
      mdiChevronRight,
      mdiLink,
      mdiClipboard,
      mdiClipboardCheck,
      mdiPencil,

      // external functions
      saveCurrentItems,
    };
  },
});
</script>
