<template>
  <v-btn
    :color="color(_value)"
    @click="toggleValue"
  >
    <v-icon class="pr-2">
      <template v-if="_value === true">
        mdi-check
      </template>
      <template v-else-if="_value === false">
        mdi-exclamation-thick
      </template>
      <template v-else>
        mdi-help
      </template>
    </v-icon>
    <slot />
  </v-btn>
</template>

<script lang="ts">
import {
  defineComponent, ref, watch,
} from '@nuxtjs/composition-api';

export default defineComponent({
  props: {
    value: [Boolean, Object],
  },
  setup (props, ctx) {
    const _value = ref(props.value);

    watch(_value, (val) => {
      ctx.emit('save', val);
    });

    const toggleValue = () => {
      if (_value.value === true) {
        _value.value = false;
      } else if (_value.value === false) {
        _value.value = null;
      } else if (_value.value === null) {
        _value.value = true;
      }
    };

    const color = (value: null | boolean) => {
      if (value === true) {
        return 'success';
      } else if (value === false) {
        return 'error';
      } else {
        return 'dark';
      }
    };

    return {
      toggleValue,
      _value,
      color,
    };
  },
});
</script>
