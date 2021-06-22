<template>
  <loading v-if="menu.length === 0" />
  <v-card v-else flat class="pa-4">
    <v-data-iterator
      :items="menu"
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
          >
            <v-row>
              <v-col>
                <v-card flat :disabled="!(!item.isDisabledByEnv && item.areDependenciesEnabled)" @click="item.enabled = !item.enabled">
                  <v-alert class="fill-height ma-0"  dense text border="left" :color="item.enabled && !item.isDisabledByEnv && item.areDependenciesEnabled ? 'success' : 'error'">
                    <strong class="text-button">{{ item.name }}</strong>
                    <div v-if="item.isDisabledByEnv">Disabled by ENV variable</div>
                    <div v-if="!item.areDependenciesEnabled">Dependency system is disabled.</div>
                  </v-alert>
                </v-card>
              </v-col>
              <v-col cols="auto">
                <v-btn>Edit</v-btn>
              </v-col>
            </v-row>
          </v-col>
        </v-row>
      </template>
    </v-data-iterator>
  </v-card>
</template>

<script lang="ts">
import { useStore } from '@nuxtjs/composition-api';
import { getSocket } from '@sogebot/ui-helpers/socket';
import translate from '@sogebot/ui-helpers/translate';
import {
  defineComponent, onMounted, ref,
} from '@vue/composition-api';

import { error } from '~/functions/error';

type systemFromIO = { name: string; enabled: boolean; areDependenciesEnabled: boolean; isDisabledByEnv: boolean };

export default defineComponent({
  beforeRouteLeave (_to, _from, next) {
    if (this.$store.state.settings.pending) {
      const isOK = confirm('You will lose your pending changes. Do you want to continue?');
      if (!isOK) {
        return next(false);
      }
    }
    this.$store.commit('settings/pending', false);
    next();
  },
  setup () {
    const store = useStore<any>();
    const isLoading = ref(true);
    const menu = ref([] as systemFromIO[]);

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
        menu.value = systems.sort((a, b) => {
          return translate('menu.' + a.name).localeCompare(translate('menu.' + b.name));
        });
        isLoading.value = false;
      });
    });

    return {
      translate,
      menu,
    };
  },
});
</script>
