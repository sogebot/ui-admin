<template>
  <v-card-text
    v-ripple
    class="text-button pa-1 mb-1 text-center"
    style="font-size: 12px !important; display: block;"
    :style="{ 'color': color }"
  >
    <v-row no-gutters>
      <v-col class="text-truncate">
        {{ item.options.label }}
      </v-col>
      <v-slide-x-reverse-transition>
        <v-col v-if="editing" cols="auto" class="d-flex">
          <v-simple-checkbox v-if="color !== 'white'" v-model="selected" light />
          <v-simple-checkbox v-else v-model="selected" dark />
        </v-col>
      </v-slide-x-reverse-transition>
    </v-row>
  </v-card-text>
</template>

<script setup lang="ts">
import gql from 'graphql-tag';

const { $graphql } = useNuxtApp();
const props = defineProps<{
  item: Record<string, any>,
  dialog: boolean,
  color: string,
  editing: boolean,
}>();

const emit = defineEmits(['select', 'unselect', 'update:dialog'])

const selected = ref(props.item.selected);
watch(selected, (val) => {
  emit(val ? 'select' : 'unselect');
});

const showDialog = () => {
  emit('update:dialog', true);
};

const trigger = () => {
  if (props.item) {
    console.log(`quickaction::trigger::${props.item.id}`);
    $graphql.default.request(gql`
      mutation quickActionTrigger($id: String!) {
        quickActionTrigger(id: $id)
      }`, { id: props.item.id });
  }
};
</script>
