<template>
  <loading v-if="!settings" />
  <v-card v-else flat class="fill-height">
    <v-card-text>
      <v-form ref="form" v-model="valid">
        <v-text-field
          v-model="settings.domain[0]"
          :label="translate('core.ui.settings.domain.title')"
          :hint="translate('core.ui.settings.domain.help')"
          persistent-hint
          :rules="[required]"
          @input="$store.commit('settings/pending', true)"
        >
          <template v-if="settings.domain[0] !== settings.domain[1]" #append-outer>
            <v-btn text @click.stop="$store.commit('settings/pending', true); settings.domain = [settings.domain[1], settings.domain[1]]">
              Revert
            </v-btn>
          </template>
        </v-text-field>
        <v-checkbox
          v-model="settings.percentage[0]"
          dense
          :label="translate('core.ui.settings.percentage')"
          @click="$store.commit('settings/pending', true)"
        />
        <v-checkbox
          v-model="settings.shortennumbers[0]"
          dense
          :label="translate('core.ui.settings.shortennumbers')"
          @click="$store.commit('settings/pending', true)"
        />
        <v-checkbox
          v-model="settings.showdiff[0]"
          dense
          :label="translate('core.ui.settings.showdiff')"
          @click="$store.commit('settings/pending', true)"
        />
      </v-form>
    </v-card-text>
  </v-card>
</template>

<script lang="ts">
import { useStore } from '@nuxtjs/composition-api';
import { getSocket } from '@sogebot/ui-helpers/socket';
import translate from '@sogebot/ui-helpers/translate';
import {
  defineComponent, onMounted, ref, watch,
} from '@vue/composition-api';

import { error } from '~/functions/error';
import { saveSettings } from '~/functions/settings';
import { required } from '~/functions/validators';

export default defineComponent({
  setup () {
    const settings = ref(null as Record<string, any> | null);
    const ui = ref(null as Record<string, any> | null);
    const store = useStore<any>();
    const valid = ref(true);
    const form = ref(null);

    watch(() => store.state.settings.save, (val) => {
      if (val && settings.value) {
        saveSettings('/core/ui', store, settings.value);
      }
    });

    watch(valid, (val) => {
      store.commit('settings/valid', val);
    }, { immediate: true });

    onMounted(() => {
      getSocket(`/core/ui`)
        .emit('settings', (err: string | null, _settings: { [x: string]: any }, _ui: { [x: string]: { [attr: string]: any } }) => {
          if (err) {
            error(err);
            return;
          }
          ui.value = _ui;
          settings.value = _settings;
        });
    });

    return {
      settings,
      ui,
      translate,
      valid,
      form,

      // validators
      required,
    };
  },
});
</script>
