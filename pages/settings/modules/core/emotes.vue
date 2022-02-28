<template>
  <loading v-if="!settings" />
  <v-form v-else v-model="valid" lazy-validation>
    <v-tabs v-model="tab">
      <v-tab>{{translate('categories.general')}}</v-tab>
    </v-tabs>

    <v-tabs-items v-model="tab">
      <v-tab-item eager>
        <v-card>
          <v-card-text>
            <v-switch class="mt-0" v-model="settings.bttv[0]" dense
              label="BetterTTV" />
            <v-switch class="mt-0" v-model="settings['7tv'][0]" dense
              label="7TV" />
            <v-switch class="mt-0" v-model="settings.ffz[0]" dense
              label="FrankerFaceZ" />

            <v-btn @click="removeEmoteCache">
              Remove emotes cache
            </v-btn>
          </v-card-text>
        </v-card>
      </v-tab-item>
    </v-tabs-items>
  </v-form>
</template>

<script lang="ts">
import { useStore } from '@nuxtjs/composition-api';
import { getSocket } from '@sogebot/ui-helpers/socket';
import translate from '@sogebot/ui-helpers/translate';
import {
  defineComponent, nextTick, onMounted, ref, watch,
} from '@vue/composition-api';

import { error } from '~/functions/error';
import { EventBus } from '~/functions/event-bus';
import { saveSettings } from '~/functions/settings';

export default defineComponent({
  setup () {
    const settings = ref(null as Record<string, any> | null);
    const ui = ref(null as Record<string, any> | null);
    const store = useStore<any>();
    const valid = ref(true);
    const tab = ref(null);

    watch(settings, () => {
      store.commit('settings/pending', true);
    }, { deep: true });

    watch(valid, (val) => {
      store.commit('settings/valid', val);
    }, { immediate: true });

    watch(() => store.state.settings.save, (val) => {
      if (val && settings.value) {
        saveSettings('/core/emotes', store, settings.value);
      }
    });

    onMounted(() => {
      getSocket(`/core/emotes`)
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

    const removeEmoteCache = () => {
      getSocket(`/core/emotes`).emit('removeCache', () => {
        EventBus.$emit('snack', 'success', `Emotes cache was cleared.`);
      });
    };

    return {
      settings,
      ui,
      translate,
      valid,
      tab,
      removeEmoteCache,
    };
  },
});
</script>

<style scoped>
.privateKey .v-input__control .v-input__slot .v-text-field__slot {
  font-family: monospace !important;
}
</style>
