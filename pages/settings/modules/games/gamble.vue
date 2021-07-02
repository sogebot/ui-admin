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
        <v-switch class="mt-0"
          v-model="settings.enableJackpot[0]"
          :label="translate('games.gamble.settings.enableJackpot')"
        />
        <revert-text-field
          class="pt-3"
          v-model="settings.maxJackpotValue"
          type="number"
          min="100"
          :label="translate('games.gamble.settings.maxJackpotValue')"
          :rules="[required, minValue(100)]"
        />
        <revert-text-field
          class="pt-3"
          v-model="settings.lostPointsAddedToJackpot"
          type="number"
          min="0"
          max="100"
          :label="translate('games.gamble.settings.lostPointsAddedToJackpot')"
          :rules="[required, minValue(0), maxValue(100)]"
        />
        <permission-tabs v-slot:default="{permissions}">
        <v-tab-item v-for="permission of permissions" :key="permission.id" eager>
          <v-row class="mt-0">
            <v-col>
              <v-text-field
                type="number"
                class="mb-1"
                hide-details
                min="0"
                :label="translate('games.gamble.settings.minimalBet')"
                :value="getPermissionSettingsValue(permissions, permission.id, settings.__permission_based__.settings.minimalBet[0])"
                @input="settings.__permission_based__.settings.minimalBet[0][permission.id] = Number($event)"
                :rules="[required, minValue(0)]"
                :disabled="settings.__permission_based__.settings.minimalBet[0][permission.id] === null"
              />
            </v-col>
            <v-col align-self="center" cols="auto" v-if="permission.id !== '0efd7b1c-e460-4167-8e06-8aaf2c170311'">
              <v-btn icon @click="settings.__permission_based__.settings.minimalBet[0][permission.id] = togglePermissionLock(permissions, permission.id, settings.__permission_based__.settings.minimalBet[0])">
                <v-icon>{{ settings.__permission_based__.settings.minimalBet[0][permission.id] === null ? mdiLock : mdiLockOpenVariant }}</v-icon>
              </v-btn>
            </v-col>
          </v-row>
          <v-row class="mt-0">
            <v-col>
              <v-text-field
                type="number"
                class="mb-1"
                hide-details
                min="1"
                max="100"
                :label="translate('games.gamble.settings.chanceToTriggerJackpot')"
                :value="getPermissionSettingsValue(permissions, permission.id, settings.__permission_based__.settings.chanceToTriggerJackpot[0])"
                @input="settings.__permission_based__.settings.chanceToTriggerJackpot[0][permission.id] = Number($event)"
                :rules="[required, minValue(1), maxValue(100)]"
                :disabled="settings.__permission_based__.settings.chanceToTriggerJackpot[0][permission.id] === null"
              />
            </v-col>
            <v-col align-self="center" cols="auto" v-if="permission.id !== '0efd7b1c-e460-4167-8e06-8aaf2c170311'">
              <v-btn icon @click="settings.__permission_based__.settings.chanceToTriggerJackpot[0][permission.id] = togglePermissionLock(permissions, permission.id, settings.__permission_based__.settings.chanceToTriggerJackpot[0])">
                <v-icon>{{ settings.__permission_based__.settings.chanceToTriggerJackpot[0][permission.id] === null ? mdiLock : mdiLockOpenVariant }}</v-icon>
              </v-btn>
            </v-col>
          </v-row>
          <v-row class="mt-0">
            <v-col>
              <v-text-field
                type="number"
                class="mb-1"
                hide-details
                min="0"
                max="100"
                :label="translate('games.gamble.settings.chanceToWin.title')"
                :value="getPermissionSettingsValue(permissions, permission.id, settings.__permission_based__.settings.chanceToWin[0])"
                @input="settings.__permission_based__.settings.chanceToWin[0][permission.id] = Number($event)"
                :rules="[required, minValue(1), maxValue(100)]"
                :disabled="settings.__permission_based__.settings.chanceToWin[0][permission.id] === null"
              >
                <template #append>%</template>
              </v-text-field>
            </v-col>
            <v-col align-self="center" cols="auto" v-if="permission.id !== '0efd7b1c-e460-4167-8e06-8aaf2c170311'">
              <v-btn icon @click="settings.__permission_based__.settings.chanceToWin[0][permission.id] = togglePermissionLock(permissions, permission.id, settings.__permission_based__.settings.chanceToWin[0])">
                <v-icon>{{ settings.__permission_based__.settings.chanceToWin[0][permission.id] === null ? mdiLock : mdiLockOpenVariant }}</v-icon>
              </v-btn>
            </v-col>
          </v-row>
        </v-tab-item>
      </permission-tabs>
          </v-card-text>
        </v-card>
      </v-tab-item>
    </v-tabs-items>
  </v-form>
</template>

<script lang="ts">
import { mdiLock, mdiLockOpenVariant } from '@mdi/js';
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
import {
  maxValue, minValue, required,
} from '~/functions/validators';

export default defineComponent({
  components: {
    permissionTabs:  defineAsyncComponent(() => import('~/components/settings/modules/permissionTabs.vue')),
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
    }, { deep: true });

    watch(() => store.state.settings.save, (val) => {
      if (val && settings.value) {
        saveSettings('/games/gamble', store, settings.value);
      }
    });

    watch(valid, (val) => {
      store.commit('settings/valid', val);
    }, { immediate: true });

    onMounted(() => {
      getSocket(`/games/gamble`)
        .emit('settings', (err: string | null, _settings: { [x: string]: any }, _ui: { [x: string]: { [attr: string]: any } }) => {
          if (err) {
            error(err);
            return;
          }
          ui.value = _ui;
          console.log({ _settings });
          settings.value = _settings;
          nextTick(() => { store.commit('settings/pending', false); });
        });
    });

    return {
      settings,
      ui,
      translate,
      valid,
      tab,

      // functions
      getIgnoredPermissions,
      getPermissionSettingsValue,
      togglePermissionLock,

      // validators
      required,
      minValue,
      maxValue,

      // icons
      mdiLock,
      mdiLockOpenVariant,
    };
  },
});
</script>
