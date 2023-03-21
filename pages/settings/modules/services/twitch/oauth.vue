<template>
  <v-overlay>
    Please set your tokens at
    <div style="font-size: 2em; font-weight: bold;">
      <a :href="`https://dash.sogebot.xyz/settings/modules/services/twitch?server=${origin}`" target="_blank">https://dash.sogebot.xyz/settings/modules/services/twitch?server={{ origin }}</a>
    </div>
  </v-overlay>
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
