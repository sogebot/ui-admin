<template>
  <div ref="pointer">
    <v-toolbar dense color="blue-grey darken-4">
      <v-icon color="white" left>
        mdi-numberic
      </v-icon>
      <v-toolbar-title class="text-button white--text">
        Clear Counter
      </v-toolbar-title>
    </v-toolbar>
  </div>
</template>

<script setup lang="ts">
const pointer = ref(null as null | HTMLElement);
</script>
