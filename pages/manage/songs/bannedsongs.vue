<template>
  <v-container fluid :class="{ 'pa-4': !$vuetify.breakpoint.mobile }">
    <v-alert
      v-if="!$store.state.$systems.find(o => o.name === 'songs').enabled"
      color="error"
      class="mb-0"
    >
      {{ translate('this-system-is-disabled') }}
    </v-alert>

    <v-data-table
      v-model="selected"
      calculate-widths
      hide-default-header
      :show-select="selectable"
      :loading="state.loading !== ButtonStates.success"
      :headers="headers"
      :items-per-page="-1"
      @current-items="saveCurrentItems"
      item-key="videoId"
      :items="fItems"
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
                  {{ mdiCheckboxMultipleMarkedOutline }}
                </v-icon>
              </v-btn>
            </v-col>
            <v-col align-self="center">
              <v-text-field
                v-model="search"
                :append-icon="mdiMagnify"
                label="Search or add by link/id"
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

              <v-btn
                color="primary"
                :disabled="search.length === 0"
                :loading="state.import === 1"
                @click="addSong"
              >
                New Item
              </v-btn>
            </v-col>
          </v-row>
        </v-sheet>
      </template>

      <template #[`item.thumbnail`]="{ item }">
        <v-img
          :aspect-ratio="16/9"
          :width="100"
          :src="generateThumbnail(item.videoId)"
        />
      </template>
      <template #[`item.actions`]="{ item }">
        <v-hover v-slot="{ hover }">
          <v-btn
            icon
            :color="hover ? 'primary' : 'secondary lighten-3'"
            :href="'http://youtu.be/' + item.videoId"
            target="_blank"
          >
            <v-icon>
              {{ mdiLink }}
            </v-icon>
          </v-btn>
        </v-hover>
      </template>
    </v-data-table>
  </v-container>
</template>

<script lang="ts">
import {
  mdiCheckboxMultipleMarkedOutline, mdiLink, mdiMagnify,
} from '@mdi/js';
import {
  computed, defineComponent, onMounted, ref, watch,
} from '@nuxtjs/composition-api';
import { ButtonStates } from '@sogebot/ui-helpers/buttonStates';
import { getSocket } from '@sogebot/ui-helpers/socket';
import translate from '@sogebot/ui-helpers/translate';
import { escapeRegExp, isNil } from 'lodash';

import type { SongBanInterface } from '.bot/src/database/entity/song';
import { addToSelectedItem } from '~/functions/addToSelectedItem';
import { error } from '~/functions/error';
import { EventBus } from '~/functions/event-bus';

export default defineComponent({
  setup () {
    const items = ref([] as SongBanInterface[]);
    const search = ref('');

    const deleteDialog = ref(false);
    const selected = ref([] as SongBanInterface[]);
    const currentItems = ref([] as SongBanInterface[]);
    const saveCurrentItems = (value: SongBanInterface[]) => {
      currentItems.value = value;
    };
    const selectable = ref(false);
    watch(selectable, (val) => {
      if (!val) {
        selected.value = [];
      }
    });

    const state = ref({
      loading: ButtonStates.progress,
      import:  ButtonStates.idle,
    } as {
      loading: number;
      import: number;
    });

    const headers = [
      {
        value: 'thumbnail', text: '', align: 'left',
      },
      { value: 'videoId', text: '' },
      { value: 'title', text: '' },
      {
        text: 'Actions', value: 'actions', sortable: false, align: 'end',
      },
    ];

    const headersDelete = [
      { value: 'videoId', text: '' },
      { value: 'title', text: '' },
    ];

    const fItems = computed(() => {
      if (search.value.length === 0) {
        return items.value;
      }
      return items.value.filter((o) => {
        const isSearchInTitle = !isNil(o.title.match(new RegExp(escapeRegExp(search.value), 'ig')));
        const isSearchInVideoId = !isNil(o.videoId.match(new RegExp(escapeRegExp(search.value), 'ig')));
        return isSearchInTitle || isSearchInVideoId;
      });
    });

    onMounted(() => {
      refresh();
    });

    const refresh = () => {
      getSocket('/systems/songs').emit('songs::getAllBanned', {}, (err: string | null, getAllBanned: SongBanInterface[]) => {
        if (err) {
          error(err);
          return;
        }
        items.value = getAllBanned;
        state.value.loading = ButtonStates.success;
      });
    };

    const generateThumbnail = (videoId: string) => {
      return `https://img.youtube.com/vi/${videoId}/1.jpg`;
    };

    const addSong = () => {
      if (search.value === '') {
        EventBus.$emit('snack', 'red', 'Cannot add empty song to ban list.');
        return;
      }
      if (state.value.import === 0) {
        state.value.import = 1;
        getSocket('/systems/songs').emit('import.ban', search.value, (err: string | null) => {
          if (err) {
            search.value = '';
            state.value.import = 0;
            return error(err);
          }
          state.value.import = 0;
          EventBus.$emit('snack', 'success', 'Song added to ban list.');
          refresh();
          search.value = '';
        });
      }
    };

    const deleteSelected = async () => {
      deleteDialog.value = false;
      await Promise.all(
        selected.value.map((item) => {
          return new Promise((resolve, reject) => {
            getSocket('/systems/songs').emit('delete.ban', item.videoId, (err: string | null) => {
              if (err) {
                reject(error(err));
              }
              resolve(true);
            });
          });
        }),
      );
      refresh();

      EventBus.$emit('snack', 'success', 'Data removed.');
      selected.value = [];
    };

    return {
      addToSelectedItem: addToSelectedItem(selected, 'videoId', currentItems),
      items,
      fItems,
      headers,
      headersDelete,
      state,
      search,
      selectable,
      saveCurrentItems,

      generateThumbnail,
      addSong,

      translate,
      ButtonStates,

      deleteDialog,
      deleteSelected,
      selected,
      mdiLink,
      mdiMagnify,
      mdiCheckboxMultipleMarkedOutline,
    };
  },
});
</script>
