<template>
  <v-expansion-panels v-model="model">
    <slot />
    <v-expansion-panel :readonly="typeof $slots.default === 'undefined'">
      <v-expansion-panel-header>Settings</v-expansion-panel-header>
      <v-expansion-panel-content>
        <v-text-field
          v-model="options.url"
          label="URL"
          @input="options.url = $event"
        />
      </v-expansion-panel-content>
    </v-expansion-panel>
  </v-expansion-panels>
</template>

<script lang="ts">
import type { OverlayMappers } from '@entity/overlay';
import {
  defineComponent, onMounted, ref, watch,
} from '@nuxtjs/composition-api';
import { getSocket } from '@sogebot/ui-helpers/socket';
import { isEqual } from 'lodash';

import { setDefaultOpts } from '~/../backend/src/helpers/overlaysDefaultValues';
import { error } from '~/functions/error';

export default defineComponent({
  props: { value: [Object, Array] },
  setup (props: any, ctx) {
    const items = ref([] as OverlayMappers[]);
    const loading = ref(true);

    onMounted(() => {
      getSocket('/registries/overlays').emit('generic::getAll', (err, result) => {
        if (err) {
          return error(err);
        }
        items.value = result.filter(o => o.value !== 'group');
        loading.value = false;
      });
    });

    const model = ref(0);
    const options = ref(setDefaultOpts(props.value, 'url'));

    watch(options, (val: any) => {
      if (!isEqual(props.value, options.value)) {
        ctx.emit('input', val);
      }
    }, { deep: true, immediate: true });

    return {
      model,
      options,
      items,
      loading,
    };
  },
});
</script>
