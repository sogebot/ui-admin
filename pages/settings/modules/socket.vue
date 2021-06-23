<template>
  <loading v-if="!settings" />
  <v-card v-else flat class="fill-height">
    <v-card-text>
      <v-form ref="form" v-model="valid">
        <v-text-field
          v-model.number="settings.connection.accessTokenExpirationTime[0]"
          :label="translate('core.socket.settings.accessTokenExpirationTime')"
          type="number"
          :rules="[required, minValue(120)]"
          @input="$store.commit('settings/pending', true)"
        >
          <template v-if="settings.connection.accessTokenExpirationTime[0] !== settings.connection.accessTokenExpirationTime[1]" #append-outer>
            <v-btn text @click.stop="$store.commit('settings/pending', true); settings.connection.accessTokenExpirationTime = [settings.connection.accessTokenExpirationTime[1], settings.connection.accessTokenExpirationTime[1]]">
              Revert
            </v-btn>
          </template>
        </v-text-field>
        <v-text-field
          v-model.number="settings.connection.refreshTokenExpirationTime[0]"
          :label="translate('core.socket.settings.refreshTokenExpirationTime')"
          type="number"
          :rules="[required, minValue(400000)]"
          @input="$store.commit('settings/pending', true)"
        >
          <template v-if="settings.connection.refreshTokenExpirationTime[0] !== settings.connection.refreshTokenExpirationTime[1]" #append-outer>
            <v-btn text @click.stop="$store.commit('settings/pending', true); settings.connection.refreshTokenExpirationTime = [settings.connection.refreshTokenExpirationTime[1], settings.connection.refreshTokenExpirationTime[1]]">
              Revert
            </v-btn>
          </template>
        </v-text-field>

        <v-text-field
          :label="translate('core.socket.settings.socketToken.title')"
          :hint="translate('core.socket.settings.socketToken.help')"
          persistent-hint
          readonly
          :value="'*'.repeat(30) + settings.connection.socketToken[0].slice(30)"
          @input="$store.commit('settings/pending', true)"
        >
          <template #append-outer>
            <v-btn text @click.stop="copy(settings.connection.socketToken[0])">
              {{ translate('systems.polls.copy') }}
            </v-btn>
            <v-btn text color="primary" @click.stop="$store.commit('settings/pending', true); settings.connection.socketToken = [v4(), '']">
              {{ translate('commons.generate') }}
            </v-btn>
          </template>
        </v-text-field>

        <v-btn color="error" class="mt-2" @click="purgeAll">
          {{ translate('core.socket.settings.purgeAllConnections') }}
        </v-btn>
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
import { v4 } from 'uuid';

import { error } from '~/functions/error';
import { EventBus } from '~/functions/event-bus';
import { saveSettings } from '~/functions/settings';
import { minValue, required } from '~/functions/validators';

export default defineComponent({
  setup () {
    const settings = ref(null as Record<string, any> | null);
    const ui = ref(null as Record<string, any> | null);
    const store = useStore<any>();
    const valid = ref(true);
    const form = ref(null);

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
      form,

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
