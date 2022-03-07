<template>
  <tr
    v-if="headers.length"
    :class="{
      'v-data-table__selected': selected && selected.some(o => (itemKey ? o[itemKey] : o.id) === (itemKey ? item[itemKey] : item.id)),
      'v-data-table__mobile-table-row': $vuetify.breakpoint.mobile,
    }"
  >
    <template v-if="$vuetify.breakpoint.mobile">
      <td class="v-data-table__mobile-row">
        <div>
          <v-simple-checkbox v-if="selected" :value="selected.some(o => (itemKey ? o[itemKey] : o.id) === (itemKey ? item[itemKey] : item.id))" @click="addToSelectedItem(item)" />
        </div>

        <div class="v-data-table__mobile-row__cell d-flex">
          <slot name="actions" />
        </div>
      </td>

      <td v-for="header of headers.filter(o => o.value !== 'actions')" :key="header.value" class="v-data-table__mobile-row">
        <div class="v-data-table__mobile-row__header">
          {{ header.text }}
        </div>

        <div class="v-data-table__mobile-row__cell">
          <slot :name="header.value">
            <v-simple-checkbox v-if="typeof item[header.value] === 'boolean'" :value="item[header.value]" disabled />
            <template v-else>
              {{ item[header.value] }}
            </template>
          </slot>
        </div>
      </td>
    </template>
    <template v-else>
      <td>
        <div class="d-flex">
          <v-simple-checkbox v-if="selected" :value="selected.some(o => (itemKey ? o[itemKey] : o.id) === (itemKey ? item[itemKey] : item.id))" @click="addToSelectedItem(item)" />
        </div>
      </td>
      <td
        v-for="header of headers.filter(o => o.value !== 'actions')"
        :key="header.value"
        class="pa-2 mx-4"
        :class="{
          'text-center': header.align === 'center',
          'text-right': header.align === 'right',
        }"
      >
        <slot :name="header.value">
          <v-simple-checkbox v-if="typeof item[header.value] === 'boolean'" :value="item[header.value]" disabled />
          <template v-else>
            {{ item[header.value] }}
          </template>
        </slot>
      </td>
      <td>
        <div class="d-flex" style="justify-content: right;">
          <slot name="actions" />
        </div>
      </td>
    </template>
  </tr>
</template>

<script lang="ts">
import { defineComponent } from '@vue/composition-api';

export default defineComponent({
  props: {
    selected:          Array,
    headers:           Array,
    item:              Object,
    addToSelectedItem: Function,
    itemKey:           String,
  },
});
</script>
