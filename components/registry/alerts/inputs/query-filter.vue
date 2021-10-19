<template>
  <div>
    <v-row v-if="!noInput">
      <v-col>
        <v-textarea v-model="stringifiedFilter" :label="translate('registry.alerts.filter.name')" auto-grow rows="1" readonly />
      </v-col>
      <v-col cols="auto">
        <v-btn-toggle v-model="editationMode">
          <v-btn icon value="true">
            <v-icon>{{ mdiCog }}</v-icon>
          </v-btn>
        </v-btn-toggle>
      </v-col>
    </v-row>

    <v-expand-transition>
      <v-card v-if="editationMode" elevation="2" color="grey darken-4">
        <v-card-text>
          <v-row>
            <v-col cols="2">
              <v-select
                v-model="_filter.operator"
                :label="translate('registry.alerts.filter.operator')"
                :items="['and', 'or', 'and not', 'or not']"
              />
            </v-col>
            <v-col cols="3">
              <v-select
                v-model="addRuleType[0]"
                :label="translate('registry.alerts.filter.rule')"
                :items="rules.map(o => o[0])"
              />
            </v-col>
            <v-col align-self="center">
              <v-btn
                small
                @click="_filter.items.push({
                  type: addRuleType[0],
                  typeof: getRuleType(addRuleType[0]),
                  comparator: 'eq',
                  value: getRuleDefaultValue(addRuleType[0]),
                })"
              >
                {{ translate('registry.alerts.filter.addRule') }}
              </v-btn>
              <v-btn small @click="_filter.items.push(null)">
                {{ translate('registry.alerts.filter.addGroup') }}
              </v-btn>
            </v-col>
            <v-col
              v-if="deletable"
              cols="auto"
              align-self="center"
            >
              <v-btn
                variant="outline-danger"
                class="border-0"
                icon
                @click="deleteGroup"
              >
                <v-icon color="red">
                  {{ mdiDelete }}
                </v-icon>
              </v-btn>
            </v-col>
          </v-row>

          <v-card v-if="_filter.items.length > 0" elevation="2">
            <template v-for="(item, index) in _filter.items">
              <v-card-text
                v-if="item !== null && typeof item.items === 'undefined'"
                :key="'item' + index"
              >
                <v-row
                  align="end"
                  no-gutters
                >
                  <v-col
                    class="align-items-end"
                    no-gutters
                  >
                    <v-row>
                      <v-col align-self="center">
                        {{ item.type }}
                      </v-col>
                      <v-col
                        cols="4"
                        class="pr-2"
                      >
                        <v-select
                          v-model="item.comparator"
                          :label="translate('registry.alerts.filter.comparator')"
                          :items="generateComparators(item.type)"
                        />
                      </v-col>
                      <v-col class="pr-2">
                        <template v-if="!['is-even', 'is-odd', 'pr'].includes(item.comparator)">
                          <v-select
                            v-if="getRuleType(item.type) === 'tier'"
                            :label="translate('registry.alerts.filter.value')"
                            :items="['Prime', '1', '2', '3']"
                            v-model="item.value"
                          />
                          <v-text-field
                            v-else-if="getRuleType(item.type) === 'number'"
                            v-model.number="item.value"
                            :label="translate('registry.alerts.filter.value')"
                            type="number"
                          />
                          <v-text-field
                            v-else-if="item.comparator === 'includes'"
                            v-model.number="item.value"
                            :label="translate('registry.alerts.filter.value')"
                            type="number"
                            :hint="translate('registry.alerts.filter.valueSplitByComma')"
                          />
                          <v-text-field
                            v-else
                            v-model="item.value"
                            :label="translate('registry.alerts.filter.value')"
                          />
                        </template>
                      </v-col>
                      <v-col
                        cols="auto"
                        align-self="end"
                      >
                        <v-btn
                          variant="outline-danger"
                          class="border-0"
                          icon
                          align-self="center"
                          @click="deleteItem(index)"
                        >
                          <v-icon color="red">
                            {{ mdiDelete }}
                          </v-icon>
                        </v-btn>
                      </v-col>
                    </v-row>
                  </v-col>
                </v-row>
              </v-card-text>
              <v-card-text
                v-else
                :key="'item' + index"
              >
                <query-filter
                  v-model="_filter.items[index]"
                  :rules="rules"
                  no-input
                  deletable
                  @delete="deleteItem(index, true)"
                />
              </v-card-text>
            </template>
          </v-card>
        </v-card-text>
      </v-card>
    </v-expand-transition>
  </div>
</template>

<script lang="ts">
import { mdiCog, mdiDelete } from '@mdi/js';
import {
  computed, defineAsyncComponent, defineComponent, ref, watch,
} from '@nuxtjs/composition-api';
import translate from '@sogebot/ui-helpers/translate';

import type { Filter } from '~/.bot/src/database/entity/alert';

type Props = {
  value: string,
  noInput: boolean,
  deletable: boolean,
  rules: [[string, string]]
};
export default defineComponent({
  components: { queryFilter: defineAsyncComponent(() => import('~/components/registry/alerts/inputs/query-filter.vue')) },
  props:      {
    value:     String,
    rules:     Array,
    noInput:   Boolean,
    deletable: Boolean,
  },
  setup (props: Props, ctx) {
    const _filter = ref((props.value !== null
      ? JSON.parse(props.value)
      : {
        operator: 'and',
        items:    [],
      }) as Filter);
    const editationMode = ref(props.noInput);
    const addRuleType = ref([props.rules[0][0]]);

    const getRuleDefaultValue = (type: string) => {
      switch (getRuleType(type)) {
        case 'string':
          return '';
        case 'number':
          return 0;
        case 'tier':
          return 'Prime';
      }
    };

    const getRuleType = (type: string) => {
      const rule = props.rules.find(o => o[0] === type);
      if (!rule) {
        return 'string';
      } else {
        return rule[1];
      }
    };

    const itemsToStringifiedPart = (items: any[], operator: string): string => {
      let output = '';
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item !== null && typeof item.items === 'undefined') {
          if (i > 0) {
            output += ` ${operator} `;
          }

          if (item.typeof === 'string') {
            if (['pr'].includes(item.comparator)) {
              output += `${item.type} ${item.comparator}`;
            } else if (['includes'].includes(item.comparator)) {
              output += `${item.type} ${item.comparator} [${item.value.split(',').map((o: string) => `'${o.trim()}'`).join(', ')}]`;
            } else {
              output += `${item.type} ${item.comparator} '${item.value}'`;
            }
          } else if (item.typeof === 'tier') {
            const value = item.value === 'Prime' ? 'Prime' : item.value;
            output += `${item.type} ${item.comparator} ${value}`;
          } else if (['is-even', 'is-odd', 'pr'].includes(item.comparator)) {
            output += `${item.type} ${item.comparator}`;
          } else {
            output += `${item.type} ${item.comparator} ${item.value}`;
          }
        } else if (item !== null && item.items.length > 0) {
          if (i > 0) {
            output += ` ${operator} `;
          }

          output += '(' + itemsToStringifiedPart(item.items, item.operator) + ')';
        }
      }
      return output;
    };

    const stringifiedFilter = computed(() => {
      if (_filter.value) {
        const filter = itemsToStringifiedPart(_filter.value.items, _filter.value.operator);
        return filter.length > 0 ? filter : `<< ${translate('registry.alerts.filter.noFilter')} >>`;
      }
      return `<< ${translate('registry.alerts.filter.noFilter')} >>`;
    });

    const deleteItem = (index: number, skipConfirm = false) => {
      if (_filter.value) {
        const item = _filter.value.items[index];
        if (typeof item !== 'undefined' && (skipConfirm || confirm('Do you want to permanently delete this rule?'))) {
          _filter.value.items.splice(index, 1);
        }
      }
    };

    const deleteGroup = () => {
      if (confirm('Do you want to permanently delete this group?')) {
        ctx.emit('delete'); // parent need to remove this
      }
    };

    const generateComparators = (type: 'number' | 'string') => {
      const items = [];

      if (getRuleType(type) === 'number') {
        items.push({ value: 'is-even', text: translate('registry.alerts.filter.isEven') });
        items.push({ value: 'is-odd', text: translate('registry.alerts.filter.isOdd') });
      }

      if (getRuleType(type) !== 'string') {
        items.push({ value: 'lt', text: translate('registry.alerts.filter.lessThan') });
        items.push({ value: 'lt-eq', text: translate('registry.alerts.filter.lessThanOrEqual') });
      }

      if (getRuleType(type) === 'string') {
        items.push({ value: 'co', text: translate('registry.alerts.filter.contain') });
      }

      items.push({ value: 'eq', text: translate('registry.alerts.filter.equal') });
      items.push({ value: 'neq', text: translate('registry.alerts.filter.notEqual') });
      items.push({ value: 'pr', text: translate('registry.alerts.filter.present') });

      if (getRuleType(type) === 'string') {
        items.push({ value: 'includes', text: translate('registry.alerts.filter.includes') });
      }

      if (getRuleType(type) !== 'string') {
        items.push({ value: 'gt', text: translate('registry.alerts.filter.greaterThan') });
        items.push({ value: 'gt-eq', text: translate('registry.alerts.filter.greaterThanOrEqual') });
      }

      return items;
    };

    watch(_filter, (val) => {
      ctx.emit('input', JSON.stringify(val));
    }, { deep: true });

    return {
      _filter,
      editationMode,
      addRuleType,
      getRuleType,
      getRuleDefaultValue,
      generateComparators,
      stringifiedFilter,
      deleteItem,
      deleteGroup,
      translate,
      mdiCog,
      mdiDelete,
    };
  },
});
</script>
