<template>
  <loading v-if="isLoading" />
  <div v-else>
    <v-navigation-drawer
      v-model="drawer"
      temporary
      right
      absolute
      app
    >
      <nuxt-child />
    </v-navigation-drawer>
    <v-card v-for="type of Object.keys(menu)" :key="type" flat>
      <v-card-title>
        <h2 class="text-capitalize">
          {{ type }}
        </h2>
      </v-card-title>
      <v-card-text>
        <v-data-iterator
          :items="menu[type]"
          item-key="name"
          :items-per-page="-1"
          hide-default-footer
        >
          <template #default="{ items }">
            <v-row dense>
              <v-col
                v-for="item in items"
                :key="item.name"
                cols="3"
                class="fill-height"
              >
                <v-card class="fill-height">
                  <v-toolbar dense color="blue-grey darken-4">
                    <v-toolbar-title class="text-button">
                      {{ item.name }}
                    </v-toolbar-title>
                    <v-spacer />
                    <v-simple-checkbox v-if="item.enabled !== undefined" v-model="item.enabled" color="success" />
                    <v-btn icon nuxt :to="`/settings/${type}/${item.name}`">
                      <v-icon>{{ mdiCog }}</v-icon>
                    </v-btn>
                  </v-toolbar>
                  <v-card-subtitle v-if="item.areDependenciesEnabled !== undefined && (item.isDisabledByEnv || !item.areDependenciesEnabled)" class="pa-1">
                    <v-alert
                      v-if="item.isDisabledByEnv"
                      class="ma-0"
                      dense
                      border="left"
                      text
                      color="error"
                    >
                      Disabled by ENV variable
                    </v-alert>
                    <v-alert
                      v-if="!item.areDependenciesEnabled"
                      class="ma-0"
                      dense
                      border="left"
                      text
                      color="error"
                    >
                      Dependency system is disabled.
                    </v-alert>
                  </v-card-subtitle>
                </v-card>
              </v-col>
            </v-row>
          </template>
        </v-data-iterator>
      </v-card-text>
    </v-card>
  </div>
</template>

<script lang="ts">
import { mdiCog } from '@mdi/js';
import { useStore } from '@nuxtjs/composition-api';
import { getSocket } from '@sogebot/ui-helpers/socket';
import translate from '@sogebot/ui-helpers/translate';
import {
  defineComponent, onMounted, ref, watch,
} from '@vue/composition-api';

import { error } from '~/functions/error';

type systemFromIO = { name: string; enabled: boolean; areDependenciesEnabled: boolean; isDisabledByEnv: boolean };

export default defineComponent({
  setup () {
    const store = useStore<any>();
    const isLoading = ref(true);
    const drawer = ref(false);
    const menu = ref({
      core:         [] as systemFromIO[],
      systems:      [] as systemFromIO[],
      integrations: [] as systemFromIO[],
      games:        [] as systemFromIO[],
    });

    watch(menu, (val) => {
      isLoading.value = true;
      for (const type of Object.keys(val)) {
        if (val[type as keyof typeof val].length === 0) {
          return;
        }
      }
      isLoading.value = false;
    });

    onMounted(() => {
      store.commit('panel/breadcrumbs', [
        { text: translate('menu.settings') },
      ]);

      for (const type of Object.keys(menu.value)) {
        getSocket('/').emit(type, (err: string | null, systems: systemFromIO[]) => {
          if (err) {
            error(err);
            return;
          }
          menu.value[type as keyof typeof menu.value] = systems.sort((a, b) => {
            return translate('menu.' + a.name).localeCompare(translate('menu.' + b.name));
          });
          isLoading.value = false;
        });
      }
    });

    return {
      isLoading,
      drawer,
      translate,
      menu,
      mdiCog,
    };
  },
});
</script>
