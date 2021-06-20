<template>
  <loading v-if="!settings" />
  <v-card flat v-else>
    <v-card-title>{{ translate('categories.general') }}</v-card-title>
    <v-card-text>
      <v-select
        v-model="settings.general.lang[0]"
        :items="ui.general.lang.values"
        :label="translate('core.general.settings.lang')"
        @input="$store.commit('settings/pending', true)"
      >
        <template v-if="settings.general.lang[0] !== settings.general.lang[1]" #append-outer>
          <v-btn text @click.stop="settings.general.lang = [settings.general.lang[1], settings.general.lang[1]]">
            Revert
          </v-btn>
        </template>
      </v-select>
    </v-card-text>
    <v-card-title>{{ translate('categories.graceful_exit') }}</v-card-title>
    <v-card-text>
      <v-select
        v-model="settings.general.lang[0]"
        :items="ui.general.lang.values"
        :label="translate('core.general.settings.lang')"
        @input="$store.commit('settings/pending', true)"
      >
        <template v-if="settings.general.lang[0] !== settings.general.lang[1]" #append-outer>
          <v-btn text @click.stop="settings.general.lang = [settings.general.lang[1], settings.general.lang[1]]">
            Revert
          </v-btn>
        </template>
      </v-select>
    </v-card-text>
  </v-card>
</template>

<script lang="ts">
import { useStore } from '@nuxtjs/composition-api';
import { getSocket } from '@sogebot/ui-helpers/socket';
import translate from '@sogebot/ui-helpers/translate';
import {
  defineComponent, onMounted, ref, watch,
} from '@vue/composition-api';
import { cloneDeep } from 'lodash';

import { error } from '~/functions/error';
import { flatten, unflatten } from '~/functions/flatten';

export default defineComponent({
  beforeRouteLeave (_to, _from, next) {
    if (this.$store.state.settings.pending) {
      const isOK = confirm('You will lose your pending changes. Do you want to continue?');
      if (!isOK) {
        return next(false);
      }
    }
    this.$store.commit('settings/pending', false);
    next();
  },
  setup () {
    const settings = ref(null as Record<string, any> | null);
    const ui = ref(null as Record<string, any> | null);
    const store = useStore<any>();

    watch(() => store.state.settings.save, (val) => {
      if (val && settings.value) {
        let clonedSettings = cloneDeep(settings.value);

        if (clonedSettings.settings) {
          for (const [name, value] of Object.entries(clonedSettings.settings)) {
            delete clonedSettings.settings[name];
            clonedSettings[name] = value;
          }
          delete clonedSettings.settings;
        }

        // flat variables - getting rid of category
        clonedSettings = flatten(clonedSettings);
        for (const key of Object.keys(clonedSettings)) {
          if (key.includes('__permission_based__') || key.includes('commands') || key.includes('_permission')) {
            continue;
          }

          const value = clonedSettings[key];
          const keyWithoutCategory = key.replace(/([\w]*\.)/, '');
          delete clonedSettings[key];
          console.debug(`FROM: ${key}`);
          console.debug(`TO:   ${keyWithoutCategory}`);
          clonedSettings[keyWithoutCategory] = value;
        }
        clonedSettings = unflatten(clonedSettings);

        // flat permission based variables - getting rid of category
        if (clonedSettings.__permission_based__) {
          clonedSettings.__permission_based__ = flatten(clonedSettings.__permission_based__);
          for (const key of Object.keys(clonedSettings.__permission_based__)) {
            const match = key.match(/\./g);
            if (match && match.length > 1) {
              const value = clonedSettings.__permission_based__[key];
              delete clonedSettings.__permission_based__[key];
              const keyWithoutCategory = key.replace(/([\w]*\.)/, '');
              console.debug(`FROM: ${key}`);
              console.debug(`TO:   ${keyWithoutCategory}`);
              clonedSettings.__permission_based__[keyWithoutCategory] = value;
            }
          }
          clonedSettings.__permission_based__ = unflatten(clonedSettings.__permission_based__);
        }

        for (const key of Object.keys(clonedSettings)) {
          clonedSettings[key] = Array.isArray(clonedSettings[key])
            ? clonedSettings[key][0] // select current values
            : clonedSettings[key];
        }

        getSocket(`/core/general`).emit('settings.update', clonedSettings, (err: string | null) => {
          store.commit('settings/save', false);
          store.commit('settings/pending', false);
          if (err) {
            return error(err);
          }
        });
      }
    });

    onMounted(() => {
      getSocket(`/core/general`)
        .emit('settings', (err: string | null, _settings: { [x: string]: any }, _ui: { [x: string]: { [attr: string]: any } }) => {
          if (err) {
            error(err);
            return;
          }
          ui.value = _ui;
          settings.value = _settings;
        });
    });

    return {
      settings,
      ui,
      translate,
    };
  },
});
</script>
