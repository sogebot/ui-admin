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

<script setup lang="ts">
import { PermissionsInterface } from '@entity/permissions';
import gql from 'graphql-tag';

const { $graphql } = useNuxtApp();
const permissions = ref([] as PermissionsInterface[]);
const tab = ref(0);

onMounted(async () => {
  permissions.value = (await $graphql.default.request(gql`
  query {
    permissions { id name order }
  }
`)).permissions;
})
</script>
