<template>
  <v-expansion-panels v-model="model" multiple>
    <slot />
    <v-expansion-panel>
      <v-expansion-panel-header>Settings</v-expansion-panel-header>
      <v-expansion-panel-content>
        <v-switch v-model="options.isHorizontal" label="Horizontal" :persistent-hint="true" :hint="(options.isHorizontal ? 'Chat will be horizontal.' : 'Chat will be vertical (default).')" />
        <v-switch v-model="options.showTimestamp" label="Show timestamps" :persistent-hint="true" :hint="(options.showTimestamp ? 'Message will contain timestamp.' : 'Timestamp won\'t be visible.')" />
        <form-x-time-input v-model.lazy="options.hideMessageAfter" label="Hide messages after" hide-details="auto" />
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
        <v-btn @click="sendTestMessage">Test</v-btn>
      </v-expansion-panel-content>
    </v-expansion-panel>
  </v-expansion-panels>
</template>

<script lang="ts">
import {
  defineAsyncComponent,
  defineComponent, ref, watch,
} from '@nuxtjs/composition-api';
import { getSocket } from '@sogebot/ui-helpers/socket';
import translate from '@sogebot/ui-helpers/translate';
import {
  defaultsDeep, isEqual, pick,
} from 'lodash';

export default defineComponent({
  components: { font: defineAsyncComponent(() => import('~/components/form/expansion/font.vue')) },
  props:      { value: [Object, Array] },
  setup (props, ctx) {
    const model = ref([0]);
    const test = ref({
      username: 'testuser',
      message: 'This is testing message Kappa :)'
    });
    const options = ref(
      pick(
        defaultsDeep(props.value, {
          isHorizontal:     false,
          hideMessageAfter: 600000,
          showTimestamp:    true,
          font:             {
            family:      'PT Sans',
            size:        20,
            borderPx:    1,
            borderColor: '#000000',
            weight:      '500',
            color:       '#ffffff',
            shadow:      [],
          },
        }),
        [
          'isHorizontal', 'hideMessageAfter', 'font', 'showTimestamp',
        ],
      ));

    watch(options, (val) => {
      if (!isEqual(props.value, options.value)) {
        ctx.emit('input', val);
      }
    }, { deep: true, immediate: true });

    const sendTestMessage = () => {
      getSocket('/overlays/chat').emit('test', { message: test.value.message, username: test.value.username })
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
