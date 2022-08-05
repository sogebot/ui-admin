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
            :readonly="model.isCorePermission"
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

          <settings-permissions-userslist
            v-if="!model.isCorePermission"
            v-model="model.userIds"
            :label="translate('core.permissions.manuallyAddedUsers')"
          />

          <settings-permissions-userslist
            v-if="!model.isCorePermission"
            v-model="model.excludeUserIds"
            :label="translate('core.permissions.manuallyExcludedUsers')"
          />

          <settings-permissions-filters
            v-if="!model.isCorePermission"
            v-model="model.filters"
          />

          <settings-permissions-test :permission="model.id" />
        </v-form>
      </template>
    </v-card-text>

    <v-card-actions v-if="model && !model.isCorePermission">
      <v-btn color="error" :loading="removing" @click="remove(model.id)">
        {{ translate('delete') }}
      </v-btn>
      <v-spacer />
      <v-btn
        :text="!$vuetify.breakpoint.xs"
        :icon="$vuetify.breakpoint.xs"
        :loading="saving"
        :disabled="!valid"
        @click="save"
      >
        <v-icon class="d-flex d-sm-none">
          mdi-floppy
        </v-icon>
        <span class="d-none d-sm-flex">{{ translate('dialog.buttons.saveChanges.idle') }}</span>
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<script setup lang="ts">
import { PermissionsInterface } from '@entity/permissions';
import { getSocket } from '@sogebot/ui-helpers/socket.js';
import translate from '@sogebot/ui-helpers/translate';

import { EventBus } from '~/functions/event-bus';
import { required } from '~/functions/validators';

const router = useRouter();
const route = useRoute();

const loading = ref(true);
const saving = ref(false);
const removing = ref(false);

const permissions = ref([] as PermissionsInterface[]);
const model = ref(null as PermissionsInterface | null);
const valid = ref(true);

const refetch = async () => {
  getSocket('/core/permissions').emit('generic::getAll', (err, res) => {
    if (err) {
      return console.error(err);
    }

    const id = route.params.id;
    if (!id) {
      router.replace('/settings/permissions/' + permissions.value[0].id);
      return;
    }

    permissions.value = res;
    model.value = res.find(o => o.id === id) ?? null
    loading.value = false;
  });
};

onMounted(() => {
  refetch();
});

watch(() => route.params.id, () => {
  refetch();
});

const automationItems = ['none', 'casters', 'moderators', 'subscribers', 'vip', 'viewers']
  .map(o => ({ value: o, text: translate('core.permissions.' + o) }));

const remove = (id: string) => {
  removing.value = true;
  getSocket('/core/permissions').emit('generic::deleteById', id, () => {
    router.push('/settings/permissions');
    EventBus.$emit('settings::permissions::refresh');
    removing.value = false;
  });
};

const save = () => {
  if (model.value && model.value.id && valid) {
    saving.value = true;
    getSocket('/core/permissions').emit('permission::save', [...permissions.value, model.value] as any, () => {
      EventBus.$emit('settings::permissions::refresh');
      EventBus.$emit('snack', 'success', 'Data updated.');
    });
   saving.value = false;
  }
};
</script>
