<template>
  <loading v-if="permissions.length === 0" />
  <div v-else>
    <v-tabs v-model="tab" show-arrows fixed-tabs>
      <v-tab v-for="item of permissions.filter(o => !(ignored || []).includes(o.id))" :key="item.id">
        {{ item.name }}
      </v-tab>
    </v-tabs>

    <v-tabs-items v-model="tab">
      <slot :permissions="permissions.filter(o => !(ignored || []).includes(o.id))" />
    </v-tabs-items>
  </div>
</template>

<script setup lang="ts">
import { PermissionsInterface } from '@entity/permissions';
import gql from 'graphql-tag';
import { orderBy } from 'lodash';

defineProps({ ignored: [Array, Object] });
const { $graphql } = useNuxtApp();
const permissions = ref([] as PermissionsInterface[]);
const tab = ref(0);

onMounted(async () => {
  permissions.value = orderBy((await $graphql.default.request(gql`
  query {
    permissions { id name order }
  }
`)).permissions, 'order', 'desc');
});
</script>
