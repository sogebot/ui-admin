<template>
  <v-dialog
    v-model="dialog"
    transition="dialog-bottom-transition"
    fullscreen
    persistent
    hide-overlay
    large
  >
    <template #activator="{ on, attrs }">
      <div
        v-bind="attrs"
        v-on="on"
      >
        <v-list dense outlined class="dense">
          <v-list-item v-if="operations.length === 0">
            <span class="grey--text text--darken-2">No operations set for this event</span>
          </v-list-item>

          <template v-for="operation of operations">
            <v-subheader :key="operation.id + operation.name">
              {{ capitalize(translate(operation.name)) }}
            </v-subheader>
            <v-list-item
              v-for="key of Object.keys(operation.definitions)"
              :key="operation.id + key + '2'"
            >
              <strong>{{ translate('events.definitions.' + key + '.label') }}:</strong>
              <code class="ml-2">{{ operation.definitions[key] }}</code>
            </v-list-item>
          </template>
        </v-list>
      </div>
    </template>
    <v-card>
      <v-card-title class="headline">
        Update <code class="mx-2">{{ item.name }}</code> {{ translate('events.dialog.operations').toLowerCase() }}
      </v-card-title>

      <v-card-text>
        <v-form
          ref="form"
          v-model="valid"
          lazy-validation
        >
          <v-list-item
            v-for="(o, i) of operationsUpdated"
            :key="'operation' + i"
            class="item"
          >
            <v-list-item-content>
              <v-row>
                <v-col>
                  <v-autocomplete
                    v-model="o.name"
                    :items="operationItems"
                    @input="operationUpdated(i)"
                  />
                </v-col>
                <v-col>
                  <div
                    v-for="defKey of Object.keys(o.definitions)"
                    :key="defKey"
                  >
                    <v-switch
                      v-if="typeof o.definitions[defKey] === 'boolean'"
                      v-model="o.definitions[defKey]"
                      :label="translate(`events.definitions.${defKey}.label`)"
                    />
                    <v-text-field
                      v-else-if="typeof o.definitions[defKey] === 'string'"
                      v-model="o.definitions[defKey]"
                      :rules="rules[defKey]"
                      :label="translate(`events.definitions.${defKey}.label`)"
                      :hint="translate('events.definitions.' + defKey + '.placeholder')"
                      persistent-hint
                    />
                    <v-text-field
                      v-else-if="typeof o.definitions[defKey] === 'number'"
                      v-model.number="o.definitions[defKey]"
                      :rules="rules[defKey]"
                      type="number"
                      min="0"
                      :label="translate(`events.definitions.${defKey}.label`)"
                      :hint="translate('events.definitions.' + defKey + '.placeholder')"
                      persistent-hint
                    />
                  </div>
                </v-col>
                <v-col cols="auto">
                  <v-spacer />
                  <v-btn
                    icon
                    @click="remove(i)"
                  >
                    <v-icon>{{ mdiTrashCan }}</v-icon>
                  </v-btn>
                </v-col>
              </v-row>
            </v-list-item-content>
          </v-list-item>
        </v-form>
      </v-card-text>

      <v-card-actions>
        <v-btn @click="addEmptyOperation">
          Add operation
        </v-btn>
        <v-spacer />
        <v-btn
          color="blue darken-1"
          text
          @click="close"
        >
          Close
        </v-btn>
        <v-btn
          color="blue darken-1"
          text
          :disabled="!valid"
          @click="save"
        >
          Save
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts">
import { mdiTrashCan } from '@mdi/js';
import {
  computed,
  defineComponent, onMounted, ref, watch,
} from '@nuxtjs/composition-api';
import { getSocket } from '@sogebot/ui-helpers/socket';
import translate from '@sogebot/ui-helpers/translate';
import {
  capitalize, cloneDeep, orderBy,
} from 'lodash';
import { v4 as uuid } from 'uuid';

import type { EventOperationInterface, Events } from '~/.bot/src/database/entity/event';
import { error } from '~/functions/error';

export default defineComponent({
  components: {},
  props:      {
    operations: Array, item: Object, rules: Object,
  },
  setup (props, ctx) {
    let operationsBackup: any[] = [];

    const valid = ref(true);
    const form = ref(null);

    const operationsUpdated = ref(cloneDeep(props.operations ?? []) as Omit<EventOperationInterface, 'event'>[]);
    const supportedOperations = ref([] as Events.SupportedOperation[]);
    const dialog = ref(false);

    const operationItems = computed(() => {
      return supportedOperations.value.map(o => ({
        value: o.id,
        text:  capitalize(translate(o.id)),
      }));
    });

    onMounted(() => {
      getSocket('/core/events').emit('list.supported.operations', (err: string | null, data: Events.SupportedOperation[]) => {
        if (err) {
          error(err);
          return;
        }
        supportedOperations.value = data.sort((a, b) => {
          const A = translate(a.id).toLowerCase();
          const B = translate(b.id).toLowerCase();
          if (A < B) { // sort string ascending
            return -1;
          }
          if (A > B) {
            return 1;
          }
          return 0; // default return value (no sorting)
        });
      });
    });

    watch(dialog, (val) => {
      if (val) {
        operationsBackup = cloneDeep(props.operations ?? []);
      }
    });

    const save = () => {
      if ((form.value as unknown as HTMLFormElement).validate()) {
        ctx.emit('save', operationsUpdated.value);
        dialog.value = false;
      }
    };

    const close = () => {
      ctx.emit('close');
      operationsUpdated.value = cloneDeep(operationsBackup); // revert
      dialog.value = false;
    };

    const remove = (idx: number) => {
      operationsUpdated.value.splice(idx, 1);
    };

    const addEmptyOperation = () => {
      if (supportedOperations.value.length === 0) {
        return;
      }
      operationsUpdated.value.push({
        id:          uuid(),
        name:        supportedOperations.value[0].id,
        definitions: getEmptyDefinitionOf(supportedOperations.value[0].id),
      });
    };

    const getEmptyDefinitionOf = (name: string) => {
      const defaultOperation = supportedOperations.value.find(o => o.id === name);
      const emptyDefinitions = {} as Record<string, any>;
      if (defaultOperation) {
        if (Object.keys(defaultOperation.definitions).length > 0) {
          for (const [key, value] of Object.entries(defaultOperation.definitions)) {
            emptyDefinitions[key] = Array.isArray(value) ? value[0] : value; // select first option by default
          }
        }
      }
      return emptyDefinitions;
    };

    const operationUpdated = (idx: number) => {
      operationsUpdated.value.splice(idx, 1, {
        id:          operationsUpdated.value[idx].id,
        name:        operationsUpdated.value[idx].name,
        definitions: getEmptyDefinitionOf(operationsUpdated.value[idx].name),
      });
    };

    return {
      orderBy,
      translate,
      dialog,
      capitalize,
      close,
      save,
      remove,
      operationsUpdated,
      addEmptyOperation,
      operationItems,
      getEmptyDefinitionOf,
      operationUpdated,
      mdiTrashCan,
      valid,
      form,
    };
  },
});
</script>

<style scoped>
.dense .v-list-item {
  min-height: 25px !important;
}
</style>
