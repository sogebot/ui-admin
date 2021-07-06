<template>
  <span />
</template>

<script lang="ts">
import { useStore } from '@nuxtjs/composition-api';
import { defineComponent, onMounted } from '@vue/composition-api';

export default defineComponent({
  setup () {
    const store = useStore();
    onMounted(() => {
      store.commit('panel/mobile', true);
    });
    return {};
  },
});
</script>
