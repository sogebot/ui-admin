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
            <v-text-field v-model="settings.apiKey[0]" type="password" dense
              :label="translate('integrations.lastfm.settings.apiKey')" />
            <v-text-field v-model="settings.username[0]" dense
              :label="translate('integrations.lastfm.settings.username')" />

            <v-row>
              <v-col cols="auto" style="align-self: center;">
                <p class="ma-0">{{translate('systems.songs.settings.notify')}}</p>
              </v-col>
              <v-col>
                <v-btn-toggle
                  v-model="settings.notify[0]"
                  mandatory
                >
                  <v-btn outlined color="primary">
                      disabled
                  </v-btn>
                  <v-btn outlined color="primary">
                    all
                  </v-btn>
                  <v-btn outlined color="primary">
                    online
                  </v-btn>
                </v-btn-toggle>
              </v-col>
            </v-row>

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
import { saveSettings } from '~/functions/settings';
import { minValue, required } from '~/functions/validators';

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

    watch(() => store.state.settings.save, (val) => {
      if (val && settings.value) {
        saveSettings('/integrations/lastfm', store, settings.value);
      }
    });

    watch(valid, (val) => {
      store.commit('settings/valid', val);
    }, { immediate: true });

    onMounted(() => {
      getSocket(`/integrations/lastfm`)
        .emit('settings', (err, _settings, _ui) => {
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
      tab,

      // functions

      // validators
      required,
      minValue,
    };
  },
});
</script>
