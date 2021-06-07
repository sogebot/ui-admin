<template>
  <v-expansion-panel>
    <v-expansion-panel-header>
      {{ translate('registry.alerts.tts.setting') }}
    </v-expansion-panel-header>
    <v-expansion-panel-content>
      <v-overlay v-if="state.loaded !== ButtonStates.success" absolute>
        <v-progress-circular indeterminate class="text-center" />
      </v-overlay>
      <div v-else-if="state.loaded === ButtonStates.success">
        <v-checkbox
          v-model="model.enabled"
          :label="translate('registry.alerts.enabled')"
        />

        <v-text-field
          v-if="!isUndefined(model.minAmountToPlay)"
          v-model="model.minAmountToPlay"
          type="number"
          min="0"
        />

        <v-checkbox
          v-if="!isUndefined(model.skipUrls)"
          v-model="model.skipUrls"
          :label="translate('registry.alerts.skipUrls')"
        />

        <v-checkbox
          v-if="!isUndefined(model.keepAlertShown)"
          v-model="model.keepAlertShown"
          :label="translate('registry.alerts.keepAlertShown')"
        />
      </div>
      <v-alert v-else text color="info" border="left" class="ma-0">
        ResponsiveVoices key is not properly set, go to
        <nuxt-link to="/settings/integrations/responsivevoice">
          ResponsiveVoice integration settings
        </nuxt-link>
        and set your key.
      </v-alert>
    </v-expansion-panel-content>
  </v-expansion-panel>
</template>

<script lang="ts">
import { ButtonStates } from '@sogebot/ui-helpers/buttonStates';
import translate from '@sogebot/ui-helpers/translate';
import {
  defineComponent, onMounted, ref, watch,
} from '@vue/composition-api';

import type { CommonSettingsInterface } from '~/.bot/src/bot/database/entity/alert';

declare global {
  interface Window {
    responsiveVoice: any;
  }
}

function isUndefined (val: any) {
  return typeof val === 'undefined';
}

export default defineComponent({
  props: { value: Object },
  setup (props: { value: Partial<CommonSettingsInterface['tts']>}, ctx) {
    const text = ref('This message should be said by TTS to test your settings.');
    const state = ref({ loaded: ButtonStates.progress } as { loaded: number });
    const model = ref(props.value);
    const voices = ref([] as {text: string; value: string}[]);

    function initResponsiveVoice () {
      if (typeof window.responsiveVoice === 'undefined') {
        setTimeout(() => initResponsiveVoice(), 200);
        return;
      }
      window.responsiveVoice.init();
      voices.value = window.responsiveVoice.getVoices().map((o: { name: string }) => {
        return { text: o.name, value: o.name };
      });
      state.value.loaded = ButtonStates.success;
    }

    onMounted(() => {
      state.value.loaded = ButtonStates.progress;
      if (ctx.root.$store.state.configuration.integrations.ResponsiveVoice.api.key.trim().length === 0) {
        state.value.loaded = ButtonStates.fail;
      } else {
        initResponsiveVoice();
      }
    });

    watch(model, (val) => {
      ctx.emit('input', val);
    }, { deep: true });

    return {
      voices,
      isUndefined,
      model,
      state,
      text,
      translate,
      ButtonStates,
    };
  },
  head () {
    return {
      script: [
        {
          hid: 'responsivevoice',
          src: 'https://code.responsivevoice.org/responsivevoice.js?key=' + this.$store.state.configuration.integrations.ResponsiveVoice.api.key,
        },
      ],
    };
  },
});
</script>
