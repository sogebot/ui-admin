<template>
  <loading v-if="!settings" />
  <v-form v-else v-model="valid" lazy-validation>
    <v-tabs v-model="tab">
      <v-tab>{{ translate('categories.general') }}</v-tab>
    </v-tabs>

    <v-tabs-items v-model="tab">
      <v-tab-item eager>
        <v-card>
          <v-card-text>
            <v-select
              v-model="settings.general.lang[0]"
              :items="ui.general.lang.values"
              :label="translate('core.general.settings.lang')"
            >
              <template v-if="settings.general.lang[0] !== settings.general.lang[1]" #append-outer>
                <v-btn
                  text
                  small
                  @click.stop="$store.commit('settings/pending', true); settings.general.lang = [settings.general.lang[1], settings.general.lang[1]]"
                >
                  Revert
                </v-btn>
              </template>
            </v-select>

            <v-select
              v-model="settings.general.numberFormat[0]"
              :items="pointsOptions"
              :label="translate('core.general.settings.numberFormat')"
            >
              <template v-if="settings.general.numberFormat[0] !== settings.general.numberFormat[1]" #append-outer>
                <v-btn
                  text
                  small
                  @click.stop="$store.commit('settings/pending', true); settings.general.numberFormat = [settings.general.numberFormat[1], settings.general.numberFormat[1]]"
                >
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
        </v-card>
      </v-tab-item>
    </v-tabs-items>
  </v-form>
</template>

<script lang="ts">
import { useStore } from '@nuxtjs/composition-api';
import { format } from '@sogebot/ui-helpers/number';
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
    const tab = ref(null);

    const formats = ['', ' ', ',', '.'];
    const pointsOptions = formats.map(o => ({ text: `${format(o, 0)(123456789.016)} or ${format(o, 2)(123456789.016)}`, value: o }));

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
      tab,
      pointsOptions,
    };
  },
});
</script>
