<template>
  <v-menu v-model="menu" offset-overflow :close-on-content-click="false" transition="scale-transition" min-width="auto">
    <template #activator="{ on, attrs }">
      <v-combobox
        v-model="date"
        prepend-icon="mdi-calendar"
        readonly
        v-bind="attrs"
        :label="label"
        v-on="on"
      />
    </template>
    <datetime v-model.number="model" />
  </v-menu>
</template>

<script lang="ts">
import {
  defineComponent,
  onMounted,
  ref,
  watch,
} from '@nuxtjs/composition-api';
import { dayjs } from '@sogebot/ui-helpers/dayjsHelper';
import { v4 } from 'uuid';

import { required } from '~/functions/validators';

export default defineComponent({
  props: {
    value: [Number, String],
    label: String,
    id:    String,
  },
  setup (props, ctx) {
    const model = ref(new Date(props.value).getTime());
    const date = ref(`${dayjs(props.value ? props.value : Date.now()).format('LL')} ${dayjs(props.value ? props.value : Date.now()).format('LTS')}`);
    const menu = ref(false);
    const uuid = ref(v4());

    const rules = [required];

    onMounted(() => {
      uuid.value = v4();
    });

    watch(model, (val) => {
      date.value = `${dayjs(val).format('LL')} ${dayjs(val).format('LTS')}`;

      // backwards compatible -> return timestamp if number
      ctx.emit('input', typeof props.value === 'number' ? new Date(val).getTime() : new Date(val).toISOString());
    });

    return {
      model,
      date,
      menu,
      rules,
      uuid,
    };
  },
});
</script>
