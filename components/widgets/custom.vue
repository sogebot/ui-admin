<template>
  <v-card
    id="27ff4cdf-2ffc-4c14-b619-c1660f5e0491"
    width="100%"
    :height="isPopout ? '100%' : undefined"
    :loading="loading"
    style="overflow: inherit;"
    flat
  >
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
    <widgets-custom-edit :key="dialog" :dialog.sync="dialog" />
  </v-card>
</template>

<script setup lang="ts">
import type { WidgetCustomInterface } from '@entity/widget';
import gql from 'graphql-tag';

const loading = ref(true);
const items = ref([] as Pick<WidgetCustomInterface, 'id' | 'url' | 'name'>[]);

const isPopout = computed(() => location.href.includes('popout'));
const show = ref(false);

const dialog = ref(false);

const tab = ref('0');

watch(dialog, (val) => {
  if (!val) {
    refetch();
  }
});

const refresh = async () => {
  items.value = (await $graphql.default.request(gql`
      query { widgetCustomGet { id url name } }
    `)).widgetCustomGet;
  loading.value = false;
};

onMounted(() => {
  refresh();
  setTimeout(() => {
    show.value = true;
  }, 100);
});
</script>
