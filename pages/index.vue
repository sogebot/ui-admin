<template>
  <v-container fluid class="pb-1">
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

      <v-col cols="12" md="2" sm="2">
        <actions />
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
    actions: defineAsyncComponent({ loader: () => import('~/components/widgets/actions.vue') }),
    chat:    defineAsyncComponent({ loader: () => import('~/components/widgets/chat.vue') }),
    events:  defineAsyncComponent({ loader: () => import('~/components/widgets/events.vue') }),
  },
  setup () {
    const tab = ref(null);
    return { translate, tab };
  },
});
</script>
