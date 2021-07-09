<template>
  <v-expansion-panels>
    <v-expansion-panel>
      <v-expansion-panel-header>Settings</v-expansion-panel-header>
      <v-expansion-panel-content>
        <v-select v-model="options.theme" :label="translate('overlays.polls.settings.cDisplayTheme')"
          :items="['light', 'dark', 'Soge\'s green']" />
        <v-select v-model="options.align" :label="translate('overlays.polls.settings.cDisplayAlign')"
          :items="['top', 'bottom']" />
        <v-switch dense :label="translate('overlays.polls.settings.cDisplayHideAfterInactivity')"
          v-model="options.hideAfterInactivity" />
        <v-slider :hint="translate('overlays.polls.settings.cDisplayInactivityTime.help')" max="120000" min="0"
          :label="translate('overlays.polls.settings.cDisplayInactivityTime.title')"
          v-model.number="options.inactivityTime" step="1000" :thumb-size="0" thumb-label="always">
          <template #thumb-label="{ value }">
            <div style="transform: translateY(-8px);">
              {{ (value / 1000) + 's' }}
            </div>
          </template>
        </v-slider>
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
  setup (props, ctx) {
    const options = ref(props.opts ?? {
      theme:               'light',
      hideAfterInactivity: false,
      inactivityTime:      5000,
      align:               'top',
    });

    watch(options, (val) => {
      ctx.emit('update', val);
    }, { deep: true });

    return {
      options,
      translate,
    };
  },
});
</script>
