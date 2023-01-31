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
          <group
            :id="item.id"
            v-model="item"
            @update="item = $event;"
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
import { Overlay } from '@sogebot/backend/dest/database/entity/overlay';
import { getSocket } from '@sogebot/ui-helpers/socket';
import translate from '@sogebot/ui-helpers/translate';

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
  components: { group: () => import('~/components/registry/overlays/group.vue') },
  setup () {
    const { $store } = useNuxtApp();
    const route = useRoute();

    const loading = ref(true);
    const saving = ref(false);

    const item = ref(new Overlay({
      id:     route.params.id,
      name:   '',
      canvas: {
        height: 1080,
        width:  1920,
      },
      items: [],
    }));

    const form1 = ref(null);
    const valid1 = ref(true);

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
