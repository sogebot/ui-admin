<template>
  <v-expansion-panels v-model="model" multiple>
    <slot />
    <v-expansion-panel>
      <v-expansion-panel-header>Settings</v-expansion-panel-header>
      <v-expansion-panel-content>
        <v-select v-model="options.type" label="Type" :items="['vertical', 'horizontal', 'niconico']" />
        <v-row>
          <v-col>
            <v-switch v-model="options.showTimestamp" label="Show timestamps" :persistent-hint="true" :hint="(options.showTimestamp ? 'Message will contain timestamp.' : 'Timestamp won\'t be visible.')" />
          </v-col>
          <v-col>
            <v-switch v-model="options.useCustomEmoteSize" label="Use custom emotes size" :persistent-hint="true" :hint="(options.useCustomEmoteSize ? 'Custom emote size will be used' : 'Custom emote size won\'t be used.')" />
          </v-col>
          <v-col>
            <v-text-field
              class="mt-2"
              v-model="options.customEmoteSize"
              label="Custom emote size"
              type="number"
              :hide-details="true"
              min="0"
            >
              <template #append>px</template>
            </v-text-field>
          </v-col>
        </v-row>
        <v-row>
          <v-col>
            <v-switch v-model="options.showBadges" label="Show badges" :persistent-hint="true" :hint="(options.showBadges ? 'Message will contain badges.' : 'Badges won\'t be visible.')" />
          </v-col>
          <v-col>
            <v-switch v-model="options.useCustomBadgeSize" label="Use custom badges size" :persistent-hint="true" :hint="(options.useCustomBadgeSize ? 'Custom badge size will be used' : 'Custom badge size won\'t be used.')" />
          </v-col>
          <v-col>
            <v-text-field
              class="mt-2"
              v-model="options.customBadgeSize"
              label="Custom badge size"
              type="number"
              :hide-details="true"
              min="0"
            >
              <template #append>px</template>
            </v-text-field>
          </v-col>
        </v-row>
        <v-row  v-if="options.type !== 'niconico'">
          <v-col>
            <v-switch v-model="options.reverseOrder" label="Reverse chat flow" />
          </v-col>
          <v-col>
            <v-switch v-model="options.useCustomLineHeight" label="Use custom line height" :persistent-hint="true" :hint="(options.useCustomLineHeight ? 'Custom line height will be used' : 'Custom line height won\'t be used.')" />
          </v-col>
          <v-col>
            <v-text-field
              class="mt-2"
              v-model="options.customLineHeight"
              label="Custom line height"
              type="number"
              :hide-details="true"
              min="0"
            >
              <template #append>px</template>
            </v-text-field>
          </v-col>
        </v-row>
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
