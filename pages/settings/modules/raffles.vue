<template>
  <loading v-if="!settings" />
  <v-card v-else flat style="min-height: 100%;">
    <v-card-text>
      <v-form ref="form" v-model="valid">
        <template>
          <v-card-title class="pt-0 pb-0">{{ translate('categories.general') }}</v-card-title>
          <v-checkbox
            :label="translate('systems.raffles.settings.allowOverTicketing.title')"
            :hint="translate('systems.raffles.settings.allowOverTicketing.help')"
            persistent-hint
            v-model="settings.allowOverTicketing[0]"
            class="pb-4"
          />

          <revert-text-field
            class="pt-3"
            v-model="settings.raffleAnnounceInterval"
            type="number"
            min="0"
            :label="translate('systems.raffles.settings.raffleAnnounceInterval.title')"
            :rules="[required, minValue(0)]"
          >
            <template #append>{{ translate('systems.raffles.settings.raffleAnnounceInterval.help') }}</template>
          </revert-text-field>

          <revert-text-field
            class="pt-3"
            v-model="settings.raffleAnnounceMessageInterval"
            type="number"
            min="0"
            :label="translate('systems.raffles.settings.raffleAnnounceMessageInterval.title')"
            :hint="translate('systems.raffles.settings.raffleAnnounceMessageInterval.help')"
            :rules="[required, minValue(0)]"
          />
        </template>

        <template>
          <v-card-title class="pt-0 pb-0">{{ translate('categories.join') }}</v-card-title>
          <v-checkbox
            :label="translate('systems.raffles.settings.deleteRaffleJoinCommands.title')"
            :hint="translate('systems.raffles.settings.deleteRaffleJoinCommands.help')"
            persistent-hint
            v-model="settings.join.deleteRaffleJoinCommands[0]"
          />
          <v-checkbox
            :label="translate('systems.raffles.settings.announceNewEntries.title')"
            :hint="translate('systems.raffles.settings.announceNewEntries.help')"
            persistent-hint
            v-model="settings.join.announceNewEntries[0]"
            class="pb-4"
          />
          <revert-text-field
            class="pt-3"
            v-model="settings.join.announceNewEntriesBatchTime"
            type="number"
            min="0"
            :label="translate('systems.raffles.settings.announceNewEntriesBatchTime.title')"
            :hint="translate('systems.raffles.settings.announceNewEntriesBatchTime.help')"
            :rules="[required, minValue(0)]"
          />
        </template>

        <template>
          <v-card-title class="pt-0">{{ translate('categories.luck') }}</v-card-title>
          <revert-text-field
            class="pt-3"
            v-model="settings.luck.subscribersPercent"
            type="number"
            min="0"
            :label="translate('systems.raffles.settings.subscribersPercent.title')"
            :rules="[required, minValue(0)]"
          >
            <template #append>{{ translate('systems.raffles.settings.subscribersPercent.help') }}</template>
          </revert-text-field>
          <revert-text-field
            class="pt-3"
            v-model="settings.luck.followersPercent"
            type="number"
            min="0"
            :label="translate('systems.raffles.settings.followersPercent.title')"
            :rules="[required, minValue(0)]"
          >
            <template #append>{{ translate('systems.raffles.settings.followersPercent.help') }}</template>
          </revert-text-field>
        </template>
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
import {
  maxValue, minValue, required,
} from '~/functions/validators';

export default defineComponent({
  components: { revertTextField: defineAsyncComponent(() => import('~/components/settings/modules/revert-text-field.vue')) },
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
        saveSettings('/systems/raffles', store, settings.value);
      }
    });

    watch(valid, (val) => {
      store.commit('settings/valid', val);
    }, { immediate: true });

    onMounted(() => {
      getSocket(`/systems/raffles`)
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
      form,

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
