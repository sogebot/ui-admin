<template>
  <loading v-if="!settings" />
  <v-form v-else v-model="valid" lazy-validation>
    <v-tabs v-model="tab">
      <v-tab>{{ $t('categories.general') }}</v-tab>
    </v-tabs>

    <v-tabs-items v-model="tab">
      <v-tab-item eager>
        <v-card>
          <v-card-text>
            <v-text-field
              v-model.trim="settings.verification_token[0]"
              :label="$t('integrations.kofi.settings.verification_token.title')"
              :hint="$t('integrations.kofi.settings.verification_token.help')"
              persistent-hint
            >
              <template #message="{ message }">
                <!-- html hints -->
                <span v-html="message" />
              </template>
            </v-text-field>

            <v-text-field
              readonly
              :value="origin + '/webhooks/kofi'"
              :label="$t('integrations.kofi.settings.webhook_url.title')"
              :hint="$t('integrations.kofi.settings.webhook_url.help')"
              persistent-hint
            >
              <template #message="{ message }">
                <ul class="error--text" v-if="origin.includes('localhost') || origin.includes('http://')">
                  <li v-if="origin.includes('http://')">{{$t('integrations.kofi.settings.webhook_url.errors.https')}}</li>
                  <li v-if="origin.includes('localhost')">{{$t('integrations.kofi.settings.webhook_url.errors.origin')}}</li>
                </ul>
                <!-- html hints -->
                <span v-html="message" v-else />
              </template>
              <template #prepend-inner>
                <v-icon color="error" v-if="origin.includes('localhost') || origin.includes('http://')">mdi-exclamation-thick</v-icon>
              </template>
            </v-text-field>
          </v-card-text>
        </v-card>
      </v-tab-item>
    </v-tabs-items>
  </v-form>
</template>

<script lang="ts">
import { useStore } from '@nuxtjs/composition-api';
import { getSocket } from '@sogebot/ui-helpers/socket';
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
    const tab = ref(null);
    const origin = location.origin

    watch(settings, () => {
      store.commit('settings/pending', true);
    }, { deep: true });

    watch(() => store.state.settings.save, (val) => {
      if (val && settings.value) {
        saveSettings('/integrations/kofi', store, settings.value);
      }
    });

    watch(valid, (val) => {
      store.commit('settings/valid', val);
    }, { immediate: true });

    onMounted(() => {
      getSocket(`/integrations/kofi`)
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
      valid,
      tab,
      origin,
    };
  },
});
</script>
