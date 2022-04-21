<template>
  <loading v-if="!settings" />
  <v-form v-else v-model="valid" lazy-validation>
    <v-tabs v-model="tab">
      <v-tab>{{ translate('categories.general') }}</v-tab>
    </v-tabs>

    <v-tabs-items v-model="tab">
      <v-tab-item eager>
        <v-card>
          <v-card-text>
            <v-text-field
              readonly
              :value="user"
              :label="$t('integrations.lastfm.settings.username')"
            >
              <template #append-outer>
                <v-btn color="primary" v-if="settings && settings.userName[0].length === 0" href="/credentials/oauth/tiltify">Authorize</v-btn>
                <v-btn color="error" v-else @click="revoke">Revoke</v-btn>
              </template>
            </v-text-field>
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
import { EventBus } from '~/functions/event-bus';

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

    const user = computed(() => {
      if (settings.value && settings.value.userName[0].length > 0 && String(settings.value.userId[0]).length > 0) {
        return settings.value.userName[0] + '#' + settings.value.userId[0];
      }
      return 'Not Authorized';
    })

    watch(settings, () => {
      store.commit('settings/pending', true);
    }, { deep: true });

    watch(() => store.state.settings.save, (val) => {
      if (val && settings.value) {
        saveSettings('/integrations/tiltify', store, settings.value);
      }
    });

    watch(valid, (val) => {
      store.commit('settings/valid', val);
    }, { immediate: true });

    onMounted(() => {
      refresh();

      if (localStorage.tiltifySuccess) {
        delete localStorage.tiltifySuccess;
        EventBus.$emit('snack', 'success', 'User logged in.');
      }
    });

    const refresh = () => {
      getSocket(`/integrations/tiltify`)
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
    };

    const revoke = () => {
      getSocket('/integrations/tiltify').emit('tiltify::revoke', () => {
        EventBus.$emit('snack', 'success', 'User access revoked.');
        refresh();
      })
    }

    return {
      settings,
      ui,
      translate,
      valid,
      tab,
      user,
      revoke,

      // validators
      required,
      minValue,
    };
  },
});
</script>
