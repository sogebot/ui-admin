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
            <v-switch class="mt-0" v-model="settings.bypassCooldownByOwnerAndMods[0]"
              :label="translate('games.duel.settings.bypassCooldownByOwnerAndMods')" />
            <revert-text-field class="pt-3" v-model="settings.cooldown" type="number" min="0"
              :label="translate('games.duel.settings.cooldown')" :rules="[required, minValue(0)]" />
            <revert-text-field class="pt-3" v-model="settings.duration" type="number" min="0"
              :label="translate('games.duel.settings.duration.title')" :rules="[required, minValue(0)]">
              <template #append>{{ translate('games.duel.settings.duration.help') }}</template>
            </revert-text-field>
            <revert-text-field class="pt-3" v-model="settings.minimalBet" type="number" min="0"
              :label="translate('games.duel.settings.minimalBet')" :rules="[required, minValue(0)]" />
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
import {
  maxValue, minValue, required,
} from '~/functions/validators';

export default defineComponent({
  components: { revertTextField: defineAsyncComponent(() => import('~/components/settings/modules/revert-text-field.vue')) },
  setup () {
    const settings = ref(null as Record<string, any> | null);
    const ui = ref(null as Record<string, any> | null);
    const store = useStore<any>();
    const valid = ref(true);
    const tab = ref(null);

    watch(settings, () => {
      store.commit('settings/pending', true);
    }, { deep: true });

    watch(() => store.state.settings.save, (val) => {
      if (val && settings.value) {
        saveSettings('/games/duel', store, settings.value);
      }
    });

    watch(valid, (val) => {
      store.commit('settings/valid', val);
    }, { immediate: true });

    onMounted(() => {
      getSocket(`/games/duel`)
        .emit('settings', (err, _settings, _ui) => {
          if (err) {
            error(err);
            return;
          }
          ui.value = _ui;
          console.log({ _settings });
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
      minValue,
      maxValue,

      // functions
    };
  },
});
</script>
