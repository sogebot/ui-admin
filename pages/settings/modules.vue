<template>
  <loading v-if="isLoading" />
  <div v-else>
    <portal to="navbar" v-if="route.path.split('/').length === 5">
      <transition appear name="fade">
        <v-btn
          small
          :text="!$vuetify.breakpoint.xs"
          :icon="$vuetify.breakpoint.xs"
          :disabled="!$store.state.settings.pending || !$store.state.settings.valid"
          :loading="$store.state.settings.save"
          @click="$store.commit('settings/save', true)"
        >
          <v-icon class="d-flex d-sm-none">{{ mdiFloppy }}</v-icon>
          <span class="d-none d-sm-flex">{{ translate('dialog.buttons.saveChanges.idle') }}</span>
        </v-btn>
      </transition>
    </portal>
    <v-navigation-drawer
      class="fullscreen-drawer"
      right
      :width="$vuetify.breakpoint.mobile ? '100%' : '100%'"
      absolute
      hide-overlay
      v-if="drawer"
      v-model="drawer"
    >
      <nuxt-child/>
    </v-navigation-drawer>

    <v-fade-transition>
      <div v-show="!drawer">

        <v-card v-for="type of Object.keys(menu)" flat :key="type" class="ma-2">
          <v-card-title v-if="haveActions(menu[type]).length > 0">
            {{ translate(`menu.${type}`) }}
          </v-card-title>
          <v-card-text v-if="haveActions(menu[type]).length > 0">
            <v-data-iterator
              :items="haveActions(menu[type])"
              item-key="name"
              :items-per-page="-1"
              hide-default-footer
            >
              <template v-slot:default="{ items }">
                <v-row dense>
                  <v-col
                    v-for="item in items"
                    :key="item.name"
                    cols="12"
                    sm="6"
                    md="6"
                    lg="4"
                    xl="2"
                    class="fill-height"
                  >
                    <v-card class="fill-height">
                      <v-toolbar dense color="blue-grey darken-4">
                        <v-toolbar-title class="text-button">
                          {{ item.name }}
                        </v-toolbar-title>
                        <v-spacer />
                        <v-switch style="transform: translateY(3px);" class="pt-4" @click="update(item)" color="success" :disabled="item.areDependenciesEnabled !== undefined && (item.isDisabledByEnv || !item.areDependenciesEnabled)" v-if="item.enabled !== undefined && item.enabled !== null" v-model="item.enabled"/>
                        <v-btn icon nuxt :to="`/settings/modules/${item.type}/${item.name}`" v-if="hasSettings(item.type, item.name)"><v-icon>{{ mdiCog }}</v-icon></v-btn>
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
    </v-fade-transition>
  </div>
</template>

<script lang="ts">
import { mdiCog, mdiFloppy } from '@mdi/js';
import {
  useRoute, useRouter, useStore,
} from '@nuxtjs/composition-api';
import { getSocket } from '@sogebot/ui-helpers/socket';
import translate from '@sogebot/ui-helpers/translate';
import {
  defineComponent, nextTick, onMounted, ref, watch,
} from '@vue/composition-api';

import { error } from '~/functions/error';
import { EventBus } from '~/functions/event-bus';

type systemFromIO = { name: string; enabled: boolean; areDependenciesEnabled: boolean; isDisabledByEnv: boolean, type: string };

export default defineComponent({
  setup () {
    const store = useStore<any>();
    const isLoading = ref(true);
    const router = useRouter();
    const route = useRoute();
    const drawer = ref(false);
    const menu = ref({
      services:     [] as systemFromIO[],
      core:         [] as systemFromIO[],
      systems:      [] as systemFromIO[],
      integrations: [] as systemFromIO[],
      games:        [] as systemFromIO[],
      overlays:     [] as systemFromIO[],
    });

    const hasSettings = (itemType: string, itemName: string) => {
      return router.resolve(`/settings/modules/${itemType}/${itemName}`).resolved.matched.length > 0;
    };

    watch(route, (val) => {
      drawer.value = val.path.split('/').length === 5;

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

    const update = (item: systemFromIO) => {
      const enabled = item.enabled;
      getSocket(`/${item.type}/${item.name}`).emit('settings.update', { enabled }, (err: string | null) => {
        if (err) {
          return error(err);
        } else {
          EventBus.$emit('snack', enabled ? 'success' : 'orange', `Module ${item.name} ${enabled ? 'enabled' : 'disabled'}.`);
        }
      });
    };

    const haveActions = (items: systemFromIO[]) => {
      return items.filter((o) => {
        const canBeEnabled = o.enabled !== undefined;
        return canBeEnabled || hasSettings(o.type, o.name);
      });
    };

    return {
      isLoading,
      drawer,
      translate,
      menu,
      mdiCog,
      route,
      hasSettings,
      haveActions,
      update,
      mdiFloppy,
    };
  },
});
</script>
