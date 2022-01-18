<template>
  <loading v-if="!settings" />
  <v-form v-else v-model="valid" lazy-validation>
    <v-tabs v-model="tab">
      <v-tab>{{translate('categories.general')}}</v-tab>
    </v-tabs>

    <v-tabs-items v-model="tab">
      <v-tab-item eager>
        <v-card>
          <v-card-text>
            <revert-text-field v-model="settings.domain" :label="translate('core.ui.settings.domain.title')"
              :hint="translate('core.ui.settings.domain.help')" :rules="[required]" />
            <v-switch class="mt-0" v-model="settings.enablePublicPage[0]" dense
            :label="translate('core.ui.settings.enablePublicPage')" />
            <v-switch class="mt-0" v-model="settings.percentage[0]" dense
              :label="translate('core.ui.settings.percentage')" />
            <v-switch class="mt-0" v-model="settings.shortennumbers[0]" dense
              :label="translate('core.ui.settings.shortennumbers')" />
            <v-switch class="mt-0" v-model="settings.showdiff[0]" dense
              :label="translate('core.ui.settings.showdiff')" />
          </v-card-text>
        </v-card>
      </v-tab-item>
    </v-tabs-items>
  </v-form>
</template>

<script lang="ts">
import { useStore } from '@nuxtjs/composition-api';
import { getSocket } from '@sogebot/ui-helpers/socket';
import translate from '@sogebot/ui-helpers/translate';
import {
  defineAsyncComponent,
  defineComponent, nextTick, onMounted, ref, watch,
} from '@vue/composition-api';

import { error } from '~/functions/error';
import { saveSettings } from '~/functions/settings';
import { required } from '~/functions/validators';

export default defineComponent({
  components: {
    revertTextField: defineAsyncComponent(() => import('~/components/settings/modules/revert-text-field.vue')),
  },
  setup () {
    const settings = ref(null as Record<string, any> | null);
    const ui = ref(null as Record<string, any> | null);
    const store = useStore<any>();
    const valid = ref(true);
    const tab = ref(null);

    watch(settings, () => {
      store.commit('settings/pending', true);
    }, {
      deep: true,
    });

    watch(() => store.state.settings.save, (val) => {
      if (val && settings.value) {
        saveSettings('/core/ui', store, settings.value);
      }
    });

    watch(valid, (val) => {
      store.commit('settings/valid', val);
    }, {
      immediate: true,
    });

    onMounted(() => {
      getSocket(`/core/ui`)
        .emit('settings', (err: string | null, _settings: { [x: string]: any }, _ui: { [x: string]: { [attr: string]: any } }) => {
          if (err) {
            error(err);
            return;
          }
          ui.value = _ui;
          settings.value = _settings;
          nextTick(() => { store.commit('settings/pending', false); });
        });
    });

    return {
      settings,
      ui,
      translate,
      valid,
      tab,

      // validators
      required,
    };
  },
});
</script>
