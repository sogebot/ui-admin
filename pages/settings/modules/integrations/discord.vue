<template>
  <loading v-if="!settings || isLoading"/>
  <v-form v-else v-model="valid" lazy-validation>
    <v-tabs v-model="tab">
      <v-tab>{{ translate('categories.general') }}</v-tab>
      <v-tab>{{ translate('categories.bot') }}</v-tab>
      <v-tab>{{ translate('categories.announcements') }}</v-tab>
      <v-tab>{{ translate('categories.mapping') }}</v-tab>
      <v-tab>{{ translate('categories.status') }}</v-tab>
    </v-tabs>

    <v-tabs-items v-model="tab">
      <v-tab-item eager>
        <v-card>
          <v-card-text>
            <v-text-field
              v-model="settings.general.clientId[0]"
              type="password"
              dense
              :label="translate('integrations.discord.settings.clientId')"
            />
            <v-text-field
              v-model="settings.general.token[0]"
              type="password"
              dense
              :label="translate('integrations.discord.settings.token')"
            />
            <v-btn
              :disabled="settings.general.clientId[0].length === 0 || settings.general.token[0].length === 0"
              @click="authorize "
            >
              {{ translate('integrations.discord.settings.joinToServerBtn') }}
            </v-btn>
          </v-card-text>
        </v-card>
      </v-tab-item>
      <v-tab-item eager>
        <v-card>
          <v-card-text>
            <v-autocomplete
              v-model="settings.bot.guild[0]"
              hide-selected
              :items="guilds"
              :label="translate('integrations.discord.settings.guild')"
            >
              <template #selection="data">
                <div v-html="data.item.text" />
              </template>
              <template #item="data">
                <div v-html="data.item.text" />
              </template>
            </v-autocomplete>

            <v-autocomplete
              v-model="settings.bot.listenAtChannels[0]"
              hide-selected
              :items="channels"
              multiple
              :label="translate('integrations.discord.settings.listenAtChannels')"
            >
              <template #selection="data">
                <div v-html="data.item.text" />
                <template
                  v-if="settings.bot.listenAtChannels[0].filter(Boolean).length > data.index + 1"
                >
                  ,&nbsp;
                </template>
              </template>
              <template #item="data">
                <div v-html="data.item.text" />
              </template>
            </v-autocomplete>

            <v-switch
              v-model="settings.bot.deleteMessagesAfterWhile[0]"
              class="mt-0"
              dense
              :label="translate('integrations.discord.settings.deleteMessagesAfterWhile')"
            />

            <v-textarea
              class="mt-3 pt-3"
              outlined
              rows="5"
              persistent-hint
              :label="translate('integrations.discord.settings.ignorelist.title')"
              :hint="translate('one-record-per-line') + '. ' + translate('integrations.discord.settings.ignorelist.help')"
              :value="settings.bot.ignorelist[0].filter(String).join('\n')"
              @input="settings.bot.ignorelist[0] = $event.split('\n').filter(String); $store.commit('settings/pending', true);"
            />
          </v-card-text>
        </v-card>
      </v-tab-item>
      <v-tab-item eager>
        <v-card>
          <v-card-text>
            <v-row>
              <v-col>
                <v-autocomplete
                  v-model="settings.bot.sendOnlineAnnounceToChannel[0]"
                  hide-selected
                  :items="channels"
                  dense
                  :label="translate('integrations.discord.settings.sendOnlineAnnounceToChannel')"
                >
                  <template #selection="data">
                    <div v-html="data.item.text" />
                  </template>
                  <template #item="data">
                    <div v-html="data.item.text" />
                  </template>
                </v-autocomplete>
              </v-col>
              <v-col>
                <v-text-field dense v-model="settings.bot.onlineAnnounceMessage[0]" :label="translate('integrations.discord.settings.onlineAnnounceMessage')" />
              </v-col>
            </v-row>

            <label class="v-label theme--dark">
              {{ translate('systems.userinfo.settings.order') }}
            </label>
            <v-simple-table dense class="pb-4">
              <template #default>
                <tbody>
                  <tr v-for="(item , idx) of settings.bot.fields[0]" :key="item">
                    <td>
                      <v-icon v-if="idx !== 0" @click.stop="swapOrder(idx, idx - 1)">
                        mdi-chevron-up
                      </v-icon>
                      <v-icon v-if="idx !== settings.bot.fields[0].length - 1" @click.stop="swapOrder(idx, idx + 1)">
                        mdi-chevron-down
                      </v-icon>
                    </td>
                    <td>{{ item }}</td>
                    <td>
                      <v-icon @click="toggleVisibility(item)">
                        {{ settings.bot.fieldsDisabled[0].includes(item) ? 'mdi-eye-off' : 'mdi-eye' }}
                      </v-icon>
                    </td>
                  </tr>
                </tbody>
              </template>
            </v-simple-table>

            <v-autocomplete
              v-for="key of Object.keys(settings.bot.sendAnnouncesToChannel[0])"
              :key="key"
              v-model="settings.bot.sendAnnouncesToChannel[0][key]"
              hide-selected
              dense
              :items="channels"
              :label="key"
            >
              <template #selection="data">
                <div v-html="data.item.text" />
              </template>
              <template #item="data">
                <div v-html="data.item.text" />
              </template>
            </v-autocomplete>
          </v-card-text>
        </v-card>
      </v-tab-item>
      <v-tab-item eager>
        <v-card>
          <v-card-text>
            <v-autocomplete
              v-for="p of permissions"
              :key="p.id"
              v-model="settings.mapping.rolesMapping[0][p.id]"
              hide-selected
              dense
              :items="roles"
              :label="p.name"
            >
              <template #selection="data">
                <div v-html="data.item.text" />
              </template>
              <template #item="data">
                <div v-html="data.item.text" />
              </template>
            </v-autocomplete>
          </v-card-text>
        </v-card>
      </v-tab-item>
      <v-tab-item eager>
        <v-card>
          <v-card-text>
            <v-select
              v-model="settings.status.onlinePresenceStatusDefault[0]"
              dense
              :items="['online', 'idle', 'invisible', 'dnd']"
              :label="translate('integrations.discord.settings.onlinePresenceStatusDefault')"
            />
            <settings-modules-revert-text-field
              v-model="settings.status.onlinePresenceStatusDefaultName"
              :label="translate('integrations.discord.settings.onlinePresenceStatusDefaultName')"
            />
            <v-select
              v-model="settings.status.onlinePresenceStatusOnStream[0]"
              dense
              :items="['streaming', 'online', 'idle', 'invisible', 'dnd']"
              :label="translate('integrations.discord.settings.onlinePresenceStatusOnStream')"
            />
            <settings-modules-revert-text-field
              v-model="settings.status.onlinePresenceStatusOnStreamName"
              :label="translate('integrations.discord.settings.onlinePresenceStatusOnStreamName')"
            />
          </v-card-text>
        </v-card>
      </v-tab-item>
    </v-tabs-items>
  </v-form>
</template>

<script setup lang="ts">
import { PermissionsInterface } from '@entity/permissions';
import { getSocket } from '@sogebot/ui-helpers/socket';
import translate from '@sogebot/ui-helpers/translate';
import gql from 'graphql-tag';
import xor from 'lodash/xor';
import { error } from '~/functions/error';
import { saveSettings } from '~/functions/settings';

type Guild = { text: string, value: string };
type Channel = { text: string, value: string };

const { $graphql, $store } = useNuxtApp();

const isLoading = ref(true);
const permissions = ref([] as PermissionsInterface[]);
const refetch = async () => {
  const data = await $graphql.default.request(gql`
      query {
        permissions { id name }
      }
    `);

  permissions.value = data.permissions;
  isLoading.value = false;
};
const settings = ref(null as Record<string, any> | null);
const ui = ref(null as Record<string, any> | null);
const valid = ref(true);
const tab = ref(null);

const guilds = ref([] as Guild[]);
const channels = ref([] as Channel[]);
const roles = ref([] as Guild[]);

watch(settings, () => {
  $store.commit('settings/pending', true);
}, { deep: true });

watch(() => $store.state.settings.save, (val) => {
  if (val && settings.value) {
    saveSettings('/integrations/discord', $store, settings.value);
  }
});

watch(valid, (val) => {
  $store.commit('settings/valid', val);
}, { immediate: true });

onMounted(() => {
  refetch();
  getSocket(`/integrations/discord`)
    .emit('settings', (err, _settings, _ui) => {
      if (err) {
        error(err);
        return;
      }
      ui.value = _ui;
      _settings.bot.listenAtChannels = [
        !Array.isArray(_settings.bot.listenAtChannels[0]) ? [_settings.bot.listenAtChannels[0]] : _settings.bot.listenAtChannels[0],
        !Array.isArray(_settings.bot.listenAtChannels[1]) ? [_settings.bot.listenAtChannels[1]] : _settings.bot.listenAtChannels[1],
      ];

      console.log({ _settings });
      settings.value = _settings;
      nextTick(() => { $store.commit('settings/pending', false); });

      getSocket(`/integrations/discord`).emit('discord::getGuilds', (err2, guilds2: Guild[]) => {
        console.groupCollapsed('discord::getGuilds');
        console.log({ guilds2 });
        console.groupEnd();

        if (!settings.value || err2) {
          return;
        }

        if (!guilds2.find((o: any) => String(o.value) === String(settings.value?.bot.guild[0]))) {
          settings.value.bot.guild = ['', settings.value.bot.guild[1]];
        }
        guilds.value = [{ value: '', text: `-- ${translate('integrations.discord.settings.noGuildSelected')} --` }, ...guilds2];
      });
      getSocket(`/integrations/discord`).emit('discord::getRoles', (err2, roles2: Guild[]) => {
        if (err2) {
          return;
        }
        console.groupCollapsed('discord::getRoles');
        console.log({ roles2 });
        console.groupEnd();
        roles.value = roles2;
      });
      getSocket(`/integrations/discord`).emit('discord::getChannels', (err2, channels2: Channel[]) => {
        console.groupCollapsed('discord::getChannels');
        console.log({ channels2 });
        console.groupEnd();

        if (!settings.value || err2) {
          return;
        }

        if (!channels2.find((o: any) => String(o.value) === String(settings.value?.bot.guild[0]))) {
          settings.value.bot.listenAtChannels = [
            [''],
            !Array.isArray(settings.value.bot.listenAtChannels[1]) ? [settings.value.bot.listenAtChannels[1]] : settings.value.bot.listenAtChannels[1]];
        }
        settings.value.bot.listenAtChannels = [settings.value.bot.listenAtChannels[0].filter(Boolean), settings.value.bot.listenAtChannels[1]];
        channels.value = channels2;
      });
    });
});
const swapOrder = (order1: number, order2: number) => {
  if (settings.value) {
    const item1 = settings.value.bot.fields[0][order1];
    const item2 = settings.value.bot.fields[0][order2];
    if (item1 && item2) {
      settings.value.bot.fields[0][order1] = item2;
      settings.value.bot.fields[0][order2] = item1;
      settings.value.bot.fields = [settings.value.bot.fields[0], settings.value.bot.fields[1]];
    }
  }
};
const toggleVisibility = (item: string) => {
  if (settings.value) {
    settings.value.bot.fieldsDisabled = [xor(settings.value.bot.fieldsDisabled[0], [item]), settings.value.bot.fieldsDisabled[1]];
  }
};

const authorize = () => {
  getSocket('/integrations/discord').emit('discord::authorize', (err, op: any) => {
    if (err) {
      error(err);
    } else {
      window.location.href = op.opts[0];
    }
  });
};
</script>
