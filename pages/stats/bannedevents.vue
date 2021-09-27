<template>
  <v-container fluid :class="{ 'pa-4': !$vuetify.breakpoint.mobile }">
    <v-data-table
      :loading="state.loading !== ButtonStates.success"
      :headers="headers"
      :items="items"
    >
      <template #[`item.event_timestamp`]="{ item }">
        {{ dayjs(item.event_timestamp).format('LL') }} {{ dayjs(item.event_timestamp).format('LTS') }}
      </template>
      <template #[`item.reason`]="{ item }">
        <v-divider v-if="item.event_data.reason.length === 0" />
        {{ item.event_data.reason }}
      </template>
      <template #[`item.moderator`]="{ item }">
        <NuxtLink :to="'/manage/viewers/' + item.event_data.moderator_id">
          {{ item.event_data.moderator_name }}&nbsp;<small class="text-muted">{{ item.event_data.moderator_id }}</small>
        </NuxtLink>
      </template>
      <template #[`item.user`]="{ item }">
        <NuxtLink :to="'/manage/viewers/' + item.event_data.user_id">
          {{ item.event_data.user_name }}&nbsp;<small class="text-muted">{{ item.event_data.user_id }}</small>
        </NuxtLink>
      </template>
    </v-data-table>
  </v-container>
</template>

<script lang="ts">
import {
  defineComponent, onMounted, ref, useContext,
} from '@nuxtjs/composition-api';
import { ButtonStates } from '@sogebot/ui-helpers/buttonStates';
import { dayjs } from '@sogebot/ui-helpers/dayjsHelper';
import translate from '@sogebot/ui-helpers/translate';
import { capitalize, orderBy } from 'lodash';

import api from '../../functions/api';

import type { BannedEventsInterface } from '~/.bot/src/database/entity/bannedEvents';

export default defineComponent({
  setup () {
    const items = ref([] as Required<BannedEventsInterface>[]);
    const { $axios } = useContext();

    const state = ref({ loading: ButtonStates.progress } as {
      loading: number;
    });

    const headers = [
      { value: 'event_timestamp', text: capitalize(translate('date')) },
      { value: 'event_type', text: capitalize('Event type') },
      {
        value: 'user', text: capitalize('user'), sortable: false,
      },
      {
        value: 'moderator', text: capitalize('Moderator'), sortable: false,
      },
      {
        value: 'reason', text: capitalize('reason'), sortable: false,
      },
    ];

    const refresh = () => {
      api.get<BannedEventsInterface[]>($axios, '/api/v1/moderation/bannedevents')
        .then(response => (items.value = response.data.data))
        .then(() => (state.value.loading = ButtonStates.success));
    };

    onMounted(() => {
      refresh();
    });

    return {
      orderBy,
      headers,
      items,
      state,
      translate,
      ButtonStates,
      refresh,
      dayjs,
    };
  },
});
</script>
