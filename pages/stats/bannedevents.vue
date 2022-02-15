<template>
  <v-container fluid :class="{ 'pa-4': !$vuetify.breakpoint.mobile }">
    <v-data-table
      :loading="loading"
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
import { defineComponent } from '@nuxtjs/composition-api';
import { dayjs } from '@sogebot/ui-helpers/dayjsHelper';
import translate from '@sogebot/ui-helpers/translate';
import { useQuery, useResult } from '@vue/apollo-composable';
import gql from 'graphql-tag';
import { capitalize, orderBy } from 'lodash';

import type { BannedEventsInterface } from '@entity/bannedEvents';

export default defineComponent({
  setup () {
    const { result, loading } = useQuery(gql`
      query {
        bannedEventsGet {
          id
          event_type
          event_timestamp
          version
          event_data {
            broadcaster_id
            broadcaster_login
            broadcaster_name
            user_id
            user_login
            expires_at
            moderator_id
            moderator_login
            moderator_name
            reason
            user_name
          }
        }
      }
    `, null, { pollInterval: 10000 });
    const items = useResult<{ bannedEventsGet: BannedEventsInterface[] }, BannedEventsInterface[], BannedEventsInterface[]>(result, [], data => data.bannedEventsGet);

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
    return {
      orderBy,
      headers,
      items,
      translate,
      loading,
      dayjs,
    };
  },
});
</script>
