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
            <v-switch class="mt-0" :label="translate('systems.songs.settings.songrequest')" dense
              v-model="settings.songrequest[0]" />
            <v-switch class="mt-0" :label="translate('systems.songs.settings.playlist')" dense
              v-model="settings.playlist[0]" />
            <v-switch class="mt-0" :label="translate('systems.songs.settings.notify')" dense
              v-model="settings.notify[0]" />
            <v-switch class="mt-0" :label="translate('systems.songs.settings.shuffle')" dense
              v-model="settings.shuffle[0]" />
            <v-switch class="mt-0" :label="translate('systems.songs.settings.onlyMusicCategory')" dense
              v-model="settings.onlyMusicCategory[0]" />
            <v-switch class="mt-0" :label="translate('systems.songs.settings.allowRequestsOnlyFromPlaylist')" dense
              v-model="settings.allowRequestsOnlyFromPlaylist[0]" />
            <v-switch class="mt-0 pb-4" :label="translate('systems.songs.settings.calculateVolumeByLoudness')" dense
              v-model="settings.calculateVolumeByLoudness[0]" />
            <revert-text-field class="pt-3" v-model="settings.volume" type="number" min="0"
              :label="translate('systems.songs.settings.volume')" :rules="[required, minValue(0), maxValue(100)]" />
            <revert-text-field class="pt-3" v-model="settings.duration" type="number" min="0"
              :label="translate('systems.songs.settings.duration.title')" :rules="[required, minValue(0)]">
              <template #append>{{ translate('systems.songs.settings.duration.help') }}</template>
            </revert-text-field>
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
        saveSettings('/systems/songs', store, settings.value);
      }
    });

    watch(valid, (val) => {
      store.commit('settings/valid', val);
    }, {
      immediate: true,
    });

    onMounted(() => {
      getSocket(`/systems/songs`)
        .emit('settings', (err, _settings, _ui) => {
          if (err) {
            error(err);
            return;
          }
          ui.value = _ui;
          console.log({
            _settings,
          });
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
    };
  },
});
</script>
