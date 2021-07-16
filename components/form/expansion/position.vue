<template>
  <v-expansion-panel :disabled="disabled">
    <v-expansion-panel-header>
      {{ translate('dialog.position.settings') }}
    </v-expansion-panel-header>
    <v-expansion-panel-content>
      <v-select
        v-model="model.anchorX"
        :label="translate('dialog.position.anchorX')"
        :items="anchorXOptions"
      />
      <v-select
        v-model="model.anchorY"
        :label="translate('dialog.position.anchorY')"
        :items="anchorYOptions"
      />

      <v-slider
        v-model="model.x"
        :label="translate('dialog.position.x')"
        :max="100"
        :step="0.01"
        :min="0"
        :thumb-size="0"
        thumb-label="always"
      >
        <template #thumb-label="{ value }">
          <div style="transform: translateY(-8px);">
            {{ Number(value) + '%' }}
          </div>
        </template>
      </v-slider>

      <v-slider
        v-model="model.y"
        :label="translate('dialog.position.y')"
        :max="100"
        :step="0.01"
        :min="0"
        :thumb-size="0"
        thumb-label="always"
      >
        <template #thumb-label="{ value }">
          <div style="transform: translateY(-8px);">
            {{ Number(value) + '%' }}
          </div>
        </template>
      </v-slider>

      <div class="m-auto py-4" style="width: 25%; margin: auto;">
        <v-responsive :aspect-ratio="16/9" style="overflow: visible;">
          <v-sheet ref="example" class="fill-height" style="position: relative;" elevation="2" color="grey darken-4">
            <v-icon ref="anchor" color="primary" style="position: absolute;" x-small :style="positionGenerator('anchor')">
              {{ mdiSquare }}
            </v-icon>
            <div ref="text" style="font-size: 1rem; position: absolute;" :style="positionGenerator('text')">
              EXAMPLE TEXT
            </div>
          </v-sheet>
        </v-responsive>
      </div>
    </v-expansion-panel-content>
  </v-expansion-panel>
</template>

<script lang="ts">
import { mdiSquare } from '@mdi/js';
import {
  defineComponent,
  reactive,
  ref,
  toRefs,
  watch,
} from '@nuxtjs/composition-api';
import translate from '@sogebot/ui-helpers/translate';
import { v4 } from 'uuid';

import type { RandomizerInterface } from '~/.bot/src/bot/database/entity/randomizer';

interface Props {
  value: RandomizerInterface['position'];
  disabled: boolean,
}

export default defineComponent({
  props: { value: Object, disabled: Boolean },
  setup (props: Props, ctx) {
    const model = reactive(props.value);
    const uuid = ref(v4());

    const anchorXOptions = [
      { value: 'left', text: translate('dialog.position.left') },
      { value: 'middle', text: translate('dialog.position.middle') },
      { value: 'right', text: translate('dialog.position.right') },
    ];

    const anchorYOptions = [
      { value: 'top', text: translate('dialog.position.top') },
      { value: 'middle', text: translate('dialog.position.middle') },
      { value: 'bottom', text: translate('dialog.position.bottom') },
    ];

    // refs
    const HTMLRef: {
      anchor: HTMLElement | null,
      text: HTMLElement | null,
    } = reactive({
      anchor: null,
      text:   null,
    });
    const example = ref(null as HTMLElement | null);

    const positionGenerator = (refType: 'anchor' | 'text'): { transform: string } => {
      if (example.value) {
        if (HTMLRef[refType]) {
          const el = refType === 'text' ? HTMLRef[refType] as any : (HTMLRef[refType] as any).$el as HTMLElement;
          const widthPxPerCent = (example.value as any).$el.getBoundingClientRect().width / 100;
          const heightPxPerCent = (example.value as any).$el.getBoundingClientRect().height / 100;
          console.log({
            el, refType, HTMLRef,
          });
          let top = 0;
          if (model.anchorY === 'middle') {
            top = el.getBoundingClientRect().height / 2;
          } else if (model.anchorY === 'bottom') {
            top = el.getBoundingClientRect().height;
          }

          let left = 0;
          if (model.anchorX === 'middle') {
            left = el.getBoundingClientRect().width / 2;
          } else if (model.anchorX === 'right') {
            left = el.getBoundingClientRect().width;
          }

          return { transform: `translate(${(model.x * widthPxPerCent) - left}px, ${(model.y * heightPxPerCent) - top}px)` };
        } else {
          return { transform: `translate(0, 0)` };
        }
      }

      return { transform: `translate(0, 0)` };
    };

    watch(model, (value) => {
      ctx.emit('input', value);
    });

    return {
      positionGenerator,
      model,
      uuid,
      example,
      anchorYOptions,
      anchorXOptions,
      ...toRefs(HTMLRef),
      translate,
      mdiSquare,
    };
  },
});
</script>
