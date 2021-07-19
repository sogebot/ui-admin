<template>
  <div>
    <v-form ref="form" v-model="valid" lazy-validation>
      <v-text-field v-model="clonedItem.options.customvariable" label="Custom variable" :rules="rules.customvariable" />
    </v-form>
  </div>
</template>

<script lang="ts">
import {
  defineComponent, onMounted, onUnmounted, ref, watch,
} from '@nuxtjs/composition-api';
import { cloneDeep } from 'lodash';

import type { CustomVariableItem } from '.bot/src/database/entity/dashboard';
import { EventBus } from '~/functions/event-bus';
import {
  minLength, required, startsWith,
} from '~/functions/validators';

type Props = {
  item: CustomVariableItem
};
export default defineComponent({
  props: { item: Object },
  setup (props: Props, ctx) {
    const clonedItem = ref(cloneDeep(props.item));
    const valid = ref(true);
    const form = ref(null);

    onMounted(() => {
      EventBus.$on(`quickaction::${props.item.id}::valid`, () => {
        console.debug(`quickaction::${props.item.id}::valid`);
        (form.value as unknown as HTMLFormElement).validate();
      });
    });

    onUnmounted(() => {
      EventBus.$off(`quickaction::${props.item.id}::valid`);
    });

    const rules = { customvariable: [required, startsWith(['$_']), minLength(3)] };

    watch(clonedItem, (val) => {
      ctx.emit('update:item', val);
    }, { deep: true });

    watch(valid, (val) => {
      ctx.emit('update:valid', val);
    });

    return {
      clonedItem, rules, valid, form,
    };
  },
});
</script>
