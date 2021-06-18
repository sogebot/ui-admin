<template>
  <v-dialog
    v-model="dialogController"
    fullscreen
    persistent
    transition="dialog-bottom-transition"
  >
    <v-card :loading="isLoading" tile>
      <v-toolbar dense color="primary">
        <v-btn
          icon
          @click="dialogController = false"
        >
          <v-icon>{{ mdiClose }}</v-icon>
        </v-btn>
        <span class="headline">Change game and title</span>
        <v-spacer />
        <v-btn
          text
          :loading="isSaving"
          @click="save"
        >
          {{ translate('dialog.buttons.saveChanges.idle') }}
        </v-btn>
      </v-toolbar>

      <v-container fluid class="pt-5">
        <v-autocomplete
          v-model="manuallySelectedGame"
          dense
          :items="gamesFromTwitch"
          :loading="isSearching"
          :search-input.sync="search"
          hide-no-data
          hide-selected
          label="Change game"
          placeholder="Start typing to Search game on Twitch"
          :return-object="false"
        />

        <v-subheader class="pl-0" style="height: 30px; font-size: 0.75rem;">
          Last used games
        </v-subheader>
        <v-container :key="JSON.stringify(lastGames)" fluid>
          <v-item-group v-model="selectedGameIdx" :mandatory="selectedGameIdx > -1">
            <v-row no-gutters>
              <v-col
                v-for="game in lastGames"
                :key="game"
                cols="2"
                md="1"
              >
                <v-item v-slot="{ active, toggle }">
                  <v-card
                    :color="active ? 'primary' : ''"
                    class="d-flex align-center"
                    tile
                    @click="toggle(); setGame(game)"
                  >
                    <v-img
                      :src="'https://static-cdn.jtvnw.net/ttv-boxart/' + encodeURIComponent(game) + '-200x280.jpg'"
                      :title="game"
                      max-height="280"
                      contain
                      :aspect-ratio="200/280"
                    />
                    <v-scroll-y-transition>
                      <v-overlay
                        v-if="active"
                        absolute
                        color="primary"
                      >
                        <v-icon>{{ mdiCheck }}</v-icon>
                      </v-overlay>
                    </v-scroll-y-transition>
                  </v-card>
                </v-item>
              </v-col>
            </v-row>
          </v-item-group>
        </v-container>
      </v-container>

      <v-divider />

      <v-container fluid>
        <v-textarea
          v-model="title"
          auto-grow
          label="Change Title"
          counter=""
          rows="1"
        />

        <v-subheader class="pl-0" style="height: 30px; font-size: 0.75rem;">
          Last used titles for {{ selectedGame }}
        </v-subheader>

        <v-list :key="JSON.stringify(lastTitles)" flat dense>
          <v-list-item-group>
            <v-list-item
              v-for="(item, i) in lastTitles"
              :key="item + i"
              class="elevation-1"
              @click="title = item"
            >
              <v-list-item-content>
                <v-list-item-title v-text="item" />
              </v-list-item-content>
            </v-list-item>
          </v-list-item-group>
        </v-list>
      </v-container>
    </v-card>
  </v-dialog>
</template>

<script lang="ts">
import { mdiCheck, mdiClose } from '@mdi/js';
import {
  computed,
  defineComponent, ref, useStore, watch,
} from '@nuxtjs/composition-api';
import { getSocket } from '@sogebot/ui-helpers/socket';
import translate from '@sogebot/ui-helpers/translate';
import { debounce, orderBy } from 'lodash-es';

import type { CacheTitlesInterface } from '.bot/src/bot/database/entity/cacheTitles';
import { error } from '~/functions/error';

export default defineComponent({
  props: { dialog: Boolean },
  setup (props, ctx) {
    const cachedSearch = new Map<string, string[]>();
    const store = useStore<any>();

    const selectedGameIdx = ref(0);
    const selectedGame = computed(() => {
      return manuallySelectedGame.value.length > 0
        ? manuallySelectedGame.value
        : lastGames.value[selectedGameIdx.value];
    });

    const search = ref('');
    const isSearching = ref(false);
    const gamesFromTwitch = ref([] as string[]);
    const manuallySelectedGame = ref('');

    const dialogController = ref(false);
    const isLoading = ref(false);
    const isSaving = ref(false);
    const titles = ref([] as CacheTitlesInterface[]);
    const lastGames = computed(() => {
      const game = [] as string[];
      for (const title of orderBy(titles.value, 'timestamp', 'desc')) {
        if (!game.includes(title.game)) {
          game.push(title.game);
        }
        if (game.length === 12) {
          break;
        }
      }
      return game;
    });
    const lastTitles = computed(() => {
      const value = [] as string[];
      for (const title of orderBy(titles.value, 'timestamp', 'desc').filter(o => o.game === selectedGame.value)) {
        if (!value.includes(title.title)) {
          value.push(title.title);
        }
        if (value.length === 12) {
          break;
        }
      }
      return value;
    });

    const title = ref('');

    const setGame = async (game: string) => {
      manuallySelectedGame.value = game;

      await (function setSearch (val: string) {
        // workaround for setting initial search and on click
        return new Promise((resolve) => {
          if (search.value !== val) {
            search.value = val;
            setTimeout(() => setSearch(val));
          } else {
            resolve(true);
          }
        });
      })(game);
    };

    watch([selectedGame, lastGames], () => {
      // check if we have this in lastGames list
      const idx = lastGames.value.indexOf(selectedGame.value);
      selectedGameIdx.value = idx;
    });

    watch(manuallySelectedGame, (val) => {
      if (val.length === 0) {
        // check if was cleared (we clear gamesFromTwitch search)
        gamesFromTwitch.value = [];
      }
      search.value = val;
    });

    watch(() => props.dialog, (val) => {
      dialogController.value = val;
      title.value = store.state.currentTitle;
      setGame(store.state.currentGame);
      isLoading.value = true;
      getSocket('/').emit('getUserTwitchGames', (values: CacheTitlesInterface[]) => {
        console.groupCollapsed('panel::stats::getUserTwitchGames');
        console.log(values);
        console.groupEnd();
        titles.value = values;
        isLoading.value = false;
      });
    });

    watch(dialogController, (val) => {
      ctx.emit('update:dialog', val);
    });

    watch(search, debounce((val) => {
      if (val && val.length > 0) {
        isSearching.value = true;

        // check if we have this search cached
        if (cachedSearch.has(val)) {
          console.log('Using cached search for ' + val);
          gamesFromTwitch.value = cachedSearch.get(val) ?? [];
          isSearching.value = false;
        } else {
          getSocket('/').emit('getGameFromTwitch', val, (values: string[]) => {
            cachedSearch.set(val, values.sort());
            gamesFromTwitch.value = values.sort();
            isSearching.value = false;
          });
        }
      }
    }, 100));

    const save = () => {
      isSaving.value = true;
      getSocket('/').emit('cleanupGameAndTitle');

      const emit = {
        game:  selectedGame.value,
        title: title.value,
        tags:  [],
      };
      store.commit('setCurrentGame', emit.game);
      store.commit('setCurrentTitle', emit.title);
      store.commit('setCurrentTags', emit.tags);

      getSocket('/').emit('updateGameAndTitle', emit, (err: string | null) => {
        isSaving.value = false;
        if (err) {
          error(err);
        } else {
          dialogController.value = false;
        }
      });
    };

    return {
      dialogController,
      translate,
      titles,
      lastGames,
      isLoading,
      isSaving,
      setGame,

      mdiCheck,
      mdiClose,

      selectedGameIdx,
      selectedGame,

      search,
      isSearching,
      gamesFromTwitch,
      manuallySelectedGame,

      title,
      lastTitles,
      save,
    };
  },
});
</script>
