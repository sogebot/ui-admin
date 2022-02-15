<template>
  <div>
    <v-stepper v-model="stepper" vertical>
      <v-stepper-step
        :complete="stepper > 1"
        step="1"
        editable
      >
        Select type of action button
      </v-stepper-step>
      <v-stepper-content :step="1">
        <v-select v-model="clonedItem.type" label="Action type" :items="typeItems" />
      </v-stepper-content>

      <v-stepper-step
        :complete="stepper > 1"
        step="2"
        editable
        :rules="[() => isSetupValid]"
      >
        Setup
      </v-stepper-step>
      <v-stepper-content :step="2" va>
        <component :is="clonedItem.type" :key="'step-2-' + timestamp" :item.sync="clonedItem" :valid.sync="isSetupValid" />
      </v-stepper-content>

      <v-stepper-step
        :complete="stepper > 3"
        step="3"
        editable
      >
        Customize theme
      </v-stepper-step>
      <v-stepper-content ref="content" :step="3">
        <div class="v-label v-label--active theme--dark pb-1" style="font-size: 12px;">
          Button color
        </div>
        <v-item-group v-model="colorIdx" mandatory active-class="asd">
          <v-row no-gutters>
            <v-col
              v-for="color in colorsList"
              :key="color"
              cols="1"
            >
              <v-item v-slot="{ active, toggle }">
                <v-card
                  class="d-flex align-center"
                  dark
                  :class="[color]"
                  height="25"
                  @click="toggle"
                >
                  <v-scroll-y-transition>
                    <v-overlay
                      v-if="active"
                      absolute
                      color="transparent"
                    >
                      <v-icon color="black">
                        mdi-check
                      </v-icon>
                    </v-overlay>
                  </v-scroll-y-transition>
                </v-card>
              </v-item>
            </v-col>
          </v-row>
        </v-item-group>
      </v-stepper-content>
    </v-stepper>
  </div>
</template>

<script lang="ts">
import {
  computed, defineAsyncComponent, defineComponent, ref, watch,
} from '@nuxtjs/composition-api';
import { cloneDeep } from 'lodash';

import type { QuickActions } from '@entity/dashboard';

type Props = {
  item: QuickActions.Item,
};

export default defineComponent({
  props: {
    item: Object,
  },
  components: {
    command: defineAsyncComponent({
      loader: () => import('~/components/widgets/actions/edit/command.vue'),
    }),
    customvariable: defineAsyncComponent({
      loader: () => import('~/components/widgets/actions/edit/customvariable.vue'),
    }),
    randomizer: defineAsyncComponent({
      loader: () => import('~/components/widgets/actions/edit/randomizer.vue'),
    }),
    overlayCountdown: defineAsyncComponent({
      loader: () => import('~/components/widgets/actions/edit/overlayCountdown.vue'),
    }),
    overlayStopwatch: defineAsyncComponent({
      loader: () => import('~/components/widgets/actions/edit/overlayStopwatch.vue'),
    }),
    overlayMarathon: defineAsyncComponent({
      loader: () => import('~/components/widgets/actions/edit/overlayMarathon.vue'),
    }),
  },
  setup (props: Props, ctx) {
    const stepper = ref('1');
    const clonedItem = ref(cloneDeep(props.item));
    const canvasWidth = ref(0);
    const content = ref(null as HTMLElement | null);
    const colorIdx = ref(0);
    const isSetupValid = ref(true);
    const timestamp = ref(Date.now());

    watch(isSetupValid, (val) => {
      ctx.emit('update:valid', val);
    });

    const colors = ref([
      'red', 'pink', 'purple', 'deep-purple', 'indigo', 'blue', 'light-blue', 'cyan', 'teal',
      'green', 'light-green', 'lime', 'yellow', 'amber', 'orange', 'deep-orange', 'brown',
      'blue-grey', 'grey',
    ]);

    const colorsList = computed(() => {
      const shade = ['lighten-4', 'lighten-3', 'lighten-2', 'lighten-1', '', 'darken-1', 'darken-2', 'darken-3', 'darken-4', 'accent-2', 'accent-3', 'accent-4'];
      const output: string[] = [];
      for (const color of colors.value) {
        for (const s of shade) {
          output.push(`${color} ${s}`.trim());
        }
      }
      return output;
    });

    watch(colorIdx, (val) => {
      if (clonedItem.value) {
        clonedItem.value.options.color = colorsList.value[val];
      }
    });

    watch(stepper, (val) => {
      if (val === '3') {
        pickColor();
        refreshCanvasWidth();
      }
    });

    const pickColor = () => {
      if (clonedItem.value) {
        const color = clonedItem.value.options.color;
        colorIdx.value = colorsList.value.indexOf(color);
      } else {
        colorIdx.value = 0;
      }
    };

    const refreshCanvasWidth = () => {
      if (!content.value || (content.value as any).$el.clientWidth === 0) {
        setTimeout(() => refreshCanvasWidth(), 1);
      } else {
        canvasWidth.value = (content.value as any).$el.clientWidth;
      }
    };

    const typeItems = [
      {
        text: 'Run Command', value: 'command',
      },
      {
        text: '+/-/= Custom Variable', value: 'customvariable',
      },
      {
        text: 'Randomizer', value: 'randomizer',
      },
      {
        text: 'Countdown overlay or countdown in group overlay', value: 'overlayCountdown',
      },
      {
        text: 'Stopwatch overlay or stopwatch in group overlay', value: 'overlayStopwatch',
      },
      {
        text: 'Marathon overlay or marathon in group overlay', value: 'overlayMarathon',
      },
    ];

    watch(clonedItem, (val) => {
      ctx.emit('update:item', val);
    }, {
      deep: true,
    });

    return {
      // refs
      stepper,
      clonedItem,
      typeItems,
      canvasWidth,
      content,
      colorsList,
      colorIdx,
      isSetupValid,
      timestamp,
    };
  },
});
</script>
