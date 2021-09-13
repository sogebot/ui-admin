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
            <v-text-field
              v-model.trim="settings.access_token[0]"
              type="password"
              :label="translate('integrations.donationalerts.settings.access_token.title')"
              :hint="translate('integrations.donationalerts.settings.access_token.help')"
              persistent-hint
            >
              <template #append-outer>
                <v-btn v-if="settings.access_token[0].length > 0" :loading="isValidating" @click="validate">
                  Validate
                </v-btn>
              </template>
            </v-text-field>
            <v-text-field
              v-model.trim="settings.refresh_token[0]"
              type="password"
              :label="translate('integrations.donationalerts.settings.refresh_token.title')"
            />
            <v-btn class="mt-4" href="https://www.sogebot.xyz/integrations/#DonationAlerts">
              {{ translate('integrations.donationalerts.settings.accessTokenBtn') }}
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
  defineComponent, nextTick, onMounted, ref, watch,
} from '@vue/composition-api';

import { error } from '~/functions/error';
import { EventBus } from '~/functions/event-bus';
import { saveSettings } from '~/functions/settings';
import { minValue, required } from '~/functions/validators';

export default defineComponent({
  setup () {
    const settings = ref(null as Record<string, any> | null);
    const ui = ref(null as Record<string, any> | null);
    const store = useStore<any>();
    const valid = ref(true);
    const tab = ref(null);
    const isValidating = ref(false);

    watch(settings, () => {
      store.commit('settings/pending', true);
    }, { deep: true });

    watch(() => store.state.settings.save, (val) => {
      if (val && settings.value) {
        saveSettings('/integrations/donationalerts', store, settings.value);
      }
    });

    watch(valid, (val) => {
      store.commit('settings/valid', val);
    }, { immediate: true });

    onMounted(() => {
      getSocket(`/integrations/donationalerts`)
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

    const validate = () => {
      if (!settings.value) {
        return;
      }
      isValidating.value = true;
      console.log({ token: settings.value.access_token[0] });
      getSocket('/integrations/donationalerts').emit('donationalerts::validate', settings.value.access_token[0], (err: null | Error) => {
        if (err) {
          EventBus.$emit('snack', 'error', 'Invalid Access Token, please recheck if you copied your token correctly');
        } else {
          EventBus.$emit('snack', 'success', 'Access token is valid.');
        }
        setTimeout(() => {
          isValidating.value = false;
        }, 1000);
      });
    };

    return {
      settings,
      ui,
      translate,
      valid,
      tab,
      isValidating,

      // functions
      validate,

      // validators
      required,
      minValue,
    };
  },
});
</script>
