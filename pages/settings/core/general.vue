<template>
  <loading v-if="!settings" />
  <v-card flat v-else>
    <v-form v-model="valid" lazy-validation>
      <v-card-text>
        <v-select
          v-model="settings.general.lang[0]"
          :items="ui.general.lang.values"
          :label="translate('core.general.settings.lang')"
          @input="$store.commit('settings/pending', true)"
        >
          <template v-if="settings.general.lang[0] !== settings.general.lang[1]" #append-outer>
            <v-btn text @click.stop="$store.commit('settings/pending', true); settings.general.lang = [settings.general.lang[1], settings.general.lang[1]]">
              Revert
            </v-btn>
          </template>
        </v-select>
      </v-card-text>
    </v-form>
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
    const valid = ref(true);

    watch(valid, (val) => {
      store.commit('settings/valid', val);
    }, { immediate: true });

    watch(() => store.state.settings.save, (val) => {
      if (val && settings.value) {
        saveSettings('/core/general', store, settings.value);
      }
    });

    onMounted(() => {
      store.commit('panel/breadcrumbs', [
        { text: translate('menu.settings') },
        { text: translate('menu.core') },
      ]);
      getSocket(`/core/general`)
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
    };
  },
});
</script>
