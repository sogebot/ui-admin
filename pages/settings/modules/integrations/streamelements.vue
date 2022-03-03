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
            <v-text-field v-model="settings.jwtToken[0]" type="password" dense
              :label="translate('integrations.streamelements.settings.jwtToken.title')"
              :hint="translate('integrations.streamelements.settings.jwtToken.help')" persistent-hint>

              <template v-slot:message="{ message }">
                <span v-html="message"/>
              </template>
              <template #append-outer>
                <v-btn @click='validate' v-if="settings.jwtToken[0].length > 0" :loading="isValidating">Validate</v-btn>
              </template>
            </v-text-field>
          </v-card-text>
        </v-card>
      </v-tab-item>
    </v-tabs-items>
  </v-form>
</template>

<script lang="ts">
import { useContext, useStore } from '@nuxtjs/composition-api';
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
    const { $axios } = useContext();

    watch(settings, () => {
      store.commit('settings/pending', true);
    }, { deep: true });

    watch(() => store.state.settings.save, (val) => {
      if (val && settings.value) {
        saveSettings('/integrations/streamelements', store, settings.value);
      }
    });

    watch(valid, (val) => {
      store.commit('settings/valid', val);
    }, { immediate: true });

    onMounted(() => {
      getSocket(`/integrations/streamelements`)
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

    const validate = async () => {
      if (!settings.value) {
        return;
      }
      isValidating.value = true;
      try {
        await $axios('https://api.streamelements.com/kappa/v2/channels/me', {
          method:  'GET',
          headers: {
            Accept:        'application/json',
            Authorization: 'Bearer ' + settings.value.jwtToken[0],
          },
        });

        // we don't need to check anything, if request passed it is enough
        EventBus.$emit('snack', 'success', 'JWT token is valid.');
        setTimeout(() => {
          isValidating.value = false;
        }, 1000);
      } catch (e) {
        EventBus.$emit('snack', 'error', 'Invalid JWT Token, please recheck if you copied your token correctly');
        setTimeout(() => {
          isValidating.value = false;
        }, 1000);
      }
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
