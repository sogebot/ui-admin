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
            <v-alert color="info" text class="mt-2">For use of EventSub you need to have SSL enabled domain and created Twitch App
            <ol>
              <li>Go to <a href="https://dev.twitch.tv/console/apps" target="_blank">https://dev.twitch.tv/console/apps</a> and register your app</li>
              <li>You can choose any <strong>name</strong> of app you want</li>
              <li>Set <strong>oauth redirect</strong> to your {{origin}}/credentials/eventsub</li>
              <li>Pick Application Integration for <strong>category</strong> and create</li>
              <li>After creation copy clientId and generate clientSecret</li>
              <li>Authorize your broadcaster account to enable subscription with your account</li>
            </ol>

            </v-alert>

            <v-text-field :label="translate('integrations.spotify.settings.clientId')"
              v-model="settings.clientId[0]" hide-details="auto" class="pb-2"/>
            <v-text-field :label="translate('integrations.spotify.settings.clientSecret')"
              v-model="settings.clientSecret[0]" type="password" hide-details="auto" class="pb-2"/>
            <v-row>
              <v-col cols="auto">
                <v-switch
                  v-model="settings.useTunneling[0]"
                  label="Use unreliable tunneling (works on localhost)"
                />
              </v-col>
              <v-col>
                <v-text-field :label="translate('core.ui.settings.domain.title')"
                  :hint="translate('core.ui.settings.domain.help')"
                  :disabled="settings.useTunneling[0]"
                  v-model="settings.domain[0]" hide-details="auto" class="pb-2"/>
              </v-col>
            </v-row>

            <v-alert color="info" text class="mt-2">Authorize by clicking on authorize button. It will then take around ~1 minute to subscribe to missing events</v-alert>

            <v-btn target="_blank" :href="`https://id.twitch.tv/oauth2/authorize?client_id=${settings.clientId[0]}&redirect_uri=${origin}&response_type=token&force_verify=true&scope=channel:read:hype_train`" :disabled="settings.clientId[0].trim().length === 0">Authorize to enable EventSub subscriptions</v-btn>

            <h3 class="pt-4 mt-4">Currently subscribed events</h3>
            <v-list dense>
              <v-list-item v-for="item of settings.enabledSubscriptions[0]" :key="item">
                <v-list-item-title>{{ item }}</v-list-item-title>
              </v-list-item>
            </v-list>
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

export default defineComponent({
  setup () {
    const settings = ref(null as Record<string, any> | null);
    const ui = ref(null as Record<string, any> | null);
    const store = useStore<any>();
    const valid = ref(true);
    const tab = ref(null);
    const origin = location.origin;

    watch(settings, () => {
      store.commit('settings/pending', true);
    }, { deep: true });

    watch(valid, (val) => {
      store.commit('settings/valid', val);
    }, { immediate: true });

    watch(() => store.state.settings.save, (val) => {
      if (val && settings.value) {
        saveSettings('/core/eventsub', store, settings.value);
      }
    });

    onMounted(() => {
      getSocket(`/core/eventsub`)
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
      tab,
      origin,
    };
  },
});
</script>
