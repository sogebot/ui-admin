<template>
  <v-card
    id="5b90af97-ad95-4776-89e3-9a59c67510e6"
    width="100%"
    :height="isPopout ? '100%' : undefined"
    :loading="loading"
    style="overflow: inherit;"
    flat
  >
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
                mdi-twitter
              </v-icon>
            </v-list-item-action>
            <v-list-item-content>
              {{ item.text }}
              <v-list-item-subtitle>{{ item.username }}, {{ dayjs(item.timestamp).format('LL') }} {{ dayjs(item.timestamp).format('LTS') }}</v-list-item-subtitle>
            </v-list-item-content>
            <v-list-item-action>
              <v-btn :href="item.url" icon target="_blank">
                <v-icon>mdi-link</v-icon>
              </v-btn>
            </v-list-item-action>
          </v-list-item>
        </v-list>
      </v-card-text>
    </v-slide-y-transition>
  </v-card>
</template>

<script setup lang="ts">
import type { WidgetSocialInterface } from '@entity/widget';
import { dayjs } from '@sogebot/ui-helpers/dayjsHelper';
import gql from 'graphql-tag';

const loading = ref(true);
const items = ref([] as WidgetSocialInterface[]);
const refresh = async () => {
  items.value = (await $graphql.default.request(gql`
      query { widgeSocialGet { id type hashtag text username displayname url timestamp }
    `)).widgeSocialGet;
  loading.value = false;
};
onMounted(() => {
  refresh();
});

const isPopout = computed(() => location.href.includes('popout'));
</script>
