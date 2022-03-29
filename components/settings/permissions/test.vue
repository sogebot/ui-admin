<template>
  <div>
    <v-text-field
      v-model="testUsername"
      :loading="isTesting"
      :label="translate('core.permissions.testUser')"
      hint="Press enter to check user"
      @keydown.enter="testUser"
      @input="empty"
    />

    <v-alert v-if="error.length > 0" text color="error" border="left">
      {{ translate('core.permissions.' + error) }}
    </v-alert>

    <v-alert
      v-if="typeof status.access !== 'undefined'
        && typeof partialStatus.access !== 'undefined'
        && !isTesting"
      text
      :color="color()"
      border="left"
    >
      <span
        v-if="Number(status.access) === 0 && Number(partialStatus.access) === 0"
        v-html="translate('core.permissions.userHaveNoAccessToThisPermissionGroup').replace('$username', testUsername)"
      />
      <span v-else-if="Number(status.access) === 1 || Number(partialStatus.access) === 1">
        <span v-html="translate('core.permissions.userHaveAccessToThisPermissionGroup').replace('$username', testUsername)" />
        <ul class="mb-0">
          <li v-if="Number(partialStatus.access) === 1">
            <span v-html="translate('core.permissions.accessDirectlyThrough')" />
            <nuxt-link :to="'/settings/permissions/' + partialStatus.permission.id">{{ partialStatus.permission.name }} <small>{{ partialStatus.permission.id }}</small></nuxt-link>.
          </li>
          <li v-if="Number(status.access) === 1 && status.permission.id !== partialStatus.permission.id">
            <span v-html="translate('core.permissions.accessThroughHigherPermission')" />
            <nuxt-link :to="'/settings/permissions/' + status.permission.id">{{ status.permission.name }} <small>{{ status.permission.id }}</small></nuxt-link>.
          </li>
        </ul>
      </span>
      <span
        v-else
        v-html="translate('core.permissions.somethingWentWrongUserWasNotFoundInBotDatabase').replace('$username', testUsername)"
      />
    </v-alert>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from '@nuxtjs/composition-api';
import { getSocket } from '@sogebot/ui-helpers/socket';
import translate from '@sogebot/ui-helpers/translate';
import { v4 } from 'uuid';

export default defineComponent({
  props: { permission: String },
  setup (props: { permission: string }) {
    const isTesting = ref(false);
    const status = ref({} as Record<string, any>);
    const partialStatus = ref({} as Record<string, any>);
    const testUsername = ref('');
    const error = ref('' as string | Error);

    const empty = () => {
      status.value = {};
      partialStatus.value = {};
    };

    const testUser = () => {
      isTesting.value = true;
      const state = v4();
      status.value = {};
      partialStatus.value = {};

      if (testUsername.value.trim().length === 0) {
        isTesting.value = false;
      } else {
        getSocket('/core/permissions').emit('test.user', {
          pid: props.permission, value: testUsername.value, state,
        }, (err, r) => {
          if (err) {
            error.value = err;
            isTesting.value = false;
            return console.error(translate('core.permissions.' + err));
          }
          error.value = '';
          if (r && r.state === state) {
            // expecting this data
            status.value = r.status;
            partialStatus.value = r.partial;
            isTesting.value = false;
          }
        });
      }
    };

    const color = () => {
      if (Number(status.value.access) === 0 && Number(partialStatus.value.access) === 0) {
        return 'error';
      } else if (Number(status.value.access) === 1 || Number(partialStatus.value.access) === 1) {
        return 'success';
      } else {
        return 'orange lighten-2';
      }
    };

    return {
      isTesting,
      status,
      partialStatus,
      testUsername,
      testUser,
      translate,
      error,
      color,
      empty,
    };
  },
});
</script>
