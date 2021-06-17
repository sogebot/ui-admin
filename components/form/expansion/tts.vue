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
          v-if="!isUndefined(model.enabled)"
          v-model="model.enabled"
          :label="translate('registry.alerts.enabled')"
        />

        <v-select
          v-if="!isUndefined(model.voice)"
          v-model="model.voice"
          :label="translate('registry.alerts.voice')"
          :items="voices"
        />

        <v-slider
          v-if="!isUndefined(model.volume)"
          v-model.number="model.volume"
          :label="translate('registry.alerts.volume')"
          min="0"
          max="1"
          step="0.01"
          :thumb-size="0"
          thumb-label="always"
        >
          <template #thumb-label="{ value }">
            <div style="transform: translateY(-8px);">
              {{ Number(value * 100).toFixed(0) + '%' }}
            </div>
          </template>
        </v-slider>

        <v-slider
          v-if="!isUndefined(model.rate)"
          v-model.number="model.rate"
          :label="translate('registry.alerts.rate')"
          min="0"
          max="1.5"
          step="0.1"
          :thumb-size="0"
          thumb-label="always"
        >
          <template #thumb-label="{ value }">
            <div style="transform: translateY(-8px);">
              {{ value }}
            </div>
          </template>
        </v-slider>

        <v-slider
          v-if="!isUndefined(model.pitch)"
          v-model.number="model.pitch"
          :label="translate('registry.alerts.pitch')"
          min="0"
          max="2"
          step="0.1"
          :thumb-size="0"
          thumb-label="always"
        >
          <template #thumb-label="{ value }">
            <div style="transform: translateY(-8px);">
              {{ value }}
            </div>
          </template>
        </v-slider>

        <v-text-field
          v-if="!isUndefined(model.minAmountToPlay)"
          v-model="model.minAmountToPlay"
          :label="translate('registry.alerts.minAmountToPlay.name')"
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

        <v-textarea
          v-if="!isUndefined(model.voice)"
          v-model="text"
          :label="translate('registry.alerts.test')"
          auto-grow
          rows="1"
        >
          <template #append>
            <v-btn icon @click="speak()">
              <v-icon>{{ mdiPlay }}</v-icon>
            </v-btn>
          </template>
        </v-textarea>
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
import { mdiPlay } from '@mdi/js';
import { ButtonStates } from '@sogebot/ui-helpers/buttonStates';
import translate from '@sogebot/ui-helpers/translate';
import {
  defineComponent, onMounted, ref, watch,
} from '@vue/composition-api';

import type { AlertInterface, CommonSettingsInterface } from '~/.bot/src/bot/database/entity/alert';

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
  setup (props: { value: Partial<CommonSettingsInterface['tts']> | AlertInterface['tts']}, ctx) {
    const text = ref('This message should be said by TTS to test your settings.');
    const state = ref({ loaded: ButtonStates.progress } as { loaded: number });
    const model = ref(props.value ?? {
      voice:  'UK English Female',
      volume: 1,
      rate:   1,
      pitch:  1,
    } as Partial<CommonSettingsInterface['tts']> | AlertInterface['tts']);
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

    async function speak () {
      for (const toSpeak of text.value.split('/ ')) {
        await new Promise<void>((resolve) => {
          if (toSpeak.trim().length === 0) {
            setTimeout(() => resolve(), 500);
          } else {
            function isGlobal (value: Partial<CommonSettingsInterface['tts']> | Required<AlertInterface['tts']>): value is Required<AlertInterface['tts']> {
              if (value) {
                return Object.keys(value).includes('voice');
              } else {
                return false;
              }
            }
            if (isGlobal(model.value) && model.value) {
              window.responsiveVoice.speak(toSpeak.trim(), model.value.voice, {
                rate: model.value.rate, pitch: model.value.pitch, volume: model.value.volume, onend: () => setTimeout(() => resolve(), 500),
              });
            } else {
              console.error('You should not see this message, speak should be disabled in this extension panel - please log a bug');
            }
          }
        });
      }
    }

    return {
      voices,
      isUndefined,
      model,
      state,
      text,
      translate,
      ButtonStates,
      mdiPlay,
      speak,
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