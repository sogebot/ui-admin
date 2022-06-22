<template>
  <div ref="pointer">
    <v-toolbar dense color="blue-grey darken-4" :loading="loading">
      <v-icon color="white" left>
        mdi-filter
      </v-icon>
      <v-toolbar-title class="text-button white--text">
        {{$t('registry.plugins.filter.permission.name')}}
      </v-toolbar-title>
    </v-toolbar>
    <v-card dark>
      <v-card-text>
        <v-alert v-if="!haveUserParam" type="error" color="red" class="ma-0">
          {{$t('registry.plugins.common-errors.missing-sender-attributes')}}
        </v-alert>
        <template v-else>
          <v-checkbox
            v-for="permission of permissions"
            :key="permission.id"
            v-model="item"
            dense
            color="white"
            hide-details="auto"
            :label="permission.name"
            :value="permission.id"
          />
        </template>
      </v-card-text>
    </v-card>
  </div>
</template>

<script setup lang="ts">
import { PermissionsInterface } from '@sogebot/backend/src/database/entity/permissions';
import { getSocket } from '@sogebot/ui-helpers/socket';

import { EventBus } from '~/functions/event-bus';
import { flatten } from '~/functions/flatten';

const loading = ref(true);

const permissions = ref([] as PermissionsInterface[]);
const item = ref([]);

const refresh = () => {
  getSocket('/core/permissions').emit('generic::getAll', (err, res) => {
    if (err) {
      return console.error(err);
    }
    permissions.value = res;
    loading.value = false;
  });
};

onMounted(() => {
  refresh();
});

const pointer = ref(null as null | HTMLElement);
const nodeId = ref(null as null | string);

watch(pointer, (value) => {
  nodeId.value = value?.parentElement?.parentElement?.id ?? null;

  if (nodeId.value) {
    EventBus.$emit('drawflow::node::value', nodeId.value, (val) => {
      item.value = val;
    });
  }
});

watch(item, (value) => {
  if (nodeId.value) {
    EventBus.$emit('drawflow::node::update', nodeId.value, value);
  }
});

const haveUserParam = ref(false);

// get all parents
const interval = setInterval(() => {
  EventBus.$emit('drawflow::getCommonParents', nodeId.value, (err, parents) => {
    if (err) {
      clearInterval(interval);
      return;
    }
    const commonAttributes: Record<string, any> = {};

    // console.log(nodeId.value, parents);
    getSocket('/core/plugins').emit('listeners', (data) => {
      let initial = true;
      for (const parent of parents) {
        const listener = data[parent.data.value];
        // console.log({listener, data, value: parent.data.value})
        if (listener) {
          if (initial) {
            initial = false;
            for (const key of Object.keys(flatten(listener))) {
              // console.log('Nothing to check adding', key)
              commonAttributes[key] = flatten(listener)[key];
            }
          } else {
            for (const key of Object.keys(flatten(listener))) {
              // console.log('Checking listener => common', nodeId.value, key)
              if (commonAttributes[key] !== flatten(listener)[key]) {
                // console.log('Removing', key)
                delete commonAttributes[key];
              }
            }
            for (const key of Object.keys(commonAttributes)) {
              // console.log('Checking common => lister', nodeId.value, key)
              if (commonAttributes[key] !== flatten(listener)[key]) {
                // console.log('Removing', key)
                delete commonAttributes[key];
              }
            }
          }
        }
      }
      haveUserParam.value = !!Object.keys(commonAttributes).find(key => key.startsWith('sender'));
    });
  });
}, 100);
</script>
