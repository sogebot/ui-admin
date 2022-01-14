<template>
  <loading v-if="!settings" />
  <v-form v-else v-model="valid" lazy-validation>
    <v-tabs v-model="tab">
      <v-tab>{{ translate('categories.general') }}</v-tab>
      <v-tab>{{ translate('categories.comboBreakMessages') }}</v-tab>
      <v-tab>{{ translate('categories.hypeMessages') }}</v-tab>
    </v-tabs>

    <v-tabs-items v-model="tab">
      <v-tab-item eager>
        <v-card>
          <v-card-text>
            <revert-text-field
              v-model="settings.comboCooldown"
              type="number"
              min="0"
              :hint="translate('overlays.emotes.settings.comboCooldown.help')"
              :label="translate('overlays.emotes.settings.comboCooldown.title')"
              :rules="[required, minValue(0)]"
            />
            <revert-text-field
              v-model="settings.comboMessageMinThreshold"
              type="number"
              min="0"
              class="pt-3"
              :hint="translate('overlays.emotes.settings.comboMessageMinThreshold.help')"
              :label="translate('overlays.emotes.settings.comboMessageMinThreshold.title')"
              :rules="[required, minValue(0)]"
            />
          </v-card-text>
        </v-card>
      </v-tab-item>
      <v-tab-item eager>
        <v-card>
          <v-card-text>
            <v-alert v-if="settings.comboMessages[0].length === 0" text border="left" color="orange">
              {{ translate('overlays.emotes.settings.noMessagesFound') }}
            </v-alert>
            <template v-for="(message, idx) of settings.comboMessages[0]">
              <v-sheet :key="idx" class="pa-2">
                <v-row>
                  <v-col>
                    <v-text-field v-model="message.message" :label="translate('overlays.emotes.settings.message')" :rules="[required]" />
                    <v-text-field
                      v-model="message.messagesCount"
                      :label="translate('overlays.emotes.settings.threshold')"
                      type="number"
                      min="0"
                      max="100"
                      :rules="[required, minValue(0)]"
                    />
                  </v-col>
                  <v-col cols="auto">
                    <v-btn icon @click="removeMessage(idx)">
                      <v-icon>mdi-delete-forever</v-icon>
                    </v-btn>
                  </v-col>
                </v-row>
              </v-sheet>
              <v-divider v-if="idx !== settings.comboMessages[0].length - 1" :key="idx + 1000000" />
            </template>
            <v-btn block @click="addMessage">
              Add message
            </v-btn>
          </v-card-text>
        </v-card>
      </v-tab-item>
      <v-tab-item eager>
        <v-card>
          <v-card-text>
            <v-switch dense class="mt-0" :label="translate('overlays.emotes.settings.hypeMessagesEnabled')"
              v-model="settings.hypeMessagesEnabled[0]" />
            <v-alert v-if="settings.hypeMessages[0].length === 0" text border="left" color="orange">
              {{ translate('overlays.emotes.settings.noMessagesFound') }}
            </v-alert>
            <template v-for="(message, idx) of settings.hypeMessages[0]">
              <v-sheet :key="idx" class="pa-2">
                <v-row>
                  <v-col>
                    <v-text-field v-model="message.message" :label="translate('overlays.emotes.settings.message')" :rules="[required]" />
                    <v-text-field
                      v-model="message.messagesCount"
                      :label="translate('overlays.emotes.settings.threshold')"
                      type="number"
                      min="0"
                      max="100"
                      :rules="[required, minValue(0)]"
                    />
                  </v-col>
                  <v-col cols="auto">
                    <v-btn icon @click="removeMessage(idx)">
                      <v-icon>mdi-delete-forever</v-icon>
                    </v-btn>
                  </v-col>
                </v-row>
              </v-sheet>
              <v-divider v-if="idx !== settings.hypeMessages[0].length - 1" :key="idx + 1000000" />
            </template>
            <v-btn block @click="addMessage">
              Add message
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

import { error } from '~/functions/error';
import { saveSettings } from '~/functions/settings';
import { minValue, required } from '~/functions/validators';

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
        saveSettings('/systems/emotescombo', store, settings.value);
      }
    });

    watch(valid, (val) => {
      store.commit('settings/valid', val);
    }, {
      immediate: true,
    });

    onMounted(() => {
      getSocket(`/systems/emotescombo`)
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

    const addMessage = () => {
      if (settings.value) {
        settings.value.comboMessages[0].push({
          message:       '<changeit>',
          messagesCount: 9999,
        });
        settings.value.comboMessages = [
          settings.value.comboMessages[0],
          settings.value.comboMessages[1],
        ];
      }
    };

    const removeMessage = (idx: number) => {
      if (settings.value) {
        settings.value.comboMessages[0].splice(idx, 1);
        settings.value.comboMessages = [
          settings.value.comboMessages[0],
          settings.value.comboMessages[1],
        ];
      }
    };

    return {
      settings,
      ui,
      translate,
      valid,
      tab,

      // functions
      addMessage,
      removeMessage,

      // validators
      required,
      minValue,
    };
  },
});
</script>
