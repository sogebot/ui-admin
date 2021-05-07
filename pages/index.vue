<template>
  <v-container fluid>
    <v-row dense>
      <v-col cols="12" md="6" sm="6">
        <v-tabs
          v-model="tab"
          height="36"
          background-color="blue-grey darken-4"
          center-active
        >
          <v-tab>{{ translate('widget-title-eventlist') }}</v-tab>
        </v-tabs>
        <v-tabs-items v-model="tab">
          <v-tab-item>
            <events />
          </v-tab-item>
        </v-tabs-items>
      </v-col>
      <v-col cols="12" md="4" sm="4">
        <chat />
      </v-col>

      <v-col cols="12" md="2" sm="4">
        <v-card width="100%" class="mb-2" height="100%">
          <v-toolbar height="36" color="blue-grey darken-4" class="mb-1">
            <v-toolbar-title class="text-button">
              actions
            </v-toolbar-title>
          </v-toolbar>
          <v-row dense>
            <v-col cols="12">
              <v-card color="primary" elevation="2" width="100%" @click="() => {}">
                <v-card-text class="text-caption pa-1 ma-0 text-center">
                  <strong>Add 5 to $_test</strong>
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import translate from '@sogebot/ui-helpers/translate';
import {
  defineAsyncComponent, defineComponent, ref,
} from '@vue/composition-api';

export default defineComponent({
  components: {
    chat:   defineAsyncComponent({ loader: () => import('~/components/widgets/chat.vue') }),
    events: defineAsyncComponent({ loader: () => import('~/components/widgets/events.vue') }),
  },
  setup () {
    const tab = ref(null);
    return { translate, tab };
  },
});
</script>
