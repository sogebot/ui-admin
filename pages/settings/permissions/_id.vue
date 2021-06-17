<template>
  <v-card>
    <v-toolbar dense color="blue-grey darken-4">
      <v-toolbar-title class="text-button">
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
        <v-form v-model="valid" lazy-validation>
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

          <filters
            v-if="!model.isCorePermission"
            v-model="model.filters"
          />

          <test :permission="model.id" />
        </v-form>
      </template>
    </v-card-text>

    <v-card-actions v-if="model && !model.isCorePermission">
      <v-btn color="error" :loading="isRemoving" @click="remove(model.id)">
        {{ translate('delete') }}
      </v-btn>
      <v-spacer />
      <v-btn :loading="isSaving" :disabled="!valid" @click="save">
        {{ translate('dialog.buttons.saveChanges.idle') }}
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<script lang="ts">
import translate from '@sogebot/ui-helpers/translate';
import {
  defineAsyncComponent, defineComponent, onMounted, ref, watch,
} from '@vue/composition-api';

import { PermissionsInterface } from '~/.bot/src/bot/database/entity/permissions';
import api from '~/functions/api';
import { error } from '~/functions/error';
import { EventBus } from '~/functions/event-bus';
import { required } from '~/functions/validators';

export default defineComponent({
  components: {
    userslist: defineAsyncComponent(() => import('~/components/settings/permissions/userslist.vue')),
    filters:   defineAsyncComponent(() => import('~/components/settings/permissions/filters.vue')),
    test:      defineAsyncComponent(() => import('~/components/settings/permissions/test.vue')),
  },
  setup (_, ctx) {
    const model = ref(null as PermissionsInterface | null);
    const isRemoving = ref(false);
    const isSaving = ref(false);
    const valid = ref(true);

    const automationItems = ['none', 'casters', 'moderators', 'subscribers', 'vip', 'viewers', 'followers']
      .map(o => ({ value: o, text: translate('core.permissions.' + o) }));

    const refresh = (val?: string) => {
      model.value = null;
      if (val) {
        api.getOne<PermissionsInterface>(ctx.root.$axios, '/api/v1/settings/permissions/', val)
          .then(response => (model.value = response.data));
      }
    };

    const remove = (id: string) => {
      isRemoving.value = true;
      api.delete(ctx.root.$axios, '/api/v1/settings/permissions/' + id)
        .then(() => {
          isRemoving.value = false;
          ctx.root.$router.push('/settings/permissions');
        });
    };

    const save = () => {
      if (model.value && model.value.id && valid) {
        isSaving.value = true;
        api.patch(ctx.root.$axios, '/api/v1/settings/permissions/' + model.value.id, model.value)
          .then(() => {
            EventBus.$emit('settings::permissions::refresh');
          })
          .catch((e) => {
            error(e);
          })
          .finally(() => {
            isSaving.value = false;
          });
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
      isRemoving,
      isSaving,
      valid,

      // functions
      save,
      remove,

      // others
      translate,

      // validators
      required,
    };
  },
});
</script>
