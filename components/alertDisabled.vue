<template>
  <v-alert v-if="!isEnabled" color="error" class="mb-0" text>
    {{ translate('this-system-is-disabled') }}
  </v-alert>
</template>

<script lang="ts">
import { useStore } from '@nuxtjs/composition-api';
import translate from '@sogebot/ui-helpers/translate';
import { computed, defineComponent } from '@vue/composition-api';

export default defineComponent({
  props: {
    system:      String,
    integration: String,
  },
  setup (props) {
    const store = useStore<any>();
    return {
      isEnabled: computed(() => {
        if (props.system) {
          return store.state.$systems.find((o: any) => o.name === props.system).enabled;
        }

        if (props.integration) {
          return store.state.$integrations.find((o: any) => o.name === props.integration).enabled;
        }

        return false;
      }),
      translate,
    };
  },
});
</script>
