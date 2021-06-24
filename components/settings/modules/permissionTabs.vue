<template>
  <loading v-if="permissions.length === 0"/>
  <div v-else>
    <v-tabs show-arrows v-model="tab" fixed-tabs>
      <v-tab v-for="item of permissions" :key="item.id">{{item.name}}</v-tab>
    </v-tabs>

    <v-tabs-items v-model="tab">
      <slot :permissions="permissions"/>
    </v-tabs-items>
  </div>
</template>

<script lang="ts">
import { useContext } from '@nuxtjs/composition-api';
import {
  defineAsyncComponent, defineComponent, onMounted, ref,
} from '@vue/composition-api';
import { orderBy } from 'lodash-es';

import { PermissionsInterface } from '~/.bot/src/bot/database/entity/permissions';
import api from '~/functions/api';

export default defineComponent({
  props:      { ignored: Array },
  components: { loading: defineAsyncComponent(() => import('~/components/loading.vue')) },
  setup (props) {
    const permissions = ref([] as PermissionsInterface[]);
    const { $axios } = useContext();
    const tab = ref(0);

    onMounted(() => {
      api.get<PermissionsInterface[]>($axios, '/api/v1/settings/permissions')
        .then((response) => {
          permissions.value = orderBy(response.data.data.filter(o => !props.ignored.includes(o.id)), 'order', 'desc');
        });
    });

    return {
      permissions,
      tab,
    };
  },
});
</script>
