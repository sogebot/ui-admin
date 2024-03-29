<template>
  <v-card id="c7eff6a7-dc62-4c0b-bad6-90df9d5b605f" :key="timestamp" width="100%">
    <v-row no-gutters class="flex-nowrap">
      <v-col cols="12" class="flex-shrink-1 flex-grow-0" style="min-width: 100px; max-width: 100%;">
        <v-tabs v-model="tab" height="36" background-color="blue-grey darken-4">
          <v-tab>{{ translate('widget-title-chat') }}</v-tab>
          <v-tab>{{ translate('widget-title-monitor') }}</v-tab>
        </v-tabs>

        <v-speed-dial
          v-model="fab"
          absolute
          right
          style="right: 2px; top: -15px;"
          direction="bottom"
          top
        >
          <template #activator>
            <v-btn v-model="fab" color="blue-grey darken-2" dark fab x-small>
              <v-icon v-if="fab">
                mdi-close
              </v-icon>
              <v-icon v-else>
                mdi-dots-vertical
              </v-icon>
            </v-btn>
          </template>

          <v-tooltip v-if="!isPopout" left>
            <template #activator="{ on, attrs }">
              <v-btn
                fab
                x-small
                color="secondary"
                v-bind="attrs"
                @click="timestamp = Date.now()"
                v-on="on"
              >
                <v-icon>mdi-refresh</v-icon>
              </v-btn>
            </template>
            <span>Refresh Widget</span>
          </v-tooltip>
          <v-tooltip v-if="!isPopout" left>
            <template #activator="{ on, attrs }">
              <v-btn
                fab
                x-small
                :color="showJoins ? 'green lighten-1' : 'red lighten-1'"
                v-bind="attrs"
                @click.stop="showJoins = !showJoins"
                v-on="on"
              >
                <v-icon>mdi-account-plus</v-icon>
              </v-btn>
            </template>
            <span>Show JOINs</span>
          </v-tooltip>
          <v-tooltip v-if="!isPopout" left>
            <template #activator="{ on, attrs }">
              <v-btn
                fab
                x-small
                :color="showParts ? 'green lighten-1' : 'red lighten-1'"
                v-bind="attrs"
                @click.stop="showParts = !showParts"
                v-on="on"
              >
                <v-icon>mdi-account-minus</v-icon>
              </v-btn>
            </template>
            <span>Show PARTs</span>
          </v-tooltip>
          <v-tooltip v-if="!isPopout" left>
            <template #activator="{ on, attrs }">
              <v-btn
                fab
                x-small
                color="secondary"
                v-bind="attrs"
                @click="dialog = true"
                v-on="on"
              >
                <v-icon>mdi-comment-plus</v-icon>
              </v-btn>
            </template>
            <span>Send bot message</span>
          </v-tooltip>
          <v-tooltip v-if="!isPopout" left>
            <template #activator="{ on, attrs }">
              <v-btn
                fab
                x-small
                color="orange darken-3"
                v-bind="attrs"
                @click="joinChat"
                v-on="on"
              >
                <v-icon>mdi-login</v-icon>
              </v-btn>
            </template>
            <span>Join chat</span>
          </v-tooltip>
          <v-tooltip v-if="!isPopout" left>
            <template #activator="{ on, attrs }">
              <v-btn
                fab
                x-small
                color="orange darken-3"
                v-bind="attrs"
                @click="leaveChat"
                v-on="on"
              >
                <v-icon>mdi-logout</v-icon>
              </v-btn>
            </template>
            <span>Leave chat</span>
          </v-tooltip>
          <v-tooltip v-if="!isPopout" left>
            <template #activator="{ on, attrs }">
              <v-btn
                color="secondary"
                fab
                x-small
                href="#/popout/monitor"
                target="_blank"
                v-bind="attrs"
                v-on="on"
              >
                <v-icon>mdi-open-in-new</v-icon>
              </v-btn>
            </template>
            <span>Popout</span>
          </v-tooltip>
        </v-speed-dial>
      </v-col>
    </v-row>
    <v-tabs-items v-model="tab">
      <v-tab-item eager>
        <div
          v-if="!isHttps || simpleChatForced"
          ref="chat"
          :key="messages[0] ? messages[0].timestamp : Date.now()"
          class="py-1"
          :style="{
            height: `${height + 20}px`,
            overflow: 'auto',
          }"
        >
          <v-alert v-if="messages.length === 0" text>
            Using simple Twitch Chat Log, because HTTPS is not available. Messages will appear here.
          </v-alert>
          <p v-for="message of messages" :key="message.timestamp" class="chat px-2 my-2">
            <img :src="badge.url" v-for="badge of (message.badges || [])" :key="badge" :title="badge.title"/>
            <span :title="new Date(message.timestamp).toLocaleString()">{{ new Date(message.timestamp).toLocaleTimeString('default', { hour: '2-digit', minute: '2-digit' }) }}</span> <strong class="pl-1" :style="{ color: generateColorFromString(message.username) }">{{ message.username }}</strong>: <span class="pl-1" v-html="message.message" />
          </p>
        </div>
        <iframe
          v-else
          class="enable-transition"
          frameborder="0"
          scrolling="no"
          :src="chatUrl"
          width="100%"
          :height="(height + 15) + 'px'"
        />
      </v-tab-item>
      <v-tab-item eager>
        <div
          v-if="!isHttps"
          ref="chat"
          :key="messages[0] ? messages[0].timestamp : Date.now()"
          :style="{
            height: `${height + 20}px`,
            overflow: 'auto',
          }"
        >
          <v-alert
            v-if="!isHttps"
            border="left"
            color="red"
            icon="mdi-exclamation-thick"
            text
            type="success"
          >
            You need to run bot on HTTPS on port 443 with valid certificate for this embed to be working
          </v-alert>
        </div>
        <iframe
          v-else
          class="enable-transition"
          frameborder="0"
          scrolling="no"
          :src="videoUrl"
          width="100%"
          :height="(height + 15) + 'px'"
        />
      </v-tab-item>
    </v-tabs-items>

    <v-expand-transition>
      <v-card v-if="showJoins || showParts">
        <v-toolbar color="blue-grey darken-4" class="mb-1" height="36">
          <small class="text-button">Chat Events</small>
        </v-toolbar>

        <v-card-text
          style="height: 173px; max-height: 173px; overflow: auto;"
          class="pa-2"
          v-html="
            list.filter(o => {
              if (showJoins && showParts) {
                return true;
              } else if (showJoins) {
                return o.username.startsWith('+');
              } else {
                return o.username.startsWith('-');
              }
            }).map(o => `<span class='${o.username.startsWith('+') ? 'green--text' : 'red--text'} text--lighten-2'>${o.username.substring(1)}</span>`).join(', ')
          "
        />
      </v-card>
    </v-expand-transition>

    <v-overlay v-model="dialog" color="black" absolute class="w-100 px-2">
      <v-textarea v-model="message" auto-grow rows="2" counter label="Bot message" />
      <v-btn color="primary" @click="sendMessage">
        Send message
      </v-btn>
      <v-btn icon @click="dialog=false">
        <v-icon>mdi-close</v-icon>
      </v-btn>
    </v-overlay>
  </v-card>
</template>

<script lang="ts">
import {
  computed, defineComponent, onMounted, onUnmounted, ref, watch,
} from '@nuxtjs/composition-api';
import { getSocket } from '@sogebot/ui-helpers/socket';
import translate from '@sogebot/ui-helpers/translate';
import {
  chunk, flatten, sortedUniq,
} from 'lodash';

import { error } from '~/functions/error';

let interval = 0;

export default defineComponent({
  setup () {
    const tab = ref(Number(localStorage.monitorTab));
    const fab = ref(false);
    watch(tab, (val) => {
      localStorage.monitorTab = String(val);
    });

    const generateColorFromString = (stringInput: string) => {
      const stringUniqueHash = [...stringInput].reduce((acc, char) => {
        return char.charCodeAt(0) + ((acc << 5) - acc);
      }, 0);
      return `hsl(${stringUniqueHash % 360}, 80%, 60%)`;
    };

    const isPopout = computed(() => location.href.includes('popout'));
    const dialog = ref(false);
    const list = ref([] as { username: string; timestamp: number }[]);
    const show = ref('Chat');
    const showJoins = ref(localStorage.showJoins === 'true');
    const showParts = ref(localStorage.showParts === 'true');
    const message = ref('');
    const height = ref(600);
    const room = ref('');
    const chat = ref(null);
    const timestamp = ref(0);
    const chatters = ref([] as string[]);
    const isHttps = computed(() => {
      const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      const isSecureHttp = window.location.protocol === 'https:';
      const isCorrectPort = ['', '443'].includes(window.location.port) && window.location.protocol === 'https:';
      return isLocalhost || (isSecureHttp && isCorrectPort);
    });
    const messages = ref([] as {
      username: string; message: string; timestamp: string; badges: string[];
    }[]);
    const chatUrl = computed(() => {
      return 'https://twitch.tv/embed/'
        + room.value
        + '/chat'
        + '?darkpopout'
        + '&parent=' + window.location.hostname;
    });

    const videoUrl = computed(() => {
      return `${window.location.protocol}//player.twitch.tv/?channel=${room.value}&autoplay=true&muted=true&parent=${window.location.hostname}`;
    });

    watch(showJoins, (val) => {
      localStorage.showJoins = String(val);
      updateHeight();
    });
    watch(showParts, (val) => {
      localStorage.showParts = String(val);
      updateHeight();
    });

    function updateHeight () {
      // so. many. parentElement. to get proper offsetTop as children offset is 0
      const offsetTop = document.getElementById('c7eff6a7-dc62-4c0b-bad6-90df9d5b605f')?.offsetTop || 0;
      const offset = 61 + (showParts.value || showJoins.value ? 200 : 0);
      const newHeight = window.innerHeight - offsetTop - offset;
      height.value = Math.max(newHeight, (showParts.value || showJoins.value) ? 300 : 500);
    }

    onMounted(() => {
      setInterval(() => updateHeight(), 100);

      if (localStorage.simpleChatMessages && localStorage.simpleChatMessagesUpdatedAt) {
        if (Date.now() - Number(localStorage.simpleChatMessagesUpdatedAt) < 1000 * 60 * 60 * 12) {
          messages.value = JSON.parse(localStorage.simpleChatMessages);

          nextTick(() => {
            chat.value.scroll(0, Number.MAX_SAFE_INTEGER);
          });
        }
      }

      interval = window.setInterval(() => {
        refresh();
      }, 60000);

      getSocket('/widgets/chat').emit('room', (err, val) => {
        if (err) {
          return error(err);
        }
        room.value = val;
        refresh();
      });

      getSocket('/widgets/chat').on('message', (data: any) => {
        messages.value = [...messages.value, data];

        // keep only 1000 messages
        while (messages.value.length > 1000) {
          messages.value.shift();
        }

        localStorage.simpleChatMessages = JSON.stringify(messages.value);
        localStorage.simpleChatMessagesUpdatedAt = String(Date.now());
        nextTick(() => {
          chat.value.scroll(0, Number.MAX_SAFE_INTEGER);
        });
      });

      getSocket('/widgets/joinpart').on('joinpart', (data) => {
        for (const [index, username] of Object.entries(data.users)) {
          if (!list.value.find(o => o.username === username)) {
            list.value.push({ username: (data.type === 'join' ? '+' : '-') + username, timestamp: Date.now() + Number(index) });
          }
        }
        list.value = chunk(list.value.sort((a, b) => {
          if (a.timestamp > b.timestamp) {
            return -1;
          }
          if (a.timestamp < b.timestamp) {
            return 1;
          }
          return 0;
        }), 50)[0] || [];
      });
    });

    onUnmounted(() => {
      clearInterval(interval);
    });

    const refresh = () => {
      if (room.value.length > 0) {
        getSocket('/widgets/chat').emit('viewers', (err, data: any) => {
          if (err) {
            return console.error('Server error', err);
          }

          const tempChatters = [];
          for (const chatter of Object.entries(data.chatters).map(o => o[1])) {
            tempChatters.push(chatter as string);
          }
          chatters.value = sortedUniq(flatten(tempChatters));
        });
      }
    };

    const joinChat = () => {
      getSocket('/').emit('joinBot');
    };
    const leaveChat = () => {
      getSocket('/').emit('leaveBot');
    };

    const sendMessage = () => {
      if (message.value.length > 0) {
        getSocket('/widgets/chat').emit('chat.message.send', message.value);
      }
      dialog.value = false;
      message.value = '';
    };

    const simpleChatForced = computed(() => {
      return localStorage.simpleChat !== undefined;
    });

    return {
      isHttps,
      chatUrl,
      messages,
      videoUrl,
      room,
      show,
      chatters,
      dialog,
      message,
      timestamp,
      showJoins,
      showParts,
      height,
      list,
      joinChat,
      leaveChat,
      sendMessage,
      isPopout,
      tab,
      translate,
      chat,
      fab,
      generateColorFromString,
      simpleChatForced,
    };
  },
});
</script>

<style>
.simpleChatImage {
  min-width: 32px;
  min-height: 17px;
  display: inline-block;
  position: relative;
}

.simpleChatImage .emote {
  position: absolute;
  margin-top: 50%;
  transform: translateY(-68%);
}
</style>

<style scoped>
.chat {
  margin-bottom: 5px;
}
</style>
