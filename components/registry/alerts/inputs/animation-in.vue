<template>
  <v-expansion-panel>
    <v-expansion-panel-header>{{ translate('registry.alerts.animationIn.name') }}</v-expansion-panel-header>
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
      { value: 'fadeIn', text: 'fadeIn' },
      { value: 'fadeInDown', text: 'fadeInDown' },
      { value: 'fadeInLeft', text: 'fadeInLeft' },
      { value: 'fadeInRight', text: 'fadeInRight' },
      { value: 'fadeInUp', text: 'fadeInUp' },
      { value: 'fadeInDownBig', text: 'fadeInDownBig' },
      { value: 'fadeInLeftBig', text: 'fadeInLeftBig' },
      { value: 'fadeInRightBig', text: 'fadeInRightBig' },
      { value: 'fadeInUpBig', text: 'fadeInUpBig' },
      { value: 'flipInX', text: 'flipInX' },
      { value: 'flipInY', text: 'flipInY' },
      { value: 'backInDown', text: 'backInDown' },
      { value: 'backInLeft', text: 'backInLeft' },
      { value: 'backInRight', text: 'backInRight' },
      { value: 'backInUp', text: 'backInUp' },
      { value: 'bounceIn', text: 'bounceIn' },
      { value: 'bounceInDown', text: 'bounceInDown' },
      { value: 'bounceInLeft', text: 'bounceInLeft' },
      { value: 'bounceInRight', text: 'bounceInRight' },
      { value: 'bounceInUp', text: 'bounceInUp' },
      { value: 'flipInX', text: 'flipInX' },
      { value: 'flipInY', text: 'flipInY' },
      { value: 'lightSpeedIn', text: 'lightSpeedIn' },
      { value: 'rotateIn', text: 'rotateIn' },
      { value: 'rotateInDownLeft', text: 'rotateInDownLeft' },
      { value: 'rotateInDownRight', text: 'rotateInDownRight' },
      { value: 'rotateInUpLeft', text: 'rotateInUpLeft' },
      { value: 'rotateInUpRight', text: 'rotateInUpRight' },
      { value: 'slideInDown', text: 'slideInDown' },
      { value: 'slideInLeft', text: 'slideInLeft' },
      { value: 'slideInRight', text: 'slideInRight' },
      { value: 'slideInUp', text: 'slideInUp' },
      { value: 'zoomIn', text: 'zoomIn' },
      { value: 'zoomInDown', text: 'zoomInDown' },
      { value: 'zoomInLeft', text: 'zoomInLeft' },
      { value: 'zoomInRight', text: 'zoomInRight' },
      { value: 'zoomInUp', text: 'zoomInUp' },
      { value: 'rollIn', text: 'rollIn' },
      { value: 'jackInTheBox', text: 'jackInTheBox' },
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
