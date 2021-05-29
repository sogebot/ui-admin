<template>
  <v-container fluid class="pa-0">
    <slot />

    <v-checkbox v-if="isChild" v-model="isOverriden" :label="translate('registry.alerts.font.overrideGlobal')" />

    <template v-if="!isChild || isChild && isOverriden">
      <v-autocomplete
        :id="id + '|fontfamily'"
        v-model="model.family"
        :label="translate('registry.alerts.font.name')"
        :items="fonts"
        validate-on-blur
      />
      <v-select
        v-if="model.align"
        v-model="model.align"
        :label="translate('registry.alerts.align.name')"
        :items="alignItems"
      />
      <v-slider
        v-model="model.size"
        :label="translate('registry.alerts.font.size.name')"
        class="align-center"
        :max="200"
        :min="1"
        hide-details
      >
        <template #append>
          <v-text-field
            v-model="model.size"
            class="mt-0 pt-0"
            hide-details
            single-line
            type="number"
            style="width: 70px;"
          >
            <template #append>
              px
            </template>
          </v-text-field>
        </template>
      </v-slider>
      <v-slider
        v-model="model.weight"
        :label="translate('registry.alerts.font.weight.name')"
        class="align-center"
        :max="900"
        :min="100"
        :step="100"
        hide-details
      >
        <template #append>
          <v-text-field
            v-model="model.weight"
            class="mt-0 pt-0"
            hide-details
            single-line
            type="number"
            style="width: 70px;"
          />
        </template>
      </v-slider>
      <v-slider
        v-model="model.borderPx"
        :label="translate('registry.alerts.font.borderPx.name')"
        class="align-center"
        :max="100"
        :min="0"
        hide-details
      >
        <template #append>
          <v-text-field
            v-model="model.borderPx"
            class="mt-0 pt-0"
            hide-details
            single-line
            type="number"
            style="width: 70px;"
          >
            <template #append>
              px
            </template>
          </v-text-field>
        </template>
      </v-slider>
      <color
        v-if="model.color"
        :id="id + '|fontcolor'"
        v-model="model.color"
        :label="translate('registry.alerts.font.color.name')"
      />
      <color
        :id="id + '|fontbordercolor'"
        v-model="model.borderColor"
        :label="translate('registry.alerts.font.borderColor.name')"
      />
      <color
        v-if="model.highlightcolor"
        :id="id + '|fonthighlightcolor'"
        v-model="model.highlightcolor"
        :label="translate('registry.alerts.font.highlightcolor.name')"
      />
    </template>
  </v-container>
</template>

<script lang="ts">
import {
  shadowGenerator,
  textStrokeGenerator,
} from '@sogebot/ui-helpers/text';
import translate from '@sogebot/ui-helpers/translate';
import {
  defineAsyncComponent,
  defineComponent,
  onBeforeMount,
  ref,
  watch,
} from '@vue/composition-api';
import { cloneDeep } from 'lodash-es';

import { required } from '~/functions/validators';

function loadFont (value: string) {
  const head = document.getElementsByTagName('head')[0];
  const style = document.createElement('style');
  style.type = 'text/css';
  console.debug('Loading font', value);
  const font = value.replace(/ /g, '+');
  const css = '@import url(\'https://fonts.googleapis.com/css?family=' + font + '\');';
  style.appendChild(document.createTextNode(css));
  head.appendChild(style);
}

interface Props {
  title ? : string;
  isChild: boolean;
  parent ? : {
    align ? : 'left' | 'center' | 'right';
    family: string;
    size: number;
    borderPx: number;
    borderColor: string;
    shadow: {
      shiftRight: number;
      shiftDown: number;
      blur: number;
      opacity: number;
      color: string;
    } [];
    weight: number;
    color ? : string;
    highlightcolor ? : string;
  },
  value: {
    align ? : 'left' | 'center' | 'right';
    family: string;
    size: number;
    borderPx: number;
    borderColor: string;
    shadow: {
      shiftRight: number;
      shiftDown: number;
      blur: number;
      opacity: number;
      color: string;
    } [];
    weight: number;
    color ? : string;
    highlightcolor ? : string;
  } | null
}
export default defineComponent({
  components: { color: defineAsyncComponent({ loader: () => import('~/components/form/color.vue') }) },
  props:      {
    parent:  Object,
    value:   Object,
    isChild: Boolean,
    title:   [String, Object],
    id:      String,
  },
  setup (props: Props, ctx) {
    const exampleColor = ref('#000000');
    const model = ref(props.value);
    const fonts = ref([] as {
      text: string;value: string
    } []);
    const isOverriden = ref(props.value !== null);

    const rules = { family: [required] };

    const alignItems = [{
      value: 'left',
      text:  translate('registry.alerts.font.align.left'),
    },
    {
      value: 'right',
      text:  translate('registry.alerts.font.align.right'),
    },
    {
      value: 'center',
      text:  translate('registry.alerts.font.align.center'),
    },
    ];

    watch(model, (val) => {
      ctx.emit('update:value', val);
    });

    const addShadow = () => {
      model.value?.shadow.push({
        shiftRight: 1,
        shiftDown:  1,
        blur:       5,
        opacity:    100,
        color:      '#ffffff',
      });
    };

    const removeShadow = (index: number) => {
      model.value?.shadow.splice(index, 1);
    };

    onBeforeMount(async () => {
      const {
        response,
      } = await new Promise < {
        response: Record < string,
        any >
      } >((resolve) => {
        const request = new XMLHttpRequest();
        request.open('GET', (process.env.isNuxtDev ? 'http://localhost:20000' : '') + '/fonts', true);

        request.onload = function () {
          if (!(this.status >= 200 && this.status < 400)) {
            console.error('Something went wrong getting font', this.status, this.response);
          }
          resolve({ response: JSON.parse(this.response) });
        };
        request.onerror = function () {
          console.error('Connection error to sogebot');
          resolve({ response: {} });
        };

        request.send();
      });
      for (const font of response.items.map((o: {
        family: string
      }) => {
        return {
          text:  o.family,
          value: o.family,
        };
      })) {
        fonts.value.push(font);
      }
      if (model.value) {
        loadFont(model.value.family);
      }
    });

    watch(() => model.value ? model.value.family : '', (val) => {
      if (val === '') {
        if (model.value !== null) {
          console.log(fonts.value[0]);
          console.log(model.value.family);
          model.value.family = fonts.value[0].value;
        }
      } else {
        loadFont(val);
      }
    });
    watch(isOverriden, (val) => {
      if (val) {
        // add default values
        console.log(props);
        if (!props.parent) {
          model.value = {
            align:          'center',
            family:         'PT Sans',
            size:           24,
            borderPx:       1,
            borderColor:    '#000000',
            weight:         800,
            color:          '#ffffff',
            highlightcolor: '#00ff00',
            shadow:         [] as {
              shiftRight: number;
              shiftDown: number;
              blur: number;
              opacity: number;
              color: string;
            } [],
          };
        } else {
          model.value = cloneDeep(props.parent as any);
        }
      } else {
        model.value = null;
      }
    });

    return {
      rules,
      alignItems,
      textStrokeGenerator,
      shadowGenerator,
      exampleColor,
      fonts,
      addShadow,
      removeShadow,
      translate,
      model,
      isOverriden,
    };
  },
});
</script>
