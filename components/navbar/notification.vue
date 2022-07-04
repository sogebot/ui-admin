<template>
  <v-menu :key="'notifications-' + $store.state.navbarMiniVariant" offset-x nudge-right="10" :rounded="false" :close-on-content-click="false" v-if="$store.state.notifications.length > 0">
    <template #activator="{ on, attrs }">
      <v-tooltip v-if="$store.state.navbarMiniVariant && !$vuetify.breakpoint.mobile" right>
        <template #activator="{ on: on2, attrs: attrs2 }">
          <div v-bind="attrs2 && attrs" style="position: relative;" v-on="on2 && on">
            <v-badge
              :content="$store.state.notifications.length"
              color="red"
              overlap
              class="mb-3 pa-2"
              :offset-x="20"
              :offset-y="20"
              style="cursor: pointer;"
            >
              <v-icon class="miniIcon" v-bind="attrs" v-on="on">
                mdi-bell-ring
              </v-icon>
            </v-badge>
          </div>
        </template>
        <span>{{ translate('menu.notifications') }}</span>
      </v-tooltip>
      <v-badge
        v-else
        :content="$store.state.notifications.length"
        color="red"
        overlap
        class="mb-2"
        :offset-x="40"
        :offset-y="20"
        style="cursor: pointer; width: 100%;"
        left
      >
        <v-list-item style="cursor: pointer;" v-bind="attrs" v-on="on">
          <v-list-item-icon>
            <v-icon>mdi-bell-ring</v-icon>
          </v-list-item-icon>
          <v-list-item-title>{{ translate('menu.notifications') }}</v-list-item-title>
        </v-list-item>
      </v-badge>
    </template>

    <div style="background-color: black;">
      <v-alert
        v-if="$store.state.notifications.includes('caster-not-set')"
        type="error"
        max-width="400px"
        class="mb-1"
        tile
        border="bottom"
        dense
        text
        transition="scroll-x-transition"
      >
        <h5>{{ translate('errors.owner_and_broadcaster_oauth_is_not_set') }}</h5>
        <div
          class="text-caption"
          v-html="translate('errors.please_set_your_broadcaster_oauth_or_owners')"
        />
      </v-alert>
      <v-alert
        v-if="$store.state.notifications.includes('new-version-available')"
        type="info"
        max-width="400px"
        class="mb-1"
        tile
        border="bottom"
        dense
        text
        transition="scroll-x-transition"
      >
        <h5>{{ translate('errors.new_update_available') }}</h5>
        <div
          class="text-caption"
          v-html="translate('errors.new_bot_version_available_at', { version: $store.state.nextVersion })"
        />
      </v-alert>
    </div>
  </v-menu>
</template>

<script lang="ts">
import { defineComponent } from '@vue/composition-api'
import { translate } from '@sogebot/ui-helpers/translate'

export default defineComponent({
  setup() {
    return {
      translate
    }
  },
})
</script>
