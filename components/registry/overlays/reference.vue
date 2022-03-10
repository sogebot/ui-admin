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
          <template v-slot:selection="data">
            <strong v-if="data.item.name" class="text-button">{{data.item.name}}&nbsp;|&nbsp;</strong>
            <span class="text-overline">{{data.item.value}}&nbsp;|&nbsp;</span>
            <span class="text-caption">{{data.item.id}}</span>
          </template>
          <template v-slot:item="data">
            <strong v-if="data.item.name" class="text-button">{{data.item.name}}&nbsp;|&nbsp;</strong>
            <span class="text-overline">{{data.item.value}}&nbsp;|&nbsp;</span>
            <span class="text-caption">{{data.item.id}}</span>
          </template>
        </v-autocomplete>
      </v-expansion-panel-content>
    </v-expansion-panel>
  </v-expansion-panels>
</template>

<script lang="ts">
import type { OverlayMappers } from '@entity/overlay';
import {
  defineComponent, onMounted, ref, useContext, watch,
} from '@nuxtjs/composition-api';
import { defaults, pick, isEqual } from 'lodash';

import GET from '~/queries/overlays/get.gql';

export default defineComponent({
  props: { value: [Object, Array] },
  setup (props: any, ctx) {
    const items = ref([] as OverlayMappers[]);
    const loading = ref(true);
    const appCtx = useContext();

    onMounted(async () => {
      const result = await (appCtx as any).$graphql.default.request(GET);

      const outputData: OverlayMappers[] = [];
      for (const key of Object.keys(result.overlays)) {
        if (key.startsWith('__') || key === 'group') {
          continue;
        }
        outputData.push(...result.overlays[key as any]);
      }

      items.value = outputData;
      loading.value = false;
    });

    const model = ref(0);
    const options = ref(
      pick(
        defaults(Array.isArray(props.value) ? null : props.value, { overlayId: null }),
        ['overlayId'],
      ));

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
