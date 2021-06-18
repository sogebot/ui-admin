<template>
  <div>
    <v-tabs
      v-model="tab"
      height="36"
      background-color="blue-grey darken-4"
    >
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
      <v-tab>
        {{ translate('widget-title-custom') }}
      </v-tab>
      <v-spacer />
      <v-tooltip v-if="!isPopout" bottom>
        <template #activator="{ on, attrs }">
          <v-btn
            icon
            v-bind="attrs"
            href="#/popout/dashboard"
            target="_blank"
            v-on="on"
          >
            <v-icon>{{ mdiOpenInNew }}</v-icon>
          </v-btn>
        </template>
        <span>Popout</span>
      </v-tooltip>
    </v-tabs>
    <v-tabs-items v-model="tab">
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
  defineAsyncComponent, defineComponent, ref, watch,
} from '@nuxtjs/composition-api';
import translate from '@sogebot/ui-helpers/translate';

export default defineComponent({
  components: {
    events:   defineAsyncComponent({ loader: () => import('~/components/widgets/events.vue') }),
    ytplayer: defineAsyncComponent({ loader: () => import('~/components/widgets/ytplayer.vue') }),
    queue:    defineAsyncComponent({ loader: () => import('~/components/widgets/queue.vue') }),
    raffles:  defineAsyncComponent({ loader: () => import('~/components/widgets/raffles.vue') }),
    social:   defineAsyncComponent({ loader: () => import('~/components/widgets/social.vue') }),
    custom:   defineAsyncComponent({ loader: () => import('~/components/widgets/custom.vue') }),
  },
  setup () {
    const tab = ref(Number(localStorage.dashboardTab));
    const isPopout = computed(() => location.href.includes('popout'));

    watch(tab, (val) => {
      localStorage.dashboardTab = String(val);
    });

    return {
      translate, tab, mdiOpenInNew, isPopout,
    };
  },
});
</script>
