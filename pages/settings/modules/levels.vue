<template>
  <loading v-if="!settings" />
  <v-card v-else flat style="min-height: 100%;">
    <v-card-text>
      <v-form ref="form" v-model="valid">
        <v-card-title class="pt-0">{{ translate('categories.conversion') }}</v-card-title>
        <revert-text-field
          v-model="settings.conversion.conversionRate"
          type="number"
          min="1"
          :label="translate('systems.levels.settings.conversionRate')"
          :rules="[required, minValue(1)]"
        />

        <v-card-title>{{ translate('categories.levels') }}</v-card-title>
        <revert-text-field
          v-model="settings.levels.firstLevelStartsAt"
          type="number"
          min="1"
          :label="translate('systems.levels.settings.firstLevelStartsAt')"
          :rules="[required, minValue(1)]"
        />
        <revert-text-field
          v-model="settings.levels.nextLevelFormula"
          :label="translate('systems.levels.settings.nextLevelFormula.title')"
          :hint="translate('systems.levels.settings.nextLevelFormula.help')"
          :rules="[required]"
        />

        <v-row no-gutters>
          <v-col>
            <v-simple-table dense>
              <template v-slot:default>
                <tbody>
                  <tr
                    v-for="(xp, idx) in showcase"
                    v-show="idx > 0 && idx < 8"
                    :key="'Level '+ idx + ': ' + xp"
                  >
                    <td>
                      {{ idx }}
                    </td>
                    <td>
                      {{ xp }}
                    </td>
                  </tr>
                </tbody>
              </template>
            </v-simple-table>
          </v-col>
          <v-col>
            <v-simple-table dense>
              <template v-slot:default>
                <tbody>
                  <tr
                    v-for="(xp, idx) in showcase"
                    v-show="idx >= 8 && idx < 15"
                    :key="'Level '+ idx + ': ' + xp"
                  >
                    <td>
                      {{ idx }}
                    </td>
                    <td>
                      {{ xp }}
                    </td>
                  </tr>
                </tbody>
              </template>
            </v-simple-table>
          </v-col>
          <v-col>
            <v-simple-table dense>
              <template v-slot:default>
                <tbody>
                  <tr
                    v-for="(xp, idx) in showcase"
                    v-show="idx >= 15"
                    :key="'Level '+ idx + ': ' + xp"
                  >
                    <td>
                      {{ idx }}
                    </td>
                    <td>
                      {{ xp }}
                    </td>
                  </tr>
                </tbody>
              </template>
            </v-simple-table>
          </v-col>
        </v-row>
        <v-alert dense text color="warning" border="left">
          {{ translate('systems.levels.settings.levelShowcaseHelp') }}
        </v-alert>

        <v-card-title>{{ translate('categories.xp') }}</v-card-title>
        <revert-text-field
          v-model="settings.xp.xpName"
          :label="translate('systems.levels.settings.xpName')"
          :rules="[required]"
        />

        <permission-tabs v-slot:default="{permissions}" :ignored="getIgnoredPermissions(settings, 'xp')">
          <v-tab-item v-for="permission of permissions" :key="permission.id" eager>
            <v-row>
              <v-col>
                <v-text-field
                  type="number"
                  class="mb-1"
                  hide-details
                  min="0"
                  :label="translate('systems.levels.settings.interval')"
                  :value="getPermissionSettingsValue(permissions, permission.id, settings.__permission_based__.xp.interval[0])"
                  @input="settings.__permission_based__.xp.interval[0][permission.id] = Number($event)"
                  :rules="[required, minValue(0)]"
                  :disabled="settings.__permission_based__.xp.interval[0][permission.id] === null"
                />
              </v-col>
              <v-col align-self="center" cols="auto" v-if="permission.id !== '0efd7b1c-e460-4167-8e06-8aaf2c170311'">
                <v-btn icon @click="settings.__permission_based__.xp.interval[0][permission.id] = togglePermissionLock(permissions, permission.id, settings.__permission_based__.xp.interval[0])"><v-icon>{{ settings.__permission_based__.xp.interval[0][permission.id] === null ? mdiLock : mdiLockOpenVariant }}</v-icon></v-btn>
              </v-col>
            </v-row>
            <v-row class="pt-0 mt-0">
              <v-col>
                <v-text-field
                  type="number"
                  class="mb-1"
                  hide-details
                  min="0"
                  :label="translate('systems.levels.settings.perInterval')"
                  :value="getPermissionSettingsValue(permissions, permission.id, settings.__permission_based__.xp.perInterval[0])"
                  @input="settings.__permission_based__.xp.perInterval[0][permission.id] = Number($event)"
                  :rules="[required, minValue(0)]"
                  :disabled="settings.__permission_based__.xp.perInterval[0][permission.id] === null"
                />
              </v-col>
              <v-col align-self="center" cols="auto" v-if="permission.id !== '0efd7b1c-e460-4167-8e06-8aaf2c170311'">
                <v-btn icon @click="settings.__permission_based__.xp.perInterval[0][permission.id] = togglePermissionLock(permissions, permission.id, settings.__permission_based__.xp.perInterval[0])"><v-icon>{{ settings.__permission_based__.xp.perInterval[0][permission.id] === null ? mdiLock : mdiLockOpenVariant }}</v-icon></v-btn>
              </v-col>
            </v-row>
            <v-row class="pt-0 mt-0">
              <v-col>
                <v-text-field
                  type="number"
                  class="mb-1"
                  hide-details
                  min="0"
                  :label="translate('systems.levels.settings.offlineInterval')"
                  :value="getPermissionSettingsValue(permissions, permission.id, settings.__permission_based__.xp.offlineInterval[0])"
                  @input="settings.__permission_based__.xp.offlineInterval[0][permission.id] = Number($event)"
                  :rules="[required, minValue(0)]"
                  :disabled="settings.__permission_based__.xp.offlineInterval[0][permission.id] === null"
                />
              </v-col>
              <v-col align-self="center" cols="auto" v-if="permission.id !== '0efd7b1c-e460-4167-8e06-8aaf2c170311'">
                <v-btn icon @click="settings.__permission_based__.xp.offlineInterval[0][permission.id] = togglePermissionLock(permissions, permission.id, settings.__permission_based__.xp.offlineInterval[0])"><v-icon>{{ settings.__permission_based__.xp.offlineInterval[0][permission.id] === null ? mdiLock : mdiLockOpenVariant }}</v-icon></v-btn>
              </v-col>
            </v-row>
            <v-row class="pt-0 mt-0">
              <v-col>
                <v-text-field
                  type="number"
                  class="mb-1"
                  hide-details
                  min="0"
                  :label="translate('systems.levels.settings.perOfflineInterval')"
                  :value="getPermissionSettingsValue(permissions, permission.id, settings.__permission_based__.xp.perOfflineInterval[0])"
                  @input="settings.__permission_based__.xp.perOfflineInterval[0][permission.id] = Number($event)"
                  :rules="[required, minValue(0)]"
                  :disabled="settings.__permission_based__.xp.perOfflineInterval[0][permission.id] === null"
                />
              </v-col>
              <v-col align-self="center" cols="auto" v-if="permission.id !== '0efd7b1c-e460-4167-8e06-8aaf2c170311'">
                <v-btn icon @click="settings.__permission_based__.xp.perOfflineInterval[0][permission.id] = togglePermissionLock(permissions, permission.id, settings.__permission_based__.xp.perOfflineInterval[0])"><v-icon>{{ settings.__permission_based__.xp.perOfflineInterval[0][permission.id] === null ? mdiLock : mdiLockOpenVariant }}</v-icon></v-btn>
              </v-col>
            </v-row>
            <v-row class="pt-0 mt-0">
              <v-col>
                <v-text-field
                  type="number"
                  class="mb-1"
                  hide-details
                  min="0"
                  :label="translate('systems.levels.settings.messageInterval')"
                  :value="getPermissionSettingsValue(permissions, permission.id, settings.__permission_based__.xp.messageInterval[0])"
                  @input="settings.__permission_based__.xp.messageInterval[0][permission.id] = Number($event)"
                  :rules="[required, minValue(0)]"
                  :disabled="settings.__permission_based__.xp.messageInterval[0][permission.id] === null"
                />
              </v-col>
              <v-col align-self="center" cols="auto" v-if="permission.id !== '0efd7b1c-e460-4167-8e06-8aaf2c170311'">
                <v-btn icon @click="settings.__permission_based__.xp.messageInterval[0][permission.id] = togglePermissionLock(permissions, permission.id, settings.__permission_based__.xp.messageInterval[0])"><v-icon>{{ settings.__permission_based__.xp.messageInterval[0][permission.id] === null ? mdiLock : mdiLockOpenVariant }}</v-icon></v-btn>
              </v-col>
            </v-row>
            <v-row class="pt-0 mt-0">
              <v-col>
                <v-text-field
                  type="number"
                  class="mb-1"
                  hide-details
                  min="0"
                  :label="translate('systems.levels.settings.perMessageInterval')"
                  :value="getPermissionSettingsValue(permissions, permission.id, settings.__permission_based__.xp.perMessageInterval[0])"
                  @input="settings.__permission_based__.xp.perMessageInterval[0][permission.id] = Number($event)"
                  :rules="[required, minValue(0)]"
                  :disabled="settings.__permission_based__.xp.perMessageInterval[0][permission.id] === null"
                />
              </v-col>
              <v-col align-self="center" cols="auto" v-if="permission.id !== '0efd7b1c-e460-4167-8e06-8aaf2c170311'">
                <v-btn icon @click="settings.__permission_based__.xp.perMessageInterval[0][permission.id] = togglePermissionLock(permissions, permission.id, settings.__permission_based__.xp.perMessageInterval[0])"><v-icon>{{ settings.__permission_based__.xp.perMessageInterval[0][permission.id] === null ? mdiLock : mdiLockOpenVariant }}</v-icon></v-btn>
              </v-col>
            </v-row>
            <v-row class="pt-0 mt-0">
              <v-col>
                <v-text-field
                  type="number"
                  class="mb-1"
                  hide-details
                  min="0"
                  :label="translate('systems.levels.settings.messageOfflineInterval')"
                  :value="getPermissionSettingsValue(permissions, permission.id, settings.__permission_based__.xp.messageOfflineInterval[0])"
                  @input="settings.__permission_based__.xp.messageOfflineInterval[0][permission.id] = Number($event)"
                  :rules="[required, minValue(0)]"
                  :disabled="settings.__permission_based__.xp.messageOfflineInterval[0][permission.id] === null"
                />
              </v-col>
              <v-col align-self="center" cols="auto" v-if="permission.id !== '0efd7b1c-e460-4167-8e06-8aaf2c170311'">
                <v-btn icon @click="settings.__permission_based__.xp.messageOfflineInterval[0][permission.id] = togglePermissionLock(permissions, permission.id, settings.__permission_based__.xp.messageOfflineInterval[0])"><v-icon>{{ settings.__permission_based__.xp.messageOfflineInterval[0][permission.id] === null ? mdiLock : mdiLockOpenVariant }}</v-icon></v-btn>
              </v-col>
            </v-row>
            <v-row class="pt-0 mt-0">
              <v-col>
                <v-text-field
                  type="number"
                  class="mb-1"
                  hide-details
                  min="0"
                  :label="translate('systems.levels.settings.perMessageOfflineInterval')"
                  :value="getPermissionSettingsValue(permissions, permission.id, settings.__permission_based__.xp.perMessageOfflineInterval[0])"
                  @input="settings.__permission_based__.xp.perMessageOfflineInterval[0][permission.id] = Number($event)"
                  :rules="[required, minValue(0)]"
                  :disabled="settings.__permission_based__.xp.perMessageOfflineInterval[0][permission.id] === null"
                />
              </v-col>
              <v-col align-self="center" cols="auto" v-if="permission.id !== '0efd7b1c-e460-4167-8e06-8aaf2c170311'">
                <v-btn icon @click="settings.__permission_based__.xp.perMessageOfflineInterval[0][permission.id] = togglePermissionLock(permissions, permission.id, settings.__permission_based__.xp.perMessageOfflineInterval[0])"><v-icon>{{ settings.__permission_based__.xp.perMessageOfflineInterval[0][permission.id] === null ? mdiLock : mdiLockOpenVariant }}</v-icon></v-btn>
              </v-col>
            </v-row>
          </v-tab-item>
        </permission-tabs>
      </v-form>
    </v-card-text>
  </v-card>
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
import { minValue, required } from '~/functions/validators';

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
    const form = ref(null);
    const showcase = ref([] as string[]);

    const showcaseRecalc = () => {
      getSocket(`/systems/levels`).emit('getLevelsExample', (err: string | null, _data: string[]) => {
        if (err) {
          console.error(err);
        } else {
          showcase.value = _data;
        }
      });
    };

    watch(settings, () => {
      store.commit('settings/pending', true);
    }, { deep: true });

    watch(() => store.state.settings.save, (val) => {
      if (val && settings.value) {
        saveSettings('/systems/levels', store, settings.value);
        showcaseRecalc();
      }
    });

    watch(valid, (val) => {
      store.commit('settings/valid', val);
    }, { immediate: true });

    onMounted(() => {
      getSocket(`/systems/levels`)
        .emit('settings', (err: string | null, _settings: { [x: string]: any }, _ui: { [x: string]: { [attr: string]: any } }) => {
          if (err) {
            error(err);
            return;
          }
          ui.value = _ui;
          console.log({ _settings });
          settings.value = _settings;
          showcaseRecalc();
          nextTick(() => { store.commit('settings/pending', false); });
        });
    });

    return {
      settings,
      ui,
      translate,
      valid,
      form,
      showcase,

      // functions
      getIgnoredPermissions,
      getPermissionSettingsValue,
      togglePermissionLock,

      // validators
      required,
      minValue,

      // icons
      mdiLock,
      mdiLockOpenVariant,
    };
  },
});
</script>
