<template>
  <v-app id="app" dark>
    <template v-if="$store.state.isUILoaded">
      <nuxt />
    </template>
    <v-overlay :value="!$store.state.isUILoaded" dark>
      <v-row>
        <v-col class="text-center">
          <v-progress-circular indeterminate size="48" />
        </v-col>
      </v-row>
      <v-row>
        <v-col class="font-weight-light">
          {{ $store.state.loadingMsg }}
        </v-col>
      </v-row>
    </v-overlay>
  </v-app>
</template>

<script lang="ts">
import { defineComponent } from '@vue/composition-api';

export default defineComponent({ middleware: ['isBotStarted'] });
</script>
