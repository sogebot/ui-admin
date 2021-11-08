<template>
  <loading v-if="!settings" />
  <v-form v-else v-model="valid" lazy-validation>
    <v-tabs v-model="tab">
      <v-tab>{{translate('categories.oauth')}}</v-tab>
      <v-tab>{{translate('categories.tmi')}}</v-tab>
      <v-tab>{{translate('categories.eventsub')}}</v-tab>
    </v-tabs>

    <v-tabs-items v-model="tab">
      <v-tab-item eager>
        <oauth :settings="settings" @update="settings = $event"/>
      </v-tab-item>
      <v-tab-item eager>
        <tmi :settings="settings" @update="settings = $event"/>
      </v-tab-item>
      <v-tab-item eager>
        <eventsub :settings="settings" @update="settings = $event"/>
      </v-tab-item>
    </v-tabs-items>
  </v-form>
</template>

<script lang="ts">
import { useStore } from '@nuxtjs/composition-api';
import { getSocket } from '@sogebot/ui-helpers/socket';
import translate from '@sogebot/ui-helpers/translate';
import {
  defineAsyncComponent,
  defineComponent, nextTick, onMounted, ref, watch,
} from '@vue/composition-api';

import { error } from '~/functions/error';
import { saveSettings } from '~/functions/settings';
import { minValue, required } from '~/functions/validators';

export default defineComponent({
  components: {
    tmi:      defineAsyncComponent(() => import('./twitch/tmi.vue')),
    oauth:    defineAsyncComponent(() => import('./twitch/oauth.vue')),
    eventsub: defineAsyncComponent(() => import('./twitch/eventsub.vue')),
  },
  setup () {
    const settings = ref(null as Record<string, any> | null);
    const ui = ref(null as Record<string, any> | null);
    const store = useStore<any>();
    const valid = ref(true);
    const tab = ref(null);

    watch(settings, () => {
      store.commit('settings/pending', true);
    }, { deep: true });

    watch(() => store.state.settings.save, (val) => {
      if (val && settings.value) {
        saveSettings('/services/twitch', store, settings.value);
      }
    });

    watch(valid, (val) => {
      store.commit('settings/valid', val);
    }, { immediate: true });

    onMounted(() => {
      getSocket(`/services/twitch`)
        .emit('settings', (err: string | null, _settings: { [x: string]: any }, _ui: { [x: string]: { [attr: string]: any } }) => {
          if (err) {
            error(err);
            return;
          }
          ui.value = _ui;
          settings.value = _settings;
          nextTick(() => { store.commit('settings/pending', false); });
        });
    });

    return {
      settings,
      ui,
      translate,
      valid,
      tab,

      // validators
      required,
      minValue,
    };
  },
});
</script>
