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
import { getSocket } from '@sogebot/ui-helpers/socket';
import { orderBy } from 'lodash';

defineProps({ ignored: [Array, Object] });
const permissions = ref([] as PermissionsInterface[]);
const tab = ref(0);

onMounted(async () => {
  getSocket('/core/permissions').emit('generic::getAll', (err, res) => {
    if (err) {
      return console.error(err);
    }
    permissions.value = orderBy(res, 'order', 'desc')
  });
});
</script>
