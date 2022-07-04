<template>
  <v-card :loading="loading" class="fill-height">
    <portal to="navbar">
      <v-btn
        small
        :text="!$vuetify.breakpoint.xs"
        :icon="$vuetify.breakpoint.xs"
        :loading="saving"
        :disabled="!valid1 || loading"
        @click="save"
      >
        <v-icon class="d-flex d-sm-none">
          mdi-floppy
        </v-icon>
        <span class="d-none d-sm-flex">{{ translate('dialog.buttons.saveChanges.idle') }}</span>
      </v-btn>
    </portal>

    <v-fade-transition>
      <v-container v-if="!loading" fluid>
        <v-form ref="form1" v-model="valid1" lazy-validation>
          <v-text-field
            v-model="item.name"
            :label="translate('name')"
          />
          <v-select
            v-model="item.value"
            :label="translate('type')"
            :items="overlayOptions"
          />
          <component
            :is="item.value"
            v-if="haveAnyOptions(item.value || '')"
            :id="item.id"
            v-model="item.opts"
            @update="item.opts = $event;"
          />
        </v-form>
      </v-container>
    </v-fade-transition>

    <v-overlay v-if="loading">
      <v-row>
        <v-col class="text-center">
          <v-progress-circular indeterminate size="48" />
        </v-col>
      </v-row>
    </v-overlay>
  </v-card>
</template>

<script lang="ts">
import type { OverlayMappers } from '@entity/overlay';
import { getSocket } from '@sogebot/ui-helpers/socket';
import translate from '@sogebot/ui-helpers/translate';
import { cloneDeep } from 'lodash';

import { EventBus } from '../../../functions/event-bus';

import { error } from '~/functions/error';
import { required } from '~/functions/validators';

export const haveAnyOptions = (type: string) => {
  const withOpts = [
    'goalRegistry', 'alertsRegistry', 'textRegistry', 'group', 'eventlist',
    'media', 'credits', 'clips', 'obswebsocket', 'clipscarousel', 'tts',
    'polls', 'emotescombo', 'emotesfireworks', 'emotesexplode', 'emotes',
    'countdown', 'stopwatch', 'marathon', 'wordcloud', 'reference', 'chat', 'url'];
  return withOpts.includes(type);
};

export default defineComponent({
  components: {
    chat:            () => import('~/components/registry/overlays/chat.vue'),
    media:           () => import('~/components/registry/overlays/media.vue'),
    countdown:       () => import('~/components/registry/overlays/countdown.vue'),
    stopwatch:       () => import('~/components/registry/overlays/stopwatch.vue'),
    marathon:        () => import('~/components/registry/overlays/marathon.vue'),
    emotes:          () => import('~/components/registry/overlays/emotes.vue'),
    emotesexplode:   () => import('~/components/registry/overlays/emotesexplode.vue'),
    emotesfireworks: () => import('~/components/registry/overlays/emotesfireworks.vue'),
    emotescombo:     () => import('~/components/registry/overlays/emotescombo.vue'),
    clipscarousel:   () => import('~/components/registry/overlays/clipscarousel.vue'),
    clips:           () => import('~/components/registry/overlays/clips.vue'),
    credits:         () => import('~/components/registry/overlays/credits.vue'),
    obswebsocket:    () => import('~/components/registry/overlays/obswebsocket.vue'),
    tts:             () => import('~/components/registry/overlays/tts.vue'),
    polls:           () => import('~/components/registry/overlays/polls.vue'),
    eventlist:       () => import('~/components/registry/overlays/eventlist.vue'),
    group:           () => import('~/components/registry/overlays/group.vue'),
    wordcloud:       () => import('~/components/registry/overlays/wordcloud.vue'),
  },
  setup () {
    const { $store } = useNuxtApp();
    const route = useRoute();

    const loading = ref(true);
    const saving = ref(false);

    const item = ref(cloneDeep({
      id:      route.params.id,
      name:    '',
      value:   null,
      groupId: null,
      opts:    null,
    }) as OverlayMappers);

    const form1 = ref(null);
    const valid1 = ref(true);

    const overlayOptions = [
      { value: null, text: 'Please select an option' },
      { value: 'group', text: 'group of overlays' },
      { value: 'chat', text: 'chat' },
      { value: 'media', text: 'media' },
      { value: 'bets', text: 'bets' },
      { value: 'carousel', text: 'carousel' },
      { value: 'countdown', text: 'countdown' },
      { value: 'clips', text: 'clips' },
      { value: 'clipscarousel', text: 'clipscarousel' },
      { value: 'credits', text: 'credits' },
      { value: 'emotes', text: 'emotes' },
      { value: 'emotescombo', text: 'emotescombo' },
      { value: 'emotesfireworks', text: 'emotesfireworks' },
      { value: 'emotesexplode', text: 'emotesexplode' },
      { value: 'eventlist', text: 'eventlist' },
      { value: 'marathon', text: 'marathon' },
      { value: 'obswebsocket', text: 'obswebsocket' },
      { value: 'polls', text: 'polls' },
      { value: 'randomizer', text: 'randomizer' },
      { value: 'stats', text: 'stats' },
      { value: 'wordcloud', text: 'wordcloud' },
      { value: 'stopwatch', text: 'stopwatch' },
      { value: 'tts', text: 'tts' },
      { value: 'hypetrain', text: 'hypetrain' },
    ];

    watch(item, () => {
      $store.commit('settings/pending', true);
    }, { deep: true });

    onMounted(() => {
      $store.commit('panel/back', '/registry/overlays');
      getSocket('/registries/overlays').emit('generic::getOne', route.params.id, (err, result) => {
        if (err) {
          return error(err);
        }
        if (result) {
          item.value = result;
        }

        loading.value = false;
      });
    });

    const save = () => {
      if ((form1.value as unknown as HTMLFormElement).validate()) {
        EventBus.$emit(`save::${item.value.id}`);

        getSocket('/registries/overlays').emit('generic::save', item.value, (err) => {
          if (err) {
            return error(err);
          }
          EventBus.$emit('snack', 'success', 'Data saved.');
          $store.commit('settings/pending', false);
        });
      }
    };

    return {
      // refs
      saving,
      loading,
      form1,
      valid1,
      item,
      overlayOptions,

      // rules
      required,

      // functions
      save,
      haveAnyOptions,

      // others
      translate,
    };
  },
});
</script>
