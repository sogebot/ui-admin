<template>
  <span>
    <v-app-bar v-if="$vuetify.breakpoint.mobile" fixed app dense>
      <v-app-bar-nav-icon
        @click.stop="drawer = !drawer"
      />
      <v-toolbar-title>{{ translate('menu.' + routeMapper.get($route.name.toLowerCase())) }}</v-toolbar-title>
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
import { mdiArrowCollapseLeft } from '@mdi/js';
import { getSocket } from '@sogebot/ui-helpers/socket';
import translate from '@sogebot/ui-helpers/translate';
import {
  defineAsyncComponent, defineComponent, onMounted, ref,
} from '@vue/composition-api';

const navmenu = defineAsyncComponent({ loader: () => import('./menu.vue') });
const user = defineAsyncComponent({ loader: () => import('../user.vue') });

const routeMapper = new Map<string, string>([
  ['index', 'dashboard'],
  ['manage-alias', 'alias'],
  ['manage-botcommands', 'botcommands'],
  ['manage-commands', 'customcommands'],
  ['manage-cooldowns', 'cooldown'],
  ['manage-keywords', 'keywords'],
  ['manage-price', 'price'],
  ['manage-polls', 'polls'],
  ['manage-quotes', 'quotes'],
  ['manage-ranks', 'ranks'],
  ['manage-timers', 'timers'],
  ['manage-viewers', 'viewers'],
  ['manage-spotify-bannedsongs', 'spotifybannedsongs'],
  ['manage-songs-bannedsongs', 'bannedsongs'],
  ['manage-songs-playlist', 'playlist'],
  ['manage-events', 'event-listeners'],
  ['manage-highlights', 'highlights'],
  ['manage-hltb', 'howlongtobeat'],
  ['registry-customvariables', 'custom-variables'],
  ['registry-textoverlay', 'textoverlay'],
  ['registry-gallery', 'gallery'],
  ['registry-carousel', 'carousel'],
  ['registry-goals', 'goals'],
  ['registry-obswebsocket', 'obswebsocket'],
  ['registry-randomizer', 'randomizer'],
  ['registry-alerts', 'alerts'],
  ['stats-api', 'api'],
  ['stats-bits', 'bits'],
  ['stats-tips', 'tips'],
  ['stats-commandcount', 'commandcount'],
  ['stats-profiler', 'profiler'],
  ['stats-api-explorer', 'api-explorer'],
]);

export default defineComponent({
  components: {
    navmenu,
    user,
  },
  setup (_, ctx) {
    const name = ref('');
    const channelName = ref('');
    const drawer = ref(!(ctx.root as any).$vuetify.breakpoint.mobile);
    const miniVariant = ref(false);

    onMounted(() => {
      console.debug('#route | ' + ctx.root.$route.name);
      const socket = getSocket('/', true);
      socket.emit('name', (recvName: string) => { name.value = recvName; });
      socket.emit('channelName', (recvName: string) => { channelName.value = recvName; });
    });

    return {
      name, channelName, drawer, translate, routeMapper, miniVariant, mdiArrowCollapseLeft,
    };
  },
  head () {
    return { title: `${this.name as string} @ ${this.channelName as string}` };
  },
});
</script>
