<template>
  <loading v-if="!settings" />
  <v-card v-else flat>
    <v-card-title>{{ translate('categories.currency') }}</v-card-title>
    <v-card-text>
      <v-select
        v-model="settings.currency.mainCurrency[0]"
        :items="ui.currency.mainCurrency.values"
        :label="translate('core.currency.settings.mainCurrency')"
        @input="$store.commit('settings/pending', true)"
      >
        <template v-if="settings.currency.mainCurrency[0] !== settings.currency.mainCurrency[1]" #append-outer>
          <v-btn text @click.stop="$store.commit('settings/pending', true); settings.currency.mainCurrency = [settings.currency.mainCurrency[1], settings.currency.mainCurrency[1]]">
            Revert
          </v-btn>
        </template>
      </v-select>
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
    const settings = ref(null as Record<string, any> | null);
    const ui = ref(null as Record<string, any> | null);
    const store = useStore<any>();

    watch(() => store.state.settings.save, (val) => {
      if (val && settings.value) {
        saveSettings('/core/currency', store, settings.value);
      }
    });

    onMounted(() => {
      store.commit('panel/breadcrumbs', [
        { text: translate('menu.settings') },
        { text: translate('menu.core') },
        { text: translate('categories.currency') },
      ]);
      getSocket(`/core/currency`)
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
    };
  },
});
</script>
