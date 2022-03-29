<template>
  <span>
    <v-app-bar fixed app dense v-if="!$store.state.panel.breadcrumbsOnlyMobile || ($vuetify.breakpoint.mobile && $store.state.panel.breadcrumbsOnlyMobile)">
      <v-app-bar-nav-icon
        v-if="$vuetify.breakpoint.mobile"
        @click.stop="drawer = !drawer"
      />

      <v-slide-x-transition>
        <v-btn icon v-if="$store.state.panel.back.length > 0" nuxt :to="$store.state.panel.back" color="primary">
          <v-icon>
            mdi-arrow-left
          </v-icon>
        </v-btn>
      </v-slide-x-transition>

      <v-breadcrumbs
        v-if="$store.state.panel.breadcrumbs.length > 0"
        style="position: absolute; transition: all; transition-duration: 0.24s; transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);"
        class="pl-0"
        :style="{
          left: $store.state.panel.back.length > 0
            ? ($vuetify.breakpoint.mobile ? '115px' : '55px')
            : ($vuetify.breakpoint.mobile ? '50px' : '20px')
        }"
        :items="$vuetify.breakpoint.mobile ? [...$store.state.panel.breadcrumbs[$store.state.panel.breadcrumbs.length - 1]] : $store.state.panel.breadcrumbs"
      />

      <v-spacer />
      <portal-target name="navbar"/>
    </v-app-bar>

    <v-navigation-drawer
      v-model="drawer"
      app
      :mini-variant="miniVariant"
      bottom
    >
      <v-toolbar dense class="text-button" color="primary">
        <v-slide-x-transition leave-absolute>
          <span v-if="!miniVariant || $vuetify.breakpoint.mobile">
            {{ name }}
            <version/>
          </span>
        </v-slide-x-transition>
        <template v-if="!$vuetify.breakpoint.mobile">
          <v-spacer v-if="!miniVariant" />
          <v-btn icon small class="ma-auto" @click="miniVariant = !miniVariant">
            <v-icon
              small
              style="transition-property: all; transition-duration: 0.5s;"
              :style="{ 'transform': miniVariant ? 'rotate(180deg)' : 'inherit' }"
            >
              mdi-arrow-collapse-left
            </v-icon>
          </v-btn>
        </template>
      </v-toolbar>
      <user />

      <v-spacer />
      <navmenu />
      <template #append>
        <div v-if="!miniVariant" class="text-center text-caption" @dblclick="setDebug" style="user-select: none;">
          <a href="https://github.com/sogehige/SogeBot">GitHub</a> |
          <a href="https://github.com/sogebot/sogeBot/issues">Issues</a> |
          <a href="https://github.com/sogebot/sogeBot/blob/master/LICENSE">GPL-3.0 License</a>
        </div>
      </template>
    </v-navigation-drawer>
  </span>
</template>

<script lang="ts">
import {
  defineAsyncComponent, defineComponent, onMounted, ref, useContext, useMeta, useRoute, useStore, watch,
} from '@nuxtjs/composition-api';
import { getSocket } from '@sogebot/ui-helpers/socket';
import translate from '@sogebot/ui-helpers/translate';

import { error } from '~/functions/error';

export default defineComponent({
  components: {
    navmenu: defineAsyncComponent(() => import('./menu.vue')),
    version: defineAsyncComponent(() => import('./version.vue')),
    user:    defineAsyncComponent(() => import('../user.vue')),
  },
  setup () {
    const name = ref('');
    const channelName = ref('');
    const drawer = ref(!useContext().$vuetify.breakpoint.mobile);
    const miniVariant = ref(localStorage.miniVariant && !useContext().$vuetify.breakpoint.mobile ? JSON.parse(localStorage.miniVariant) : false);

    const store = useStore<any>();

    watch(miniVariant, (value) => {
      store.commit('setNavbarMiniVariant', value);
      localStorage.miniVariant = JSON.stringify(value);
    }, {
      immediate: true,
    });

    useMeta(() => ({
      title: `${name.value} @ ${channelName.value}`,
    }));

    onMounted(() => {
      console.debug('#route | ' + useRoute().value.name);
      getSocket('/', true).emit('name', (recvName: string) => { name.value = recvName; });
      getSocket('/', true).emit('channelName', (recvName: string) => { channelName.value = recvName; });
    });

    const setDebug = () => {
      getSocket('/').emit('debug::get', (err, debugEnv) => {
        if (err) {
          error(err);
        }
        const debug = prompt('Set debug', debugEnv);
        if (debug !== null) {
          getSocket('/').emit('debug::set', debug, () => {
            return true;
          });
        }
      });
    };

    return {
      name, channelName, drawer, translate, miniVariant, setDebug,
    };
  },
  head: {
  }, // enable useMeta
});
</script>
