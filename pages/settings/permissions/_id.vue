<template>
  <v-card>
    <v-toolbar dense>
      <v-toolbar-title>
        {{ translate('core.permissions.settings') }}
      </v-toolbar-title>
    </v-toolbar>
    <v-card-text>
      <v-overlay v-if="!model" absolute>
        <v-row>
          <v-col class="text-center">
            <v-progress-circular indeterminate size="48" />
          </v-col>
        </v-row>
      </v-overlay>
      <template v-else>
        <v-text-field
          v-model="model.name"
          :label="translate('core.permissions.name')"
          :rules="[required]"
        />

        <v-select
          v-if="!model.isCorePermission"
          v-model="model.automation"
          :label="translate('core.permissions.baseUsersSet')"
          :items="automationItems"
        />

        <v-checkbox
          v-if="!model.isCorePermission"
          v-model="model.isWaterfallAllowed"
          :label="translate('core.permissions.allowHigherPermissions')"
        />

        <userslist
          v-if="!model.isCorePermission"
          v-model="model.userIds"
          :label="translate('core.permissions.manuallyAddedUsers')"
        />

        <userslist
          v-if="!model.isCorePermission"
          v-model="model.excludeUserIds"
          :label="translate('core.permissions.manuallyExcludedUsers')"
        />
      </template>
    </v-card-text>
  </v-card>
</template>

<script lang="ts">
import translate from '@sogebot/ui-helpers/translate';
import {
  defineAsyncComponent, defineComponent, onMounted, ref, watch,
} from '@vue/composition-api';

import { PermissionsInterface } from '~/.bot/src/bot/database/entity/permissions';
import api from '~/functions/api';
import { required } from '~/functions/validators';

export default defineComponent({
  components: { userslist: defineAsyncComponent(() => import('~/components/settings/permissions/userslist.vue')) },
  setup (_, ctx) {
    const model = ref(null as PermissionsInterface | null);

    const automationItems = ['none', 'casters', 'moderators', 'subscribers', 'vip', 'viewers', 'followers']
      .map(o => ({ value: o, text: translate('core.permissions.' + o) }));

    const refresh = (val) => {
      model.value = null;
      if (val) {
        api.getOne<PermissionsInterface>(ctx.root.$axios, '/api/v1/settings/permissions/', val)
          .then(response => (model.value = response.data));
      }
    };

    watch(() => ctx.root.$route.params.id, (val) => {
      refresh(val);
    });

    onMounted(() => {
      refresh(ctx.root.$route.params.id);
    });

    return {
      // refs
      model,
      automationItems,

      // others
      translate,

      // validators
      required,
    };
  },
});
</script>
