<template>
  <div>
    <v-card-text
      v-ripple
      class="text-button pa-1 mb-1 text-center"
      style="font-size: 12px !important; display: block;"
      :style="{ 'color': color }"
      @click="!editing ? trigger($event) : showDialog()"
    >
      <v-row v-if="item.type === 'customvariable'" no-gutters ripple>
        <v-slide-x-transition>
          <v-col v-if="editing" cols="auto" class="d-flex">
            <v-simple-checkbox v-if="color !== 'white'" v-model="selected" light />
            <v-simple-checkbox v-else v-model="selected" dark />
          </v-col>
        </v-slide-x-transition>
        <template v-if="customVariable && customVariable.type === 'eval'">
          <v-col class="text-truncate" style="line-height: normal;">
            <div>Eval cannot be used</div>
            <div class="font-weight-light">
              {{ item.options.customvariable }}
            </div>
          </v-col>
        </template>
        <template v-if="customVariable && customVariable.type === 'number'">
          <v-col v-if="!editing" cols="auto" class="d-flex">
            <v-icon class="minus" :color="color">
              mdi-minus
            </v-icon>
          </v-col>
          <v-col class="text-truncate text" style="line-height: normal;">
            <div style="font-size: 1.2rem;">
              {{ customVariable.currentValue }}
            </div>
            <div class="font-weight-light">
              {{ item.options.customvariable }}
            </div>
          </v-col>

          <v-col v-if="!editing" cols="auto" class="d-flex">
            <v-icon class="plus" :color="color">
              mdi-plus
            </v-icon>
          </v-col>
        </template>
        <template v-if="customVariable && customVariable.type === 'options'">
          <v-col class="text-truncate text" style="line-height: normal;">
            <div>
              {{ customVariable.currentValue }}
            </div>
            <div class="font-weight-light">
              {{ item.options.customvariable }}
            </div>
          </v-col>

          <v-col v-if="!editing" cols="auto" class="d-flex" :color="color">
            <v-icon>mdi-chevron-down</v-icon>
          </v-col>
        </template>
        <template v-if="customVariable && customVariable.type === 'text'">
          <v-col class="text-truncate text" style="line-height: normal;">
            <div>
              {{ customVariable.currentValue.length === 0 ? '&nbsp;' : customVariable.currentValue }}
            </div>
            <div class="font-weight-light">
              {{ item.options.customvariable }}
            </div>
          </v-col>

          <v-col v-if="!editing" cols="auto" class="d-flex" :color="color">
            <v-icon>mdi-pencil</v-icon>
          </v-col>
        </template>
      </v-row>
    </v-card-text>

    <v-expand-transition>
      <div v-if="showMenu && customVariable && customVariable.type === 'text'">
        <v-text-field
          v-model="customVariable.currentValue"
          filled
          dense
          hide-details
          placeholder="Set your value"
          class="pa-0 ma-0"
          @input="debouncedTrigger($event, customVariable.currentValue)"
        />
      </div>
    </v-expand-transition>

    <v-expand-transition>
      <div v-if="showMenu && customVariable && customVariable.type === 'options'">
        <v-list dense>
          <v-list-item v-for="(item, index) in customVariable.usableOptions" :key="index">
            <v-list-item-title @click="trigger($event, item)">
              {{ item }}
            </v-list-item-title>
          </v-list-item>
        </v-list>
      </div>
    </v-expand-transition>
  </div>
</template>

<script setup lang="ts">
import { VariableInterface } from '@entity/variable';
import gql from 'graphql-tag';
import { debounce } from 'lodash';

const { $graphql } = useNuxtApp();
const props = defineProps<{
  item: Record<string, any>,
  dialog: boolean,
  color: string,
  editing: boolean,
}>();

const customVariable = ref(null as VariableInterface | null);
const refresh = async () => {
  customVariable.value = (await $graphql.default.request(gql`
      query customVariable($name: String!) {
        customVariable(name: $name) { id currentValue type }
      }
    `, { name: props.item.options.customvariable })).customVariable[0];
  loading.value = false;
  setTimeout(() => refresh(), 5000);
};

onMounted(() => {
  refresh();
});

const selected = ref(props.item.selected);
watch(selected, (val) => {
  ctx.emit(val ? 'select' : 'unselect');
});

const showMenu = ref(false);

const showDialog = () => {
  ctx.emit('update:dialog', true);
};

const debouncedTrigger = debounce((ev: MouseEvent, value?: string) => trigger(ev, value), 1000);
const trigger = (ev: MouseEvent, value?: string) => {
  if (customVariable.value && (customVariable.value.type === 'options' || customVariable.value.type === 'text')) {
    if (typeof value === 'undefined') {
      showMenu.value = !showMenu.value;
    } else {
      console.log(`quickaction::trigger::${props.item.id}`);
      customVariable.value.currentValue = value;
      triggerMutation({ id: props.item.id, value: value.trim() });
    }
  } else if (customVariable.value && customVariable.value.type === 'number') {
    // determinate which part of button is pushed
    const card = document.getElementById(`quickaction-${props.item.id}`) as HTMLElement;
    const text = document.getElementsByClassName(`text`)[0] as HTMLElement;

    const getClassList = (el: Element) => {
      if (el.tagName === 'path') {
        return (Array.from(el.parentElement?.parentElement?.classList ?? []));
      } if (el.tagName === 'SPAN') {
        return (Array.from(el.classList ?? []));
      } else {
        return (Array.from(el.parentElement?.classList ?? []));
      }
    };

    const mouseOffsetX = ev.offsetX;
    const isText = getClassList(ev.target as Element).includes('text');

    const isDecrement = !getClassList(ev.target as Element).includes('plus')
          && (getClassList(ev.target as Element).includes('minus') || mouseOffsetX < ((isText ? text.clientWidth : card.clientWidth) / 2));

    customVariable.value.currentValue = String(isDecrement
      ? Number(customVariable.value.currentValue) - 1
      : Number(customVariable.value.currentValue) + 1);
    console.log(`quickaction::trigger::${props.item.id}`);
    $graphql.default.request(gql`
      mutation quickActionTrigger($id: String!, $value: String!) {
        quickActionTrigger(id: $id, value: $value)
      }`, { id: props.item.id, value: isDecrement ? '-1' : '+1' });
  } else {
    console.log(`quickaction::trigger::${props.item.id}`);
    $graphql.default.request(gql`
      mutation quickActionTrigger($id: String!, $value: String!) {
        quickActionTrigger(id: $id, value: $value)
      }`, { id: props.item.id });
  }
};
</script>
