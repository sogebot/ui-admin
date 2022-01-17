<template>
  <v-sheet flat color="dark" class="my-2 pb-2 mt-0">
    <v-row class="px-2" dense>
      <v-col align-self="center">
        <v-text-field v-model="searchModel" append-icon="mdi-magnify" :label="searchLabel" single-line hide-details
          class="pa-0 ma-2" />
      </v-col>
      <v-col cols="auto" align-self="center" v-if="typeof $slots.default !== 'undefined'">
        <slot />
      </v-col>
    </v-row>
  </v-sheet>
</template>

<script lang="ts">
import {
  defineComponent, ref, watch,
} from '@vue/composition-api';

export default defineComponent({
  props: {
    search: String,
    label:  String,
  },
  setup (props, ctx) {
    const searchModel = ref(props.search);
    const searchLabel = props.label ? props.label : 'Search';

    watch(searchModel, (val) => {
      ctx.emit('update:search', val);
    });
    return {
      searchModel,
      searchLabel,
    };
  },
});
</script>
