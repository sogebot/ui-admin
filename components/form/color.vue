<template>
  <v-text-field :id="id + '|' + uuid" v-model="model" :rules="rules.color" :label="label">
    <template #prepend>
      <v-menu
        v-model="menu"
        offset-overflow
        :close-on-content-click="false"
        transition="scale-transition"
        min-width="auto"
      >
        <template #activator="{ on, attrs }">
          <v-btn
            v-bind="attrs"
            width="75"
            height="25"
            elevation="2"
            :color="model"
            v-on="on"
          />
        </template>

        <v-color-picker v-model="picker" mode="hexa" />
      </v-menu>
    </template>
  </v-text-field>
</template>

<script lang="ts">
import {
  defineComponent,
  onMounted,
  ref,
  watch,
} from '@vue/composition-api';
import { v4 } from 'uuid';

import { isHexColor, required } from '~/functions/validators';

export default defineComponent({
  props: {
    value: String,
    label: String,
    id:    String,
  },
  setup (props, ctx) {
    const model = ref(props.value);
    const picker = ref(props.value);
    const menu = ref(false);
    const uuid = ref(v4());

    const rules = { color: [required, isHexColor] };

    onMounted(() => {
      uuid.value = v4();
    });

    watch(picker, (val) => {
      model.value = (val as any).hex ? (val as any).hex : val;
    });
    watch(model, val => ctx.emit('input', val));

    return {
      model,
      menu,
      picker,
      rules,
      uuid,
    };
  },
});
</script>
