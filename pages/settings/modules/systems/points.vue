<template>
  <loading v-if="!settings" />
  <v-form v-else v-model="valid" lazy-validation>
    <v-tabs v-model="tab">
      <v-tab>{{ translate('categories.customization') }}</v-tab>
      <v-tab>{{ translate('categories.reset') }}</v-tab>
    </v-tabs>

    <v-tabs-items v-model="tab">
      <v-tab-item eager>
        <v-card>
          <v-card-text>
            <revert-text-field
              v-model="settings.customization.name"
              :label="translate('systems.points.settings.name.title')"
              :hint="translate('systems.points.settings.name.help')"
              :rules="[required]"
            />
            <permission-tabs v-slot="{permissions}" :ignored="getIgnoredPermissions(settings, 'customization')">
              <v-tab-item v-for="permission of permissions" :key="permission.id" eager>
                <v-row>
                  <v-col>
                    <v-text-field
                      type="number"
                      class="mb-1"
                      hide-details
                      min="0"
                      :label="translate('systems.points.settings.interval')"
                      :value="getPermissionSettingsValue(permissions, permission.id, settings.__permission_based__.customization.interval[0])"
                      :rules="[required, minValue(0)]"
                      :disabled="settings.__permission_based__.customization.interval[0][permission.id] === null"
                      @input="settings.__permission_based__.customization.interval[0][permission.id] = Number($event)"
                    />
                  </v-col>
                  <v-col
                    v-if="permission.id !== '0efd7b1c-e460-4167-8e06-8aaf2c170311'"
                    align-self="center"
                    cols="auto"
                  >
                    <v-btn
                      icon
                      @click="settings.__permission_based__.customization.interval[0][permission.id] = togglePermissionLock(permissions, permission.id, settings.__permission_based__.customization.interval[0])"
                    >
                      <v-icon>
                        {{ settings.__permission_based__.customization.interval[0][permission.id] === null ? 'mdi-lock' : 'mdi-lock-open-variant' }}
                      </v-icon>
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
                      :label="translate('systems.points.settings.perInterval')"
                      :value="getPermissionSettingsValue(permissions, permission.id, settings.__permission_based__.customization.perInterval[0])"
                      :rules="[required, minValue(0)]"
                      :disabled="settings.__permission_based__.customization.perInterval[0][permission.id] === null"
                      @input="settings.__permission_based__.customization.perInterval[0][permission.id] = Number($event)"
                    />
                  </v-col>
                  <v-col
                    v-if="permission.id !== '0efd7b1c-e460-4167-8e06-8aaf2c170311'"
                    align-self="center"
                    cols="auto"
                  >
                    <v-btn
                      icon
                      @click="settings.__permission_based__.customization.perInterval[0][permission.id] = togglePermissionLock(permissions, permission.id, settings.__permission_based__.customization.perInterval[0])"
                    >
                      <v-icon>
                        {{ settings.__permission_based__.customization.perInterval[0][permission.id] === null ? 'mdi-lock' : 'mdi-lock-open-variant' }}
                      </v-icon>
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
                      :label="translate('systems.points.settings.offlineInterval')"
                      :value="getPermissionSettingsValue(permissions, permission.id, settings.__permission_based__.customization.offlineInterval[0])"
                      :rules="[required, minValue(0)]"
                      :disabled="settings.__permission_based__.customization.offlineInterval[0][permission.id] === null"
                      @input="settings.__permission_based__.customization.offlineInterval[0][permission.id] = Number($event)"
                    />
                  </v-col>
                  <v-col
                    v-if="permission.id !== '0efd7b1c-e460-4167-8e06-8aaf2c170311'"
                    align-self="center"
                    cols="auto"
                  >
                    <v-btn
                      icon
                      @click="settings.__permission_based__.customization.offlineInterval[0][permission.id] = togglePermissionLock(permissions, permission.id, settings.__permission_based__.customization.offlineInterval[0])"
                    >
                      <v-icon>
                        {{ settings.__permission_based__.customization.offlineInterval[0][permission.id] === null ? 'mdi-lock' : 'mdi-lock-open-variant' }}
                      </v-icon>
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
                      :label="translate('systems.points.settings.perOfflineInterval')"
                      :value="getPermissionSettingsValue(permissions, permission.id, settings.__permission_based__.customization.perOfflineInterval[0])"
                      :rules="[required, minValue(0)]"
                      :disabled="settings.__permission_based__.customization.perOfflineInterval[0][permission.id] === null"
                      @input="settings.__permission_based__.customization.perOfflineInterval[0][permission.id] = Number($event)"
                    />
                  </v-col>
                  <v-col
                    v-if="permission.id !== '0efd7b1c-e460-4167-8e06-8aaf2c170311'"
                    align-self="center"
                    cols="auto"
                  >
                    <v-btn
                      icon
                      @click="settings.__permission_based__.customization.perOfflineInterval[0][permission.id] = togglePermissionLock(permissions, permission.id, settings.__permission_based__.customization.perOfflineInterval[0])"
                    >
                      <v-icon>
                        {{ settings.__permission_based__.customization.perOfflineInterval[0][permission.id] === null ? 'mdi-lock' : 'mdi-lock-open-variant' }}
                      </v-icon>
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
                      :label="translate('systems.points.settings.messageInterval')"
                      :value="getPermissionSettingsValue(permissions, permission.id, settings.__permission_based__.customization.messageInterval[0])"
                      :rules="[required, minValue(0)]"
                      :disabled="settings.__permission_based__.customization.messageInterval[0][permission.id] === null"
                      @input="settings.__permission_based__.customization.messageInterval[0][permission.id] = Number($event)"
                    />
                  </v-col>
                  <v-col
                    v-if="permission.id !== '0efd7b1c-e460-4167-8e06-8aaf2c170311'"
                    align-self="center"
                    cols="auto"
                  >
                    <v-btn
                      icon
                      @click="settings.__permission_based__.customization.messageInterval[0][permission.id] = togglePermissionLock(permissions, permission.id, settings.__permission_based__.customization.messageInterval[0])"
                    >
                      <v-icon>
                        {{ settings.__permission_based__.customization.messageInterval[0][permission.id] === null ? 'mdi-lock' : 'mdi-lock-open-variant' }}
                      </v-icon>
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
                      :label="translate('systems.points.settings.perMessageInterval')"
                      :value="getPermissionSettingsValue(permissions, permission.id, settings.__permission_based__.customization.perMessageInterval[0])"
                      :rules="[required, minValue(0)]"
                      :disabled="settings.__permission_based__.customization.perMessageInterval[0][permission.id] === null"
                      @input="settings.__permission_based__.customization.perMessageInterval[0][permission.id] = Number($event)"
                    />
                  </v-col>
                  <v-col
                    v-if="permission.id !== '0efd7b1c-e460-4167-8e06-8aaf2c170311'"
                    align-self="center"
                    cols="auto"
                  >
                    <v-btn
                      icon
                      @click="settings.__permission_based__.customization.perMessageInterval[0][permission.id] = togglePermissionLock(permissions, permission.id, settings.__permission_based__.customization.perMessageInterval[0])"
                    >
                      <v-icon>
                        {{ settings.__permission_based__.customization.perMessageInterval[0][permission.id] === null ? 'mdi-lock' : 'mdi-lock-open-variant' }}
                      </v-icon>
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
                      :label="translate('systems.points.settings.messageOfflineInterval')"
                      :value="getPermissionSettingsValue(permissions, permission.id, settings.__permission_based__.customization.messageOfflineInterval[0])"
                      :rules="[required, minValue(0)]"
                      :disabled="settings.__permission_based__.customization.messageOfflineInterval[0][permission.id] === null"
                      @input="settings.__permission_based__.customization.messageOfflineInterval[0][permission.id] = Number($event)"
                    />
                  </v-col>
                  <v-col
                    v-if="permission.id !== '0efd7b1c-e460-4167-8e06-8aaf2c170311'"
                    align-self="center"
                    cols="auto"
                  >
                    <v-btn
                      icon
                      @click="settings.__permission_based__.customization.messageOfflineInterval[0][permission.id] = togglePermissionLock(permissions, permission.id, settings.__permission_based__.customization.messageOfflineInterval[0])"
                    >
                      <v-icon>
                        {{ settings.__permission_based__.customization.messageOfflineInterval[0][permission.id] === null ? 'mdi-lock' : 'mdi-lock-open-variant' }}
                      </v-icon>
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
                      :label="translate('systems.points.settings.perMessageOfflineInterval')"
                      :value="getPermissionSettingsValue(permissions, permission.id, settings.__permission_based__.customization.perMessageOfflineInterval[0])"
                      :rules="[required, minValue(0)]"
                      :disabled="settings.__permission_based__.customization.perMessageOfflineInterval[0][permission.id] === null"
                      @input="settings.__permission_based__.customization.perMessageOfflineInterval[0][permission.id] = Number($event)"
                    />
                  </v-col>
                  <v-col
                    v-if="permission.id !== '0efd7b1c-e460-4167-8e06-8aaf2c170311'"
                    align-self="center"
                    cols="auto"
                  >
                    <v-btn
                      icon
                      @click="settings.__permission_based__.customization.perMessageOfflineInterval[0][permission.id] = togglePermissionLock(permissions, permission.id, settings.__permission_based__.customization.perMessageOfflineInterval[0])"
                    >
                      <v-icon>
                        {{ settings.__permission_based__.customization.perMessageOfflineInterval[0][permission.id] === null ? 'mdi-lock' : 'mdi-lock-open-variant' }}
                      </v-icon>
                    </v-btn>
                  </v-col>
                </v-row>
              </v-tab-item>
            </permission-tabs>
          </v-card-text>
        </v-card>
      </v-tab-item>
      <v-tab-item eager>
        <v-card>
          <v-card-text>
            <v-switch
              v-model="settings.reset.isPointResetIntervalEnabled[0]"
              :label="translate('systems.points.settings.isPointResetIntervalEnabled')"
              dense
              class="mt-0"
            />
            <revert-text-field
              v-model="settings.reset.resetIntervalCron"
              :label="translate('systems.points.settings.resetIntervalCron.name')"
              :hint="translate('systems.points.settings.resetIntervalCron.help')"
              :rules="[required]"
            />

            <v-simple-table dense>
              <template #default>
                <tbody>
                  <tr v-for="timestamp of cronIntervals" :key="timestamp">
                    <td>{{ new Date(timestamp).toUTCString() }}</td>
                  </tr>
                </tbody>
              </template>
            </v-simple-table>
            <v-alert v-if="cronError.length > 0" dense border="left" text color="error">
              {{ cronError }}
            </v-alert>
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
    const cronIntervals = ref([] as number[]);
    const cronError = ref('');

    watch(settings, () => {
      store.commit('settings/pending', true);
    }, { deep: true });

    watch(() => store.state.settings.save, (val) => {
      if (val && settings.value) {
        saveSettings('/systems/points', store, settings.value);
      }
    });

    watch(() => settings.value?.reset.resetIntervalCron, (val) => {
      if (val) {
        getSocket(`/systems/points`).emit('parseCron', val[0], (err, intervals) => {
          if (err) {
            cronIntervals.value = [];
            if (err instanceof Error) {
              cronError.value = err.stack || err.message;
            } else {
              cronError.value = err;
            }
          } else {
            cronError.value = '';
            cronIntervals.value = intervals;
          }
        });
      }
    }, { deep: true });

    watch(valid, (val) => {
      store.commit('settings/valid', val);
    }, { immediate: true });

    onMounted(() => {
      getSocket(`/systems/points`)
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
    });

    return {
      settings,
      ui,
      translate,
      valid,
      tab,
      cronIntervals,
      cronError,

      // functions
      getIgnoredPermissions,
      getPermissionSettingsValue,
      togglePermissionLock,

      // validators
      required,
      minValue,
      maxValue,
    };
  },
});
</script>
