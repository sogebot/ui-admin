<template>
  <v-expansion-panel>
    <v-expansion-panel-header>{{ $t('registry.alerts.animationText.name') }}</v-expansion-panel-header>
    <v-expansion-panel-content>
      <v-row no-gutters>
        <v-col>
          <v-select
            v-model="animType"
            :label="$t('registry.alerts.animationType.name')"
            :items="options"
          />
        </v-col>
        <v-col v-if="!['baffle', 'typewriter'].includes(animType)" align-self="center" class="text-center">
          <div
            v-for="(char, index) of text.split('')"
            :key="char + index"
            class="char d-inline-block animate__animated animate__infinite"
            :class="['animate__' + animType, 'animate__' + animOptions.speed]"
            :style="{'animation-delay' : (index * 50) + 'ms'}"
          >
            {{ char === ' ' ? '&nbsp;' : char }}
          </div>
        </v-col>
        <v-col v-else-if="animType === 'typewriter'" align-self="center" class="text-center">
          <div
            v-for="(char, index) of text.split('')"
            :key="char + index + animOptions.speed"
            class="char d-inline-block animate__animated animate__fadeIn"
            :class="['animate__' + animOptions.speed]"
            :style="{
              'animation-timing-function': 'steps(1, end)',
              'animation-duration': `${animOptions.speed}ms`,
              'animation-delay': (index * animOptions.speed) + 'ms'
            }"
          >
            {{ char === ' ' ? '&nbsp;' : char }}
          </div>
        </v-col>
        <v-col v-else align-self="center" class="text-center">
          <baffle
            class="char"
            text="Sample text"
            :options="animOptions"
          />
        </v-col>
      </v-row>
      <v-row
        v-if="!['baffle', 'wiggle', 'wiggle2' ,'wave', 'none', 'typewriter'].includes(animType)"
        no-gutters
      >
        <v-col>
          <v-select
            v-model="animOptions.speed"
            :label="$t('registry.alerts.speed.name')"
            :items="speedOptions"
          />
        </v-col>
      </v-row>
      <template v-if="['baffle', 'typewriter'].includes(animType)">
        <v-row no-gutters>
          <v-col>
            <v-text-field
              v-model.number="animOptions.speed"
              type="number"
              min="0"
              :label="$t('registry.alerts.speed.name')"
            />
          </v-col>
        </v-row>
        <v-row no-gutters v-if="['baffle'].includes(animType)">
          <v-col>
            <v-text-field
              v-model.number="animOptions.maxTimeToDecrypt"
              type="number"
              min="0"
              :label="$t('registry.alerts.maxTimeToDecrypt.name')"
            />
          </v-col>
        </v-row>
        <v-row no-gutters v-if="['baffle'].includes(animType)">
          <v-col>
            <v-text-field
              v-model="animOptions.characters"
              :label="$t('registry.alerts.characters.name')"
            />
          </v-col>
        </v-row>
      </template>
    </v-expansion-panel-content>
  </v-expansion-panel>
</template>

<script lang="ts">
import {
  defineAsyncComponent,
  defineComponent, ref, watch,
} from '@nuxtjs/composition-api';

require('animate.css');

export default defineComponent({
  components: { baffle: defineAsyncComponent({ loader: () => import('~/components/baffle.vue') }) },
  props:      {
    animation:        String,
    animationOptions: Object,
  },
  setup (props, ctx) {
    const animType = ref(props.animation as string);
    const animOptions = ref(props.animationOptions ?? {});

    const text = ref('Sample text');

    const speedOptions: { value: string, text: string }[] = [
      { value: 'slower', text: 'slower' },
      { value: 'slow', text: 'slow' },
      { value: 'fast', text: 'fast' },
      { value: 'faster', text: 'faster' },
    ];

    const options: { value: string, text: string }[] = [
      { value: 'none', text: 'none' },
      { value: 'baffle', text: 'baffle' },
      { value: 'bounce', text: 'bounce' },
      { value: 'bounce2', text: 'bounce2' },
      { value: 'flip', text: 'flip' },
      { value: 'flash', text: 'flash' },
      { value: 'pulse2', text: 'pulse' },
      { value: 'rubberBand', text: 'rubberBand' },
      { value: 'shake2', text: 'shake' },
      { value: 'swing', text: 'swing' },
      { value: 'tada', text: 'tada' },
      { value: 'typewriter', text: 'typewriter' },
      { value: 'wave', text: 'wave' },
      { value: 'wobble', text: 'wobble' },
      { value: 'wiggle', text: 'wiggle' },
      { value: 'wiggle2', text: 'wiggle2' },
      { value: 'jello', text: 'jello' },
    ];

    watch(animType, (val) => {
      if (val === 'baffle') {
        animOptions.value.speed = 50;
        animOptions.value.characters = '█▓░ </>';
        animOptions.value.maxTimeToDecrypt = '4000';
      } else if (val === 'typewriter') {
        animOptions.value.speed = 50;
      } else {
        animOptions.value.speed = 'slower';
      }
      ctx.emit('update:animation', val);
    });
    watch(animOptions, (val) => {
      ctx.emit('update:animationOptions', val);
    }, { deep: true });

    return {
      text,
      options,
      animType,
      animOptions,
      speedOptions,
    };
  },
});
</script>
