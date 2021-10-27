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
        :clearable="nullable"
        @change="triggerEvent"
      />
    </v-menu>
  </div>
</template>
<script lang="ts">
import {
  computed, defineComponent, ref,
} from '@nuxtjs/composition-api';
import translate from '@sogebot/ui-helpers/translate';

import { getPermissionName } from '~/functions/getPermissionName';

type Props = {
  nullable: boolean,
  permission: string,
  permissions: { name: string, id: string }[]
};

export default defineComponent({
  props: {
    permission:  String,
    permissions: Array,
    nullable:    Boolean,
  },
  setup (props: Props, ctx) {
    const menu = ref(false);

    const permissionItems = computed(() => {
      if (props.nullable) {
        return [
          {
            text:     '-- unset --',
            value:    null,
            disabled: false,
          },
          ...(props.permissions ?? []).map(item => ({
            text:     item.name,
            value:    item.id,
            disabled: false,
          })),
        ];
      }
      return props.permissions?.map((item: any) => ({
        text:     item.name,
        value:    item.id,
        disabled: false,
      }));
    });

    const triggerEvent = (input: string | null) => {
      if (input === null && !props.nullable) {
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
