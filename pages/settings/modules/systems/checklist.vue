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
            <v-text-field v-for="(item, idx) of settings.customization.itemsArray[0]" :key="idx"
              v-model="settings.customization.itemsArray[0][idx]" dense :label="`Item ${idx+1}`">
              <template #append-outer>
                <v-btn icon color="red" @click="remove(idx)">
                  <v-icon>mdi-delete-forever</v-icon>
                </v-btn>
              </template>
            </v-text-field>
            <v-btn @click="settings.customization.itemsArray[0].push('')">Add new item</v-btn>
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
  defineComponent, nextTick, onMounted, ref, watch,
} from '@vue/composition-api';

import { error } from '~/functions/error';
import { saveSettings } from '~/functions/settings';
import { minValue, required } from '~/functions/validators';

export default defineComponent({
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
        saveSettings('/systems/checklist', store, settings.value);
      }
    });

    watch(valid, (val) => {
      store.commit('settings/valid', val);
    }, {
      immediate: true,
    });

    onMounted(() => {
      getSocket(`/systems/checklist`)
        .emit('settings', (err, _settings, _ui) => {
          if (err) {
            error(err);
            return;
          }
          ui.value = _ui;
          settings.value = _settings;
          nextTick(() => { store.commit('settings/pending', false); });
        });
    });

    const remove = (index: number) => {
      if (!settings.value) {
        return;
      }
      settings.value.customization.itemsArray[0].splice(index, 1);
    };

    return {
      settings,
      ui,
      translate,
      valid,
      tab,
      remove,

      // validators
      required,
      minValue,
    };
  },
});
</script>
