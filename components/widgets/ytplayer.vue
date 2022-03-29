<template>
  <v-card id="5b90af97-ad95-4776-89e3-9a59c67510e5" width="100%" flat>
    <v-toolbar height="36" color="blue-grey darken-4">
      <v-spacer />

      <v-tooltip bottom>
        <template #activator="{ on, attrs }">
          <v-btn
            icon
            v-bind="attrs"
            @click="!autoplay ? play() : pause()"
            v-on="on"
          >
            <v-icon v-if="!autoplay">
              mdi-play
            </v-icon>
            <v-icon v-else>
              mdi-stop
            </v-icon>
          </v-btn>
        </template>
        <span>{{ autoplay ? 'Playing songs' : 'Songs are not playing' }}</span>
      </v-tooltip>

      <v-tooltip bottom>
        <template #activator="{ on, attrs }">
          <v-btn
            icon
            v-bind="attrs"
            @click="next"
            v-on="on"
          >
            <v-icon>mdi-skip-forward</v-icon>
          </v-btn>
        </template>
        <span>Skip to next</span>
      </v-tooltip>

      <v-tooltip v-if="autoplay" bottom>
        <template #activator="{ on, attrs }">
          <v-btn
            color="red"
            icon
            v-bind="attrs"
            @click="nextAndRemoveFromPlaylist"
            v-on="on"
          >
            <v-icon>mdi-delete-forever</v-icon>
          </v-btn>
        </template>
        <span>Skip and remove from playlist</span>
      </v-tooltip>
    </v-toolbar>

    <v-select
      v-model="currentTag"
      label="Playlist"
      :items="availableTags"
      dense
      filled
      hide-details
    />

    <v-card-text id="youtubeplayer" class="pa-0">
      <div
        v-if="currentSong.videoId !== null"
        :key="JSON.stringify(currentSong)"
      >
        <vue-plyr
          ref="playerRef"
          :options="{ controls: ['volume', 'progress', 'current-time', 'restart', 'mute'], fullscreen: { enabled: false }, clickToPlay: false }"
          @timeupdate="videoTimeUpdated"
          @ended="videoEnded"
        >
          <div
            data-plyr-provider="youtube"
            :data-plyr-embed-id="currentSong.videoId"
          /> <!-- this is only needed for first init of player -->
        </vue-plyr>
      </div>
    </v-card-text>

    <v-card-text>
      <v-simple-table :height="height - 36">
        <template #default>
          <tbody>
            <tr
              v-for="(request, index) of requests"
              :key="index"
            >
              <td style="vertical-align: middle;">
                {{ request.title }}
              </td>
              <td style="vertical-align: middle;">
                {{ request.username }}
              </td>
              <td style="vertical-align: middle;">
                {{ formatTime(request.length) }}
              </td>
              <td
                style="vertical-align: middle;"
                class="text-right"
              >
                <v-btn color="red" icon @click="removeSongRequest(String(request.id))">
                  <v-icon>mdi-delete-forever</v-icon>
                </v-btn>
              </td>
            </tr>
          </tbody>
        </template>
      </v-simple-table>
    </v-card-text>
  </v-card>
</template>

<script lang="ts">
import type { currentSongType, SongRequestInterface } from '@entity/song';
import {
  computed,
  defineComponent, nextTick, onMounted, onUnmounted, ref, watch,
} from '@nuxtjs/composition-api';
import VuePlyr from '@skjnldsv/vue-plyr';
import { getSocket } from '@sogebot/ui-helpers/socket';
import translate from '@sogebot/ui-helpers/translate';
import { isEqual } from 'lodash';
import Vue from 'vue';

// Workaround is to load css in head https://github.com/skjnldsv/vue-plyr/issues/28
// import '@skjnldsv/vue-plyr/dist/dist/vue-plyr.css';

import { error } from '~/functions/error';

Vue.use(VuePlyr, { plyr: {} });

const emptyCurrentSong = {
  videoId: null, title: '', type: '', username: '', volume: 0, loudness: 0, forceVolume: false, startTime: 0, endTime: Number.MAX_SAFE_INTEGER,
};

export default defineComponent({
  props: { height: Number },
  setup () {
    const isPopout = computed(() => location.href.includes('popout'));

    const currentTag = ref('general');
    const availableTags = ref([] as string[]);
    const autoplay = ref(false);
    const currentSong = ref(emptyCurrentSong as currentSongType);
    const requests = ref([] as SongRequestInterface[]);
    const playerRef = ref(null as null | any);
    const player = computed(() => {
      return playerRef.value ? playerRef.value.player : null;
    });
    const updateTime = ref(Date.now());
    const intervals = [] as number[];

    watch(currentSong, () => {
      playThisSong(0);
    }, { deep: true });
    watch(currentTag, val => getSocket('/systems/songs').emit('set.playlist.tag', val));
    watch(autoplay, async (val) => {
      await waitForPlayerReady();
      player.value.autoplay = val;
      if (!val) {
        player.value.pause();
      } else {
        player.value.play();
      }
    });

    const waitForPlayerReady = () => new Promise<void>((resolve) => {
      const loop = () => {
        if (player.value && player.value.ready) {
          player.value.off('timeupdate');
          player.value.off('ended');
          player.value.on('timeupdate', (event: any) => videoTimeUpdated(event));
          player.value.on('ended', () => videoEnded());
          resolve();
        } else {
          setTimeout(() => loop(), 1000);
        }
      };
      loop();
    });

    const refreshPlaylist = () => {
      getSocket('/systems/songs').emit('current.playlist.tag', (err, tag: string) => {
        if (err) {
          return error(err);
        }
        currentTag.value = tag;
      });
      getSocket('/systems/songs').emit('get.playlist.tags', (err, tags: string[]) => {
        if (err) {
          return error(err);
        }
        availableTags.value = tags;
      });
    };

    const removeSongRequest = (id: string) => {
      if (confirm('Do you want to delete song request ' + requests.value.find(o => String(o.id) === id)?.title + ' from ' + requests.value.find(o => String(o.id) === id)?.username + '?')) {
        console.log('Removing => ' + id);
        requests.value = requests.value.filter(o => String(o.id) !== id);
        getSocket('/systems/songs').emit('songs::removeRequest', id, () => {
          return true;
        });
      }
    };

    const videoEnded = () => {
      console.debug('[YTPLAYER.ended] - autoplay ', autoplay.value);
      if (autoplay.value) {
        next();
      }
    };

    const videoTimeUpdated = (event: any) => {
      if (autoplay.value && currentSong.value) {
        if (currentSong.value.endTime && event.detail.plyr.currentTime >= currentSong.value.endTime) {
          next(); // go to next if we are at endTime
        }
      }
    };

    const nextAndRemoveFromPlaylist = () => {
      if (currentSong.value && currentSong.value.videoId) {
        getSocket('/systems/songs').emit('delete.playlist', currentSong.value.videoId, () => {
          return true;
        });
        next();
      }
    };

    const next = () => {
      currentSong.value = emptyCurrentSong;
      if (player.value) {
        player.value.pause();
      }
      getSocket('/systems/songs').emit('next');
    };

    const pause = () => {
      autoplay.value = false;
    };

    const play = () => {
      autoplay.value = true;
      if (currentSong.value.videoId === null) {
        getSocket('/systems/songs').emit('next');
      }
    };

    const formatTime = (seconds: number) => {
      const h = Math.floor(seconds / 3600);
      const m = Math.floor((seconds % 3600) / 60);
      const s = seconds % 60;
      return [
        h,
        m > 9 ? m : (h ? '0' + m : m || '0'),
        s > 9 ? s : '0' + s,
      ].filter(a => a).join(':');
    };

    const playThisSong = async (retry = 0) => {
      if (retry > 10) {
        console.error('Time of retries exceeded to play this song.');
        return;
      }

      const waitForPlayer = () => new Promise<void>((resolve) => {
        const loop = () => {
          if (playerRef.value) {
            resolve();
          } else {
            setTimeout(() => loop(), 1000);
          }
        };
        loop();
      });
      await waitForPlayer();

      nextTick(async () => {
        try {
          // change only if something is changed
          if (!player.value.source || !player.value.source.includes(currentSong.value.videoId)) {
            player.value.source = {
              type:    'video',
              sources: [
                {
                  src:      currentSong.value.videoId,
                  provider: 'youtube',
                },
              ],
            };
          }
          await waitForPlayerReady();

          if (currentSong.value.startTime) {
            console.log(`Setting start time to ${currentSong.value.startTime}s`);
            player.value.forward(currentSong.value.startTime);
          }

          player.value.volume = currentSong.value.volume / 100;
          player.value.muted = true;
          nextTick(() => {
            player.value.muted = false;
          });
          player.value.play();
        } catch (e) {
          return setTimeout(() => {
            console.log('Retrying playThisSong');
            console.log('If song is not playing and you are on Chrome, disable adblockers or popup blockers - https://github.com/sampotts/plyr/issues/1538');
            console.error(e);
            playThisSong(retry++); // retry after while
          }, 1000);
        }
      });
    };

    onMounted(() => {
      refreshPlaylist();

      getSocket('/systems/songs').on('isPlaying', (cb: (isPlaying: boolean) => void) => {
        if (player.value) {
          cb(player.value.playing);
        } else {
          // eslint-disable-next-line node/no-callback-literal
          cb(false);
        }
      });

      intervals.push(window.setInterval(() => {
        if (autoplay.value) {
          getSocket('/systems/songs').emit('songs::currentSong', (err, botCurrentSong: currentSongType) => {
            if (err) {
              return error(err);
            }
            if (!isEqual(currentSong.value, botCurrentSong)) {
              currentSong.value = botCurrentSong;
            }
          });
        }
        getSocket('/systems/songs').emit('songs::getAllRequests', {}, (err, items) => {
          if (err) {
            error(err);
          }
          if (currentSong.value.videoId === null && autoplay.value) {
            next();
          }
          requests.value = items;
        });
      }, 1000));

      intervals.push(window.setInterval(() => {
        refreshPlaylist();
      }, 10000));
    });
    onUnmounted(() => {
      for (const interval of intervals) {
        clearInterval(interval);
      }
    });

    return {
      // refs
      isPopout,
      currentTag,
      availableTags,
      autoplay,
      currentSong,
      requests,
      playerRef,
      updateTime,

      removeSongRequest,
      videoEnded,
      videoTimeUpdated,
      nextAndRemoveFromPlaylist,
      next,
      pause,
      play,
      formatTime,

      translate,
    };
  },
  head () {
    return {
      link: [
        {
          rel:  'stylesheet',
          href: 'https://unpkg.com/vue-plyr/dist/vue-plyr.css',
        },
      ],
    };
  },
});
</script>
