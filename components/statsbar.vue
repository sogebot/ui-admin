<template>
  <div>
    <v-alert
      v-if="!$store.state.configuration.isCastersSet"
      type="error"
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
    <v-snackbar absolute app v-model="updateSnackbar" right top style="z-index: 9999">
      <h5>{{ translate('errors.new_update_available') }}</h5>
      <div
        class="text-caption"
        v-html="translate('errors.new_bot_version_available_at').replace(/\$version/gmi, update.version)"
      />

      <template v-slot:action="{ attrs }">
        <v-btn
          icon
          v-bind="attrs"
          @click="updateSnackbar = false"
        >
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </template>
    </v-snackbar>
    <v-row no-gutters>
      <component
        :is="`${item.split('|')[0]}-${item.split('|')[1].replace(/([A-Z])/g, '-$1').toLowerCase()}`"
        v-for="item of $store.state.configuration.core.dashboard.µWidgets"
        :key="item"
        :timestamp="timestamp"
        :uptime="uptime"
        :is-loaded="isLoaded"
        :is-stream-online="isStreamOnline"
        :current="currentStats"
        :average="averageStats"
        :broadcaster-type="broadcasterType"
      />
    </v-row>
  </div>
</template>

<script lang="ts">
/* eslint-disable camelcase */
import {
  computed, defineAsyncComponent, defineComponent, onMounted, onUnmounted, reactive, ref, watch,
} from '@nuxtjs/composition-api';
import { getSocket } from '@sogebot/ui-helpers/socket';
import translate from '@sogebot/ui-helpers/translate';

import { EventBus } from '~/functions/event-bus';

let interval = 0;
let UIErrorInterval = 0;

export default defineComponent({
  components: {
    'general-current-song': defineAsyncComponent({
      loader: () => import('~/components/microWidgets/general-current-song.vue'),
    }),
    'general-tips': defineAsyncComponent({
      loader: () => import('~/components/microWidgets/general-tips.vue'),
    }),
    'twitch-chat-messages': defineAsyncComponent({
      loader: () => import('~/components/microWidgets/twitch-chat-messages.vue'),
    }),
    'twitch-bits': defineAsyncComponent({
      loader: () => import('~/components/microWidgets/twitch-bits.vue'),
    }),
    'twitch-followers': defineAsyncComponent({
      loader: () => import('~/components/microWidgets/twitch-followers.vue'),
    }),
    'twitch-subscribers': defineAsyncComponent({
      loader: () => import('~/components/microWidgets/twitch-subscribers.vue'),
    }),
    'twitch-viewers': defineAsyncComponent({
      loader: () => import('~/components/microWidgets/twitch-viewers.vue'),
    }),
    'twitch-views': defineAsyncComponent({
      loader: () => import('~/components/microWidgets/twitch-views.vue'),
    }),
    'twitch-max-viewers': defineAsyncComponent({
      loader: () => import('~/components/microWidgets/twitch-max-viewers.vue'),
    }),
    'twitch-new-chatters': defineAsyncComponent({
      loader: () => import('~/components/microWidgets/twitch-new-chatters.vue'),
    }),
    'twitch-status': defineAsyncComponent({
      loader: () => import('~/components/microWidgets/twitch-status.vue'),
    }),
    'twitch-uptime': defineAsyncComponent({
      loader: () => import('~/components/microWidgets/twitch-uptime.vue'),
    }),
    'twitch-watched-time': defineAsyncComponent({
      loader: () => import('~/components/microWidgets/twitch-watched-time.vue'),
    }),
  },
  setup () {
    const averageStats: any = reactive({
    });
    const currentStats: any = reactive({
    });
    const timestamp = ref(null as null | number);
    const uptime = ref(null as null | number);
    const broadcasterType = ref(localStorage.broadcasterType || '');
    const version = ref('');
    const update: {
      version: null | string;
    } = reactive({
      version: null,
    });
    const updateSnackbar = computed({
      get: () => {
        return update.version !== null;
      },
      set (val) {
        if (val === false) {
          update.version = null;
        }
      },
    });
    const isLoaded = ref(false);

    const isStreamOnline = computed(() => uptime.value !== null);

    watch(isStreamOnline, () => {
      getLatestStats();
    });

    const getLatestStats = () => {
      getSocket('/').emit('getLatestStats', (err: string | null, data: any) => {
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
      getSocket('/').emit('version', async (recvVersion: string) => {
        version.value = recvVersion;

        const { response } = await new Promise<{ response: Record<string, any>}>((resolve) => {
          const request = new XMLHttpRequest();
          request.open('GET', 'https://api.github.com/repos/sogehige/sogebot/releases/latest', true);

          request.onload = function () {
            if (!(this.status >= 200 && this.status < 400)) {
              console.error('Error getting version from git', this.status, this.response);
            }
            resolve({
              response: JSON.parse(this.response),
            });
          };
          request.onerror = function () {
            console.error('Connection error to github');
            resolve({
              response: {
              },
            });
          };

          request.send();
        });
        const botVersion = recvVersion.replace('-SNAPSHOT', '').split('.').map(o => Number(o));
        const gitVersion = (response.tag_name as string).split('.').map(o => Number(o));
        console.debug({
          botVersion, gitVersion,
        });

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
        getSocket('/').emit('panel::alerts', (err: string | null, data: { errors: { name: string; message: string }[], warns: { name: string; message: string }[] }) => {
          if (err) {
            return console.error(err);
          }
          for (const e of data.errors) {
            console.error(`UIError: ${e.name} | ${e.message}`);
            EventBus.$emit('snack', 'red', `<h4>${e.name}</h4><div>${e.message}</div>`);
          }
          for (const e of data.warns) {
            console.info(`UIWarn: ${e.name} | ${e.message}`);
            EventBus.$emit('snack', 'orange', `<h4>${e.name}</h4><div>${e.message}</div>`);
          }
        });
      }, 5000);

      getLatestStats();

      getSocket('/').emit('panel::resetStatsState');
      getSocket('/').on('panel::stats', (data: Record<string, any>) => {
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
      }, 250);
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
      updateSnackbar,
      update,
      uptime,
      isLoaded,
      isStreamOnline,

      translate,
    };
  },
});
</script>
