<template>
  <v-overlay absolute>
    <v-row>
      <v-col class="text-center">
        <v-progress-circular indeterminate size="48" />
      </v-col>
    </v-row>
  </v-overlay>
</template>

<script lang="ts">
import { defineComponent } from '@vue/composition-api';

export default defineComponent({
  setup () {
    return {};
  },
});
</script>
