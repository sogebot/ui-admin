<template>
  <tr
    :class="{
      'v-data-table__selected': selected.some(o => o.id === item.id),
      'v-data-table__mobile-table-row': $vuetify.breakpoint.mobile,
    }"
  >
    <template v-if="$vuetify.breakpoint.mobile">
      <td class="v-data-table__mobile-row">
        <div>
          <v-simple-checkbox :value="selected.some(o => o.id === item.id)" @click="addToSelectedItem(item)" />
        </div>

        <div class="v-data-table__mobile-row__cell d-flex">
          <slot name="actions"/>
        </div>
      </td>

      <td class="v-data-table__mobile-row" v-for="header of headers" :key="header.value">
        <div class="v-data-table__mobile-row__header">
          {{ header.text }}
        </div>

        <div class="v-data-table__mobile-row__cell">
          <slot :name="header.value">
            <v-simple-checkbox :value="item[header.value]" disabled v-if="typeof item[header.value] === 'boolean'" />
            <template v-else>{{ item[header.value] }}</template>
          </slot>
        </div>
      </td>
    </template>
    <template v-else>
      <td>
        <div class="d-flex">
          <v-simple-checkbox :value="selected.some(o => o.id === item.id)" @click="addToSelectedItem(item)" />
          <slot name="actions"/>
        </div>
      </td>

      <td class="pa-2" v-for="header of headers" :key="header.value"
        :class="{
          'text-center': header.align === 'center',
        }">
        <slot :name="header.value">
          <v-simple-checkbox :value="item[header.value]" disabled v-if="typeof item[header.value] === 'boolean'" />
          <template v-else>{{ item[header.value] }}</template>
        </slot>
      </td>
    </template>
  </tr>
</template>

<script lang="ts">
import { defineComponent } from '@vue/composition-api';

export default defineComponent({
  props: {
    selected: Array,
    headers:  Array,
    item:     Object,
  },
});
</script>
