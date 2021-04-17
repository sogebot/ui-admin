<template>
  <div class="d-inline-block">
    <v-menu
      v-model="menu"
      :close-on-content-click="false"
    >
      <template #activator="{ on, attrs }">
        <v-btn
          small
          plain
          v-bind="attrs"
          v-on="on"
        >
          {{ getPermissionName(permission, permissions) }}
        </v-btn>
      </template>

      <v-select
        class="ma-2"
        :value="permission"
        :label="translate('permission')"
        :items="permissionItems"
        @change="triggerEvent"
      />
    </v-menu>
  </div>
</template>
<script lang="ts">
import translate from '@sogebot/ui-helpers/translate';
import {
  computed, defineComponent, ref,
} from '@vue/composition-api';

import { getPermissionName } from '~/functions/getPermissionName';

export default defineComponent({
  props: {
    permission:  String,
    permissions: Array,
  },
  setup (props, ctx) {
    const menu = ref(false);

    const permissionItems = computed(() => {
      return props.permissions?.map((item: any) => ({
        text:     item.name,
        value:    item.id,
        disabled: false,
      }));
    });

    const triggerEvent = (input: string | null) => {
      if (input === null) {
        return;
      }
      ctx.emit('input', input);
      menu.value = false;
    };

    return {
      triggerEvent, menu, permissionItems, translate, getPermissionName,
    };
  },
});
</script>

<style>
/* workaround for transparent menu */
.theme-- .v-menu__content {
  background-color: rgb(30, 30, 30);
}

.theme--light .v-menu__content {
  background-color: #fff;
}
</style>