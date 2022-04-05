<template>
  <v-container fluid :class="{ 'pa-4': !$vuetify.breakpoint.mobile }">
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
                      Delete
                    </v-btn>
                  </template>

                  <v-card>
                    <v-card-title>
                      <span class="headline">Delete {{ selected.length }} Item(s)?</span>
                    </v-card-title>

                    <v-card-text>
                      <v-data-table dense :items="selected" :headers="headersDelete" :items-per-page="-1"
                        hide-default-header hide-default-footer />
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

    <alert-disabled system="songs" />

    <v-data-table v-model="selected" calculate-widths hide-default-header show-select
      :loading="state.loading !== ButtonStates.success" :headers="headers" :items-per-page="-1" item-key="videoId"
      :items="fItems" @current-items="saveCurrentItems">
      <template #top>
        <table-search-bar :search.sync="search" label="Search or add by link/id">
          <v-btn color="primary" :disabled="search.length === 0" :loading="state.import === 1" @click="addSong">
            New Item
          </v-btn>
        </table-search-bar>
      </template>

      <template #[`item`]="{ item }">
        <table-mobile :headers="headers" :selected="selected" :item="item" :addToSelectedItem="addToSelectedItem" item-key="videoId">
          <template #actions>
            <v-btn class="primary-hover" :href="'http://youtu.be/' + item.videoId" target="_blank" icon>
              <v-icon>
                mdi-link
              </v-icon>
            </v-btn>
            <v-btn class="danger-hover" icon @click="selected = [item]; deleteDialog = true;">
              <v-icon>
                mdi-delete-forever
              </v-icon>
            </v-btn>
          </template>

          <template #thumbnail>
            <v-img :aspect-ratio="16/9" :width="100" :src="generateThumbnail(item.videoId)" />
          </template>
        </table-mobile>
      </template>
    </v-data-table>
  </v-container>
</template>

<script lang="ts">
import {
  computed, defineAsyncComponent, defineComponent, onMounted, ref, watch,
} from '@nuxtjs/composition-api';
import { ButtonStates } from '@sogebot/ui-helpers/buttonStates';
import { getSocket } from '@sogebot/ui-helpers/socket';
import { escapeRegExp, isNil } from 'lodash';

import type { SongBanInterface } from '@entity/song';
import { addToSelectedItem } from '~/functions/addToSelectedItem';
import { error } from '~/functions/error';
import { EventBus } from '~/functions/event-bus';

export default defineComponent({
  components: {
    'table-search-bar': defineAsyncComponent(() => import('~/components/table/searchBar.vue')),
  },
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
        value: 'thumbnail', text: 'Thumbnail', align: 'left',
      },
      {
        value: 'videoId', text: 'Video ID',
      },
      {
        value: 'title', text: 'Title',
      },
    ];

    const headersDelete = [
      {
        value: 'videoId', text: '',
      },
      {
        value: 'title', text: '',
      },
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
      getSocket('/systems/songs').emit('songs::getAllBanned', {
      }, (err, getAllBanned: SongBanInterface[]) => {
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
        getSocket('/systems/songs').emit('import.ban', search.value, (err) => {
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
            getSocket('/systems/songs').emit('delete.ban', item.videoId, (err) => {
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

      ButtonStates,

      deleteDialog,
      deleteSelected,
      selected,
    };
  },
});
</script>
