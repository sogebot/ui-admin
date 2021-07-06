<template>
  <v-card id="5b90af97-ad95-4776-89e3-9a59c67510e6" width="100%" :height="isPopout ? '100%' : undefined">
    <v-slide-y-transition>
      <v-card-text v-if="items.length === 0" :style="{ height: height + 'px' }">
        <div class="font-weight-light">
          To fill social widget, you need to add tweet events with hashtags. Then all new posts will be added to this widget.
        </div>
      </v-card-text>
    </v-slide-y-transition>
    <v-slide-y-transition>
      <v-card-text v-if="items.length > 0" :style="{ height: height + 'px', overflow: 'auto' }" class="pa-0">
        <v-list>
          <v-list-item v-for="item of items" :key="item.id" two-line>
            <v-list-item-action>
              <v-icon x-large color="#08a0e9">
                {{ mdiTwitter }}
              </v-icon>
            </v-list-item-action>
            <v-list-item-content>
              {{ item.text }}
              <v-list-item-subtitle>{{ item.username }}, {{ dayjs(item.timestamp).format('LL') }} {{ dayjs(item.timestamp).format('LTS') }}</v-list-item-subtitle>
            </v-list-item-content>
            <v-list-item-action>
              <v-btn :href="item.url" icon target="_blank">
                <v-icon>{{ mdiLink }}</v-icon>
              </v-btn>
            </v-list-item-action>
          </v-list-item>
        </v-list>
      </v-card-text>
    </v-slide-y-transition>
  </v-card>
</template>

<script lang="ts">
import { mdiLink, mdiTwitter } from '@mdi/js';
import {
  computed,
  defineComponent, onMounted, ref, useContext,
} from '@nuxtjs/composition-api';
import { dayjs } from '@sogebot/ui-helpers/dayjsHelper';
import translate from '@sogebot/ui-helpers/translate';

import type { WidgetSocialInterface } from '.bot/src/bot/database/entity/widget';
import api from '~/functions/api';

export default defineComponent({
  setup () {
    const context = useContext();
    const isPopout = computed(() => location.href.includes('popout'));
    const height = ref(600);
    const items = ref([] as WidgetSocialInterface[]);

    function updateHeight () {
      // so. many. parentElement. to get proper offsetTop as children offset is 0
      const offsetTop = document.getElementById('5b90af97-ad95-4776-89e3-9a59c67510e6')?.parentElement?.parentElement?.parentElement?.parentElement?.offsetTop || 0;
      const offset = 50;
      const newHeight = window.innerHeight - offsetTop - offset;
      height.value = Math.max(newHeight, 300);
    }

    const refresh = async () => {
      const response = await api.get<WidgetSocialInterface[]>(context.$axios, `/api/v1/social`);
      items.value = response.data.data;
    };

    onMounted(() => {
      setInterval(() => updateHeight(), 100);

      refresh();
      setInterval(() => {
        refresh();
      }, 10000);
    });

    return {
      // refs
      isPopout,
      height,
      items,

      // functions

      // helpers
      translate,
      dayjs,

      // icons,
      mdiTwitter,
      mdiLink,
    };
  },
});
</script>
