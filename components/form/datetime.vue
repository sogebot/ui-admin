<template>
  <v-menu v-model="menu" offset-overflow :close-on-content-click="false" transition="scale-transition" min-width="auto">
    <template #activator="{ on, attrs }">
      <v-combobox
        v-model="date"
        :prepend-icon="mdiCalendar"
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
import { mdiCalendar } from '@mdi/js';
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
    value: Number,
    label: String,
    id:    String,
  },
  setup (props, ctx) {
    const model = ref(props.value ?? 0);
    const date = ref(`${dayjs(props.value ? props.value : Date.now()).format('LL')} ${dayjs(props.value ? props.value : Date.now()).format('LTS')}`);
    const menu = ref(false);
    const uuid = ref(v4());

    const rules = [required];

    onMounted(() => {
      uuid.value = v4();
    });

    watch(model, (val) => {
      date.value = `${dayjs(val).format('LL')} ${dayjs(val).format('LTS')}`;
      ctx.emit('input', val);
    });

    return {
      model,
      date,
      menu,
      rules,
      uuid,
      mdiCalendar,
    };
  },
});
</script>
