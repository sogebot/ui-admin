<template>
  <v-expansion-panels v-model="model">
    <v-expansion-panel readonly>
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
import { defaults, pick } from 'lodash';

export default defineComponent({
  props: { opts: Object },
  setup (props: any, ctx) {
    const model = ref(0);
    const options = ref(
      pick(
        defaults(props.opts, {
          galleryCache:          false,
          galleryCacheLimitInMb: 50,
        }),
        ['galleryCache', 'galleryCacheLimitInMb'],
      ));

    watch(options, (val: any) => {
      ctx.emit('update', val);
    }, { deep: true });

    return {
      model,
      options,
      translate,
    };
  },
});
</script>
