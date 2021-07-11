<template>
  <v-expansion-panels v-model="model">
    <v-expansion-panel readonly>
      <v-expansion-panel-header>Settings</v-expansion-panel-header>
      <v-expansion-panel-content>
        <v-row>
          <v-col cols="auto">
            <label class="v-label theme--dark" style="position: relative; top: 5px;">
              {{ translate('overlays.emotes.settings.cEmotesSize') }}
            </label>
          </v-col>
          <v-col>
            <v-slider
              v-model="options.emotesSize"
              :title="translate('overlays.emotes.settings.cEmotesSize')"
              min="1"
              max="3"
              :tick-labels="[1, 2, 3]"
              ticks="always"
              tick-size="4"
            />
          </v-col>
        </v-row>
        <v-text-field
          v-model.number="options.animationTime"
          :label="translate('overlays.emotes.settings.cEmotesAnimationTime')"
          min="200"
        />
        <v-text-field
          v-model.number="options.numOfExplosions"
          :label="translate('overlays.emotes.settings.cExplosionNumOfExplosions')"
          min="1"
        />
        <v-text-field
          v-model.number="options.numOfEmotesPerExplosion"
          :label="translate('overlays.emotes.settings.cExplosionNumOfEmotesPerExplosion')"
          min="1"
        />
        <v-btn @click="test">
          {{ translate('overlays.emotes.settings.btnTestFirework') }}
        </v-btn>
      </v-expansion-panel-content>
    </v-expansion-panel>
  </v-expansion-panels>
</template>

<script lang="ts">
import {
  defineComponent, ref, watch,
} from '@nuxtjs/composition-api';
import { getSocket } from '@sogebot/ui-helpers/socket';
import translate from '@sogebot/ui-helpers/translate';
import { defaults } from 'lodash';

export default defineComponent({
  props: { opts: Object },
  setup (props: any, ctx) {
    const model = ref(0);
    const options = ref(
      defaults(props.opts, {
        emotesSize:              3,
        numOfEmotesPerExplosion: 10,
        animationTime:           1000,
        numOfExplosions:         5,
      }));

    watch(options, (val: any) => {
      ctx.emit('update', val);
    }, { deep: true });

    const test = () => {
      getSocket('/core/emotes').emit('testFireworks', () => {
        return true;
      });
    };

    return {
      model,
      options,
      translate,
      test,
    };
  },
});
</script>
