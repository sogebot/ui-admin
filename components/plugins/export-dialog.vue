<template>
  <v-dialog
    v-model="dialog"
    persistent
    max-width="600px"
  >
    <template #activator="{ on, attrs }">
      <v-btn
        v-bind="attrs"
        v-on="on"
        text
        small
        color="primary"
      >
        Export
      </v-btn>
    </template>
    <v-card>
      <v-card-text class="pa-2 pb-0">
        <v-container>
          <v-textarea
            v-model="model"
            outlined
            readonly
            hide-details="auto"
            label="Exported plugin string"
          />
        </v-container>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn
          text
          color="primary"
          @click="copy"
        >
          Copy to clipboard
        </v-btn>
        <v-btn
          text
          @click="dialog = false"
        >
          Close
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { EventBus } from '~/functions/event-bus';

const { $store } = useNuxtApp();
const dialog = ref(false);
const model = ref();

watch(dialog, () => {
  const bufSettings = Buffer.from(JSON.stringify($store.state.registryPlugins.item.settings));
  const buf = Buffer.from($store.state.registryPlugins.item.workflow);
  model.value = buf.toString('base64') + '%' + bufSettings.toString('base64');
});

const copy = () => {
  EventBus.$emit('snack', 'success', 'Plugin copied to clipboard.');
  console.log(`Exported plugin`);
  console.log(model.value);
  navigator.clipboard.writeText(model.value);
}
</script>