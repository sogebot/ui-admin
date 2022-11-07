<template>
  <v-card>
    <v-card-text>
      <v-switch class="mt-0" v-model="_settings.general.createMarkerOnEvent[0]" dense
        :label="translate('core.twitch.settings.createMarkerOnEvent')" />
      <v-switch class="mt-0" v-model="_settings.general.isTitleForced[0]" dense
        :label="translate('core.twitch.settings.isTitleForced')" />
      <v-switch class="mt-0" v-model="_settings.chat.sendWithMe[0]" dense
        :label="translate('core.tmi.settings.sendWithMe')" />
      <v-switch class="mt-0" v-model="_settings.chat.mute[0]" dense :label="translate('core.tmi.settings.mute')" />
      <v-switch class="mt-0" v-model="_settings.chat.whisperListener[0]" dense
        :label="translate('core.tmi.settings.whisperListener')" />
      <v-switch class="mt-0" v-model="_settings.chat.showWithAt[0]" dense
        :label="translate('core.tmi.settings.showWithAt')" />
      <v-switch class="mt-0" v-model="_settings.chat.sendAsReply[0]" dense
        :label="translate('core.tmi.settings.sendAsReply')" />
      <v-textarea class="mt-3 pt-3" outlined rows="5" persistent-hint :label="translate('core.tmi.settings.ignorelist')"
        :value="_settings.chat.ignorelist[0].filter(String).join('\n')" :hint="translate('one-record-per-line')"
        @input="_settings.chat.ignorelist[0] = $event.split('\n').filter(String); $store.commit('settings/pending', true);" />
    </v-card-text>
  </v-card>
</template>

<script lang="ts">
import translate from '@sogebot/ui-helpers/translate';
import {
  defineComponent, onMounted, ref, watch,
} from '@vue/composition-api';

import { minValue, required } from '~/functions/validators';

type Props = {
  settings: Record<string, any>,
};

export default defineComponent({
  props: { settings: Object },
  setup (props: Props, ctx) {
    const _settings = ref(props.settings);
    watch(_settings, (val) => {
      ctx.emit('input', val);
    }, { deep: true });

    const globalIgnoreList = ref({} as {
      [x: string]: {
        reason: string,
        // eslint-disable-next-line camelcase
        known_aliases: string[],
      }
    });
    const customFilter = (item: string, queryText: string) => {
      const aliases = globalIgnoreList.value[item].known_aliases;
      return item.includes(queryText) || aliases.find(o => o.includes(queryText));
    };

    onMounted(() => {
      fetch((process.env.isNuxtDev ? 'http://localhost:20000/' : '/') + 'assets/globalIgnoreList.json')
        .then(response => response.json())
        .then((data) => {
          globalIgnoreList.value = data;
        });
    });

    return {
      _settings,
      translate,
      globalIgnoreList,
      customFilter,

      // validators
      required,
      minValue,
    };
  },
});
</script>
