<template>
  <v-expansion-panels v-model="model" multiple>
    <slot />
    <v-expansion-panel>
      <v-expansion-panel-header>Settings</v-expansion-panel-header>
      <v-expansion-panel-content>
        <v-select v-model="options.type" label="Type" :items="['vertical', 'horizontal', 'niconico']" />
        <v-switch v-model="options.showTimestamp" label="Show timestamps" :persistent-hint="true" :hint="(options.showTimestamp ? 'Message will contain timestamp.' : 'Timestamp won\'t be visible.')" />
        <v-switch v-model="options.showBadges" label="Show badges" :persistent-hint="true" :hint="(options.showBadges ? 'Message will contain badges.' : 'Badges won\'t be visible.')" />
        <v-switch v-if="options.type !== 'niconico'" v-model="options.reverseOrder" label="Reverse chat flow" />
        <form-x-time-input v-if="options.type !== 'niconico'" v-model.lazy="options.hideMessageAfter" label="Hide messages after" hide-details="auto" />
      </v-expansion-panel-content>
    </v-expansion-panel>
    <v-expansion-panel>
      <v-expansion-panel-header>Font</v-expansion-panel-header>
      <v-expansion-panel-content>
        <font v-model="options.font" />
      </v-expansion-panel-content>
    </v-expansion-panel>
    <v-expansion-panel>
      <v-expansion-panel-header>Test</v-expansion-panel-header>
      <v-expansion-panel-content>
        <v-text-field v-model="test.username" label="Test username" />
        <v-text-field v-model="test.message" label="Test message" />
        <v-btn @click="sendTestMessage">
          Test
        </v-btn>
      </v-expansion-panel-content>
    </v-expansion-panel>
  </v-expansion-panels>
</template>

<script lang="ts">
import {
  defineAsyncComponent,
  defineComponent, ref, watch,
} from '@nuxtjs/composition-api';
import { setDefaultOpts } from '@sogebot/backend/src/helpers/overlaysDefaultValues';
import { getSocket } from '@sogebot/ui-helpers/socket';
import translate from '@sogebot/ui-helpers/translate';
import { isEqual } from 'lodash';

export default defineComponent({
  components: { font: defineAsyncComponent(() => import('~/components/form/expansion/font.vue')) },
  props:      { value: [Object, Array] },
  setup (props, ctx) {
    const model = ref([0]);
    const test = ref({
      username: 'testuser',
      message:  'This is testing message Kappa :)',
    });
    const options = ref(setDefaultOpts(props.value, 'chat'));

    watch(options, (val) => {
      if (!isEqual(props.value, options.value)) {
        ctx.emit('input', val);
      }
    }, { deep: true, immediate: true });

    const sendTestMessage = () => {
      getSocket('/overlays/chat').emit('test', { message: test.value.message, username: test.value.username });
    };

    return {
      model,
      options,
      test,
      sendTestMessage,
      translate,
    };
  },
});
</script>
