<template>
  <span>
    <v-tabs v-model="tab">
      <v-tab>{{ translate('categories.general') }}</v-tab>
      <v-tab>{{ translate('categories.bot') }}</v-tab>
      <v-tab>{{ translate('categories.channel') }}</v-tab>
    </v-tabs>

    <v-tabs-items v-model="tab">
      <v-tab-item eager>
        <v-overlay style="text-align: center;" absolute>
          Please set your tokens at
          <div style="font-size: 2em; font-weight: bold;">
            <a :href="`https://dash.sogebot.xyz/settings/modules/services/twitch?server=${origin}`" target="_blank">https://dash.sogebot.xyz/settings/modules/services/twitch?server={{ origin }}</a>
          </div>
        </v-overlay>
        <v-card>
          <v-card-text>
            <v-select
              v-model="_settings.general.tokenService[0]"
              class="pb-2 mb-2"
              :items="['SogeBot Token Generator', 'Own Twitch App']"
              label="Token Generator"
              hint="If you change token generator, you need to re-do all tokens!"
              persistent-hint
            />

            <v-expand-transition>
              <div v-if="_settings.general.tokenService[0] === 'Own Twitch App'">
                <v-card>
                  <v-card-text>
                    <v-alert color="info" text class="mt-2">
                      <ol>
                        <li>Go to <a
                          href="https://dev.twitch.tv/console/apps"
                          target="_blank"
                        >https://dev.twitch.tv/console/apps</a> and register your app</li>
                        <li>You can choose any <strong>name</strong> of app you want</li>
                        <li>Set <strong>oauth redirect</strong> to your {{ redirectUri }}</li>
                        <li>Pick Application Integration for <strong>category</strong> and create</li>
                        <li>After creation copy clientId and generate clientSecret</li>
                      </ol>
                    </v-alert>
                    <v-text-field
                      v-model="_settings.general.tokenServiceCustomClientId[0]"
                      label="Client ID"
                      hide-details="auto"
                    />
                    <v-text-field
                      v-model="_settings.general.tokenServiceCustomClientSecret[0]"
                      label="Client Secret"
                      hide-details="auto"
                      type="password"
                      persistent-hint
                      hint="Never share your Client Secret!"
                    />
                  </v-card-text>
                </v-card>
              </div>
            </v-expand-transition>

            <v-textarea
              auto-grow
              outlined
              persistent-hint
              :label="translate('core.oauth.settings.generalOwners')"
              :value="_settings.general.generalOwners[0].filter(String).join('\n')"
              :hint="translate('one-record-per-line')"
              @input="_settings.general.generalOwners = [$event.split('\n').filter(String), '']"
            />
          </v-card-text>
        </v-card>
      </v-tab-item>
      <v-tab-item eager>
        <v-overlay style="text-align: center;" absolute>
          Please set your tokens at
          <div style="font-size: 2em; font-weight: bold;">
            <a :href="`https://dash.sogebot.xyz/settings/modules/services/twitch?server=${origin}`" target="_blank">https://dash.sogebot.xyz/settings/modules/services/twitch?server={{ origin }}</a>
          </div>
        </v-overlay>
        <v-card>
          <v-card-text>
            <v-text-field
              v-model="_settings.bot.botAccessToken[0]"
              :label="translate('core.oauth.settings.botAccessToken')"
              type="password"
            />
            <v-text-field
              v-model="_settings.bot.botRefreshToken[0]"
              :label="translate('core.oauth.settings.botRefreshToken')"
              type="password"
            />
            <v-text-field
              v-model="_settings.bot.botUsername[0]"
              :label="translate('core.oauth.settings.botUsername')"
              disabled
            />
            <v-btn :href="botUrl" target="_blank">
              {{ translate('commons.generate') }}
            </v-btn>
          </v-card-text>
        </v-card>
      </v-tab-item>
      <v-tab-item eager>
        <v-overlay style="text-align: center;" absolute>
          Please set your tokens at
          <div style="font-size: 2em; font-weight: bold;">
            <a :href="`https://dash.sogebot.xyz/settings/modules/services/twitch?server=${origin}`" target="_blank">https://dash.sogebot.xyz/settings/modules/services/twitch?server={{ origin }}</a>
          </div>
        </v-overlay>
        <v-card>
          <v-card-text>
            <v-text-field
              v-model="_settings.broadcaster.broadcasterAccessToken[0]"
              :label="translate('core.oauth.settings.channelAccessToken')"
              type="password"
            />
            <v-text-field
              v-model="_settings.broadcaster.broadcasterRefreshToken[0]"
              :label="translate('core.oauth.settings.channelRefreshToken')"
              type="password"
            />
            <v-text-field
              v-model="_settings.broadcaster.broadcasterUsername[0]"
              :label="translate('core.oauth.settings.channelUsername')"
              disabled
            />

            <v-btn :href="broadcasterUrl" target="_blank">
              {{ translate('commons.generate') }}
            </v-btn>
          </v-card-text>
        </v-card>
      </v-tab-item>
    </v-tabs-items>
  </span>
</template>

<script lang="ts">
import translate from '@sogebot/ui-helpers/translate';
import {
  computed,
  defineComponent, ref, watch,
} from '@vue/composition-api';

type Props = {
  settings: Record<string, any>,
};
export default defineComponent({
  props: { settings: Object },
  setup (props: Props, ctx) {
    const tab = ref(null);

    const origin = location.origin;

    const _settings = ref(props.settings);
    watch(_settings, (val) => {
      ctx.emit('input', val);
    }, { deep: true });

    const redirectUri = computed(() => {
      return `${window.location.origin}/credentials/oauth/tokens`;
    });

    const botUrl = computed(() => {
      const scope = 'scope=channel:edit:commercial channel:moderate chat:edit chat:read clips:edit user:edit:broadcast user:read:broadcast whispers:edit whispers:read channel:manage:broadcast moderator:manage:announcements';
      const clientId = _settings.value.general.tokenServiceCustomClientId[0];
      const clientSecret = _settings.value.general.tokenServiceCustomClientSecret[0];

      if (_settings.value.general.tokenService[0] === 'SogeBot Token Generator') {
        return `https://twitch-token-generator.soge.workers.dev/request-tokens?${scope}`;
      } else {
        return `${redirectUri.value}?${scope}&clientId=${clientId}&clientSecret=${clientSecret}`;
      }
    });

    const broadcasterUrl = computed(() => {
      if (!_settings.value) {
        return '';
      }

      const scope = 'scope=channel:edit:commercial channel:manage:polls channel:manage:predictions channel:moderate channel:read:hype_train channel:read:polls channel:read:redemptions channel:read:subscriptions channel_editor chat:edit chat:read moderation:read moderator:read:chatters user:edit:broadcast user:read:broadcast';
      const clientId = _settings.value.general.tokenServiceCustomClientId[0];
      const clientSecret = _settings.value.general.tokenServiceCustomClientSecret[0];

      if (_settings.value.general.tokenService[0] === 'SogeBot Token Generator') {
        return `https://twitch-token-generator.soge.workers.dev/request-tokens?${scope}`;
      } else {
        return `${redirectUri.value}?${scope}&clientId=${clientId}&clientSecret=${clientSecret}`;
      }
    });

    return {
      _settings,
      translate,
      origin,
      tab,
      redirectUri,
      botUrl,
      broadcasterUrl,
    };
  },
});
</script>
