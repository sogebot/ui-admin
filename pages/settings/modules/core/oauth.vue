<template>
  <loading v-if="!settings" />
  <v-form v-else v-model="valid" lazy-validation>
    <v-tabs v-model="tab">
      <v-tab>{{translate('categories.general')}}</v-tab>
      <v-tab>{{translate('categories.bot')}}</v-tab>
      <v-tab>{{translate('categories.broadcaster')}}</v-tab>
    </v-tabs>

    <v-tabs-items v-model="tab">
      <v-tab-item eager>
        <v-card>
          <v-card-text>
            <v-select
              class="pb-2 mb-2"
              v-model="settings.general.tokenService[0]"
              :items="['Twitch Token Generator', 'SogeBot Token Generator', 'Own Twitch App']"
              label="Token Generator"
              hint="If you change token generator, you need to re-do all tokens!"
              persistent-hint/>

            <v-expand-transition>
              <div v-if="settings.general.tokenService[0] === 'Own Twitch App'">
                <v-card>
                  <v-card-text>
                <v-alert text color="cyan">
                  <ul>
                    <li>Create Twitch App at <a href="https://dev.twitch.tv/console/apps" target="_blank">https://dev.twitch.tv/console/apps</a></li>
                    <li>For working redirect uri you need https domain or http://localhost</li>
                  </ul>
                </v-alert>
                <v-text-field label="Client ID" hide-details="auto"
                  v-model="settings.general.tokenServiceCustomClientId[0]" />
                <v-text-field label="Client Secret"  hide-details="auto" type="password"
                  v-model="settings.general.tokenServiceCustomClientSecret[0]"
                  persistent-hint hint="Never share your Client Secret!"/>
                <v-text-field label="Redirect URI" hide-details="auto" readonly
                  v-model="redirectUri"
                  persistent-hint hint="Set this redirect uri in your Twitch App"/>
                  </v-card-text>
                </v-card>
              </div>
            </v-expand-transition>

            <v-text-field :label="translate('core.oauth.settings.generalChannel')"
              v-model="settings.general.generalChannel[0]" />

            <v-textarea auto-grow outlined persistent-hint :label="translate('core.oauth.settings.generalOwners')"
              :value="settings.general.generalOwners[0].filter(String).join('\n')"
              @input="settings.general.generalOwners = [$event.split('\n').filter(String), '']"
              :hint="translate('one-record-per-line')" />
          </v-card-text>
        </v-card>
      </v-tab-item>
      <v-tab-item eager>
        <v-card>
          <v-card-text>
            <v-text-field :label="translate('core.oauth.settings.botAccessToken')"
              v-model="settings.bot.botAccessToken[0]" type="password" />
            <v-text-field :label="translate('core.oauth.settings.botRefreshToken')"
              v-model="settings.bot.botRefreshToken[0]" type="password" />
            <v-text-field label="Client ID" v-model="settings.bot.botClientId[0]" />
            <v-text-field :label="translate('core.oauth.settings.botUsername')" v-model="settings.bot.botUsername[0]"
              disabled />
            <v-btn :href="botUrl" target="_blank">
              {{ translate('commons.generate') }}
            </v-btn>
          </v-card-text>
        </v-card>
      </v-tab-item>
      <v-tab-item eager>
        <v-card>
          <v-card-text>
            <v-text-field :label="translate('core.oauth.settings.broadcasterAccessToken')"
              v-model="settings.broadcaster.broadcasterAccessToken[0]" type="password" />
            <v-text-field :label="translate('core.oauth.settings.broadcasterRefreshToken')"
              v-model="settings.broadcaster.broadcasterRefreshToken[0]" type="password" />
            <v-text-field label="Client ID" v-model="settings.broadcaster.broadcasterClientId[0]" />
            <v-text-field :label="translate('core.oauth.settings.broadcasterUsername')"
              v-model="settings.broadcaster.broadcasterUsername[0]" disabled />

            <v-btn :href="broadcasterUrl" target="_blank">
              {{ translate('commons.generate') }}
            </v-btn>
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
  computed,
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

    const redirectUri = computed(() => {
      return `${window.location.origin}/credentials/oauth/tokens`;
    });

    const botUrl = computed(() => {
      if (!settings.value) {
        return '';
      }

      const scope = 'scope=channel:edit:commercial channel:moderate chat:edit chat:read clips:edit user:edit:broadcast user:read:broadcast whispers:edit whispers:read';
      const clientId = settings.value.general.tokenServiceCustomClientId[0];
      const clientSecret = settings.value.general.tokenServiceCustomClientSecret[0];

      if (settings.value.general.tokenService[0] === 'Twitch Token Generator') {
        return 'https://twitchtokengenerator.com/quick/jLbq7v1pzF';
      } else if (settings.value.general.tokenService[0] === 'SogeBot Token Generator') {
        return 'https://twitch-token-generator.soge.workers.dev/request-tokens?';
      } else {
        return `${redirectUri.value}?${scope}&clientId=${clientId}&clientSecret=${clientSecret}`;
      }
    });

    const broadcasterUrl = computed(() => {
      if (!settings.value) {
        return '';
      }

      const scope = 'scope=channel:edit:commercial channel:moderate channel:read:hype_train channel:read:redemptions channel:read:subscriptions channel_editor chat:edit chat:read moderation:read user:read:broadcast channel:manage:broadcast';
      const clientId = settings.value.general.tokenServiceCustomClientId[0];
      const clientSecret = settings.value.general.tokenServiceCustomClientSecret[0];

      if (settings.value.general.tokenService[0] === 'Twitch Token Generator') {
        return 'https://twitchtokengenerator.com/quick/VHavigHX0P';
      } else if (settings.value.general.tokenService[0] === 'SogeBot Token Generator') {
        return 'https://twitch-token-generator.soge.workers.dev/request-tokens?scope=channel:edit:commercial channel:moderate channel:read:hype_train channel:read:redemptions channel:read:subscriptions channel_editor chat:edit chat:read moderation:read user:read:broadcast channel:manage:broadcast';
      } else {
        return `${redirectUri.value}?${scope}&clientId=${clientId}&clientSecret=${clientSecret}`;
      }
    });

    watch(settings, () => {
      store.commit('settings/pending', true);
    }, { deep: true });

    watch(valid, (val) => {
      store.commit('settings/valid', val);
    }, { immediate: true });

    watch(() => store.state.settings.save, (val) => {
      if (val && settings.value) {
        saveSettings('/core/oauth', store, settings.value);
      }
    });

    onMounted(() => {
      getSocket(`/core/oauth`)
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
      redirectUri,
      botUrl,
      broadcasterUrl,
    };
  },
});
</script>
