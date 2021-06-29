<template>
  <loading v-if="!settings" />
  <v-card v-else flat class="fill-height">
    <v-card-text>
      <v-form ref="form" v-model="valid">
        <v-checkbox
          v-model="settings.cooldownNotifyAsWhisper[0]"
          dense
          :label="translate('systems.cooldown.settings.cooldownNotifyAsWhisper')"
        />
        <v-checkbox
          v-model="settings.cooldownNotifyAsChat[0]"
          dense
          :label="translate('systems.cooldown.settings.cooldownNotifyAsChat')"
        />

        <permission-tabs v-slot:default="{permissions}" :ignored="getIgnoredPermissions(settings, 'default')">
          <v-tab-item v-for="permission of permissions" :key="permission.id" eager>
            <v-row>
              <v-col>
                <v-text-field
                  type="number"
                  class="mb-1"
                  hide-details
                  min="0"
                  :label="translate('systems.cooldown.settings.defaultCooldownOfCommandsInSeconds')"
                  :value="getPermissionSettingsValue(permissions, permission.id, settings.__permission_based__.default.defaultCooldownOfCommandsInSeconds[0])"
                  @input="settings.__permission_based__.default.defaultCooldownOfCommandsInSeconds[0][permission.id] = Number($event)"
                  :rules="[required, minValue(0)]"
                  :disabled="settings.__permission_based__.default.defaultCooldownOfCommandsInSeconds[0][permission.id] === null"
                />
              </v-col>
              <v-col align-self="center" cols="auto" v-if="permission.id !== '0efd7b1c-e460-4167-8e06-8aaf2c170311'">
                <v-btn icon @click="settings.__permission_based__.default.defaultCooldownOfCommandsInSeconds[0][permission.id] = togglePermissionLock(permissions, permission.id, settings.__permission_based__.default.defaultCooldownOfCommandsInSeconds[0])"><v-icon>{{ settings.__permission_based__.default.defaultCooldownOfCommandsInSeconds[0][permission.id] === null ? mdiLock : mdiLockOpen }}</v-icon></v-btn>
              </v-col>
            </v-row>
            <v-row class="pt-0 mt-0">
              <v-col>
                <v-text-field
                  type="number"
                  class="mb-1"
                  hide-details
                  min="0"
                  :label="translate('systems.cooldown.settings.defaultCooldownOfKeywordsInSeconds')"
                  :value="getPermissionSettingsValue(permissions, permission.id, settings.__permission_based__.default.defaultCooldownOfKeywordsInSeconds[0])"
                  @input="settings.__permission_based__.default.defaultCooldownOfKeywordsInSeconds[0][permission.id] = Number($event)"
                  :rules="[required, minValue(0)]"
                  :disabled="settings.__permission_based__.default.defaultCooldownOfKeywordsInSeconds[0][permission.id] === null"
                />
              </v-col>
              <v-col align-self="center" cols="auto" v-if="permission.id !== '0efd7b1c-e460-4167-8e06-8aaf2c170311'">
                <v-btn icon @click="settings.__permission_based__.default.defaultCooldownOfKeywordsInSeconds[0][permission.id] = togglePermissionLock(permissions, permission.id, settings.__permission_based__.default.defaultCooldownOfKeywordsInSeconds[0])"><v-icon>{{ settings.__permission_based__.default.defaultCooldownOfKeywordsInSeconds[0][permission.id] === null ? mdiLock : mdiLockOpen }}</v-icon></v-btn>
              </v-col>
            </v-row>
          </v-tab-item>
        </permission-tabs>
      </v-form>
    </v-card-text>
  </v-card>
</template>

<script lang="ts">
import { mdiLock, mdiLockOpen } from '@mdi/js';
import { useStore } from '@nuxtjs/composition-api';
import { getSocket } from '@sogebot/ui-helpers/socket';
import translate from '@sogebot/ui-helpers/translate';
import {
  defineAsyncComponent,
  defineComponent, nextTick, onMounted, ref, watch,
} from '@vue/composition-api';

import { error } from '~/functions/error';
import { getIgnoredPermissions } from '~/functions/getIgnoredPermissions';
import { getPermissionSettingsValue } from '~/functions/getPermissionSettingsValue';
import { saveSettings } from '~/functions/settings';
import { togglePermissionLock } from '~/functions/togglePermissionLock';
import { minValue, required } from '~/functions/validators';

export default defineComponent({
  components: { permissionTabs: defineAsyncComponent(() => import('~/components/settings/modules/permissionTabs.vue')) },
  setup () {
    const settings = ref(null as Record<string, any> | null);
    const ui = ref(null as Record<string, any> | null);
    const store = useStore<any>();
    const valid = ref(true);
    const form = ref(null);

    watch(settings, () => {
      store.commit('settings/pending', true);
    }, { deep: true });

    watch(() => store.state.settings.save, (val) => {
      if (val && settings.value) {
        saveSettings('/systems/cooldown', store, settings.value);
      }
    });

    watch(valid, (val) => {
      store.commit('settings/valid', val);
    }, { immediate: true });

    onMounted(() => {
      getSocket(`/systems/cooldown`)
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

      // functions
      getIgnoredPermissions,
      getPermissionSettingsValue,
      togglePermissionLock,

      // validators
      required,
      minValue,

      // icons
      mdiLock,
      mdiLockOpen,
    };
  },
});
</script>
