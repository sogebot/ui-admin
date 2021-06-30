<template>
  <loading v-if="!settings" />
  <v-card v-else flat style="min-height: 100%;">
    <v-form v-model="valid" lazy-validation>
      <v-card-text>
        <v-select
          v-model="settings.general.lang[0]"
          :items="ui.general.lang.values"
          :label="translate('core.general.settings.lang')"
        >
          <template v-if="settings.general.lang[0] !== settings.general.lang[1]" #append-outer>
            <v-btn text @click.stop="$store.commit('settings/pending', true); settings.general.lang = [settings.general.lang[1], settings.general.lang[1]]">
              Revert
            </v-btn>
          </template>
        </v-select>

        <revert-text-field
          v-model="settings.graceful_exit.gracefulExitEachXHours"
          type="number"
          min="0"
          :label="translate('core.general.settings.gracefulExitEachXHours.title')"
          :hint="translate('core.general.settings.gracefulExitEachXHours.help')"
          :rules="[required, minValue(0)]"
        />
      </v-card-text>
    </v-form>
  </v-card>
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
  components: { revertTextField: defineAsyncComponent(() => import('~/components/settings/modules/revert-text-field.vue')) },
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
        saveSettings('/core/general', store, settings.value);
      }
    });

    onMounted(() => {
      getSocket(`/core/general`)
        .emit('settings', (err: string | null, _settings: { [x: string]: any }, _ui: { [x: string]: { [attr: string]: any } }) => {
          if (err) {
            error(err);
            return;
          }
          ui.value = _ui;
          console.log({ _settings });
          settings.value = _settings;
          nextTick(() => { store.commit('settings/pending', false); });
        });
    });

    return {
      settings,
      ui,
      translate,
      valid,
      required,
      minValue,
    };
  },
});
</script>
