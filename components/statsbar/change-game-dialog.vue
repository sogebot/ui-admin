<template>
  <v-dialog
    v-model="dialogController"
    fullscreen
    transition="dialog-bottom-transition"
  >
    <v-card :loading="isLoading">
      <v-card-title>
        {{ translate('change-game') }} to <span class="primary--text pl-1">{{ selectedGame }}</span>
      </v-card-title>

      <v-divider />

      <v-container fluid>
        <v-subheader style="height: 30px; font-size: 0.75rem;">Last used games</v-subheader>
        <v-item-group v-model="selectedGameIdx">
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
                  @click="toggle(); manuallySelectedGame = ''"
                >
                  <v-img
                    :src="'https://static-cdn.jtvnw.net/ttv-boxart/' + encodeURIComponent(game) + '-200x280.jpg'"
                    :title="game"
                    max-height="280"
                    contain
                    aspect-ratio="0.71"
                  />
                  <v-scroll-y-transition>
                    <v-overlay
                      v-if="active"
                      absolute
                      color="primary"
                    >
                      <v-icon>{{mdiCheck}}</v-icon>
                    </v-overlay>
                  </v-scroll-y-transition>
                </v-card>
              </v-item>
            </v-col>
          </v-row>
        </v-item-group>
      </v-container>

      <v-container fluid>
        <v-autocomplete
          dense
          v-model="manuallySelectedGame"
          :items="gamesFromTwitch"
          :loading="isSearching"
          :search-input.sync="search"
          hide-no-data
          hide-selected
          item-text="Description"
          item-value="API"
          label="Twitch games"
          placeholder="Start typing to Search game on Twitch"
          :prepend-icon="mdiMagnify"
          :return-object="false"
        ></v-autocomplete>
      </v-container>

      <v-divider/>

      <v-card-title>
        {{ translate('change-title') }} to <span class="primary--text pl-1">{{ selectedGame }}</span>
      </v-card-title>
    </v-card>
  </v-dialog>
</template>

<script lang="ts">
import {
  mdiCheck, mdiMagnify,
} from '@mdi/js';
import { getSocket } from '@sogebot/ui-helpers/socket';
import translate from '@sogebot/ui-helpers/translate';
import { debounce, orderBy } from 'lodash-es';
import {
  computed,
  defineComponent, onMounted, ref, watch,
} from '@vue/composition-api';

import type { CacheTitlesInterface } from '.bot/src/bot/database/entity/cacheTitles';

export default defineComponent({
  props: { dialog: Boolean },
  setup (props, ctx) {
    const cachedSearch = new Map<string, string[]>();

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

    watch(selectedGame, (val) => {
      // check if we have this in lastGames list
      const idx = lastGames.value.indexOf(val)
      selectedGameIdx.value = idx;
    });

    watch(manuallySelectedGame, (val) => {
      if (val.length === 0) {
        // check if was cleared (we clear gamesFromTwitch search)
        gamesFromTwitch.value = [];
      }
    })

    watch(() => props.dialog, (val) => {
      dialogController.value = val;
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
          })
        }
      }
    }, 1000));

    return {
      dialogController,
      translate,
      titles,
      lastGames,
      isLoading,

      mdiCheck,
      mdiMagnify,

      selectedGameIdx,
      selectedGame,

      search,
      isSearching,
      gamesFromTwitch,
      manuallySelectedGame,
    };
  },
});
</script>
