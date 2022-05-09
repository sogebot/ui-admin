<template>
  <div>
    <v-dialog
      v-model="menu"
      persistent
      max-width="800"
      scrollable
      :fullscreen="$vuetify.breakpoint.mobile"
    >
      <template #activator="{ on, attrs }">
        <v-btn v-if="item.id !== undefined" icon v-bind="attrs" class="primary-hover" v-on="on">
          <v-icon>
            mdi-pencil
          </v-icon>
        </v-btn>
        <v-btn v-else v-bind="attrs" color="primary" v-on="on">
          New item
        </v-btn>
      </template>
      <v-card outlined class="pt-3">
        <v-card-text>
          <v-form ref="form" v-model="valid" lazy-validation>
            <v-text-field
              v-model="item.name"
              :label="translate('name')"
              :rules="rules.name"
              hide-details="auto"
              :clearable="true"
              required
            />

            <v-text-field
              v-model.number="item.triggerEverySecond"
              type="number"
              :rules="rules.triggerEverySecond"
              :label="capitalize(translate('seconds'))"
              hide-details="auto"
            />

            <v-text-field
              v-model.number="item.triggerEveryMessage"
              type="number"
              :rules="rules.triggerEveryMessage"
              :label="capitalize(translate('messages'))"
              hide-details="auto"
            />

            <v-switch
              v-model="item.isEnabled"
              :label="translate('enabled')"
              persistent-hint
              hide-details="auto"
              :hint="(item.isEnabled
                ? 'Timer is enabled.'
                : 'Timer is disabled.')"
            />

            <v-switch
              v-model="item.tickOffline"
              :label="capitalize(translate('timers.dialog.tickOffline'))"
              persistent-hint
              hide-details="auto"
              :hint="(item.tickOffline
                ? 'Timers will be ticking, when stream is offline.'
                : 'Timers will be stopped, when stream is offline.')"
            />
          </v-form>

          <manage-timers-responses v-model="item.messages" :key="item.messages.length" />
        </v-card-text>
        <v-card-actions>
          <v-spacer />

          <v-btn text @click="menu = false">
            Cancel
          </v-btn>
          <v-btn color="primary" :loading="saving" text :disabled="!valid" @click="save()">
            Save &amp; Close
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { TimerInterface } from '@sogebot/backend/src/database/entity/timer';
import { getSocket } from '@sogebot/ui-helpers/socket';
import translate from '@sogebot/ui-helpers/translate';
import capitalize from 'lodash/capitalize';
import cloneDeep from 'lodash/cloneDeep';
import { v4 } from 'uuid';

import { EventBus } from '~/functions/event-bus';

type Props = {
  value: TimerInterface;
  rules: Record<string, any>;
};

const newItem: TimerInterface = {
  name:                '',
  isEnabled:           true,
  tickOffline:         true,
  triggerEveryMessage: 0,
  triggerEverySecond:  0,
  messages:            [],
};

const props = defineProps<Props>();
const emit = defineEmits(['save']);

const menu = ref(false);
const item = ref(cloneDeep(props.value || newItem));
const valid = ref(true);
const form = ref(null);
const saving = ref(false);

const resetForm = () => {
  valid.value = true;
  if (form.value as unknown) {
    (form.value as unknown as HTMLFormElement).resetValidation();
    item.value = cloneDeep(props.value || newItem);
  } else {
    setTimeout(() => {
      resetForm();
    }, 100);
  }
};

watch(menu, (val) => {
  if (val) {
    resetForm();
  }
});

const save = async () => {
  if ((form.value as unknown as HTMLFormElement).validate()) {
    // check validity
    for (const key of Object.keys(props.rules ?? {})) {
      for (const rule of (props.rules as any)[key]) {
        const ruleStatus = rule((item.value as any)[key]);
        if (ruleStatus === true) {
          continue;
        } else {
          EventBus.$emit('snack', 'red', `[${key}] - ${ruleStatus}`);
          return;
        }
      }
    }

    const messages = item.value.messages.filter(o => o.response.trim().length > 0);
    item.value.messages = [];
    for (const [idx, message] of Object.entries(messages)) {
      message.timestamp = Number(idx) * 100000;
      item.value.messages.push(message);
    }

    console.log('Updating', { data: item.value });

    saving.value = true;

    getSocket('/systems/timers').emit('generic::setById', {
      id:   item.value.id ?? v4(),
      item: { ...item.value },
    }, (err) => {
      if (err) {
        return console.error(err);
      }

      saving.value = false;
      menu.value = false;
      EventBus.$emit('snack', 'success', 'Data updated.');
      emit('save');
    });
  }
};
</script>
