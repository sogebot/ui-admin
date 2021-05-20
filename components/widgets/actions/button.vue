<template>
  <v-card
    :color="item.options.color"
    elevation="2"
    width="100%"
    @click="!editing ? () => {} : null"
  >
    <v-card-text class="text-button pa-1 mb-1 text-center" style="font-size: 12px !important;">
      <v-row no-gutters>
        <v-slide-x-transition>
          <v-col v-if="editing" cols="auto" class="d-flex">
            <v-simple-checkbox v-model="clonedItem.selected" />
          </v-col>
        </v-slide-x-transition>
        <v-col class="text-truncate">
          {{ item.options.label }}
        </v-col>
        <v-slide-x-reverse-transition>
          <v-col v-if="editing" cols="auto" class="d-flex">
            <v-btn icon @click="dialog = true">
              <v-icon>{{ mdiPencil }}</v-icon>
            </v-btn>
          </v-col>
        </v-slide-x-reverse-transition>
      </v-row>
    </v-card-text>

    <v-dialog
      v-model="dialog"
      persistent
      :fullscreen="$vuetify.breakpoint.mobile"
      transition="dialog-bottom-transition"
      max-width="600"
    >
      <v-card>
        <v-toolbar dense color="primary">
          <v-btn
            icon
            @click="dialog = false"
          >
            <v-icon>{{ mdiClose }}</v-icon>
          </v-btn>
          <span class="headline">Edit Action</span>
          <v-spacer />
          <v-btn
            text
            :loading="isSaving"
            :disabled="!valid"
            @click="save"
          >
            {{ translate('dialog.buttons.saveChanges.idle') }}
          </v-btn>
        </v-toolbar>
        <v-card-text class="pa-0">
          <edit :key="timestamp" :item.sync="clonedItem" :valid.sync="valid" />
        </v-card-text>
      </v-card>
    </v-dialog>
  </v-card>
</template>

<script lang="ts">
import { mdiClose, mdiPencil } from '@mdi/js';
import translate from '@sogebot/ui-helpers/translate';
import {
  defineAsyncComponent,
  defineComponent, ref, watch,
} from '@vue/composition-api';
import { cloneDeep } from 'lodash-es';

import type { QuickActions } from '.bot/src/bot/database/entity/dashboard';
import api from '~/functions/api';
import { error } from '~/functions/error';
import { EventBus } from '~/functions/event-bus';

type Props = {
  item: QuickActions.Item<QuickActions.Types> & { selected: boolean },
};

export default defineComponent({
  props:      { item: Object, editing: Boolean },
  components: { edit: defineAsyncComponent({ loader: () => import('~/components/widgets/actions/edit.vue') }) },
  setup (props: Props, ctx) {
    const dialog = ref((props.item as any).temporary);
    const timestamp = ref(Date.now());
    const isSaving = ref(false);
    const clonedItem = ref(cloneDeep(props.item));
    const valid = ref(true);

    watch(dialog, (val) => {
      if (val) {
        isSaving.value = false;
        valid.value = true;
        timestamp.value = Date.now();
        clonedItem.value = cloneDeep(props.item);
      }
    });

    watch(() => clonedItem.value.selected, (val) => {
      ctx.emit('selected', val);
    });

    const save = () => {
      EventBus.$emit(`quickaction::${props.item.id}::valid`);
      ctx.root.$nextTick(async () => {
        if (valid.value) {
          isSaving.value = true;
          try {
            await api.post<(QuickActions.Item<QuickActions.Types>)>
              (ctx.root.$axios,
              `/api/v1/quickaction`,
              clonedItem.value,
              { headers: { userId: (ctx.root as any).$store.state.loggedUser.id } });
            dialog.value = false;
          } catch (e) {
            error(e);
          } finally {
            isSaving.value = false;
            ctx.emit('save');
          }
        }
      });
    };

    return {
      /* refs */
      clonedItem,
      dialog,
      isSaving,
      timestamp,
      valid,

      // fncs
      save,

      /* icons */
      mdiClose,
      mdiPencil,

      // others
      translate,
    };
  },
});
</script>
