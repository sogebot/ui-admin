<template>
  <div>
    <label class="v-label theme--dark">
      {{ translate('core.permissions.filters') }}
    </label>
    <v-row v-for="(filter, index) of model" :key="filter.id">
      <v-col align-self="end">
        <v-select
          v-model="filter.type"
          :items="typeItems"
          :label="translate('core.permissions.type')"
          hide-details
          @input.passive="setComparator(filter)"
        />
      </v-col>
      <v-col align-self="end">
        <v-select
          v-model="filter.comparator"
          :items="comparatorItems(filter)"
          hide-details
        />
      </v-col>
      <v-col align-self="end">
        <v-text-field
          v-if="isNumber(filter.value)"
          v-model.number="filter.value"
          hide-details
          :label="translate('core.permissions.value')"
        />
        <v-text-field
          v-else
          v-model="filter.value"
          hide-details
          :label="translate('core.permissions.value')"
        />
      </v-col>
      <v-col align-self="end" cols="auto">
        <v-btn icon color="red" @click="remove(index)">
          <v-icon>mdi-delete-forever</v-icon>
        </v-btn>
      </v-col>
    </v-row>
    <v-row>
      <v-col>
        <v-btn @click="add">
          {{ translate('core.permissions.addFilter') }}
        </v-btn>
      </v-col>
    </v-row>
  </div>
</template>

<script lang="ts">
import {
  defineComponent, ref, watch,
} from '@nuxtjs/composition-api';
import translate from '@sogebot/ui-helpers/translate';

import type { PermissionFiltersInterface } from '@entity/permissions';

export default defineComponent({
  props: {
    value: Array,
  },
  setup (props: { value: Omit<PermissionFiltersInterface, 'permission'>[] }, ctx) {
    const model = ref(props.value);
    const typeItems = ref([
      'level', 'ranks', 'points', 'watched', 'tips', 'bits', 'messages', 'subtier', 'subcumulativemonths', 'substreakmonths', 'followtime',
    ].map(o => ({
      value: o, text: translate('core.permissions.' + o),
    })),
    );

    watch(model, (val) => {
      ctx.emit('input', val);
    });

    const setComparator = (filter: PermissionFiltersInterface) => {
      if (isNumber(filter.type)) {
        filter.comparator = '==';
      }
    };
    const isNumber = (type: string) => {
      return !type.includes('ranks');
    };
    const remove = (index: number) => {
      model.value.splice(index, 1);
    };
    const add = () => {
      model.value.push({
        comparator: '>=',
        type:       'watched',
        value:      '0',
      });
    };
    const comparatorItems = (filter: PermissionFiltersInterface) => {
      const items: { value:string, text: string }[] = [];
      if (isNumber(filter.type)) {
        items.push({
          value: '<', text: translate('core.permissions.isLowerThan'),
        });
        items.push({
          value: '<=', text: translate('core.permissions.isLowerThanOrEquals'),
        });
      }
      items.push({
        value: '==', text: translate('core.permissions.equals'),
      });

      if (isNumber(filter.type)) {
        items.push({
          value: '>', text: translate('core.permissions.isHigherThan'),
        });
        items.push({
          value: '>=', text: translate('core.permissions.isHigherThanOrEquals'),
        });
      }

      return items;
    };

    return {
      // refs
      model,
      typeItems,
      comparatorItems,

      // functions
      setComparator,
      isNumber,
      remove,
      add,

      // icond

      translate,
    };
  },
});
</script>
