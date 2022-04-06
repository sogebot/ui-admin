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

    <v-data-table
      v-model="selected"
      calculate-widths
      show-select
      :loading="state.loading !== ButtonStates.success"
      :headers="headers"
      :items-per-page.sync="perPage"
      :items="fItems"
      item-key="videoId"
      :page.sync="currentPage"
      :server-items-length.sync="count"
      hide-default-header
      @current-items="saveCurrentItems"
    >
      <template #top>
        <table-search-bar :search.sync="search" label="Search or add by link/id">
          <v-btn
            color="primary"
            :disabled="search.length === 0"
            :loading="state.import === 1"
            @click="addSongOrPlaylist"
          >
            New Item
          </v-btn>
        </table-search-bar>
      </template>

      <template #[`body.prepend`]="{}">
        <tr>
          <td v-if="!$vuetify.breakpoint.mobile" colspan="5" />
          <td :class="{'v-data-table__mobile-row': $vuetify.breakpoint.mobile}">
            <v-select v-model="showTag" :items="tagsItems" clearable />
          </td>
          <td v-if="!$vuetify.breakpoint.mobile" colspan="1" />
        </tr>
      </template>

      <template #[`item`]="{ item }">
        <table-mobile :headers="headers" :selected="selected" :item="item" :add-to-selected-item="addToSelectedItem" item-key="videoId">
          <template #actions>
            <playlist-edit :rules="rules" :value="item" :tags-items="tagsItems" @save="refresh()" />
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

          <template #data>
            <v-icon>mdi-clock-outside</v-icon> {{ item.length | formatTime }}
            <v-icon>mdi-volume-high</v-icon> {{ Number(item.volume).toFixed(1) }}%
            <v-icon>mdi-skip-previous</v-icon> {{ item.startTime | formatTime }} - {{ item.endTime | formatTime }}
            <v-icon>mdi-skip-next</v-icon>
            <v-icon>mdi-music</v-icon> {{ dayjs(item.lastPlayedAt).format('LL') }}
            {{ dayjs(item.lastPlayedAt).format('LTS') }}
          </template>

          <template #tags>
            <v-chip-group class="d-inline-block">
              <v-chip
                v-for="tag of item.tags"
                :key="tag"
                :color="showTag === tag ? 'primary' : 'secondary'"
                label
                class="mr-2"
                @click="showTag=tag"
              >
                {{ tag }}
              </v-chip>
            </v-chip-group>
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
import type { SongPlaylistInterface } from '@entity/song';
import {
  computed, defineAsyncComponent, defineComponent, onMounted, ref, watch,
} from '@nuxtjs/composition-api';
import { ButtonStates } from '@sogebot/ui-helpers/buttonStates';
import { dayjs } from '@sogebot/ui-helpers/dayjsHelper';
import { getSocket } from '@sogebot/ui-helpers/socket';
import translate from '@sogebot/ui-helpers/translate';

import { addToSelectedItem } from '~/functions/addToSelectedItem';
import { error } from '~/functions/error';
import { EventBus } from '~/functions/event-bus';
import {
  maxValue, minValue, required,
} from '~/functions/validators';

export default defineComponent({
  components: {
    'table-search-bar':    defineAsyncComponent(() => import('~/components/table/searchBar.vue')),
    'playlist-edit': defineAsyncComponent(() => import('~/components/manage/songs/playlistEdit.vue')),
  },
  filters: {
    formatTime (seconds: number) {
      const h = Math.floor(seconds / 3600);
      const m = Math.floor((seconds % 3600) / 60);
      const s = seconds % 60;
      return [
        h,
        m > 9 ? m : (h ? '0' + m : m || '0'),
        s > 9 ? s : '0' + s,
      ].filter(a => a).join(':');
    },
  },
  setup () {
    const items = ref([] as SongPlaylistInterface[]);
    const search = ref('');

    const deleteDialog = ref(false);
    const selected = ref([] as SongPlaylistInterface[]);
    const currentItems = ref([] as SongPlaylistInterface[]);
    const saveCurrentItems = (value: SongPlaylistInterface[]) => {
      currentItems.value = value;
    };

    const state = ref({
      loading: ButtonStates.progress,
      import:  ButtonStates.idle,
      save:    ButtonStates.idle,
    } as {
      loading: number;
      import: number;
      save: number;
    });
    const showTag = ref(null as string | null); // null === all
    const currentTag = ref('general');
    const tags = ref([] as string[]);
    const tagsItems = computed(() => {
      return [{ text: 'All playlists', value: null }, ...tags.value.map(item => ({
        text:     currentTag.value === item ? `${item} (current)` : item,
        value:    item,
        disabled: false,
      }))];
    });

    const rules = {
      endTime:   [required],
      startTime: [required],
      volume:    [required, minValue(0), maxValue(100)],
    };

    const headers = [
      {
        value: 'thumbnail', text: 'Thumbnail', align: 'left',
      },
      { value: 'videoId', text: 'Video ID' },
      { value: 'title', text: 'Title' },
      { value: 'data', text: '' },
      { value: 'tags', text: 'Playlist' },
      { value: 'actions', sortable: false },
    ];

    const headersDelete = [
      { value: 'videoId', text: '' },
      { value: 'title', text: '' },
    ];

    const currentPage = ref(1);
    const count = ref(0);
    const perPage = ref(15);
    const fItems = computed(() => items.value);

    onMounted(() => {
      refresh();
    });

    watch([showTag, search], () => {
      currentPage.value = 1;
      refresh();
    });

    watch([currentPage, search, perPage], () => {
      refresh();
    });

    const refresh = async () => {
      await Promise.all([
        new Promise<void>((resolve, reject) => {
          getSocket('/systems/songs').emit('current.playlist.tag', (err, tag: string) => {
            if (err) {
              error(err);
              reject(err);
            }
            currentTag.value = tag;
            resolve();
          });
        }),
        new Promise<void>((resolve, reject) => {
          getSocket('/systems/songs').emit('get.playlist.tags', (err, _tags) => {
            if (err) {
              error(err);
              reject(err);
            }
            tags.value = [..._tags];
            resolve();
          });
        }),
        new Promise<void>((resolve, reject) => {
          getSocket('/systems/songs').emit('find.playlist', {
            page: (currentPage.value - 1), search: search.value, tag: showTag.value, perPage: perPage.value,
          }, (err, _items, _count) => {
            if (err) {
              error(err);
              reject(err);
            }
            for (const item of _items) {
              item.startTime = item.startTime ? item.startTime : 0;
              item.endTime = item.endTime ? item.endTime : item.length;
            }
            count.value = _count;
            items.value = _items;
            resolve();
          });
        }),
      ]);
      state.value.loading = ButtonStates.success;
      if (showTag.value && !tags.value.includes(showTag.value)) {
        showTag.value = null;
      }
    };

    const generateThumbnail = (videoId: string) => {
      return `https://img.youtube.com/vi/${videoId}/1.jpg`;
    };

    const addSongOrPlaylist = () => {
      if (search.value === '') {
        EventBus.$emit('snack', 'red', 'Cannot add empty song to ban list.');
        return;
      }
      if (state.value.import === 0) {
        state.value.import = 1;
        getSocket('/systems/songs').emit(search.value.includes('playlist') ? 'import.playlist' : 'import.video', { playlist: search.value, forcedTag: showTag.value }, (err) => {
          if (err) {
            search.value = '';
            state.value.import = 0;
            return error(err);
          } else {
            state.value.import = 0;
            refresh();
            search.value = '';
            EventBus.$emit('snack', 'success', 'Song added to playlist.');
          }
        });
      }
    };

    const deleteSelected = async () => {
      deleteDialog.value = false;
      await Promise.all(
        selected.value.map((item) => {
          return new Promise((resolve, reject) => {
            getSocket('/systems/songs').emit('delete.playlist', item.videoId, (err) => {
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
      search,
      state,
      showTag,
      currentTag,
      tagsItems,
      tags,
      perPage,
      currentPage,
      count,
      saveCurrentItems,

      generateThumbnail,
      addSongOrPlaylist,

      ButtonStates,
      translate,

      dayjs,
      deleteDialog,
      deleteSelected,
      selected,
      rules,
      refresh,
    };
  },
});
</script>

<style>
.table-p-0 td {
  padding: 0 !important;
}

.fitThumbnail {
  width: 100px;
}
</style>
