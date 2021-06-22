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
        <nuxt-child />
      </template>
    </v-card-text>
  </v-card>
</template>

<script lang="ts">
import {
  useRoute, useRouter, useStore,
} from '@nuxtjs/composition-api';
import { getSocket } from '@sogebot/ui-helpers/socket';
import translate from '@sogebot/ui-helpers/translate';
import {
  defineAsyncComponent, defineComponent, onMounted, ref,
} from '@vue/composition-api';

import { error } from '~/functions/error';

type systemFromIO = { name: string; enabled: boolean; areDependenciesEnabled: boolean; isDisabledByEnv: boolean };

export default defineComponent({
  components: { loading: defineAsyncComponent(() => import('~/components/loading.vue')) },
  setup () {
    const store = useStore();
    const isLoading = ref(true);
    const menu = ref([] as systemFromIO[]);
    const route = useRoute();
    const router = useRouter();
    const tabs = ref(null);

    onMounted(() => {
      store.commit('panel/breadcrumbs', [
        { text: translate('menu.settings') },
        { text: translate('menu.systems') },
      ]);
      getSocket('/').emit('systems', (err: string | null, systems: systemFromIO[]) => {
        if (err) {
          error(err);
          return;
        }
        const sortedSystems = systems.sort((a, b) => {
          return translate('menu.' + a.name).localeCompare(translate('menu.' + b.name));
        });
        const path = route.value.path.split('/');
        if (!sortedSystems.map(o => o.name).includes(path[path.length - 1]) && path[path.length - 1] !== 'status') {
          router.push({ name: 'settings-systems-status' });
        }
        menu.value = sortedSystems;
        isLoading.value = false;
      });
    });

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
