<template>
  <v-expansion-panels v-model="model">
    <slot/>
    <v-expansion-panel :readonly="typeof $slots.default === 'undefined'">
      <v-expansion-panel-header>Settings</v-expansion-panel-header>
      <v-expansion-panel-content>
        <v-select
          :loading="isLoading"
          :items="itemsOptions"
          v-model="options.id"
          label="Alert Registry to use"
        />
      </v-expansion-panel-content>
    </v-expansion-panel>
  </v-expansion-panels>
</template>

<script lang="ts">
import {
  computed,
  defineComponent, onMounted, ref, useContext, watch,
} from '@nuxtjs/composition-api';
import translate from '@sogebot/ui-helpers/translate';
import {
  defaults, isEqual, pick,
} from 'lodash';

import type { AlertInterface } from '.bot/src/database/entity/alert';
import api from '~/functions/api';

export default defineComponent({
  props: { value: [Object, Array] },
  setup (props: any, ctx) {
    const { $axios } = useContext();
    const isLoading = ref(true);
    const items = ref([] as AlertInterface[]);

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
      api.get<AlertInterface[]>($axios, '/api/v1/registry/alerts/')
        .then((response) => {
          items.value = response.data.data;
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
