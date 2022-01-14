<template>
  <v-menu
    v-model="menu"
    offset-y
    :close-on-click="false"
    min-width="400"
    :close-on-content-click="false"
  >
    <template #activator="{ on, attrs }">
      <v-btn
        icon
        dark
        v-bind="attrs"
        small
        v-on="on"
      >
        <v-icon>mdi-cog</v-icon>
      </v-btn>
    </template>
    <v-card>
      <v-card-text>
        <v-select
          v-model="permissionModel"
          label="Group Permission"
          clearable
          hide-details="auto"
          :items="permissionItems"
        />
        <v-textarea
          v-model="filterModel"
          hide-details="auto"
          :label="capitalize(translate('systems.customcommands.filter.name'))"
          :rows="1"
          auto-grow
          clearable
          @keydown.enter.prevent
        >
          <template #append>
            <input-variables
              @input="filterModel = filterModel + $event"
            />
          </template>
        </v-textarea>
      </v-card-text>
      <v-card-actions>
        <v-spacer />

        <v-btn
          text
          @click="menu = false"
        >
          Cancel
        </v-btn>
        <v-btn
          color="primary"
          text
          @click="menu = false; save()"
        >
          Save
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-menu>
</template>

<script lang="ts">
import translate from '@sogebot/ui-helpers/translate';
import {
  defineComponent, ref, watch,
} from '@vue/composition-api';
import { capitalize } from 'lodash';

type Props = {
  filter: string | null;
  permission: string | null;
  permissionItems: any[];
};

export default defineComponent({
  props: {
    filter:          [String, Object],
    permission:      [String, Object],
    permissionItems: Array,
  },
  setup (props: Props, ctx) {
    const menu = ref(false);
    const filterModel = ref(props.filter ?? '');
    const permissionModel = ref(props.permission);

    watch(menu, (val) => {
      if (val) {
        filterModel.value = props.filter ?? '';
        permissionModel.value = props.permission;
      }
    });

    watch(filterModel, (val) => {
      if (!val) {
        filterModel.value = '';
      }
    });

    function save () {
      ctx.emit('save', {
        filter: filterModel.value.trim().length > 0 ? filterModel.value : null, permission: permissionModel.value,
      });
    }

    return {
      menu, filterModel, permissionModel, save, translate, capitalize,
    };
  },
});
</script>
