<template>
  <span>
    <v-app-bar fixed app dense v-if="!$store.state.panel.breadcrumbsOnlyMobile || ($vuetify.breakpoint.mobile && $store.state.panel.breadcrumbsOnlyMobile)">
      <v-app-bar-nav-icon
        v-if="$vuetify.breakpoint.mobile"
        @click.stop="drawer = !drawer"
      />

      <v-btn icon v-if="$store.state.panel.back.length > 0" nuxt :to="$store.state.panel.back" color="primary" class="mr-1">
        <v-icon>
          {{ mdiArrowLeft }}
        </v-icon>
      </v-btn>
      <v-breadcrumbs
        class="pl-0"
        :items="$vuetify.breakpoint.mobile ? [...$store.state.panel.breadcrumbs[$store.state.panel.breadcrumbs.length - 1]] : $store.state.panel.breadcrumbs"
      />
      <v-spacer />
      <portal-target name="navbar"/>
    </v-app-bar>

    <v-navigation-drawer
      v-model="drawer"
      app
      :mini-variant.sync="miniVariant"
      bottom
    >
      <v-toolbar dense class="text-button" color="primary">
        <v-slide-x-transition leave-absolute>
          <span v-if="!miniVariant || $vuetify.breakpoint.mobile">{{ name }}</span>
        </v-slide-x-transition>
        <template v-if="!$vuetify.breakpoint.mobile">
          <v-spacer v-if="!miniVariant" />
          <v-btn icon small class="ma-auto" @click="miniVariant = !miniVariant">
            <v-icon
              small
              style="transition-property: all; transition-duration: 0.5s;"
              :style="{ 'transform': miniVariant ? 'rotate(180deg)' : 'inherit' }"
            >
              {{ mdiArrowCollapseLeft }}
            </v-icon>
          </v-btn>
        </template>
      </v-toolbar>
      <user />

      <v-spacer />
      <navmenu />
      <template #append>
        <div v-if="!miniVariant" class="text-center text-caption">
          <a href="https://github.com/sogehige/SogeBot">GitHub</a> |
          <a href="https://github.com/sogehige/SogeBot/issues">Issues</a> |
          <a href="https://github.com/sogehige/SogeBot/blob/master/LICENSE">GPL-3.0 License</a>
        </div>
      </template>
    </v-navigation-drawer>
  </span>
</template>

<script lang="ts">
import { mdiArrowCollapseLeft, mdiArrowLeft } from '@mdi/js';
import {
  defineAsyncComponent, defineComponent, onMounted, ref, useContext, useMeta, useRoute,
} from '@nuxtjs/composition-api';
import { getSocket } from '@sogebot/ui-helpers/socket';
import translate from '@sogebot/ui-helpers/translate';

const navmenu = defineAsyncComponent({ loader: () => import('./menu.vue') });
const user = defineAsyncComponent({ loader: () => import('../user.vue') });

export default defineComponent({
  components: {
    navmenu,
    user,
  },
  setup () {
    const name = ref('');
    const channelName = ref('');
    const drawer = ref(!useContext().$vuetify.breakpoint.mobile);
    const miniVariant = ref(false);

    useMeta(() => ({ title: `${name.value} @ ${channelName.value}` }));

    onMounted(() => {
      console.debug('#route | ' + useRoute().value.name);
      const socket = getSocket('/', true);
      socket.emit('name', (recvName: string) => { name.value = recvName; });
      socket.emit('channelName', (recvName: string) => { channelName.value = recvName; });
    });

    return {
      name, channelName, drawer, translate, miniVariant, mdiArrowCollapseLeft, mdiArrowLeft,
    };
  },
  head: {}, // enable useMeta
});
</script>
