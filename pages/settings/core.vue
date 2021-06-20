<template>
  <v-card class="fill-height">
    <v-toolbar v-if="!$vuetify.breakpoint.mobile" dense color="dark">
      <v-breadcrumbs
        class="pl-0"
        :items="breadcrumbs"
      />
      <v-spacer />
      <v-btn text :disabled="!$store.state.settings.pending" :loading="$store.state.settings.save" @click="$store.commit('settings/save', true)">
        {{ translate('dialog.buttons.saveChanges.idle') }}
      </v-btn>
    </v-toolbar>
    <v-card-text class="pa-0">
      <loading v-if="isLoading" />
      <template v-else>
        <v-tabs centered grow dense>
          <v-tab v-for="item of menu" :key="item.name" nuxt :to="'/settings/core/' + item.name">{{ item.name }}</v-tab>
        </v-tabs>
        <nuxt-child />
      </template>
    </v-card-text>
  </v-card>
</template>

<script lang="ts">
import { useRoute, useRouter } from '@nuxtjs/composition-api';
import { getSocket } from '@sogebot/ui-helpers/socket';
import translate from '@sogebot/ui-helpers/translate';
import {
  defineAsyncComponent, defineComponent, onMounted, ref, watch,
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

    const breadcrumbs = ref([
      { text: 'Settings' },
      { text: translate('menu.core') },
    ]);

    watch(route, (val) => {
      const path = val.path.split('/');
      const currentSystem = path[path.length - 1];
      breadcrumbs.value.length = 2;
      breadcrumbs.value.push({ text: translate('menu.' + currentSystem) });
    });

    onMounted(() => {
      getSocket('/').emit('core', (err: string | null, systems: systemFromIO[]) => {
        if (err) {
          error(err);
          return;
        }
        const sortedSystems = systems.sort((a, b) => {
          return translate('menu.' + a.name).localeCompare(translate('menu.' + b.name));
        });
        if (!sortedSystems.map(o => o.name).includes(route.value.params.id)) {
          router.push({ name: 'settings-core-' + sortedSystems[0].name });
          // this.loadSettings(sortedSystems[0].name);
        } else if (route.value.params.id) {
          // this.loadSettings(route.value.params.id);
        }
        menu.value = sortedSystems;
        isLoading.value = false;
      });
    });

    return {
      breadcrumbs,
      isLoading,
      menu,

      // others
      translate,

      // icons
    };
  },
});
</script>
