<template>
  <v-snackbars :objects.sync="snacks">
    <template #default="{ message }">
      <div v-html="message" />
    </template>
  </v-snackbars>
</template>

<script lang="ts">
import {
  defineComponent,
  onMounted,
  ref,
} from '@nuxtjs/composition-api';
import VSnackbars from 'v-snackbars';

import { EventBus } from '../functions/event-bus';

export default defineComponent({
  components: { 'v-snackbars': VSnackbars },
  setup () {
    const snacks = ref([] as {
      timeout: number,
      color: string,
      message: string,
    } []);

    onMounted(() => {
      EventBus.$on('snack', (color: string, message: string, errors?: { constraints: { [x: string]: string }, property: string }[] = []) => {
        const errorList: string[] = [];

        for (const error of errors) {
          for (const constraint of Object.values(error.constraints)) {
            errorList.push(`- ${constraint}`)
          }
        }

        if (errorList.length > 0) {
          message += '<br/>' + errorList.join('<br/>')
        }

        if (!snacks.value.find(item => item.color === color && item.message === message)) {
          snacks.value.push({
            color,
            message,
            timeout: 5000,
          });
        }
      });
    });

    return { snacks };
  },
});
</script>
