<template>
  <loading v-if="!settings" />
  <v-card v-else flat class="fill-height">
    <v-card-text>
      <v-form ref="form" v-model="valid">
        <v-checkbox
          v-model="settings.cooldownNotifyAsWhisper[0]"
          dense
          :label="translate('systems.cooldown.settings.cooldownNotifyAsWhisper')"
        />
        <v-checkbox
          v-model="settings.cooldownNotifyAsChat[0]"
          dense
          :label="translate('systems.cooldown.settings.cooldownNotifyAsChat')"
        />
      </v-form>
    </v-card-text>
  </v-card>
</template>

<script lang="ts">
import { useStore } from '@nuxtjs/composition-api';
import { getSocket } from '@sogebot/ui-helpers/socket';
import translate from '@sogebot/ui-helpers/translate';
import {
  defineComponent, nextTick, onMounted, ref, watch,
} from '@vue/composition-api';

import { error } from '~/functions/error';
import { saveSettings } from '~/functions/settings';
import { minValue, required } from '~/functions/validators';

export default defineComponent({
  setup () {
    const settings = ref(null as Record<string, any> | null);
    const ui = ref(null as Record<string, any> | null);
    const store = useStore<any>();
    const valid = ref(true);
    const form = ref(null);

    watch(settings, () => {
      store.commit('settings/pending', true);
    }, { deep: true });

    watch(() => store.state.settings.save, (val) => {
      if (val && settings.value) {
        saveSettings('/systems/cooldown', store, settings.value);
      }
    });

    watch(valid, (val) => {
      store.commit('settings/valid', val);
    }, { immediate: true });

    onMounted(() => {
      getSocket(`/systems/cooldown`)
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
      form,

      // validators
      required,
      minValue,
    };
  },
});
</script>
