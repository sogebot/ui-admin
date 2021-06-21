<template>
  <span />
</template>

<script lang="ts">
import { useStore } from '@nuxtjs/composition-api';
import translate from '@sogebot/ui-helpers/translate';
import { defineComponent, onMounted } from '@vue/composition-api';

export default defineComponent({
  setup () {
    const store = useStore();
    onMounted(() => {
      store.commit('panel/mobile', true);
      store.commit('panel/breadcrumbs', [
        { text: translate('menu.dashboard') },
      ]);
    });
    return {};
  },
});
</script>
