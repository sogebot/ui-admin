<template>
  <v-expansion-panels v-model="model">
    <v-expansion-panel readonly>
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
import {
  computed,
  defineComponent, onMounted, ref, watch,
} from '@nuxtjs/composition-api';
import { getSocket } from '@sogebot/ui-helpers/socket';
import translate from '@sogebot/ui-helpers/translate';
import {
  defaults, isEqual, pick,
} from 'lodash';

import type { TextInterface } from '.bot/src/database/entity/text';
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
    const options = ref(
      pick(
        defaults(Array.isArray(props.value) ? null : props.value, { id: '' }),
        ['id'],
      ));

    onMounted(() => {
      getSocket('/registries/text').emit('generic::getAll', (err: string | null, itemsGetAll: TextInterface[]) => {
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
