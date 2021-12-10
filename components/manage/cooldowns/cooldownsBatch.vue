<template>
  <div>
    <v-menu
      v-model="menu"
      offset-y
      :close-on-click="false"
      min-width="400"
      :close-on-content-click="false"
      offset-overflow
    >
      <template #activator="{ on, attrs }">
        <v-btn v-bind="attrs" small v-on="on">
          Batch update
        </v-btn>
      </template>
      <v-card outlined>
        <v-card-text>
          <v-form v-model="valid" lazy-validation>
            <v-row no-gutters>
              <v-col cols="auto" align-self="center">
                <v-checkbox v-model="toggles" value="count" />
              </v-col>
              <v-col>
                <v-text-field
                  :disabled="!toggles.includes('count')"
                  v-model.number="count"
                  :label="translate('cooldown')"
                  hide-details="auto"
                  type="number"
                  :rules="rules.count"
                >
                  <template #append>
                    s
                  </template>
                </v-text-field>
              </v-col>
            </v-row>

            <v-row no-gutters>
              <v-col cols="auto" align-self="center">
                <v-checkbox v-model="toggles" value="isEnabled" />
              </v-col>
              <v-col>
                <v-switch
                  :disabled="!toggles.includes('isEnabled')"
                  v-model="isEnabled"
                  :label="translate('enabled')"
                  persistent-hint
                  hide-details="auto"
                  :hint="(isEnabled
                    ? 'Cooldown is enabled.'
                    : 'Cooldown is disabled.')"
                />
              </v-col>
            </v-row>

            <v-row no-gutters>
              <v-col cols="auto" align-self="center">
                <v-checkbox v-model="toggles" value="isErrorMsgQuiet" />
              </v-col>
              <v-col>
                <v-switch
                  :disabled="!toggles.includes('isErrorMsgQuiet')"
                  v-model="isErrorMsgQuiet"
                  :label="capitalize(translate('quiet'))"
                  persistent-hint
                  hide-details="auto"
                  :hint="(isErrorMsgQuiet
                    ? 'Cooldown won\'t send message if triggered.'
                    : 'Cooldown will send message if triggered.')"
                />
              </v-col>
            </v-row>

            <v-row no-gutters>
              <v-col cols="auto" align-self="center">
                <v-checkbox v-model="toggles" value="isOwnerAffected" />
              </v-col>
              <v-col>
                <v-switch
                  :disabled="!toggles.includes('isOwnerAffected')"
                  v-model="isOwnerAffected"
                  :label="capitalize(translate('core.permissions.casters'))"
                  persistent-hint
                  hide-details="auto"
                  :hint="(isOwnerAffected
                    ? 'Owners will be affected with cooldown.'
                    : 'Owners won\'t be affected with cooldown.')"
                />
              </v-col>
            </v-row>

            <v-row no-gutters>
              <v-col cols="auto" align-self="center">
                <v-checkbox v-model="toggles" value="isSubscriberAffected" />
              </v-col>
              <v-col>
                <v-switch
                  :disabled="!toggles.includes('isSubscriberAffected')"
                  v-model="isSubscriberAffected"
                  :label="capitalize(translate('core.permissions.subscribers'))"
                  persistent-hint
                  hide-details="auto"
                  :hint="(isSubscriberAffected
                    ? 'Subscribers will be affected with cooldown.'
                    : 'Subscribers won\'t be affected with cooldown.')"
                />
              </v-col>
            </v-row>

            <v-row no-gutters>
              <v-col cols="auto" align-self="center">
                <v-checkbox v-model="toggles" value="isModeratorAffected" />
              </v-col>
              <v-col>
                <v-switch
                  :disabled="!toggles.includes('isModeratorAffected')"
                  v-model="isModeratorAffected"
                  :label="capitalize(translate('core.permissions.moderators'))"
                  persistent-hint
                  hide-details="auto"
                  :hint="(isModeratorAffected
                    ? 'Moderators will be affected with cooldown.'
                    : 'Moderators won\'t be affected with cooldown.')"
                />
              </v-col>
            </v-row>

            <v-row no-gutters>
              <v-col cols="auto" align-self="center">
                <v-checkbox v-model="toggles" value="isFollowerAffected" />
              </v-col>
              <v-col>
                <v-switch
                  :disabled="!toggles.includes('isFollowerAffected')"
                  v-model="isFollowerAffected"
                  :label="capitalize(translate('core.permissions.followers'))"
                  persistent-hint
                  hide-details="auto"
                  :hint="(isFollowerAffected
                    ? 'Followers will be affected with cooldown.'
                    : 'Followers won\'t be affected with cooldown.')"
                />
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer />

          <v-btn text @click="menu = false">
            Cancel
          </v-btn>
          <v-btn color="primary" text :disabled="!valid" @click="save()">
            Save
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-menu>
  </div>
</template>

<script lang="ts">

import translate from '@sogebot/ui-helpers/translate';
import {
  defineComponent, ref, watch,
} from '@vue/composition-api';
import capitalize from 'lodash/capitalize';

type Props = {
  length: number;
};

export default defineComponent({
  props: {
    length: Number,
    rules:  Object,
  },
  setup (props: Props, ctx) {
    const menu = ref(false);
    const valid = ref(true);

    watch(menu, (val) => {
      if (val) {
        toggles.value = [];
      }
    });

    const toggles = ref([] as string[]);

    const count = ref(60);
    const isEnabled = ref(false);
    const isErrorMsgQuiet = ref(false);
    const isOwnerAffected = ref(false);
    const isSubscriberAffected = ref(false);
    const isFollowerAffected = ref(false);
    const isModeratorAffected = ref(false);

    const save = () => {
      ctx.emit('save', {
        miliseconds: toggles.value.includes('count')
          ? count.value * 1000
          : undefined,
        isEnabled: toggles.value.includes('isEnabled')
          ? isEnabled.value
          : undefined,
        isErrorMsgQuiet: toggles.value.includes('isErrorMsgQuiet')
          ? isErrorMsgQuiet.value
          : undefined,
        isOwnerAffected: toggles.value.includes('isOwnerAffected')
          ? isOwnerAffected.value
          : undefined,
        isSubscriberAffected: toggles.value.includes('isSubscriberAffected')
          ? isSubscriberAffected.value
          : undefined,
        isFollowerAffected: toggles.value.includes('isFollowerAffected')
          ? isFollowerAffected.value
          : undefined,
        isModeratorAffected: toggles.value.includes('isModeratorAffected')
          ? isModeratorAffected.value
          : undefined,
      });
      menu.value = false;
    };

    return {
      count,
      toggles,
      isEnabled,
      isErrorMsgQuiet,
      isFollowerAffected,
      isOwnerAffected,
      isModeratorAffected,
      isSubscriberAffected,

      menu,
      save,
      translate,
      capitalize,
      valid,
    };
  },
});
</script>
