<template>
  <div>
    <v-form ref="form" v-model="valid" lazy-validation>
      <v-text-field v-model="clonedItem.options.label" label="Label" :rules="rules.label" />
      <v-text-field v-model="clonedItem.options.command" label="Command" :rules="rules.command" />
    </v-form>
  </div>
</template>

<script lang="ts">
import {
  defineComponent, onMounted, onUnmounted, ref, watch,
} from '@nuxtjs/composition-api';
import { cloneDeep } from 'lodash-es';

import type { CommandItem } from '.bot/src/bot/database/entity/dashboard';
import { EventBus } from '~/functions/event-bus';
import {
  minLength, required, startsWith,
} from '~/functions/validators';

type Props = {
  item: CommandItem
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

    const rules = {
      label:   [required],
      command: [required, startsWith(['!']), minLength(2)],
    };

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
