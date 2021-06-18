<template>
  <v-app id="app" dark>
    <template v-if="$store.state.isUILoaded">
      <navbar />
      <v-main>
        <!-- dashboard needs to be visible all the time -->
        <v-fade-transition>
          <statsbar v-show="$route.name === 'index'" />
        </v-fade-transition>
        <v-fade-transition>
          <dashboard v-show="$route.name === 'index'" />
        </v-fade-transition>
        <nuxt />
        <snackbar />
      </v-main>
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
import { defineAsyncComponent, defineComponent } from '@nuxtjs/composition-api';

export default defineComponent({
  components: {
    navbar:    () => import('../components/navbar/navbar.vue'),
    snackbar:  () => import('../components/snackbar.vue'),
    dashboard: () => import('../components/dashboard.vue'),
    statsbar:  defineAsyncComponent({ loader: () => import('~/components/statsbar.vue') }),
  },
  middleware: ['isBotStarted'],
});
</script>
