<template>
  <loading v-if="permissions.length === 0"/>
  <div v-else>
    <v-tabs show-arrows v-model="tab" fixed-tabs>
      <v-tab v-for="item of permissions.filter(o => !ignored.includes(o.id))" :key="item.id">{{item.name}}</v-tab>
    </v-tabs>

    <v-tabs-items v-model="tab">
      <slot :permissions="permissions.filter(o => !ignored.includes(o.id))"/>
    </v-tabs-items>
  </div>
</template>

<script lang="ts">
import { useQuery, useResult } from '@vue/apollo-composable';
import {
  defineAsyncComponent, defineComponent, ref,
} from '@vue/composition-api';
import gql from 'graphql-tag';

import { PermissionsInterface } from '@entity/permissions';

export default defineComponent({
  props:      { ignored: Array },
  components: { loading: defineAsyncComponent(() => import('~/components/loading.vue')) },
  setup () {
    const { result } = useQuery(gql`
      query {
        permissions { id name order }
      }
    `);
    const permissions = useResult<{permissions: PermissionsInterface[] }, PermissionsInterface[], PermissionsInterface[]>(result, [], data => data.permissions);
    const tab = ref(0);

    return {
      permissions,
      tab,
    };
  },
});
</script>
