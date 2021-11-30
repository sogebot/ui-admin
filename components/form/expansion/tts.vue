<template>
  <v-expansion-panel :readonly="readonly">
    <v-expansion-panel-header>
      {{ translate('registry.alerts.tts.setting') }}
    </v-expansion-panel-header>
    <v-expansion-panel-content>
      <v-overlay v-if="state.loaded === ButtonStates.progress" absolute>
        <v-progress-circular indeterminate class="text-center" />
      </v-overlay>
      <div v-else-if="state.loaded === ButtonStates.success">
        <v-checkbox
          v-if="!isUndefined(model.enabled)"
          v-model="model.enabled"
          :label="translate('registry.alerts.enabled')"
        />

        <v-autocomplete
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
          :max="service === 0 ? 1.5 : 4.0"
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
          :min="service === 0 ? 0.0 : -20.0"
          :max="service === 0 ? 2.0 : 20.0"
          :step="service === 0 ? 0.1 : 1"
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

        <slot name="append" />

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
        TTS is not properly set, go to <nuxt-link to="/settings/modules/core/tts">
          TTS settings
        </nuxt-link> and configure.
      </v-alert>
    </v-expansion-panel-content>
  </v-expansion-panel>
</template>

<script lang="ts">
import { mdiPlay } from '@mdi/js';
import {
  defineComponent, onMounted, ref, useMeta, useStore, watch,
} from '@nuxtjs/composition-api';
import { ButtonStates } from '@sogebot/ui-helpers/buttonStates';
import { getSocket } from '@sogebot/ui-helpers/socket';
import translate from '@sogebot/ui-helpers/translate';

import type { AlertInterface, CommonSettingsInterface } from '~/.bot/src/database/entity/alert';

declare global {
  interface Window {
    responsiveVoice: any;
  }
}

function isUndefined (val: any) {
  return typeof val === 'undefined';
}

export default defineComponent({
  props: { value: Object, readonly: Boolean },
  setup (props: { value: Partial<CommonSettingsInterface['tts']> | AlertInterface['tts']}, ctx) {
    const text = ref('This message should be said by TTS to test your settings.');
    const state = ref({ loaded: ButtonStates.progress } as { loaded: number });

    const service = ref(0);

    const model = ref(props.value ?? {
      voice: useStore<any>().state.configuration.core.tts.service === 0
        ? 'UK English Female'
        : 'en-US-Wavenet-A',
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
      const store = useStore<any>();
      if (store.state.configuration.core.tts.service === -1
        || (store.state.configuration.core.tts.service === 0 && store.state.configuration.core.tts.responsiveVoiceKey.length === 0)
        || (store.state.configuration.core.tts.service === 1 && (store.state.configuration.core.tts.googlePrivateKey.length === 0 || store.state.configuration.core.tts.googleClientEmail.length === 0))) {
        state.value.loaded = ButtonStates.fail;
      } else if (store.state.configuration.core.tts.service === 0) {
        service.value = 0;
        initResponsiveVoice();
      } else if (store.state.configuration.core.tts.service === 1) {
        service.value = 1;
        voices.value = store.state.configuration.core.tts.googleVoices;
        state.value.loaded = ButtonStates.success;
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
              if (service.value === 0) {
                window.responsiveVoice.speak(toSpeak.trim(), model.value.voice, {
                  rate: model.value.rate, pitch: model.value.pitch, volume: model.value.volume, onend: () => setTimeout(() => resolve(), 500),
                });
              } else {
                // Google TTS
                getSocket('/core/tts').emit('google::speak', {
                  rate: model.value.rate, pitch: model.value.pitch, volume: model.value.volume, voice: model.value.voice, text: text.value,
                }, (err: Error | null, b64mp3: string) => {
                  if (err) {
                    console.error(err);
                  }
                  const snd = new Audio(`data:audio/mp3;base64,` + b64mp3);
                  snd.play();
                });
              }
            } else {
              console.error('You should not see this message, speak should be disabled in this extension panel - please log a bug');
            }
          }
        });
      }
    }

    if (useStore<any>().state.configuration.core.tts.service === 0) {
      useMeta({
        script: [
          {
            hid: 'responsivevoice',
            src: 'https://code.responsivevoice.org/responsivevoice.js?key=' + useStore<any>().state.configuration.core.tts.responsiveVoiceKey,
          },
        ],
      });
    }

    return {
      voices,
      isUndefined,
      model,
      state,
      text,
      service,
      translate,
      ButtonStates,
      mdiPlay,
      speak,
    };
  },
  head: {}, // enable useMeta
});
</script>
