<template>
  <div>
    <v-text-field
      v-model="command"
      label="Command"
    >
      <template #prepend-inner>
        <v-icon>mdi-exclamation-thick</v-icon>
      </template>
    </v-text-field>
    <v-text-field
      v-model="parameters"
      label="Parameters"
      hint="a"
    >
      <template #message="{ message }">
        <strong>How to</strong>: use regexp grouping<br/>
        <strong>Example 1</strong>: ([0-9]) ([a-Z])? <small>Expecting number and optional string</small><br/>
        <strong>Example 2</strong>: ([a-Z]) <small>Expecting string</small><br/>
      </template>
    </v-text-field>
  </div>
</template>

<script setup lang="ts">
const props = defineProps({ value: String });
const emit = defineEmits(['input']);

const command = ref('');
const parameters = ref('');

watch(props, (val: string) => {
  command.value = JSON.parse(val.value).command ?? '';
  parameters.value = JSON.parse(val.value).parameters ?? '';
}, { immediate: true });

watch([command, parameters], (val) => {
  emit('input', { command: val[0], parameters: val[1] });
});
</script>
