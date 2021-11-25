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
            <v-switch :label="translate('systems.antihateraid.settings.clearChat')" v-model="settings.clearChat[0]"/>
            <v-select v-model="settings.mode[0]" :items="modes" :label="translate('systems.antihateraid.settings.mode')" />
            <v-expand-transition>
              <revert-text-field v-if="settings.mode[0] === 1" v-model.number="settings.minFollowTime" :label="translate('systems.antihateraid.settings.minFollowTime')">
                <template #append>{{translate('minutes')}}</template>
              </revert-text-field>
            </v-expand-transition>
            <revert-text-field v-model="settings.customAnnounce" :label="translate('systems.antihateraid.settings.customAnnounce')" hint="$mode, $username" />
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
import { minValue, required } from '~/functions/validators';

export default defineComponent({
  components: { revertTextField: defineAsyncComponent(() => import('~/components/settings/modules/revert-text-field.vue')) },
  setup () {
    const settings = ref(null as Record<string, any> | null);
    const ui = ref(null as Record<string, any> | null);
    const store = useStore<any>();
    const valid = ref(true);
    const tab = ref(null);

    const modes = [
      { text: 'sub-only', value: 0 },
      { text: 'follow-only', value: 1 },
      { text: 'emotes-only', value: 2 },
    ];

    watch(settings, () => {
      store.commit('settings/pending', true);
    }, { deep: true });

    watch(() => store.state.settings.save, (val) => {
      if (val && settings.value) {
        saveSettings('/systems/antihateraid', store, settings.value);
      }
    });

    watch(valid, (val) => {
      store.commit('settings/valid', val);
    }, { immediate: true });

    onMounted(() => {
      getSocket(`/systems/antihateraid`)
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
      modes,

      // validators
      required,
      minValue,
    };
  },
});
</script>
