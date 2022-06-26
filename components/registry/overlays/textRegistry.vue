<template>
  <v-expansion-panels v-model="model">
    <slot />
    <v-expansion-panel :readonly="typeof $slots.default === 'undefined'">
      <v-expansion-panel-header>Settings</v-expansion-panel-header>
      <v-expansion-panel-content>
        <v-select
          v-model="options.id"
          :loading="isLoading"
          :items="itemsOptions"
          label="Text Registry to use"
        />
      </v-expansion-panel-content>
    </v-expansion-panel>
  </v-expansion-panels>
</template>

<script lang="ts">
import type { TextInterface } from '@entity/text';
import {
  computed,
  defineComponent, onMounted, ref, watch,
} from '@nuxtjs/composition-api';
import { getSocket } from '@sogebot/ui-helpers/socket';
import translate from '@sogebot/ui-helpers/translate';
import {
  isEqual,
} from 'lodash';
import { setDefaultOpts } from '~/../backend/src/helpers/overlaysDefaultValues';

import { error } from '~/functions/error';

export default defineComponent({
  props: { value: [Object, Array] },
  setup (props: any, ctx) {
    const isLoading = ref(true);
    const items = ref([] as TextInterface[]);

    const itemsOptions = computed(() => {
      return items.value.map(o => ({
        value: o.id,
        text:  o.name,
      }));
    });

    const model = ref(0);
    const options = ref(setDefaultOpts(props.value, 'textregistry'));

    onMounted(() => {
      getSocket('/registries/text').emit('generic::getAll', (err, itemsGetAll: TextInterface[]) => {
        if (err) {
          return error(err);
        }
        items.value = itemsGetAll;
        isLoading.value = false;
      });
    });

    watch(options, (val: any) => {
      if (!isEqual(props.value, options.value)) {
        ctx.emit('input', val);
      }
    }, { deep: true, immediate: true });

    return {
      model,
      options,
      isLoading,
      translate,
      itemsOptions,
    };
  },
});
</script>
