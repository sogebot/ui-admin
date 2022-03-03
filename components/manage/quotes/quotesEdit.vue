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
            <v-textarea
              v-model="item.quote"
              :label="capitalize(translate('systems.quotes.quote.name'))"
              :rules="rules.quote"
              required
              counter
            />
            <v-text-field
              v-model="quotedByUsername"
              :readonly="true"
              :disabled="true"
              :loading="quotedByUsername === ''"
              :label="capitalize(translate('systems.quotes.by.name'))"
            />
            <v-combobox
              v-model="tagsInput"
              :label="capitalize(translate('systems.quotes.tags.name'))"
              hide-selected
              clearable
              :search-input.sync="tagsSearch"
              :return-object="false"
              multiple
              :items="tags"
            >
              <template #no-data>
                <v-list-item>
                  <span class="subheading">Add new tag</span>
                  <strong class="pl-2">{{ tagsSearch }}</strong>
                </v-list-item>
              </template>
            </v-combobox>
          </v-form>
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

<script lang="ts">

import { useStore } from '@nuxtjs/composition-api';
import translate from '@sogebot/ui-helpers/translate';
import { getUsernameById } from '@sogebot/ui-helpers/userById';
import {
  defineComponent, onMounted, ref, watch,
} from '@vue/composition-api';
import capitalize from 'lodash/capitalize';
import cloneDeep from 'lodash/cloneDeep';
import { QuoteInterface } from '@entity/quotes';

import { EventBus } from '~/functions/event-bus';
import { getSocket } from '@sogebot/ui-helpers/socket';

const newItem = {
  createdAt: Date.now(),
  tags:      [],
  quotedBy:  '',
  quote:     '',
};

type Props = {
  rules: Record<string, any>,
  value: QuoteInterface,
}

export default defineComponent({
  props: {
    value: Object,
    rules: Object,
    tags:  Array,
  },
  setup (props: Props, ctx) {
    const saving = ref(false);

    const menu = ref(false);
    const item = ref(cloneDeep(props.value || newItem));
    const valid = ref(true);
    const form = ref(null);
    const tagsInput = ref([] as string[]);
    const quotedByUsername = ref('');
    const tagsSearch = ref('');

    const store = useStore<any>();

    onMounted(async () => {
      newItem.quotedBy = store.state.loggedUser.id;
      quotedByUsername.value = await getUsernameById(store.state.loggedUser.id);
      tagsInput.value = item.value.tags;
    });

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

    watch(tagsInput, (val) => {
      item.value.tags = val;
    });

    const save = async () => {
      if ((form.value as unknown as HTMLFormElement).validate()) {
        // check validity
        for (const key of Object.keys(props.rules)) {
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

        saving.value = true;
        console.log('Updating', item.value);
        getSocket('/systems/quotes').emit('generic::setById', { id: item.value.id, item: item.value }, (err?: Error) => {
          saving.value = false;
          if (err) {
            EventBus.$emit('snack', 'error', err);
          } else {
            EventBus.$emit('snack', 'success', 'Data updated.');
            ctx.emit('save');
            menu.value = false;
          }
        });
      }
    };

    return {
      menu, item, save, translate, capitalize, valid, saving, form, quotedByUsername, tagsInput, tagsSearch
    };
  },
});
</script>
