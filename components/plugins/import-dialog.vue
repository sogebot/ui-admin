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
        Import
      </v-btn>
    </template>
    <v-card>
      <v-card-text class="pa-2 pb-0">
        <v-container>
          <v-textarea
            v-model="model"
            outlined
            hide-details="auto"
            label="Insert import plugin string"
          />
        </v-container>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn
          text
          @click="dialog = false"
        >
          Close
        </v-btn>
        <v-btn
          color="primary"
          text
          @click="importPlugin"
        >
          Import
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { EventBus } from '~/functions/event-bus';

const dialog = ref(false);
const emit = defineEmits(['import'])

const model = ref('');
watch(dialog, () => {
  model.value = '';
});

const importPlugin = () => {
  if (model.value !== null && model.value.trim() !== '') {
    const buf = Buffer.from(model.value, 'base64');
    try {
      emit('import', JSON.parse(buf.toString('utf-8')));
      EventBus.$emit('snack', 'success', 'Plugin imported.');
      dialog.value = false;
    } catch (e) {
      console.error(e);
      EventBus.$emit('snack', 'error', 'Something went wrong with plugin import.');
    }
  }
};

</script>