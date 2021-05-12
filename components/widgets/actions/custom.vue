<template>
  <v-card
    :color="item.color"
    elevation="2"
    width="100%"
    @click="() => {}"
  >
    <v-card-text class="text-button pa-1 mb-1 text-center" style="font-size: 12px !important;">
      <v-row no-gutters>
        <v-col v-if="editing" cols="auto" class="d-flex">
          <v-simple-checkbox v-model="selected" />
        </v-col>
        <v-col>
          <strong>{{ item.title }}</strong>
        </v-col>
      </v-row>
    </v-card-text>
  </v-card>
</template>

<script lang="ts">
import {
  defineComponent, ref, watch,
} from '@vue/composition-api';

export default defineComponent({
  props: { item: Object, editing: Boolean },
  setup (props, ctx) {
    const selected = ref(props.item?.selected ?? false);

    watch(selected, (val) => {
      ctx.emit('update:item', { ...props.item, selected: val });
    });

    return {
      /* refs */
      selected,
    };
  },
});
</script>
