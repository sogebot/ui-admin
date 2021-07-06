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
            <revert-text-field v-model="settings.connection.accessTokenExpirationTime" type="number" min="0"
              :label="translate('core.socket.settings.accessTokenExpirationTime')" :rules="[required, minValue(120)]" />
            <revert-text-field v-model="settings.connection.refreshTokenExpirationTime" type="number" min="0"
              :label="translate('core.socket.settings.refreshTokenExpirationTime')"
              :rules="[required, minValue(400000)]" />

            <v-text-field :label="translate('core.socket.settings.socketToken.title')"
              :hint="translate('core.socket.settings.socketToken.help')" persistent-hint readonly
              :value="'*'.repeat(30) + settings.connection.socketToken[0].slice(30)">
              <template #append-outer>
                <v-btn text small @click.stop="copy(settings.connection.socketToken[0])">
                  {{ translate('systems.polls.copy') }}
                </v-btn>
                <v-btn text small color="primary" @click.stop="settings.connection.socketToken = [v4(), '']">
                  {{ translate('commons.generate') }}
                </v-btn>
              </template>
            </v-text-field>

            <v-btn color="error" class="mt-2" @click="purgeAll">
              {{ translate('core.socket.settings.purgeAllConnections') }}
            </v-btn>
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
import { v4 } from 'uuid';

import { error } from '~/functions/error';
import { EventBus } from '~/functions/event-bus';
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

    watch(settings, () => {
      store.commit('settings/pending', true);
    }, { deep: true });

    watch(() => store.state.settings.save, (val) => {
      if (val && settings.value) {
        saveSettings('/core/socket', store, settings.value);
      }
    });

    watch(valid, (val) => {
      store.commit('settings/valid', val);
    }, { immediate: true });

    onMounted(() => {
      getSocket(`/core/socket`)
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

    const copy = (text: string) => {
      navigator.clipboard.writeText(text);
      EventBus.$emit('snack', 'success', 'Socket token copied to clipboard.');
    };

    const purgeAll = () => {
      getSocket(`/core/socket`).emit('purgeAllConnections', () => {
        EventBus.$emit('snack', 'error', 'Tokens purged.');
      });
    };

    return {
      settings,
      ui,
      translate,
      valid,
      tab,

      // functions
      v4,
      EventBus,
      copy,
      purgeAll,

      // validators
      required,
      minValue,
    };
  },
});
</script>
