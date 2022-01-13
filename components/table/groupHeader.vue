<template>
  <div v-if="$vuetify.breakpoint.mobile" class="header">
    <v-row no-gutters>
      <v-col>
      <v-icon @click="toggle">
        {{ isOpen ? mdiMinus : mdiPlus }}
      </v-icon>

      <v-simple-checkbox class="d-inline-block px-4" style="transform: translateY(5px);" inline
        :value="isGroupSelected(items[0].group)" @click="toggleGroupSelection(items[0].group)" />

      <span v-if="items[0].group === null" class="red--text text--lighten-1">Ungrouped</span>
      <span v-else>
        {{ items[0].group }}

        <span class="px-4" :class="!getGroup[items[0].group].options.permission ? 'red--text' : ''">
          {{
            getGroup[items[0].group].options.permission
              ? getPermissionName(getGroup[items[0].group].options.permission, permissions)
              : '-- unset --'
          }}
        </span>

        <span class="px-4">
          <template v-if="getGroup[items[0].group].options.filter">
            <v-icon>mdi-filter</v-icon>
            <code>
              {{ getGroup[items[0].group].options.filter }}
            </code>
          </template>
          <template v-else>
            <v-icon>mdi-filter-off</v-icon>
            <span class="grey--text text--darken-2">No filters set</span>
          </template>
        </span>
      </span>
      </v-col>
      <v-col cols="auto" align-self="end">
        <slot name="config"/>
      </v-col>
    </v-row>
  </div>
  <th colspan="100%" v-else>
    <v-row no-gutters>
      <v-col>
      <v-icon @click="toggle">
        {{ isOpen ? mdiMinus : mdiPlus }}
      </v-icon>

      <v-simple-checkbox class="d-inline-block px-4" style="transform: translateY(5px);" inline
        :value="isGroupSelected(items[0].group)" @click="toggleGroupSelection(items[0].group)" />

      <span v-if="items[0].group === null" class="red--text text--lighten-1">Ungrouped</span>
      <span v-else>
        {{ items[0].group }}

        <span class="px-4" :class="!getGroup[items[0].group].options.permission ? 'red--text' : ''">
          {{
            getGroup[items[0].group].options.permission
              ? getPermissionName(getGroup[items[0].group].options.permission, permissions)
              : '-- unset --'
          }}
        </span>

        <span class="px-4">
          <template v-if="getGroup[items[0].group].options.filter">
            <v-icon>mdi-filter</v-icon>
            <code>
              {{ getGroup[items[0].group].options.filter }}
            </code>
          </template>
          <template v-else>
            <v-icon>mdi-filter-off</v-icon>
            <span class="grey--text text--darken-2">No filters set</span>
          </template>
        </span>
      </span>
      </v-col>
      <v-col cols="auto" align-self="end">
        <slot name="config"/>
      </v-col>
    </v-row>
    </th>
</template>

<script lang="ts">
import { mdiMinus, mdiPlus } from '@mdi/js';
import { defineComponent } from '@nuxtjs/composition-api';

export default defineComponent({
  props: {
    isOpen:               Boolean,
    toggle:               Function,
    isGroupSelected:      Function,
    toggleGroupSelection: Function,
    items:                Array,
    getGroup:             Object,
  },
  setup () {
    return {
      mdiMinus,
      mdiPlus,
    };
  },
});
</script>

<style scoped>
div.header {
  padding: 1rem;
  border-bottom: 1px solid #383838;
}
</style>
