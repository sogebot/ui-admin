<template>
  <loading v-if="!settings" />
  <v-card v-else flat class="fill-height">
    <v-card-text>
      <v-form ref="form" v-model="valid">
        <v-checkbox
          v-model="settings.general.isTitleForced[0]"
          dense
          :label="translate('core.twitch.settings.isTitleForced')"
          @click="$store.commit('settings/pending', true)"
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
  defineComponent, onMounted, ref, watch,
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

    watch(() => store.state.settings.save, (val) => {
      if (val && settings.value) {
        saveSettings('/core/twitch', store, settings.value);
      }
    });

    watch(valid, (val) => {
      store.commit('settings/valid', val);
    }, { immediate: true });

    onMounted(() => {
      getSocket(`/core/twitch`)
        .emit('settings', (err: string | null, _settings: { [x: string]: any }, _ui: { [x: string]: { [attr: string]: any } }) => {
          if (err) {
            error(err);
            return;
          }
          ui.value = _ui;
          settings.value = _settings;
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
