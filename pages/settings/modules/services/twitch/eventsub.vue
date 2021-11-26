<template>
  <v-card>
    <v-card-text>
      <v-alert color="info" text class="mt-2">For use of EventSub you need to have SSL enabled domain and created Twitch
        App
        <ol>
          <li>Go to <a href="https://dev.twitch.tv/console/apps" target="_blank">https://dev.twitch.tv/console/apps</a>
            and register your app</li>
          <li>You can choose any <strong>name</strong> of app you want</li>
          <li>Set <strong>oauth redirect</strong> to your {{origin}}/credentials/oauth/eventsub</li>
          <li>Pick Application Integration for <strong>category</strong> and create</li>
          <li>After creation copy clientId and generate clientSecret</li>
          <li>Authorize your broadcaster account to enable subscription with your account</li>
        </ol>

      </v-alert>

      <v-text-field :label="translate('integrations.spotify.settings.clientId')"
        v-model="_settings.eventsub.eventSubClientId[0]" hide-details="auto" class="pb-2" />
      <v-text-field :label="translate('integrations.spotify.settings.clientSecret')"
        v-model="_settings.eventsub.eventSubClientSecret[0]" type="password" hide-details="auto" class="pb-2" />
      <v-row>
        <v-col cols="auto">
          <v-switch v-model="_settings.eventsub.useTunneling[0]"
            label="Use unreliable tunneling (works on localhost)" />
        </v-col>
        <v-col>
          <v-text-field :label="translate('core.ui.settings.domain.title')"
            :hint="translate('core.ui.settings.domain.help')" :disabled="_settings.eventsub.useTunneling[0]"
            v-model="_settings.eventsub.domain[0]" hide-details="auto" class="pb-2" />
        </v-col>
      </v-row>

      <v-alert color="info" text class="mt-2">Authorize by clicking on authorize button. It will then take around ~1
        minute to subscribe to missing events</v-alert>

      <v-btn target="_blank"
        :href="`https://id.twitch.tv/oauth2/authorize?client_id=${_settings.eventsub.eventSubClientId[0]}&redirect_uri=${origin}/credentials/oauth/eventsub&response_type=token&force_verify=true&scope=channel:read:hype_train channel:read:polls channel:manage:polls`"
        :disabled="_settings.eventsub.eventSubClientId[0].trim().length === 0">Authorize to enable EventSub
        subscriptions</v-btn>

      <h3 class="pt-4 mt-4">Currently subscribed events</h3>
      <v-list dense>
        <v-list-item v-for="item of _settings.eventsub.eventSubEnabledSubscriptions[0]" :key="item">
          <v-list-item-title>{{ item }}</v-list-item-title>
        </v-list-item>
      </v-list>
    </v-card-text>
  </v-card>
</template>

<script lang="ts">
import translate from '@sogebot/ui-helpers/translate';
import {
  defineComponent, ref, watch,
} from '@vue/composition-api';

type Props = {
  settings: Record<string, any>,
};

export default defineComponent({
  props: { settings: Object },
  setup (props: Props, ctx) {
    const origin = location.origin;

    const _settings = ref(props.settings);
    watch(_settings, (val) => {
      ctx.emit('input', val);
    }, { deep: true });

    return {
      _settings,
      translate,
      origin,
    };
  },
});
</script>
