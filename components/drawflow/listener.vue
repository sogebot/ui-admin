<template>
  <div ref="pointer">
    <v-toolbar dense color="blue-grey darken-4">
      <v-icon color="white" left>
        mdi-ear-hearing
      </v-icon>
      <v-toolbar-title class="text-button white--text">
        Event listener
      </v-toolbar-title>
    </v-toolbar>
    <v-card dark>
      <v-card-text>
        <v-autocomplete dark :items="items" hide-details="auto" class="pa-4" style="width: 300px;" v-model="item"/>
      </v-card-text>
    </v-card>
  </div>
</template>

<script setup lang="ts">
import { getSocket } from '@sogebot/ui-helpers/socket';
import translate from '@sogebot/ui-helpers/translate';
import { capitalize } from 'lodash';
import { EventBus } from '~/functions/event-bus';

const item = ref('twitchChatMessage');

const availableListeners = ref([] as string[]);
const items = computed(() => {
  return availableListeners.value.map(availableListener => ({
    text:     capitalize(translate(availableListener)),
    value:    availableListener,
    disabled: false,
  }));
});

const pointer = ref(null as null | HTMLElement);
const nodeId = ref(null as null | string);

watch(pointer, (value) => {
  nodeId.value = value?.parentElement?.parentElement?.id ?? null;

  if (nodeId.value) {
    EventBus.$emit('drawflow::node::value', nodeId.value, (val) => {
      item.value = val;
    })
    EventBus.$emit(`drawflow::node::redraw`, nodeId.value)
  }
})

watch(item, (value) => {
  if (nodeId.value) {
    EventBus.$emit('drawflow::node::update', nodeId.value, value)
  }
})

onMounted(() => {
  getSocket('/core/plugins').emit('listeners', (data) => {
    const listeners = Object.keys(data);
    availableListeners.value = listeners.sort((a, b) => {
      const A = translate(a).toLowerCase();
      const B = translate(b).toLowerCase();
      if (A < B) { // sort string ascending
        return -1;
      }
      if (A > B) {
        return 1;
      }
      return 0; // default return value (no sorting)
    });
  });
});
</script>
