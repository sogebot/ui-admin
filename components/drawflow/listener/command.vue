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

    <v-subheader>{{$t('registry.plugins.listener.command.parameters')}} <small class="pl-2">({{$t('registry.plugins.listener.command.order-is-important')}})</small></v-subheader>

    <v-alert text color="info" dense v-if="parameters.length === 0">
      Not expecting any parameters.
    </v-alert>

    <div v-for="(parameter, idx) of parameters" :key="parameter.id" class="d-flex" style="align-items: center;">
      <div class="pr-2">{{ idx + 1 }}</div>
      <v-text-field v-model="parameter.name" label="Name" class="pr-1"/>
      <v-select v-model="parameter.type" label="Type" :items="['number', 'word', 'sentence']"/>
      <v-btn icon @click="removeParam(parameter.id)"><v-icon color="danger" >mdi-delete</v-icon></v-btn>
      <v-divider/>
    </div>

    <v-btn @click="addParam" dense class="mt-2" block>
      {{$t('registry.plugins.listener.command.add-parameter')}}
    </v-btn>
  </div>
</template>

<script setup lang="ts">
import { v4 } from 'uuid';

const props = defineProps({ value: String });
const emit = defineEmits(['input']);

const command = ref('');
const parameters = ref([] as {
  id: string, name: string, type: 'number' | 'word' | 'sentence'
}[]);

watch(() => props.value ?? '', (val: string) => {
  command.value = JSON.parse(val).command ?? '';
  parameters.value = JSON.parse(val).parameters ?? [];
}, { immediate: true });

watch([command, parameters], (val) => {
  emit('input', { command: val[0], parameters: val[1] });
}, { deep: true });

const addParam = () => {
  parameters.value = [
    ...parameters.value,
    {
      id:   v4(),
      name: '',
      type: 'number',
    },
  ];
};

const removeParam = (id: string) => {
  parameters.value = parameters.value.filter(o => o.id !== id);
}
</script>
