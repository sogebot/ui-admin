<template>
  <v-card id="c7eff6a7-dc61-4c0b-bad6-90df9d5b605f" :key="timestamp" width="100%">
    <v-toolbar color="blue-grey darken-4" class="mb-1" height="36">
      <v-toolbar-title class="text-button">
        Chat
      </v-toolbar-title>
      <v-spacer />
      <v-btn icon @click="timestamp = Date.now()">
        <v-icon>{{ mdiRefresh }}</v-icon>
      </v-btn>
      <v-btn icon :color="showJoins ? 'green lighten-1' : 'red lighten-1'" @click="showJoins = !showJoins">
        <v-icon>{{ mdiAccountPlus }}</v-icon>
      </v-btn>
      <v-btn icon :color="showParts ? 'green lighten-1' : 'red lighten-1'" @click="showParts = !showParts">
        <v-icon>{{ mdiAccountMinus }}</v-icon>
      </v-btn>
      <v-btn icon @click="dialog = true">
        <v-icon>{{ mdiCommentPlus }}</v-icon>
      </v-btn>
    </v-toolbar>
    <v-alert v-if="!isHttps" color="error">
      You need to run bot on HTTPS on port 443 with valid certificate for this embed to be working
    </v-alert>

    <iframe
      v-else
      class="enable-transition"
      frameborder="0"
      scrolling="no"
      :src="chatUrl"
      width="100%"
      :height="height + 'px'"
    />

    <v-expand-transition>
      <v-card v-if="showJoins || showParts" height="200px">
        <v-toolbar color="blue-grey darken-4" class="mb-1" height="36">
          <small class="text-button">Chat Events</small>
        </v-toolbar>

        <v-card-text
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
      <v-btn color="primary">
        Send message
      </v-btn>
      <v-btn icon @click="dialog=false">
        <v-icon>{{ mdiClose }}</v-icon>
      </v-btn>
    </v-overlay>
  </v-card>
</template>

<script lang="ts">
import {
  mdiAccountMinus, mdiAccountPlus, mdiClose, mdiCommentPlus, mdiRefresh,
} from '@mdi/js';
import { getSocket } from '@sogebot/ui-helpers/socket';
import {
  computed, defineComponent, onMounted, onUnmounted, ref, watch,
} from '@vue/composition-api';
import {
  chunk, flatten, sortedUniq,
} from 'lodash';

import { error } from '~/functions/error';

let interval = 0;

export default defineComponent({
  setup () {
    const dialog = ref(false);
    const list = ref([] as { username: string; timestamp: number }[]);
    const showJoins = ref(localStorage.showJoins === 'true');
    const showParts = ref(localStorage.showParts === 'true');
    const message = ref('');
    const height = ref(600);
    const room = ref('');
    const timestamp = ref(0);
    const chatters = ref([] as string[]);
    const isHttps = computed(() => {
      const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      const isSecureHttp = window.location.protocol === 'https:';
      const isCorrectPort = ['', '443'].includes(window.location.port) && window.location.protocol === 'https:';
      return isLocalhost || (isSecureHttp && isCorrectPort);
    });
    const chatUrl = computed(() => {
      return 'https://twitch.tv/embed/'
        + room.value
        + '/chat'
        + '?darkpopout'
        + '&parent=' + window.location.hostname;
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
      const offsetTop = document.getElementById('c7eff6a7-dc61-4c0b-bad6-90df9d5b605f')?.offsetTop || 0;
      const offset = 61 + (showParts.value || showJoins.value ? 200 : 0);
      const newHeight = window.innerHeight - offsetTop - offset;
      height.value = Math.max(newHeight, (showParts.value || showJoins.value) ? 300 : 500);
    }

    onMounted(() => {
      setInterval(() => updateHeight(), 100);

      interval = window.setInterval(() => {
        refresh();
      }, 60000);

      getSocket('/widgets/chat').emit('room', (err: string | null, val: string) => {
        if (err) {
          return error(err);
        }
        room.value = val;
        refresh();
      });

      getSocket('/widgets/joinpart').on('joinpart', (data: { users: string[], type: 'join' | 'part' }) => {
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
        getSocket('/widgets/chat').emit('viewers', (err: string | null, data: any) => {
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

    return {
      isHttps,
      chatUrl,
      room,
      chatters,
      dialog,
      message,
      timestamp,
      showJoins,
      showParts,
      height,
      list,
      mdiRefresh,
      mdiClose,
      mdiCommentPlus,
      mdiAccountPlus,
      mdiAccountMinus,
    };
  },
});
</script>
