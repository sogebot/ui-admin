<template>
  <v-text-field
    v-model="model"
    dense
    :type="type"
    :min="min"
    :hint="hint"
    :label="label"
    :rules="rules"
  >
    <template #append-outer>
      <v-expand-x-transition>
        <div v-if="model !== original">
          <v-btn  text @click.stop="$store.commit('settings/pending', true); model = original">
            Revert
          </v-btn>
        </div>
      </v-expand-x-transition>
    </template>
  </v-text-field>
</template>

<script lang="ts">
import {
  defineComponent, ref, watch,
} from '@vue/composition-api';

export default defineComponent({
  props: {
    value: Array,
    rules: Array,
    label: String,
    type:  String,
    min:   String,
    hint:  String,
  },
  setup (props: {
    value: [any, any]
  }, ctx) {
    const model = ref(props.value[0]);
    const original = ref(props.value[1]);

    watch(model, (val) => {
      ctx.emit('input', [val, props.value[1]]);
    });

    return {
      model,
      original,
    };
  },
});
</script>
