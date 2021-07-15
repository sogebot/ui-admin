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
        offline
        type="bigNumber"
        title="views"
        :timestamp="timestamp"
        :is-stream-online="isStreamOnline"
        :is-loaded="isLoaded"
        :current="currentStats.currentViews"
        :average="averageStats.currentViews"
      />
      <with-trending
        offline
        type="bigNumber"
        title="followers"
        :timestamp="timestamp"
        :is-stream-online="isStreamOnline"
        :is-loaded="isLoaded"
        :current="currentStats.currentFollowers"
        :average="averageStats.currentFollowers"
      />
      <with-trending
        offline
        v-if="broadcasterType !== ''"
        type="bigNumber"
        title="subscribers"
        :timestamp="timestamp"
        :is-stream-online="isStreamOnline"
        :is-loaded="isLoaded"
        :current="currentStats.currentSubscribers"
        :average="averageStats.currentSubscribers"
      />
      <with-trending
        v-if="broadcasterType !== ''"
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
      <song :timestamp="timestamp" />
    </v-row>
  </div>
</template>

<script lang="ts">
/* eslint-disable camelcase */
import {
  computed, defineAsyncComponent, defineComponent, onMounted, onUnmounted, reactive, ref, watch,
} from '@nuxtjs/composition-api';
import type { Ref } from '@nuxtjs/composition-api';
import { getSocket } from '@sogebot/ui-helpers/socket';
import translate from '@sogebot/ui-helpers/translate';

import { EventBus } from '~/functions/event-bus';

let interval = 0;
let UIErrorInterval = 0;

const socket = getSocket('/');

export default defineComponent({
  components: {
    game:         defineAsyncComponent({ loader: () => import('~/components/statsbar/game.vue') }),
    song:         defineAsyncComponent({ loader: () => import('~/components/statsbar/song.vue') }),
    uptime:       defineAsyncComponent({ loader: () => import('~/components/statsbar/uptime.vue') }),
    viewers:      defineAsyncComponent({ loader: () => import('~/components/statsbar/viewers.vue') }),
    withTrending: defineAsyncComponent({ loader: () => import('~/components/statsbar/withTrending.vue') }),
  },
  setup () {
    const averageStats: any = reactive({});
    const currentStats: any = reactive({});
    const timestamp: Ref<null | number> = ref(null);
    const uptime = ref(null as null | number);
    const broadcasterType = ref(localStorage.broadcasterType || '');
    const version = ref('');
    const update: {
      version: null | string;
    } = reactive({ version: null });
    const isLoaded = ref(false);

    const isStreamOnline = computed(() => uptime.value !== null);

    watch(isStreamOnline, () => {
      getLatestStats();
    });

    const getLatestStats = () => {
      socket.emit('getLatestStats', (err: string | null, data: any) => {
        console.groupCollapsed('navbar::getLatestStats');
        console.log(data);
        if (err) {
          return console.error(err);
        }
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
      socket.on('panel::stats', (data: Record<string, any>) => {
        console.groupCollapsed('panel::stats');
        console.log(data);
        console.groupEnd();

        uptime.value = data.uptime;
        broadcasterType.value = data.broadcasterType;
        localStorage.broadcasterType = data.broadcasterType;

        for (const key of Object.keys(data)) {
          currentStats[key] = data[key];
        }
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
      timestamp,
      broadcasterType,
      version,
      update,
      uptime,
      isLoaded,
      isStreamOnline,

      translate,
    };
  },
});
</script>
