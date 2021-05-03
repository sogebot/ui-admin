<template>
  <div>
    <v-alert
      v-if="!$store.state.configuration.isChannelSet"
      type="danger"
      dismissible
      prominent
      dense
    >
      <h5>{{ translate('errors.channel_is_not_set') }}</h5>
      <div
        class="text-caption"
        v-html="translate('errors.please_set_your_channel')"
      />
    </v-alert>
    <v-alert
      v-if="!$store.state.configuration.isCastersSet"
      type="info"
      dismissible
      prominent
      dense
    >
      <h5>{{ translate('errors.owner_and_broadcaster_oauth_is_not_set') }}</h5>
      <div
        class="text-caption"
        v-html="translate('errors.please_set_your_broadcaster_oauth_or_owners')"
      />
    </v-alert>
    <v-alert
      v-if="update.version"
      type="info"
      dismissible
      prominent
      dense
    >
      <h5>{{ translate('errors.new_update_available') }}</h5>
      <div
        class="text-caption"
        v-html="translate('errors.new_bot_version_available_at').replace(/\$version/gmi, update.version)"
      />
    </v-alert>

    <v-row no-gutters>
      <game :timestamp="timestamp" />
      <song :timestamp="timestamp" />
      <uptime :timestamp="timestamp" :uptime="uptime" :is-loaded="isLoaded" />
      <viewers :timestamp="timestamp" :is-stream-online="isStreamOnline" :is-loaded="isLoaded" :viewers="currentStats.currentViewers" />
      <with-trending
        hide
        title="max-viewers"
        :timestamp="timestamp"
        :is-stream-online="isStreamOnline"
        :is-loaded="isLoaded"
        :current="currentStats.maxViewers"
        :average="averageStats.maxViewers"
      />
      <with-trending
        hide
        title="new-chatters"
        :timestamp="timestamp"
        :is-stream-online="isStreamOnline"
        :is-loaded="isLoaded"
        :current="currentStats.newChatters"
        :average="averageStats.newChatters"
      />
      <with-trending
        type="bigNumber"
        title="chat-messages"
        :timestamp="timestamp"
        :is-stream-online="isStreamOnline"
        :is-loaded="isLoaded"
        :current="currentStats.chatMessages"
        :average="averageStats.chatMessages"
      />
      <with-trending
        type="bigNumber"
        title="views"
        :timestamp="timestamp"
        :is-stream-online="isStreamOnline"
        :is-loaded="isLoaded"
        :current="currentStats.currentViews"
        :average="averageStats.currentViews"
      />
      <with-trending
        type="bigNumber"
        title="followers"
        :timestamp="timestamp"
        :is-stream-online="isStreamOnline"
        :is-loaded="isLoaded"
        :current="currentStats.currentFollowers"
        :average="averageStats.currentFollowers"
      />
      <with-trending
        type="bigNumber"
        title="subscribers"
        :timestamp="timestamp"
        :is-stream-online="isStreamOnline"
        :is-loaded="isLoaded"
        :current="currentStats.currentSubscribers"
        :average="averageStats.currentSubscribers"
      />
      <with-trending
        type="bigNumber"
        title="bits"
        :timestamp="timestamp"
        :is-stream-online="isStreamOnline"
        :is-loaded="isLoaded"
        :current="currentStats.currentBits"
        :average="averageStats.currentBits"
      />
      <with-trending
        type="currency"
        title="tips"
        :timestamp="timestamp"
        :is-stream-online="isStreamOnline"
        :is-loaded="isLoaded"
        :current="currentStats.currentTips"
        :average="averageStats.currentTips"
      />
      <with-trending
        type="hours"
        title="watched-time"
        :timestamp="timestamp"
        :is-stream-online="isStreamOnline"
        :is-loaded="isLoaded"
        :current="currentStats.currentWatched"
        :average="averageStats.currentWatched"
      />
    </v-row>
  </div>
  <!--div
    ref="quickwindow"
    class="stream-info-container container-fluid"
    :class="{ 'sticky-top': b_sticky }"
    :style="{ 'top': b_sticky ? top + 'px' : undefined }"
  >
    <b-toast
      v-for="error of errors"
      :key="error.name + error.message + error.date"
      :title="error.name"
      :no-auto-hide="getErrorType(error.type) !== 'success'"
      visible
      :variant="getErrorType(error.type)"
    >
      <div v-html="error.message" />
    </b-toast>
    <b-toast
      v-if="!$store.state.configuration.isChannelSet"
      :title="translate('errors.channel_is_not_set')"
      no-auto-hide
      visible
      variant="danger"
      solid
    >
      <div v-html="translate('errors.please_set_your_channel')" />
    </b-toast>
    <b-toast
      v-if="!$store.state.configuration.isCastersSet"
      :title="translate('errors.owner_and_broadcaster_oauth_is_not_set')"
      no-auto-hide
      visible
      variant="danger"
      solid
    >
      <div v-html="translate('errors.please_set_your_broadcaster_oauth_or_owners')" />
    </b-toast>
    <b-toast
      v-if="update.version"
      :title="translate('errors.new_update_available')"
      no-auto-hide
      visible
      variant="info"
      solid
    >
      <div v-html="translate('errors.new_bot_version_available_at').replace(/\$version/gmi, update.version)" />
    </b-toast>
    <template v-if="!isLoaded">
      <div class="mx-auto text-center p-3 pt-4">
        <div
          class="spinner-grow"
          role="status"
        />
      </div>
    </template>
    <template v-else>

      <div class="row">
        <div
          class="col-12 col-sm-12 col-md-4 col-lg-4 stream-info"
          @click="showGameAndTitleDlg"
        >
          <span
            v-if="game"
            class="data"
            :title="game"
          >{{ game }}</span>
          <span
            v-else
            class="data"
          >{{ translate('not-available') }}</span>
          <h2>
            <span>{{ translate('game') }}</span>
            <small>{{ translate('click-to-change') }}</small>
          </h2>
        </div>

        <div
          class="col-12 col-sm-12 col-md-4 col-lg-4 stream-info"
          @click="showGameAndTitleDlg"
        >
          <span
            v-if="title"
            class="data"
            :title="rawStatus"
            v-html="title"
          />
          <span
            v-else
            class="data"
          >{{ translate('not-available') }}</span>
          <span class="data">
            <small
              v-for="tag of filterTags(true)"
              :key="tag.name"
              :class="{ 'text-muted': tag.is_auto }"
              :title="tag.is_auto ? 'Automatically added tag' : 'Manual tag'"
            >
              {{ tag.name }}
            </small>
            <span
              v-for="tag of filterTags(false)"
              :key="tag.name"
              :class="{ 'text-muted': tag.is_auto }"
              :title="tag.is_auto ? 'Automatically added tag' : 'Manual tag'"
            >
              {{ tag.name }}
            </span>
          </span>
          <h2>
            <span>{{ translate('title') }}</span>
            <small>{{ translate('click-to-change') }}</small>
          </h2>
        </div>

        <div class="col-12 col-sm-12 col-md-4 col-lg-4 stream-info">
          <span class="data">
            {{ currentSong }}
          </span>
          <h2>
            <span>{{ translate('currentsong') }}</span>
          </h2>
        </div>
      </div>
    </template>
  </div-->
</template>

<script lang="ts">
/* eslint-disable camelcase */
import { mdiTrendingDown, mdiTrendingUp } from '@mdi/js';
import { getSocket } from '@sogebot/ui-helpers/socket';
import translate from '@sogebot/ui-helpers/translate';
import {
  computed, defineAsyncComponent, defineComponent, onMounted, onUnmounted, reactive, ref, watch,
} from '@vue/composition-api';
import type { Ref } from '@vue/composition-api';
import { isNil } from 'lodash-es';

import { error } from '~/functions/error';
import { EventBus } from '~/functions/event-bus';

let interval = 0;
let UIErrorInterval = 0;

const socket = getSocket('/');

const numberReducer = (out: string, item: any) => {
  if (['currency', 'compact'].includes(item.type)) {
    out += `<small class="text-muted">${item.value}</small>`;
  } else {
    out += item.value;
  }
  return out;
};

export default defineComponent({
  components: {
    game:         defineAsyncComponent({ loader: () => import('~/components/statsbar/game.vue') }),
    song:         defineAsyncComponent({ loader: () => import('~/components/statsbar/song.vue') }),
    uptime:       defineAsyncComponent({ loader: () => import('~/components/statsbar/uptime.vue') }),
    viewers:      defineAsyncComponent({ loader: () => import('~/components/statsbar/viewers.vue') }),
    withTrending: defineAsyncComponent({ loader: () => import('~/components/statsbar/withTrending.vue') }),
  },
  setup (_, context) {
    const averageStats: any = reactive({});
    const currentStats: any = reactive({});
    const hideStats = ref(localStorage.getItem('hideStats') === 'true');
    const timestamp: Ref<null | number> = ref(null);
    const uptime = ref(null as null | number);
    const currentSong = ref(null);
    const broadcasterType = ref('');
    const version = ref('');
    const update: {
      version: null | string;
    } = reactive({ version: null });
    const title: Ref<null | string> = ref(null);
    const game: Ref<null | string> = ref(null);
    const rawStatus = ref('');
    const cachedTitle = ref('');
    const isLoaded = ref(false);
    const top = ref('50');

    const isStreamOnline = computed(() => uptime.value !== null);

    // $refs
    const quickwindow = ref(null);

    watch(isStreamOnline, () => {
      getLatestStats();
    });

    const showGameAndTitleDlg = () => EventBus.$emit('show-game_and_title_dlg');
    
    const getLatestStats = () => {
      socket.emit('getLatestStats', (err: string | null, data: any) => {
        console.groupCollapsed('navbar::getLatestStats');
        if (err) {
          return console.error(err);
        }
        console.log(data);
        console.groupEnd();
        for (const key of Object.keys(data)) {
          averageStats[key] = data[key];
        }
      });
    };

    onMounted(() => {
      socket.emit('version', async (recvVersion: string) => {
        version.value = recvVersion;

        const { response } = await new Promise<{ response: Record<string, any>}>((resolve) => {
          const request = new XMLHttpRequest();
          request.open('GET', 'https://api.github.com/repos/sogehige/sogebot/releases/latest', true);

          request.onload = function () {
            if (!(this.status >= 200 && this.status < 400)) {
              console.error('Error getting version from git', this.status, this.response);
            }
            resolve({ response: JSON.parse(this.response) });
          };
          request.onerror = function () {
            console.error('Connection error to github');
            resolve({ response: {} });
          };

          request.send();
        });
        const botVersion = recvVersion.replace('-SNAPSHOT', '').split('.').map(o => Number(o));
        const gitVersion = (response.tag_name as string).split('.').map(o => Number(o));
        console.debug({ botVersion, gitVersion });

        let isNewer = false;
        for (let index = 0; index < botVersion.length; index++) {
          if (botVersion[index] < gitVersion[index]) {
            isNewer = true;
            break;
          } else if (botVersion[index] === gitVersion[index]) {
            continue;
          } else {
            isNewer = false;
            break;
          }
        }

        if (isNewer) {
          update.version = gitVersion.join('.');
        }
      });

      UIErrorInterval = window.setInterval(() => {
        socket.emit('panel::alerts', (err: string | null, data: { errors: { name: string; message: string }[], warns: { name: string; message: string }[] }) => {
          if (err) {
            return console.error(err);
          }
          for (const e of data.errors) {
            console.error(`UIError: ${e.name} ¦ ${e.message}`);
            EventBus.$emit('snack', 'red', `<h4>${e.name}</h4><div>${e.message}</div>`);
          }
          for (const e of data.warns) {
            console.info(`UIWarn: ${e.name} ¦ ${e.message}`);
            EventBus.$emit('snack', 'orange', `<h4>${e.name}</h4><div>${e.message}</div>`);
          }
        });
      }, 5000);

      getLatestStats();

      socket.emit('panel::resetStatsState');
      socket.on('panel::stats', async (data: Record<string, any>) => {
        console.groupCollapsed('panel::stats');
        console.log(data);
        console.groupEnd();

        broadcasterType.value = data.broadcasterType;
        uptime.value = data.uptime;
        for (const key of Object.keys(data)) {
          currentStats[key] = data[key];
        }
        uptime.value = 1620034166295;
        currentStats.chatMessages = Math.floor(Math.random() * 100);
        currentStats.currentTips = Math.floor(Math.random() * 100);
        currentStats.currentBits = Math.floor(Math.random() * 100);
        currentStats.currentFollowers = Math.floor(Math.random() * 100);
        currentStats.currentSubscribers = Math.floor(Math.random() * 100);
        currentStats.currentWatched = Math.floor(Math.random() * 10000000000);
        isLoaded.value = true;
      });

      interval = window.setInterval(() => {
        timestamp.value = Date.now();
      }, 1000);
    });
    onUnmounted(() => {
      clearInterval(interval);
      clearInterval(UIErrorInterval);
    });

    return {
      averageStats,
      currentStats,
      hideStats,
      timestamp,
      uptime,
      currentSong,
      broadcasterType,
      version,
      update,
      title,
      game,
      rawStatus,
      cachedTitle,
      isLoaded,
      top,
      isStreamOnline,
      showGameAndTitleDlg,

      quickwindow,
      translate,
      numberReducer,
      mdiTrendingDown,
      mdiTrendingUp,
    };
  },
});
</script>
