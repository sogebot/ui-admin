<template>
  <div class="fill-height">
    <loading v-if="!settings" />
    <v-card v-else flat class="fill-height">
      <v-form v-model="valid" lazy-validation>
        <v-card-text>
          <v-select
            v-model="settings.currency.mainCurrency[0]"
            :items="ui.currency.mainCurrency.values"
            :label="translate('core.currency.settings.mainCurrency')"
          >
            <template v-if="settings.currency.mainCurrency[0] !== settings.currency.mainCurrency[1]" #append-outer>
              <v-btn text @click.stop="settings.currency.mainCurrency = [settings.currency.mainCurrency[1], settings.currency.mainCurrency[1]]">
                Revert
              </v-btn>
            </template>
          </v-select>
        </v-card-text>
      </v-form>
    </v-card>
  </div>
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

export default defineComponent({
  setup () {
    const settings = ref(null as Record<string, any> | null);
    const ui = ref(null as Record<string, any> | null);
    const store = useStore<any>();
    const valid = ref(true);

    watch(settings, () => {
      store.commit('settings/pending', true);
    }, { deep: true });

    watch(valid, (val) => {
      store.commit('settings/valid', val);
    }, { immediate: true });

    watch(() => store.state.settings.save, (val) => {
      if (val && settings.value) {
        saveSettings('/core/currency', store, settings.value);
      }
    });

    onMounted(() => {
      getSocket(`/core/currency`)
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
    };
  },
});
</script>
