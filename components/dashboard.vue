<template>
  <v-container fluid class="pb-1">
    <v-row dense>
      <v-col cols="12" md="6" sm="6">
        <widgets />
      </v-col>
      <v-col cols="12" md="4" sm="4">
        <chat />
      </v-col>
      <v-col cols="12" md="2" sm="2">
        <actions />
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts">
import { defineAsyncComponent, defineComponent } from '@nuxtjs/composition-api';

export default defineComponent({
  components: {
    actions: defineAsyncComponent({ loader: () => import('~/components/widgets/actions.vue') }),
    chat:    defineAsyncComponent({ loader: () => import('~/components/widgets/chat.vue') }),
    widgets: defineAsyncComponent({ loader: () => import('~/components/widgets.vue') }),
  },
});
</script>
