<template>
  <loading v-if="!settings" />
  <v-card v-else flat class="fill-height">
    <v-card-text>
      <v-form ref="form" v-model="valid">
        <div v-for="item of settings.urls.urls[0]" :key="item.url">
          <v-text-field
            readonly
            hide-details
            :value="item.url"
          >
            <template #append-outer>
              <v-btn text @click="item.clip = !item.clip" :color="item.clip ? 'success' : 'error'">CLIP</v-btn>
              <v-btn text @click="item.highlight = !item.highlight" :color="item.highlight ? 'success' : 'error'">HIGHLIGHT</v-btn>
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
    const form = ref(null);
    const origin = computed(() => window.location.origin);

    watch(settings, () => {
      store.commit('settings/pending', true);
    }, { deep: true });

    watch(() => store.state.settings.save, (val) => {
      if (val && settings.value) {
        saveSettings('/systems/highlights', store, settings.value);
      }
    });

    watch(valid, (val) => {
      store.commit('settings/valid', val);
    }, { immediate: true });

    onMounted(() => {
      getSocket(`/systems/highlights`)
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
      form,
      origin,

      // functions
      v4,

      // validators
      required,
      minValue,
    };
  },
});
</script>
