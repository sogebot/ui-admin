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
            <v-row>
              <v-col>
                <v-switch v-model="settings.isAutomaticUpdateEnabled[0]" class="mt-0" dense
                  :label="translate('core.updater.settings.isAutomaticUpdateEnabled')" />
              </v-col>
              <v-col>
                <v-btn @click="manualCheck" :loading="isChecking">Check for new versions</v-btn>
              </v-col>
            </v-row>

            <v-simple-table>
              <template #default>
                <tbody>
                  <tr v-for="key of Object.keys(settings.versions[0])" :key="key">
                    <td>{{ key }}</td>
                    <td>
                      <strong>Installed:</strong> {{ settings.versions[0][key] }}
                      <br>
                      <strong>Latest compatible version:</strong> {{ settings.versionsAvailable[0][key] }}
                    </td>
                    <td>
                      <v-btn v-if="settings.versions[0][key] !== settings.versionsAvailable[0][key]" color="accent darken-4"
                        target="_blank" :href="`https://github.com/${key.replace('@', '')}/compare/v${settings.versions[0][key]}...v${settings.versionsAvailable[0][key]}`">
                        Changelog
                      </v-btn>
                      <v-btn v-if="settings.versions[0][key] !== settings.versionsAvailable[0][key]"
                        :loading="updating[key]" @click="update(key)">
                        Update
                      </v-btn>
                    </td>
                  </tr>
                </tbody>
              </template>
            </v-simple-table>
          </v-card-text>
        </v-card>
      </v-tab-item>
    </v-tabs-items>
  </v-form>
</template>

<script lang="ts">
import { useStore } from '@nuxtjs/composition-api';
import {
  defineComponent, nextTick, onMounted, reactive, ref, watch,
} from '@nuxtjs/composition-api';
import { getSocket } from '@sogebot/ui-helpers/socket';
import translate from '@sogebot/ui-helpers/translate';
import marked from 'marked';
import Vue from 'vue';

import { error } from '~/functions/error';
import { EventBus } from '~/functions/event-bus';
import { saveSettings } from '~/functions/settings';

export default defineComponent({
  setup () {
    const settings = ref(null as Record<string, any> | null);
    const ui = ref(null as Record<string, any> | null);
    const store = useStore<any>();
    const valid = ref(true);
    const tab = ref(null);
    const dialog = ref({});
    const updating = reactive({} as Record<string, boolean>);
    const isChecking = ref(false);

    watch(settings, () => {
      store.commit('settings/pending', true);
    }, { deep: true });

    watch(valid, (val) => {
      store.commit('settings/valid', val);
    }, { immediate: true });

    watch(() => store.state.settings.save, (val) => {
      if (val && settings.value) {
        saveSettings('/core/updater', store, settings.value);
      }
    });

    const update = (pkg: string) => {
      if (settings.value) {
        Vue.set(updating, pkg, true);
        getSocket(`/core/updater`).emit('updater::trigger', { pkg, version: settings.value.versionsAvailable[0][pkg] }, (err: string | null) => {
          if (err) {
            EventBus.$emit('snack', 'orange', `Package ${pkg} was not successfuly updated.`);
          } else {
            EventBus.$emit('snack', 'success', `Package ${pkg} was successfuly updated to ${settings.value?.versionsAvailable[0][pkg]}.`);
          }
          Vue.set(updating, pkg, false);
          refresh();
        });
      }
    };

    onMounted(() => {
      refresh();
    });

    const manualCheck = () => {
      isChecking.value = true;
      getSocket(`/core/updater`)
        .emit('updater::check', () => {
          isChecking.value = false;
          refresh();
        });
    };

    const refresh = () => {
      getSocket(`/core/updater`)
        .emit('settings', (err: string | null, _settings: { [x: string]: any }, _ui: { [x: string]: { [attr: string]: any } }) => {
          if (err) {
            error(err);
            return;
          }
          ui.value = _ui;
          settings.value = _settings;
          nextTick(() => { store.commit('settings/pending', false); });
        });
    };

    return {
      settings,
      ui,
      valid,
      tab,
      dialog,
      updating,
      isChecking,
      update,
      translate,
      manualCheck,
      marked,
    };
  },
});
</script>
