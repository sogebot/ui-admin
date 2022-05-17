<template>
  <v-container fluid :class="{ 'pa-4': !$vuetify.breakpoint.mobile }">
    <slot />

    <v-checkbox v-if="isChild" v-model="isOverriden" :label="translate('registry.alerts.font.overrideGlobal')" />
    <v-expand-transition>
      <div v-if="!isChild || isChild && isOverriden">
        <v-autocomplete
          :id="id + '|fontfamily'"
          v-model="model.family"
          :label="translate('registry.alerts.font.name')"
          :items="fonts"
          validate-on-blur
        />
        <v-select
          v-if="model.align !== undefined && model.align !== null"
          v-model="model.align"
          :label="translate('registry.alerts.font.align.name')"
          :items="alignItems"
        />
        <v-slider
          v-if="model.size !== undefined && model.size !== null"
          v-model="model.size"
          :label="translate('registry.alerts.font.size.name')"
          class="align-center"
          :max="200"
          :min="1"
          :thumb-size="0"
          thumb-label="always"
        >
          <template #thumb-label="{ value }">
            <div style="transform: translateY(-8px);">
              {{ Number(value) + 'px' }}
            </div>
          </template>
        </v-slider>
        <v-slider
          v-model="model.weight"
          :label="translate('registry.alerts.font.weight.name')"
          class="align-center"
          :max="900"
          :min="100"
          :step="100"
          :thumb-size="0"
          thumb-label="always"
        >
          <template #thumb-label="{ value }">
            <div style="transform: translateY(-8px);">
              {{ Number(value) }}
            </div>
          </template>
        </v-slider>
        <v-slider
          v-if="model.borderPx !== undefined && model.borderPx !== null"
          v-model="model.borderPx"
          :label="translate('registry.alerts.font.borderPx.name')"
          class="align-center"
          :max="100"
          :min="0"
          :thumb-size="0"
          thumb-label="always"
        >
          <template #thumb-label="{ value }">
            <div style="transform: translateY(-8px);">
              {{ Number(value) + 'px' }}
            </div>
          </template>
        </v-slider>
        <color
          v-if="model.color !== undefined && model.color !== null"
          :id="id + '|fontcolor'"
          v-model="model.color"
          :label="translate('registry.alerts.font.color.name')"
        />
        <color
          v-if="model.borderColor !== undefined && model.borderColor !== null"
          :id="id + '|fontbordercolor'"
          v-model="model.borderColor"
          :label="translate('registry.alerts.font.borderColor.name')"
        />
        <color
          v-if="model.highlightcolor !== undefined && model.highlightcolor !== null"
          :id="id + '|fonthighlightcolor'"
          v-model="model.highlightcolor"
          :label="translate('registry.alerts.font.highlightcolor.name')"
        />

        <v-card v-if="model.shadow !== undefined && model.shadow !== null">
          <v-card-text class="pa-0">
            <v-row no-gutters>
              <v-col cols="11">
                <v-fade-transition leave-absolute>
                  <v-alert v-if="model.shadow.length === 0" text color="info" border="left" class="ma-0">
                    There are no shadow.
                    Create a new shadow using the <b>+</b> button on the right.
                  </v-alert>
                  <v-tabs
                    v-else
                    ref="tabs"
                    v-model="selectedTab"
                    show-arrows
                    center-active
                    leave-absolute
                  >
                    <v-tab v-for="(shadow, idx) of model.shadow" :key="'shadow' + idx">
                      Shadow {{ idx + 1 }}
                    </v-tab>
                  </v-tabs>
                </v-fade-transition>
              </v-col>
              <v-col cols="1" class="text-center" align-self="center">
                <v-btn icon @click="addShadow">
                  <v-icon>mdi-plus</v-icon>
                </v-btn>
              </v-col>
            </v-row>

            <v-expand-transition>
              <v-tabs-items v-if="model.shadow.length > 0" v-model="selectedTab">
                <v-tab-item v-for="(shadow, idx) of model.shadow" :key="'shadow2' + idx" class="ma-2">
                  <v-slider
                    v-model="shadow.shiftRight"
                    :label="translate('dialog.font.shadowShiftRight')"
                    class="align-center"
                    :max="50"
                    :min="-50"
                    :thumb-size="0"
                    thumb-label="always"
                  >
                    <template #thumb-label="{ value }">
                      <div style="transform: translateY(-8px);">
                        {{ Number(value) + 'px' }}
                      </div>
                    </template>
                  </v-slider>
                  <v-slider
                    v-model="shadow.shiftDown"
                    :label="translate('dialog.font.shadowShiftDown')"
                    class="align-center"
                    :max="50"
                    :min="-50"
                    :thumb-size="0"
                    thumb-label="always"
                  >
                    <template #thumb-label="{ value }">
                      <div style="transform: translateY(-8px);">
                        {{ Number(value) + 'px' }}
                      </div>
                    </template>
                  </v-slider>
                  <v-slider
                    v-model="shadow.blur"
                    :label="translate('dialog.font.shadowBlur')"
                    class="align-center"
                    :max="50"
                    :min="0"
                    :thumb-size="0"
                    thumb-label="always"
                  >
                    <template #thumb-label="{ value }">
                      <div style="transform: translateY(-8px);">
                        {{ Number(value) }}
                      </div>
                    </template>
                  </v-slider>
                  <v-slider
                    v-model="shadow.opacity"
                    :label="translate('dialog.font.shadowOpacity')"
                    class="align-center"
                    :max="100"
                    :min="0"
                    :thumb-size="0"
                    thumb-label="always"
                  >
                    <template #thumb-label="{ value }">
                      <div style="transform: translateY(-8px);">
                        {{ Number(value) + '%' }}
                      </div>
                    </template>
                  </v-slider>
                  </v-slider>
                  <color v-model="shadow.color" :label="translate('dialog.font.color')" />
                  <v-card-actions>
                    <v-spacer />
                    <v-btn color="error" @click="removeShadow(idx)">
                      {{ translate('dialog.buttons.delete') }}
                    </v-btn>
                  </v-card-actions>
                </v-tab-item>
              </v-tabs-items>
            </v-expand-transition>

            <v-sheet
              :style="{
                color: typeof model.color === 'undefined' ? exampleColor : model.color,
                'font-size': model.size + 'px',
                'font-weight': model.weight,
                'font-family': `'${model.family}'`,
                'text-align': 'center',
                'text-shadow': [textStrokeGenerator(model.borderPx, model.borderColor), shadowGenerator(model.shadow)].filter(Boolean).join(', ')
              }"
              class="mt-4 pb-4"
            >
              <div :style="{lineHeight: (model.size + 15) + 'px', width: '90%' }">
                <div class="text-center" style="overflow: visible !important;">
                  The quick brown fox jumps over the lazy dog
                </div>
              </div>
              <color v-if="typeof model.color === 'undefined'" v-model="exampleColor" style="width: 100px;" only-color label="Example Color" />
            </v-sheet>
          </v-card-text>
        </v-card>
      </div>
    </v-expand-transition>
  </v-container>
</template>

<script lang="ts">
import {
  defineAsyncComponent,
  defineComponent,
  onBeforeMount,
  ref,
  watch,
} from '@nuxtjs/composition-api';
import {
  shadowGenerator,
  textStrokeGenerator,
} from '@sogebot/ui-helpers/text';
import translate from '@sogebot/ui-helpers/translate';
import { cloneDeep } from 'lodash';

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
    }[];
    weight: number;
    color ? : string;
    highlightcolor ? : string;
  } | null
}
export default defineComponent({
  components: {
    color: defineAsyncComponent({
      loader: () => import('~/components/form/color.vue'),
    }),
  },
  props: {
    parent:  Object,
    value:   Object,
    isChild: Boolean,
    title:   [String, Object],
    id:      String,
  },
  setup (props: Props, ctx) {
    const selectedTab = ref(0);
    const exampleColor = ref('#ffffff');
    const model = ref(props.value);
    const fonts = ref([] as {
      text: string;value: string
    } []);
    const isOverriden = ref(props.value !== null);

    const rules = {
      family: [required],
    };

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
      ctx.emit('input', val);
    }, {
      deep: true,
    });

    const addShadow = () => {
      if (model.value) {
        model.value.shadow.push({
          shiftRight: 1,
          shiftDown:  1,
          blur:       5,
          opacity:    100,
          color:      '#ffffff',
        });
        selectedTab.value = model.value.shadow.length - 1;
      }
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
          resolve({
            response: JSON.parse(this.response),
          });
        };
        request.onerror = function () {
          console.error('Connection error to sogebot');
          resolve({
            response: {
            },
          });
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
        console.log(model.value);
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
      selectedTab,
    };
  },
});
</script>
