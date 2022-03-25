<template>
  <loading v-if="!settings" />
  <v-form v-else v-model="valid" lazy-validation>
    <v-tabs v-model="tab">
      <v-tab>{{ translate('categories.general') }}</v-tab>
      <v-tab>{{ translate('categories.connection') }}</v-tab>
      <v-tab>{{ translate('categories.customization') }}</v-tab>
    </v-tabs>

    <v-tabs-items v-model="tab">
      <v-tab-item eager>
        <v-card>
          <v-card-text>
            <v-switch v-model="settings.songRequests[0]" class="mt-1" dense hide-details="auto"
              :label="translate('integrations.spotify.settings.songRequests')" />
            <v-switch v-model="settings.fetchCurrentSongWhenOffline[0]" dense hide-details="auto"
              :label="translate('integrations.spotify.settings.fetchCurrentSongWhenOffline.title')" persistent-hint
              :hint="translate('integrations.spotify.settings.fetchCurrentSongWhenOffline.help')" />
            <v-switch v-model="settings.queueWhenOffline[0]" dense hide-details="auto"
              :label="translate('integrations.spotify.settings.queueWhenOffline.title')" persistent-hint
              :hint="translate('integrations.spotify.settings.queueWhenOffline.help')" />
            <v-switch v-model="settings.notify[0]" dense hide-details="auto"
              :label="translate('integrations.spotify.settings.notify')" />
            <v-switch v-model="settings.allowApprovedArtistsOnly[0]" dense hide-details="auto"
              :label="translate('integrations.spotify.settings.allowApprovedArtistsOnly')" />
            <v-textarea class="mt-3 pt-3" outlined rows="5" persistent-hint
              :label="translate('integrations.spotify.settings.approvedArtists.title')"
              :hint="translate('integrations.spotify.settings.approvedArtists.help')"
              :value="settings.approvedArtists[0].filter(String).join('\n')"
              @input="settings.approvedArtists[0] = $event.split('\n').filter(String); $store.commit('settings/pending', true);"/>
          </v-card-text>
        </v-card>
      </v-tab-item>
      <v-tab-item eager>
        <v-card>
          <v-card-text>
            <v-text-field v-model="settings.connection.clientId" dense
              :label="translate('integrations.spotify.settings.clientId')" persistent-hint type="password" />
            <v-text-field v-model="settings.connection.clientSecret" dense
              :label="translate('integrations.spotify.settings.clientSecret')" persistent-hint type="password" />
            <v-revert-field v-model="settings.connection.redirectURI"
              :label="translate('integrations.spotify.settings.redirectURI')" persistent-hint />
            <v-row>
              <v-col>
                <v-text-field v-model="settings.connection.username[0]" dense disabled
                  :label="translate('integrations.spotify.settings.username')" />
              </v-col>
              <v-col cols="auto" align-self="center">
                <v-btn text color="success" v-if="settings.connection.username[0].length === 0" @click="authorize"
                  small>
                  {{ translate('integrations.spotify.settings.authorizeBtn') }}
                </v-btn>
                <v-btn text color="error" v-else @click="revoke" small>
                  {{ translate('integrations.spotify.settings.revokeBtn') }}
                </v-btn>
              </v-col>
            </v-row>

            <v-text-field v-model="settings.connection.manualDeviceId[0]" persistent-hint dense
              :disabled="settings.connection.username[0].length === 0"
              :label="translate('integrations.spotify.settings.manualDeviceId.title')"
              :hint="translate('integrations.spotify.settings.manualDeviceId.help')">
              <template #append-outer>
                <v-btn text small @click="setActive" :loading="gettingActive">Set current active device</v-btn>
              </template>
            </v-text-field>
          </v-card-text>
        </v-card>
      </v-tab-item>
      <v-tab-item eager>
        <v-card>
          <v-card-text>
            <v-revert-field v-model="settings.customization.format"
              :label="translate('integrations.spotify.settings.format.title')"
              :hint="translate('integrations.spotify.settings.format.help')" persistent-hint />
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
  components: { vRevertField: defineAsyncComponent(() => import('~/components/settings/modules/revert-text-field.vue')) },
  setup () {
    const settings = ref(null as Record<string, any> | null);
    const ui = ref(null as Record<string, any> | null);
    const store = useStore<any>();
    const valid = ref(true);
    const tab = ref(null);
    const gettingActive = ref(false);

    watch(settings, () => {
      store.commit('settings/pending', true);
    }, { deep: true });

    watch(() => store.state.settings.save, (val) => {
      if (val && settings.value) {
        saveSettings('/integrations/spotify', store, settings.value);
      }
    });

    watch(valid, (val) => {
      store.commit('settings/valid', val);
    }, { immediate: true });

    const authorize = () => {
      getSocket(`/integrations/spotify`)
        .emit('spotify::authorize', (err, op: any) => {
          if (err) {
            error(err);
          } else {
            window.location.href = op.opts[0];
          }
        });
    };
    const revoke = () => {
      getSocket(`/integrations/spotify`)
        .emit('spotify::revoke', (err) => {
          if (err) {
            error(err);
          } else if (settings.value) {
            settings.value.connection.username = ['', ''];
          }
        },
        );
    };

    const setActive = () => {
      gettingActive.value = true;
      getSocket(`/integrations/spotify`).emit('get.value', 'lastActiveDeviceId', (err: null | string, value: string) => {
        if (err) {
          error(err);
        } else if (settings.value) {
          settings.value.connection.manualDeviceId = [value, settings.value.connection.manualDeviceId[1]];
        }
        gettingActive.value = false;
      });
    };

    onMounted(() => {
      getSocket(`/integrations/spotify`)
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
      gettingActive,
      store,

      // functions
      authorize,
      revoke,
      setActive,

      // validators
      required,
      minValue,
    };
  },
});
</script>
