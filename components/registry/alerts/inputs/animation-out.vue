<template>
  <v-expansion-panel>
    <v-expansion-panel-header>{{ translate('registry.alerts.animationOut.name') }}</v-expansion-panel-header>
    <v-expansion-panel-content>
      <v-row>
        <v-col>
          <v-select v-model="animType" :items="options" :label="translate('type')">
            <template #append-outer>
              <v-btn icon @click="test = true">
                <v-icon>{{ mdiPlay }}</v-icon>
              </v-btn>
            </template>
          </v-select>

          <v-text-field v-model.number="animDuration" type="number" min="100" :label="translate('duration')" />
        </v-col>
        <v-col class="ma-auto" cols="auto">
          <v-sheet
            color="primary"
            width="100px"
            height="100px"
            class="animate__animated"
            :class="[computedClass]"
            :style="{ 'animation-duration': animDuration + 'ms' }"
          />
        </v-col>
      </v-row>
    </v-expansion-panel-content>
  </v-expansion-panel>
</template>

<script lang="ts">
import { mdiPlay } from '@mdi/js';
import {
  computed,
  defineComponent, ref, watch,
} from '@nuxtjs/composition-api';
import translate from '@sogebot/ui-helpers/translate';

require('animate.css');

export default defineComponent({
  props: {
    animation:         String,
    animationDuration: Number,
  },
  setup (props, ctx) {
    const animType = ref(props.animation);
    const animDuration = ref(props.animationDuration ?? {});

    const test = ref(false);

    const computedClass = computed(() => {
      if (test.value) {
        // eslint-disable-next-line vue/no-async-in-computed-properties
        setTimeout(() => {
          test.value = false;
        }, 100);
        return '';
      } else {
        return 'animate__' + animType.value;
      }
    });

    const options: { value: string, text: string }[] = [
      { value: 'fadeOut', text: 'fadeOut' },
      { value: 'fadeOutDown', text: 'fadeOutDown' },
      { value: 'fadeOutLeft', text: 'fadeOutLeft' },
      { value: 'fadeOutRight', text: 'fadeOutRight' },
      { value: 'fadeOutUp', text: 'fadeOutUp' },
      { value: 'fadeOutDownBig', text: 'fadeOutDownBig' },
      { value: 'fadeOutLeftBig', text: 'fadeOutLeftBig' },
      { value: 'fadeOutRightBig', text: 'fadeOutRightBig' },
      { value: 'fadeOutUpBig', text: 'fadeOutUpBig' },
      { value: 'flipOutX', text: 'flipOutX' },
      { value: 'flipOutY', text: 'flipOutY' },
      { value: 'backOutDown', text: 'backOutDown' },
      { value: 'backOutLeft', text: 'backOutLeft' },
      { value: 'backOutRight', text: 'backOutRight' },
      { value: 'backOutUp', text: 'backOutUp' },
      { value: 'bounceOut', text: 'bounceOut' },
      { value: 'bounceOutDown', text: 'bounceOutDown' },
      { value: 'bounceOutLeft', text: 'bounceOutLeft' },
      { value: 'bounceOutRight', text: 'bounceOutRight' },
      { value: 'bounceOutUp', text: 'bounceOutUp' },
      { value: 'flipOutX', text: 'flipOutX' },
      { value: 'flipOutY', text: 'flipOutY' },
      { value: 'lightSpeedOut', text: 'lightSpeedOut' },
      { value: 'rotateOut', text: 'rotateOut' },
      { value: 'rotateOutDownLeft', text: 'rotateOutDownLeft' },
      { value: 'rotateOutDownRight', text: 'rotateOutDownRight' },
      { value: 'rotateOutUpLeft', text: 'rotateOutUpLeft' },
      { value: 'rotateOutUpRight', text: 'rotateOutUpRight' },
      { value: 'slideOutDown', text: 'slideOutDown' },
      { value: 'slideOutLeft', text: 'slideOutLeft' },
      { value: 'slideOutRight', text: 'slideOutRight' },
      { value: 'slideOutUp', text: 'slideOutUp' },
      { value: 'zoomOut', text: 'zoomOut' },
      { value: 'zoomOutDown', text: 'zoomOutDown' },
      { value: 'zoomOutLeft', text: 'zoomOutLeft' },
      { value: 'zoomOutRight', text: 'zoomOutRight' },
      { value: 'zoomOutUp', text: 'zoomOutUp' },
      { value: 'rollOut', text: 'rollOut' },
    ];

    watch(animType, (val) => {
      ctx.emit('update:animation', val);
    }, { deep: true });
    watch(animDuration, (val) => {
      ctx.emit('update:animationDuration', val);
    }, { deep: true });

    return {
      animType,
      animDuration,
      test,
      options,
      computedClass,
      mdiPlay,
      translate,
    };
  },
});
</script>
