<template>
  <div>
    <v-row no-gutters class="flex-nowrap">
      <v-col v-if="!isPopout" cols="auto" order="last" class="flex-grow-0">
        <div class="blue-grey darken-4">
          <v-tooltip bottom>
            <template #activator="{ on, attrs }">
              <v-btn icon v-bind="attrs" href="#/popout/dashboard" target="_blank" v-on="on">
                <v-icon>{{ mdiOpenInNew }}</v-icon>
              </v-btn>
            </template>
            <span>Popout</span>
          </v-tooltip>
        </div>
      </v-col>
      <v-col cols="12" class="flex-shrink-1 flex-grow-0" style="min-width: 100px; max-width: 100%">
        <v-tabs v-model="tab" height="36" background-color="blue-grey darken-4" center-active>
          <v-tab>{{ translate('widget-title-eventlist') }}</v-tab>
          <v-tab v-if="$store.state.$systems.find(o => o.name === 'songs').enabled">
            {{ translate('widget-title-ytplayer') }}
          </v-tab>
          <v-tab v-if="$store.state.$systems.find(o => o.name === 'queue').enabled">
            {{ translate('widget-title-queue') }}
          </v-tab>
          <v-tab v-if="$store.state.$systems.find(o => o.name === 'raffles').enabled">
            {{ translate('widget-title-raffles') }}
          </v-tab>
          <v-tab v-if="$store.state.$integrations.find(o => o.name === 'twitter').enabled">
            {{ translate('widget-title-social') }}
          </v-tab>
          <v-tab v-if="$store.state.$systems.find(o => o.name === 'checklist').enabled">
            {{ translate('menu.checklist') }}
          </v-tab>
          <v-tab>
            {{ translate('widget-title-custom') }}
          </v-tab>
        </v-tabs>
      </v-col>
    </v-row>
    <v-tabs-items id="widget-tab-items" v-model="tab" :style="{ height: `${height}px` }">
      <v-tab-item>
        <events />
      </v-tab-item>
      <v-tab-item v-if="$store.state.$systems.find(o => o.name === 'songs').enabled">
        <ytplayer />
      </v-tab-item>
      <v-tab-item v-if="$store.state.$systems.find(o => o.name === 'queue').enabled">
        <queue />
      </v-tab-item>
      <v-tab-item v-if="$store.state.$systems.find(o => o.name === 'raffles').enabled">
        <raffles />
      </v-tab-item>
      <v-tab-item v-if="$store.state.$integrations.find(o => o.name === 'twitter').enabled">
        <social />
      </v-tab-item>
      <v-tab-item v-if="$store.state.$systems.find(o => o.name === 'checklist').enabled">
        <checklist />
      </v-tab-item>
      <v-tab-item>
        <custom />
      </v-tab-item>
    </v-tabs-items>
  </div>
</template>

<script lang="ts">
import { mdiOpenInNew } from '@mdi/js';
import {
  computed,
  defineAsyncComponent, defineComponent, onMounted, ref, useContext, watch,
} from '@nuxtjs/composition-api';
import translate from '@sogebot/ui-helpers/translate';

export default defineComponent({
  components: {
    events:    defineAsyncComponent({ loader: () => import('~/components/widgets/events.vue') }),
    checklist: defineAsyncComponent({ loader: () => import('~/components/widgets/checklist.vue') }),
    ytplayer:  defineAsyncComponent({ loader: () => import('~/components/widgets/ytplayer.vue') }),
    queue:     defineAsyncComponent({ loader: () => import('~/components/widgets/queue.vue') }),
    raffles:   defineAsyncComponent({ loader: () => import('~/components/widgets/raffles.vue') }),
    social:    defineAsyncComponent({ loader: () => import('~/components/widgets/social.vue') }),
    custom:    defineAsyncComponent({ loader: () => import('~/components/widgets/custom.vue') }),
  },
  setup () {
    const tab = ref(Number(localStorage.dashboardTab));
    const isPopout = computed(() => location.href.includes('popout'));
    const height = ref(0);
    const ctx = useContext();

    function updateHeight () {
      // so. many. parentElement. to get proper offsetTop as children offset is 0
      const offsetTop = document.getElementById('widget-tab-items')?.parentElement?.offsetTop || 0;
      const offset = ctx.$vuetify.breakpoint.mobile ? 45 + 48 : 45;
      const newHeight = window.innerHeight - offsetTop - offset;
      height.value = Math.max(newHeight, 300);
    }

    onMounted(() => {
      setTimeout(() => { updateHeight(); }, 300);
      window.addEventListener('resize', updateHeight);
    });

    watch(tab, (val) => {
      localStorage.dashboardTab = String(val);
    });

    return {
      translate, tab, mdiOpenInNew, isPopout, height,
    };
  },
});
</script>
