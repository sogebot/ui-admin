<template>
  <loading v-if="isLoading" />
  <div v-else>
    <portal to="navbar" v-if="route.path.split('/').length === 4">
      <transition appear name="fade">
        <v-btn text :disabled="!$store.state.settings.pending && $store.state.settings.valid" :loading="$store.state.settings.save" @click="$store.commit('settings/save', true)">
          {{ translate('dialog.buttons.saveChanges.idle') }}
        </v-btn>
      </transition>
    </portal>
    <v-navigation-drawer
      right
      :width="$vuetify.breakpoint.mobile ? '100%' : '60%'"
      absolute
      hide-overlay
      v-model="drawer"
    >
      <nuxt-child/>
    </v-navigation-drawer>
    <v-card v-for="type of Object.keys(menu)" flat :key="type">
      <v-card-title>
        <h2 class="text-capitalize">{{type}}</h2>
      </v-card-title>
      <v-card-text>
        <v-data-iterator
          :items="menu[type]"
          item-key="name"
          :items-per-page="-1"
          hide-default-footer
        >
          <template v-slot:default="{ items }">
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
                    <v-simple-checkbox color="success" v-if="item.enabled !== undefined" v-model="item.enabled"/>
                    <v-btn icon nuxt :to="`/settings/modules/${item.name}`" v-if="hasSettings(item.name)"><v-icon>{{ mdiCog }}</v-icon></v-btn>
                  </v-toolbar>
                  <v-card-subtitle class="pa-1" v-if="item.areDependenciesEnabled !== undefined && (item.isDisabledByEnv || !item.areDependenciesEnabled)">
                    <v-alert class="ma-0" dense border="left" text color="error" v-if="item.isDisabledByEnv">Disabled by ENV variable</v-alert>
                    <v-alert class="ma-0" dense border="left" text color="error" v-if="!item.areDependenciesEnabled">Dependency system is disabled.</v-alert>
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
import {
  useRoute, useRouter, useStore,
} from '@nuxtjs/composition-api';
import { getSocket } from '@sogebot/ui-helpers/socket';
import translate from '@sogebot/ui-helpers/translate';
import {
  defineComponent, nextTick, onMounted, ref, watch,
} from '@vue/composition-api';

import { error } from '~/functions/error';

type systemFromIO = { name: string; enabled: boolean; areDependenciesEnabled: boolean; isDisabledByEnv: boolean };

export default defineComponent({
  setup () {
    const store = useStore<any>();
    const isLoading = ref(true);
    const router = useRouter();
    const route = useRoute();
    const drawer = ref(false);
    const menu = ref({
      core:         [] as systemFromIO[],
      systems:      [] as systemFromIO[],
      integrations: [] as systemFromIO[],
      games:        [] as systemFromIO[],
      overlays:     [] as systemFromIO[],
    });

    const hasSettings = (itemName: string) => {
      return router.resolve('/settings/modules/' + itemName).resolved.matched.length > 0;
    };

    watch(route, (val) => {
      drawer.value = val.path.split('/').length === 4;

      if (drawer.value) {
        nextTick(() => {
          store.commit('panel/back', '/settings/modules');
        });
      }
    }, { immediate: true });

    watch(drawer, (val) => {
      if (!val) {
        router.push('/settings/modules');
      }
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
      route,
      hasSettings,
    };
  },
});
</script>
