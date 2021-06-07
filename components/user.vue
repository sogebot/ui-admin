<template>
  <v-list
    nav
    dense
  >
    <template v-if="isViewerLoaded && $store.state.loggedUser">
      <v-menu
        v-model="menu"
        :close-on-content-click="false"
        :nudge-width="200"
        offset-x
      >
        <template #activator="{ on, attrs }">
          <v-list-item
            class="px-0"
            style="height: 72px;"
            v-bind="attrs"
            v-on="on"
          >
            <v-list-item-avatar>
              <v-avatar>
                <v-img :src="$store.state.loggedUser.profile_image_url" />
              </v-avatar>
            </v-list-item-avatar>
            <v-list-item-content>
              <v-list-item-title>{{ $store.state.loggedUser.login }}</v-list-item-title>
              <v-list-item-subtitle v-if="viewer.permission">
                {{ viewer.permission.name }}
              </v-list-item-subtitle>
            </v-list-item-content>
          </v-list-item>
        </template>

        <v-card>
          <v-list>
            <v-list-item>
              <v-list-item-avatar>
                <v-avatar>
                  <v-img :src="$store.state.loggedUser.profile_image_url" />
                </v-avatar>
              </v-list-item-avatar>

              <v-list-item-content>
                <v-list-item-title>{{ $store.state.loggedUser.login }}</v-list-item-title>
                <v-list-item-subtitle v-if="viewer.permission">
                  {{ viewer.permission.name }}
                </v-list-item-subtitle>
                <v-list-item-subtitle>
                  <v-chip
                    v-for="k of viewerIs"
                    :key="k"
                    x-small
                    pill
                    color="orange"
                  >
                    {{ k }}
                  </v-chip>
                </v-list-item-subtitle>
              </v-list-item-content>
            </v-list-item>
          </v-list>

          <v-divider />

          <v-container>
            <v-row>
              <v-col class="font-weight-medium text-center pa-1">
                {{ Intl.NumberFormat($store.state.configuration.lang).format(viewer.points) }}
                <div class="font-weight-thin">
                  {{ translate('points') }}
                </div>
              </v-col>
              <v-col class="font-weight-medium text-center pa-1">
                {{ Intl.NumberFormat($store.state.configuration.lang).format(viewer.messages) }}
                <div class="font-weight-thin">
                  {{ translate('messages') }}
                </div>
              </v-col>
              <v-col class="font-weight-medium text-center pa-1">
                {{ Intl.NumberFormat($store.state.configuration.lang).format(viewer.aggregatedBits) }}
                <div class="font-weight-thin">
                  {{ translate('bits') }}
                </div>
              </v-col>
            </v-row>
            <v-row>
              <v-col class="font-weight-medium text-center pa-1">
                {{ Intl.NumberFormat($store.state.configuration.lang, { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(viewer.watchedTime / 1000 / 60 / 60) }} h
                <div class="font-weight-thin">
                  {{ translate('watched-time') }}
                </div>
              </v-col>
              <v-col class="font-weight-medium text-center pa-1">
                {{ Intl.NumberFormat($store.state.configuration.lang, { style: 'currency', currency: $store.state.configuration.currency }).format(viewer.aggregatedTips) }}
                <div class="font-weight-thin">
                  {{ translate('tips') }}
                </div>
              </v-col>
              <v-col class="font-weight-medium text-center pa-1" />
            </v-row>
          </v-container>

          <v-card-actions>
            <v-spacer />

            <v-btn
              text
              @click="menu = false"
            >
              {{ translate('close') }}
            </v-btn>
            <v-btn
              color="danger"
              text
              @click="logout"
            >
              <v-icon class="red--text">
                {{ mdiLogout }}
              </v-icon>
              {{ translate('logout') }}
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-menu>

      <v-list-item
        v-if="!isPublicPage"
        href="/public/"
        class="mt-3"
      >
        <v-list-item-icon>
          <v-icon>{{ mdiEarth }}</v-icon>
        </v-list-item-icon>
        <v-list-item-title>{{ translate('go-to-public') }}</v-list-item-title>
      </v-list-item>
      <v-list-item
        v-if="isPublicPage && viewer.permission.id === defaultPermissions.CASTERS"
        href="/"
        class="mt-3"
      >
        <v-list-item-icon>
          <v-icon>{{ mdiShield }}</v-icon>
        </v-list-item-icon>
        <v-list-item-title>{{ translate('go-to-admin') }}</v-list-item-title>
      </v-list-item>
    </template>
    <template v-else>
      <v-list-item @click="login">
        <v-list-item-icon>
          <v-icon>{{ mdiLogin }}</v-icon>
        </v-list-item-icon>
        <v-list-item-title>{{ translate('not-logged-in') }}</v-list-item-title>
      </v-list-item>
    </template>
  </v-list>
</template>

<script lang="ts">
import {
  mdiEarth, mdiLogin, mdiLogout, mdiShield,
} from '@mdi/js';
import { defaultPermissions } from '@sogebot/ui-helpers/permissions/defaultPermissions';
import { getSocket } from '@sogebot/ui-helpers/socket';
import translate from '@sogebot/ui-helpers/translate';
import type { Ref } from '@vue/composition-api';
import {
  computed, defineComponent, onMounted, onUnmounted, ref,
} from '@vue/composition-api';

import type { PermissionsInterface } from '../.bot/src/bot/database/entity/permissions';
import type { UserInterface } from '../.bot/src/bot/database/entity/user';

let interval = 0;

export default defineComponent({
  setup (_props, context) {
    const menu = ref(false);
    const isViewerLoaded = ref(false);
    const viewer: Ref<(Required<UserInterface> & { aggregatedTips: number; aggregatedBits: number; permission: PermissionsInterface }) | null> = ref(null);
    const viewerIs = computed(() => {
      const status: string[] = [];
      const isArray = ['isFollower', 'isSubscriber', 'isVIP'] as const;
      isArray.forEach((item: typeof isArray[number]) => {
        if (viewer.value && viewer.value[item]) {
          status.push(item.replace('is', ''));
        }
      });
      return status;
    });
    const isPublicPage = computed(() => window.location.href.includes('public'));

    onMounted(() => {
      refreshViewer();
      interval = window.setInterval(() => {
        refreshViewer();
      }, 60000);
    });
    onUnmounted(() => clearInterval(interval));

    const logout = () => {
      const socket = getSocket('/core/users', true);
      socket.emit('logout', {
        accessToken:  localStorage.getItem('accessToken'),
        refreshToken: localStorage.getItem('refreshToken'),
      });
      localStorage.setItem('code', '');
      localStorage.setItem('accessToken', '');
      localStorage.setItem('refreshToken', '');
      localStorage.setItem('userType', 'unauthorized');
      window.location.assign(window.location.origin + '/credentials/login#error=logged+out');
    };
    const login = () => window.location.assign(window.location.origin + '/credentials/login');
    const refreshViewer = () => {
      if (typeof (context.root as any).$store.state.loggedUser === 'undefined' || (context.root as any).$store.state.loggedUser === null) {
        return;
      }
      const socket = getSocket('/core/users', true);
      socket.emit('viewers::findOne', (context.root as any).$store.state.loggedUser.id, (err: string| number, recvViewer: Readonly<Required<UserInterface>> & { aggregatedTips: number; aggregatedBits: number; permission: PermissionsInterface }) => {
        if (err) {
          return console.error(err);
        }
        if (recvViewer) {
          console.log('Logged in as', recvViewer);
          viewer.value = recvViewer;
          isViewerLoaded.value = true;
        } else {
          console.error('Cannot find user data, try to write something in chat to load data');
        }
      });
    };

    const joinBot = () => {
      const socket = getSocket('/core/users', true);
      socket.emit('joinBot');
    };
    const leaveBot = () => {
      const socket = getSocket('/core/users', true);
      socket.emit('leaveBot');
    };

    return {
      menu,
      defaultPermissions,
      isViewerLoaded,
      viewer,
      viewerIs,
      isPublicPage,
      logout,
      login,
      translate,
      joinBot,
      leaveBot,

      mdiLogout,
      mdiShield,
      mdiLogin,
      mdiEarth,

    };
  },
});
</script>

<style>
.v-speed-dial__list {
  width: auto;
}
</style>
