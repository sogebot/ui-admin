<template>
  <v-card class="fill-height">
    <portal to="navbar">
      <v-btn text :disabled="!$store.state.settings.pending && $store.state.settings.valid" :loading="$store.state.settings.save" @click="$store.commit('settings/save', true)">
        {{ translate('dialog.buttons.saveChanges.idle') }}
      </v-btn>
    </portal>
    <v-card-text class="pa-0">
      <loading v-if="isLoading" />
      <template v-else>
        <v-row no-gutters :style="{'flex-direction': $vuetify.breakpoint.mobile ? undefined : 'row-reverse'}">
          <v-col :cols="$vuetify.breakpoint.mobile ? 12 : 'auto'" style="min-width: 200px;">
            <v-tabs
              ref="tabs"
              :vertical="!$vuetify.breakpoint.mobile"
              show-arrows
            >
              <v-tab :class="{ 'tab-left': !$vuetify.breakpoint.mobile }" v-for="item of menu" :key="item.name" nuxt :to="'/settings/core/' + item.name">{{ item.name }}</v-tab>
            </v-tabs>
          </v-col>
          <v-col>
            <nuxt-child />
          </v-col>
        </v-row>
      </template>
    </v-card-text>
  </v-card>
</template>

<script lang="ts">
import { useRoute, useRouter } from '@nuxtjs/composition-api';
import { getSocket } from '@sogebot/ui-helpers/socket';
import translate from '@sogebot/ui-helpers/translate';
import {
  defineAsyncComponent, defineComponent, nextTick, onMounted, ref,
} from '@vue/composition-api';

import { error } from '~/functions/error';

type systemFromIO = { name: string; enabled: boolean; areDependenciesEnabled: boolean; isDisabledByEnv: boolean };

export default defineComponent({
  components: { loading: defineAsyncComponent(() => import('~/components/loading.vue')) },
  setup () {
    const isLoading = ref(true);
    const menu = ref([] as systemFromIO[]);
    const route = useRoute();
    const router = useRouter();
    const tabs = ref(null);

    onMounted(() => {
      getSocket('/').emit('core', (err: string | null, systems: systemFromIO[]) => {
        if (err) {
          error(err);
          return;
        }
        const sortedSystems = systems.sort((a, b) => {
          return translate('menu.' + a.name).localeCompare(translate('menu.' + b.name));
        });
        const path = route.value.path.split('/');
        if (!sortedSystems.map(o => o.name).includes(path[path.length - 1])) {
          router.push({ name: 'settings-core-' + sortedSystems[0].name });
        }
        menu.value = sortedSystems;
        isLoading.value = false;
      });

      setInterval(() => {
        updateTabWidth();
      }, 1000);
    });

    const updateTabWidth = () => {
      if (tabs.value) {
        (tabs.value as any).callSlider();
      } else {
        nextTick(() => {
          updateTabWidth();
        });
      }
    };
    return {
      isLoading,
      menu,
      tabs,

      // others
      translate,

      // icons
    };
  },
});
</script>
