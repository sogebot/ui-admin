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
            <v-select v-model="settings.service[0]" :items="services" :label="translate('core.tts.settings.service')"/>

            <v-expand-transition>
              <div v-if="settings.service[0] === 1">
                <v-select :items="privateKeys" v-model="settings.googlePrivateKey[0]" label="Google Private Key" item-value="id">
                  <template v-slot:selection="data">
                    <strong>{{data.item.clientEmail}}</strong>
                    <small class="pl-2">{{data.item.id}}</small>
                  </template>
                  <template v-slot:item="data">
                    <strong>{{data.item.clientEmail}}</strong>
                    <small class="pl-2">{{data.item.id}}</small>
                  </template>
                </v-select>
              </div>
            </v-expand-transition>

            <v-expand-transition>
              <div v-if="settings.service[0] === 0">
                <v-text-field v-model="settings.responsiveVoiceKey[0]" type="password" dense
                  :label="translate('integrations.responsivevoice.settings.key.title')"
                  :hint="translate('integrations.responsivevoice.settings.key.help')" persistent-hint />
              </div>
            </v-expand-transition>
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
import { useQuery, useResult } from '@vue/apollo-composable';
import {
  defineComponent, nextTick, onMounted, ref, watch,
} from '@vue/composition-api';

import { error } from '~/functions/error';
import { saveSettings } from '~/functions/settings';
import GET_ALL_PRIVATE_KEYS from '~/queries/google/privateKeysGetAll.gql';

export default defineComponent({
  setup () {
    const { result, loading } = useQuery(GET_ALL_PRIVATE_KEYS);
    const privateKeys = useResult<{privateKeys:any[] }, any[], any[]>(result, [], data => data.privateKeys);

    const settings = ref(null as Record<string, any> | null);
    const ui = ref(null as Record<string, any> | null);
    const store = useStore<any>();
    const valid = ref(true);
    const tab = ref(null);

    const services = [
      { value: -1, text: 'None' },
      { value: 0, text: 'ResponsiveVoice' },
      { value: 1, text: 'Google TTS' },
    ];

    watch(settings, () => {
      store.commit('settings/pending', true);
    }, { deep: true });

    watch(valid, (val) => {
      store.commit('settings/valid', val);
    }, { immediate: true });

    watch(() => store.state.settings.save, (val) => {
      if (val && settings.value) {
        saveSettings('/core/tts', store, settings.value);
      }
    });

    onMounted(() => {
      getSocket(`/core/tts`)
        .emit('settings', (err, _settings, _ui) => {
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

      services,
      privateKeys,
      loading,
    };
  },
});
</script>

<style scoped>
.privateKey .v-input__control .v-input__slot .v-text-field__slot {
  font-family: monospace !important;
}
</style>
