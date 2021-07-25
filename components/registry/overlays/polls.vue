<template>
  <v-expansion-panels v-model="model">
    <v-expansion-panel readonly>
      <v-expansion-panel-header>Settings</v-expansion-panel-header>
      <v-expansion-panel-content>
        <v-select
          v-model="options.theme"
          :label="translate('overlays.polls.settings.cDisplayTheme')"
          :items="['light', 'dark', 'Soge\'s green']"
        />
        <v-select
          v-model="options.align"
          :label="translate('overlays.polls.settings.cDisplayAlign')"
          :items="['top', 'bottom']"
        />
        <v-switch
          v-model="options.hideAfterInactivity"
          dense
          :label="translate('overlays.polls.settings.cDisplayHideAfterInactivity')"
        />
        <v-slider
          v-model.number="options.inactivityTime"
          :hint="translate('overlays.polls.settings.cDisplayInactivityTime.help')"
          max="120000"
          min="0"
          :label="translate('overlays.polls.settings.cDisplayInactivityTime.title')"
          step="1000"
          :thumb-size="0"
          thumb-label="always"
        >
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
import {
  defaults, isEqual, pick,
} from 'lodash';

export default defineComponent({
  props: { value: Object },
  setup (props, ctx) {
    const model = ref(0);
    const options = ref(
      pick(
        defaults(props.value, {
          theme:               'light',
          hideAfterInactivity: false,
          inactivityTime:      5000,
          align:               'top',
        }),
        ['theme', 'hideAfterInactivity', 'inactivityTime', 'align'],
      ));

    watch(options, (val) => {
      if (!isEqual(props.value, options.value)) {
        ctx.emit('input', val);
      }
    }, { deep: true, immediate: true });

    return {
      model,
      options,
      translate,
    };
  },
});
</script>
