<template>
  <loading v-if="!settings" />
  <v-card flat v-else class="fill-height">
    <v-form v-model="valid" lazy-validation>
      <v-card-title>{{ translate('categories.general') }}</v-card-title>
      <v-card-text>
        <v-text-field
          :label="translate('core.oauth.settings.generalChannel')"
          v-model="settings.general.generalChannel[0]"
          @input="$store.commit('settings/pending', true)"
        />

        <v-textarea
          auto-grow
          outlined
          persistent-hint
          :label="translate('core.oauth.settings.generalOwners')"
          :value="settings.general.generalOwners[0].filter(String).join('\n')"
          @input="settings.general.generalOwners[0] = $event.split('\n').filter(String); $store.commit('settings/pending', true)"
          :hint="translate('one-record-per-line')"
        />
      </v-card-text>

      <v-divider />

      <v-card-title>{{ translate('categories.bot') }}</v-card-title>
      <v-card-text>
        <v-text-field
          :label="translate('core.oauth.settings.botAccessToken')"
          v-model="settings.bot.botAccessToken[0]"
          @input="$store.commit('settings/pending', true)"
          type="password"
        />
        <v-text-field
          :label="translate('core.oauth.settings.botRefreshToken')"
          v-model="settings.bot.botRefreshToken[0]"
          @input="$store.commit('settings/pending', true)"
          type="password"
        />
        <v-text-field
          :label="translate('core.oauth.settings.botUsername')"
          v-model="settings.bot.botUsername[0]"
          disabled
        />
        <v-btn href="https://twitchtokengenerator.com/quick/jLbq7v1pzF" target="_blank">
          {{ translate('commons.generate') }}
        </v-btn>
      </v-card-text>

      <v-divider />

      <v-card-title>{{ translate('categories.broadcaster') }}</v-card-title>
      <v-card-text>
        <v-text-field
          :label="translate('core.oauth.settings.broadcasterAccessToken')"
          v-model="settings.broadcaster.broadcasterAccessToken[0]"
          @input="$store.commit('settings/pending', true)"
          type="password"
        />
        <v-text-field
          :label="translate('core.oauth.settings.broadcasterRefreshToken')"
          v-model="settings.broadcaster.broadcasterRefreshToken[0]"
          @input="$store.commit('settings/pending', true)"
          type="password"
        />
        <v-text-field
          :label="translate('core.oauth.settings.broadcasterUsername')"
          v-model="settings.broadcaster.broadcasterUsername[0]"
          disabled
        />
        <v-btn href="https://twitchtokengenerator.com/quick/XH6B7JteDO" target="_blank">
          {{ translate('commons.generate') }}
        </v-btn>
      </v-card-text>
    </v-form>
  </v-card>
</template>

<script lang="ts">
import { useStore } from '@nuxtjs/composition-api';
import { getSocket } from '@sogebot/ui-helpers/socket';
import translate from '@sogebot/ui-helpers/translate';
import {
  defineComponent, onMounted, ref, watch,
} from '@vue/composition-api';

import { error } from '~/functions/error';
import { saveSettings } from '~/functions/settings';

export default defineComponent({
  beforeRouteLeave (_to, _from, next) {
    if (this.$store.state.settings.pending) {
      const isOK = confirm('You will lose your pending changes. Do you want to continue?');
      if (!isOK) {
        return next(false);
      }
    }
    this.$store.commit('settings/pending', false);
    next();
  },
  setup () {
    const settings = ref(null as Record<string, any> | null);
    const ui = ref(null as Record<string, any> | null);
    const store = useStore<any>();
    const valid = ref(true);

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
        });
    });

    return {
      settings,
      ui,
      translate,
      valid,
    };
  },
});
</script>
