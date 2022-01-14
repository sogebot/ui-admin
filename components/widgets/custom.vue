<template>
  <v-card id="27ff4cdf-2ffc-4c14-b619-c1660f5e0491" width="100%" :height="isPopout ? '100%' : undefined" :loading="loading" style="overflow: inherit" flat>
    <v-tabs
      v-model="tab"
      height="36"
      background-color="blue-grey darken-4"
    >
      <v-tab v-for="item of items" :key="item.id">
        {{ item.name }}
      </v-tab>
      <v-spacer />
      <v-tooltip bottom>
        <template #activator="{ on, attrs }">
          <v-btn
            icon
            v-bind="attrs"
            target="_blank"
            @click="dialog = true"
            v-on="on"
          >
            <v-icon>mdi-pencil</v-icon>
          </v-btn>
        </template>
        <span>Edit URLs</span>
      </v-tooltip>
    </v-tabs>

    <v-slide-y-transition>
      <v-card-text v-if="items.length === 0" :style="{ height: height - 36 + 'px' }">
        <div class="font-weight-light">
          No URLs are defined yet.
        </div>
      </v-card-text>
    </v-slide-y-transition>
    <v-slide-y-transition>
      <v-card-text v-if="items.length > 0" :style="{ height: height - 36 + 'px', overflow: 'auto' }" class="pa-0">
        <v-tabs-items v-if="show" v-model="tab">
          <v-tab-item v-for="item of items" :key="item.id + 'tab'">
            <iframe
              frameborder="0"
              scrolling="no"
              :src="item.url.includes('://') ? item.url : `http://${item.url}`"
              width="100%"
              :height="height - 36 + 'px'"
            />
          </v-tab-item>
        </v-tabs-items>
      </v-card-text>
    </v-slide-y-transition>
    <edit :key="dialog" :dialog.sync="dialog" />
  </v-card>
</template>

<script lang="ts">
import {
  computed,
  defineAsyncComponent,
  defineComponent, onMounted, ref, watch,
} from '@nuxtjs/composition-api';
import translate from '@sogebot/ui-helpers/translate';
import { useQuery, useResult } from '@vue/apollo-composable';
import gql from 'graphql-tag';

import { error } from '../../functions/error';

import type { WidgetCustomInterface } from '.bot/src/database/entity/widget';

export default defineComponent({
  props: {
    height: Number,
  },
  components: {
    edit: defineAsyncComponent({
      loader: () => import('~/components/widgets/custom/edit.vue'),
    }),
  },
  setup () {
    const { result, loading, refetch, onError } = useQuery(gql`
      query { widgetCustomGet { id url name } }
    `);
    onError(error);
    const items = useResult<{ widgetCustomGet: Pick<WidgetCustomInterface, 'id' | 'url' | 'name'>[] }, Pick<WidgetCustomInterface, 'id' | 'url' | 'name'>[], Pick<WidgetCustomInterface, 'id' | 'url' | 'name'>[]>(result, [], data => data.widgetCustomGet);

    const isPopout = computed(() => location.href.includes('popout'));
    const show = ref(false);

    const dialog = ref(false);

    const tab = ref('0');

    watch(dialog, (val) => {
      if (!val) {
        refetch();
      }
    });

    onMounted(() => {
      setTimeout(() => {
        show.value = true;
      }, 100);
    });

    return {
      // refs
      isPopout,
      tab,
      dialog,
      items,
      show,
      loading,

      // functions

      // helpers
      translate,
    };
  },
});
</script>
