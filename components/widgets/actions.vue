<template>
  <v-card id="c7eff6a7-dc62-4c0b-bad6-90df9d5b605f" width="100%" height="100%">
    <v-toolbar color="blue-grey darken-4" class="mb-1" height="36">
      <v-toolbar-title class="text-button">
        Actions
      </v-toolbar-title>
      <v-spacer />
      <v-btn icon :color="editing ? 'primary' : 'secondary lighten-2'" @click="editing = !editing">
        <v-icon>{{ mdiCircleEditOutline }}</v-icon>
      </v-btn>
    </v-toolbar>

    <v-row dense>
      <v-col cols="12">
        <v-expand-transition v-for="(item, idx) of items" :key="item.id + 'transition'">
          <component
            :is="item.type"
            :key="item.id"
            :item="item"
            :editing="editing"
            @update:item="updateItem(idx, $event)"
          />
        </v-expand-transition>
      </v-col>
    </v-row>
    <v-row v-if="isAnySelected && editing">
      <v-col cols="12">
        <v-btn color="error" block @click="deleteItems">
          Delete
        </v-btn>
      </v-col>
    </v-row>
  </v-card>
</template>

<script lang="ts">
import { mdiCircleEditOutline } from '@mdi/js';
import {
  computed,
  defineAsyncComponent,
  defineComponent, onMounted, ref,
} from '@vue/composition-api';

export default defineComponent({
  components: { custom: defineAsyncComponent({ loader: () => import('~/components/widgets/actions/custom.vue') }) },
  setup () {
    const editing = ref(true);
    const height = ref(600);

    const selectedItems = computed(() => {
      return items.value.filter(o => o.selected);
    });
    const isAnySelected = computed(() => {
      return selectedItems.value.length > 0;
    });

    const items = ref([{
      id:       '2f1e3ea3-3071-4781-948a-978e7b362ed5',
      title:    'Add 5 to $_test',
      color:    'green',
      type:     'custom',
      selected: false,
    }, {
      id:       '2f1e3ea3-3072-4781-948a-978e7b362ed5',
      title:    'Run commercial 30s',
      color:    'deep-orange',
      type:     'custom',
      selected: false,
    }, {
      id:       '2f1e3ea3-4072-4781-948a-978e7b362ed5',
      title:    'PUBG Poll',
      color:    'cyan',
      type:     'custom',
      selected: false,
    }]);

    function updateHeight () {
      // so. many. parentElement. to get proper offsetTop as children offset is 0
      const offsetTop = document.getElementById('c7eff6a7-dc62-4c0b-bad6-90df9d5b605f')?.parentElement?.parentElement?.parentElement?.parentElement?.offsetTop || 0;
      const offset = 95;
      const newHeight = window.innerHeight - offsetTop - offset;
      height.value = Math.max(newHeight, 500);
    }

    function updateItem (idx: number, item: typeof items.value[number]) {
      items.value.splice(idx, 1, item);
    }

    function deleteItems () {
      items.value = items.value.filter(item => !item.selected);
    }

    onMounted(() => {
      setInterval(() => updateHeight(), 1000);
    });

    return {
      /* refs */
      isAnySelected,
      selectedItems,
      editing,
      height,
      items,

      /* functions */
      updateItem,
      deleteItems,

      /* icons */
      mdiCircleEditOutline,
    };
  },
});
</script>
