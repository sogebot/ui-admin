<template>
  <v-expansion-panels v-model="model">
    <v-expansion-panel readonly>
      <v-expansion-panel-header>Settings</v-expansion-panel-header>
      <v-expansion-panel-content>
        <v-text-field
          v-model.number="options.showEmoteInOverlayThreshold"
          :label="translate('overlays.emotes.settings.showEmoteInOverlayThreshold')"
          min="1"
        />
        <v-text-field
          v-model.number="options.hideEmoteInOverlayAfter"
          :label="translate('overlays.emotes.settings.hideEmoteInOverlayAfter.title')"
          :hint="translate('overlays.emotes.settings.hideEmoteInOverlayAfter.help')"
          persistent-hint
          min="1"
        />
      </v-expansion-panel-content>
    </v-expansion-panel>
  </v-expansion-panels>
</template>

<script lang="ts">
import {
  defineComponent, ref, watch,
} from '@nuxtjs/composition-api';
import translate from '@sogebot/ui-helpers/translate';

export default defineComponent({
  props: { opts: Object },
  setup (props: any, ctx) {
    const model = ref(0);
    const options = ref(props.opts ?? {
      showEmoteInOverlayThreshold: 3,
      hideEmoteInOverlayAfter:     30,
    });

    watch(options, (val: any) => {
      ctx.emit('update', val);
    }, { deep: true });

    return {
      model,
      options,
      translate,
    };
  },
});
</script>
