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
            <v-form ref="form" v-model="valid">
              <div v-for="(item, idx) of settings.urls.urls[0]" :key="item.url">
                <v-text-field readonly hide-details :value="item.url">
                  <template #append-outer>
                    <v-btn text small @click="item.clip = !item.clip" :color="item.clip ? 'success' : 'error'">CLIP</v-btn>
                    <v-btn text small @click="item.highlight = !item.highlight" :color="item.highlight ? 'success' : 'error'">
                      HIGHLIGHT</v-btn>
                    <v-btn icon color="red" @click="remove(idx)">
                      <v-icon>mdi-delete-forever</v-icon>
                    </v-btn>
                  </template>
                </v-text-field>
              </div>
              <v-btn @click="settings.urls.urls[0].push({
            url: origin + '/highlights/' + v4(),
            clip: false,
            highlight: false,
          })">Generate new url</v-btn>
            </v-form>
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
  computed,
  defineComponent, nextTick, onMounted, ref, watch,
} from '@vue/composition-api';
import { v4 } from 'uuid';

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
    const origin = computed(() => window.location.origin);

    watch(settings, () => {
      store.commit('settings/pending', true);
    }, {
      deep: true,
    });

    watch(() => store.state.settings.save, (val) => {
      if (val && settings.value) {
        saveSettings('/systems/highlights', store, settings.value);
      }
    });

    watch(valid, (val) => {
      store.commit('settings/valid', val);
    }, {
      immediate: true,
    });

    onMounted(() => {
      getSocket(`/systems/highlights`)
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
      settings.value.urls.urls[0].splice(index, 1);
    };

    return {
      settings,
      ui,
      translate,
      valid,
      tab,
      origin,

      // functions
      v4,
      remove,

      // validators
      required,
      minValue,
    };
  },
});
</script>
