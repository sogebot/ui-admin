<template>
  <v-expansion-panels v-model="model">
    <slot />
    <v-expansion-panel :readonly="typeof $slots.default === 'undefined'">
      <v-expansion-panel-header>Settings</v-expansion-panel-header>
      <v-expansion-panel-content>
        <v-autocomplete
          v-model="options.overlayId"
          :loading="loading"
          :items="items"
          item-value="id"
          label="Overlay to link"
        >
          <template #selection="data">
            <strong v-if="data.item.name" class="text-button">{{ data.item.name }}&nbsp;|&nbsp;</strong>
            <span class="text-overline">{{ data.item.opts.typeId }}&nbsp;|&nbsp;</span>
            <span class="text-caption">{{ data.item.id }}</span>
          </template>
          <template #item="data">
            <strong v-if="data.item.name" class="text-button">{{ data.item.name }}&nbsp;|&nbsp;</strong>
            <span class="text-overline">{{ data.item.opts.typeId }}&nbsp;|&nbsp;</span>
            <span class="text-caption">{{ data.item.id }}</span>
          </template>
        </v-autocomplete>
      </v-expansion-panel-content>
    </v-expansion-panel>
  </v-expansion-panels>
</template>

<script lang="ts">
import type { Overlay } from '@entity/overlay';
import {
  defineComponent, onMounted, ref, watch,
} from '@nuxtjs/composition-api';
import { getSocket } from '@sogebot/ui-helpers/socket';
import { isEqual } from 'lodash';

import { setDefaultOpts } from '~/../backend/src/helpers/overlaysDefaultValues';
import { error } from '~/functions/error';

export default defineComponent({
  props: { value: Object },
  setup (props: any, ctx) {
    const items = ref([] as Overlay['items']);
    const loading = ref(true);

    onMounted(() => {
      getSocket('/registries/overlays').emit('generic::getAll', (err, result) => {
        if (err) {
          return error(err);
        }
        items.value = [];
        for (const group of result) {
          for (const item of group.items) {
            console.log({ item });
            items.value.push(item);
          }
        }
        loading.value = false;
      });
    });

    const model = ref(0);
    const options = ref(setDefaultOpts(props.value!.opts, 'reference'));

    watch(options, (val: any) => {
      console.log({ props, options });
      if (!isEqual(props.value, { ...props.value, opts: val })) {
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
