<template>
  <v-expansion-panels v-model="model">
    <slot />
    <v-expansion-panel :readonly="typeof $slots.default === 'undefined'">
      <v-expansion-panel-header>Settings</v-expansion-panel-header>
      <v-expansion-panel-content>
        <v-switch
          v-model="options.galleryCache"
          :label="translate('overlays.alerts.settings.galleryCache')"
        />
        <v-text-field
          v-model.number="options.galleryCacheLimitInMb"
          :label="translate('overlays.alerts.settings.galleryCacheLimitInMb')"
          min="0"
        />
      </v-expansion-panel-content>
    </v-expansion-panel>
  </v-expansion-panels>
</template>

<script lang="ts">
import {
  defineComponent, ref, watch,
} from '@nuxtjs/composition-api';
import translate from '@sogebot/ui-helpers/translate';
import { isEqual } from 'lodash';

import { setDefaultOpts } from '~/../backend/src/helpers/overlaysDefaultValues';

export default defineComponent({
  props: { value: Object },
  setup (props: any, ctx) {
    const model = ref(0);
    const options = ref(setDefaultOpts(props.value!.opts, 'media'));

    watch(options, (val: any) => {
      if (!isEqual(props.value, { ...props.value, opts: val })) {
        ctx.emit('input', val);
      }
    }, { deep: true, immediate: true });

    return {
      model,
      options,
      translate,
    };
  },
});
</script>
