<template>
  <v-card :loading="isLoading" class="fill-height">
    <portal to="navbar">
      <v-btn
        small
        :text="!$vuetify.breakpoint.xs"
        :icon="$vuetify.breakpoint.xs"
        :loading="isSaving"
        :disabled="!valid1 || isLoading"
        @click="save"
      >
        <v-icon class="d-flex d-sm-none">
          {{ mdiFloppy }}
        </v-icon>
        <span class="d-none d-sm-flex">{{ translate('dialog.buttons.saveChanges.idle') }}</span>
      </v-btn>
    </portal>

    <v-fade-transition>
      <v-container v-if="!isLoading" fluid>
        <v-form ref="form1" v-model="valid1" lazy-validation>
          <v-select
            v-model="item.value"
            :label="translate('type')"
            :items="overlayOptions"
          />
          <component
            :is="item.value"
            v-if="haveAnyOptions(item.value)"
            v-model="item.opts"
            @update="item.opts = $event;"
          />
        </v-form>
      </v-container>
    </v-fade-transition>

    <v-overlay v-if="isLoading">
      <v-row>
        <v-col class="text-center">
          <v-progress-circular indeterminate size="48" />
        </v-col>
      </v-row>
    </v-overlay>
  </v-card>
</template>

<script lang="ts">
import { mdiFloppy } from '@mdi/js';
import {
  defineComponent, onMounted, ref, useContext, useRoute, useStore, watch,
} from '@nuxtjs/composition-api';
import translate from '@sogebot/ui-helpers/translate';
import { cloneDeep } from 'lodash';

import type { OverlayMappers } from '~/.bot/src/database/entity/overlay';
import api from '~/functions/api';
import { error } from '~/functions/error';
import { EventBus } from '~/functions/event-bus';
import { required } from '~/functions/validators';

export const haveAnyOptions = (type: string) => {
  const withOpts = ['goalRegistry', 'alertsRegistry', 'textRegistry', 'group', 'eventlist', 'alerts', 'credits', 'clips', 'obswebsocket', 'clipscarousel', 'tts', 'polls', 'emotescombo', 'emotesfireworks', 'emotesexplode', 'emotes'];
  return withOpts.includes(type);
};

export default defineComponent({
  components: {
    alerts:          () => import('~/components/registry/overlays/alerts.vue'),
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
  },
  setup () {
    const store = useStore();
    const { $axios } = useContext();
    const route = useRoute();

    const form1 = ref(null);
    const valid1 = ref(true);

    const isSaving = ref(false);
    const isNew = ref(false);
    const isLoading = ref(true);

    const overlayOptions = [
      { value: null, text: 'Please select an option' },
      { value: 'group', text: 'group of overlays' },
      { value: 'alerts', text: 'alerts' },
      { value: 'bets', text: 'bets' },
      { value: 'carousel', text: 'carousel' },
      { value: 'clips', text: 'clips' },
      { value: 'clipscarousel', text: 'clipscarousel' },
      { value: 'credits', text: 'credits' },
      { value: 'emotes', text: 'emotes' },
      { value: 'emotescombo', text: 'emotescombo' },
      { value: 'emotesfireworks', text: 'emotesfireworks' },
      { value: 'emotesexplode', text: 'emotesexplode' },
      { value: 'eventlist', text: 'eventlist' },
      { value: 'obswebsocket', text: 'obswebsocket' },
      { value: 'polls', text: 'polls' },
      { value: 'randomizer', text: 'randomizer' },
      { value: 'stats', text: 'stats' },
      { value: 'tts', text: 'tts' },
      { value: 'hypetrain', text: 'hypetrain' },
    ];

    const item = ref(cloneDeep({
      id:    route.value.params.id,
      value: null,
      opts:  null,
    }) as OverlayMappers);

    onMounted(() => {
      store.commit('panel/back', '/registry/overlays');
      if (route.value.params.id) {
        // load initial item
        isLoading.value = true;
        api.getOne<OverlayMappers>($axios, `/api/v1/overlay`, item.value.id)
          .then((response) => {
            item.value = cloneDeep(response.data);
            isLoading.value = false;
            store.commit('settings/pending', false);
          })
          .catch(() => {
            console.debug('Overlay not found, assuming new creation of overlay');
            isLoading.value = false;
            isNew.value = true;
          }).finally(() => {
            watch(item, () => {
              store.commit('settings/pending', true);
            }, { deep: true });
          });
      }
    });

    const save = () => {
      if (
        (form1.value as unknown as HTMLFormElement).validate()
      ) {
        isSaving.value = true;
        if (!isNew.value) {
          api.patch<OverlayMappers>($axios, `/api/v1/overlay/${item.value.id}`, item.value)
            .then(() => {
              EventBus.$emit('snack', 'success', 'Data saved.');
            })
            .catch((e) => {
              console.error(e.response.data);
              error(JSON.stringify(e.response.data));
            })
            .finally(() => {
              isSaving.value = false;
              store.commit('settings/pending', false);
            });
        } else {
          api.post<OverlayMappers>($axios, '/api/v1/overlay', item.value)
            .then(() => {
              EventBus.$emit('snack', 'success', 'Data saved.');
              isNew.value = false;
            })
            .catch((e) => {
              console.error(e.response.data);
              error(JSON.stringify(e.response.data));
            })
            .finally(() => {
              isSaving.value = false;
              store.commit('settings/pending', false);
            });
        }
      }
    };

    return {
      // refs
      isSaving,
      isLoading,
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

      // icons
      mdiFloppy,
    };
  },
});
</script>
