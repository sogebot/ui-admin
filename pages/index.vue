<template>
  <v-container fluid>
    <statsbar />
  </v-container>
</template>

<script>
import { defineAsyncComponent } from '@vue/composition-api';

export default { components: { statsbar: defineAsyncComponent({ loader: () => import('~/components/statsbar.vue') }) } };
</script>
