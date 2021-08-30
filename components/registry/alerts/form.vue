<template>
  <v-form ref="form1" v-model="valid">
    <v-checkbox
      v-model="model.enabled"
      :label="translate('registry.alerts.enabled')"
    />

    <v-text-field
      v-model="model.title"
      :placeholder="translate('registry.alerts.title.placeholder')"
      :label="translate('registry.alerts.title.name')"
    />

    <query-filter v-model="model.filter" :rules="rules(event)" />
    <variant v-model="model.variantAmount" />

    <rewards
      v-if="model.rewardId !== undefined"
      v-model="model.rewardId"
    />

    <v-text-field
      v-model="model.messageTemplate"
      :placeholder="translate('registry.alerts.messageTemplate.placeholder')"
      :label="translate('registry.alerts.messageTemplate.name')"
      :hint="translate('registry.alerts.messageTemplate.help')"
      persistent-hint
    />

    <v-slider
      v-model.number="model.alertDurationInMs"
      class="pt-4"
      :label="translate('registry.alerts.alertDurationInMs.name')"
      min="0"
      max="60000"
      step="500"
      :thumb-size="0"
      thumb-label="always"
    >
      <template #thumb-label="{ value }">
        <div style="transform: translateY(-8px);">
          {{ value / 1000 }}s
        </div>
      </template>
    </v-slider>

    <v-slider
      v-model.number="model.alertTextDelayInMs"
      :label="translate('registry.alerts.alertTextDelayInMs.name')"
      min="0"
      max="60000"
      step="500"
      :thumb-size="0"
      thumb-label="always"
    >
      <template #thumb-label="{ value }">
        <div style="transform: translateY(-8px);">
          {{ value / 1000 }}s
        </div>
      </template>
    </v-slider>

    <v-slider
      v-model.number="model.soundVolume"
      :label="translate('registry.alerts.soundVolume.name')"
      min="0"
      max="100"
      step="1"
      :thumb-size="0"
      thumb-label="always"
    >
      <template #thumb-label="{ value }">
        <div style="transform: translateY(-8px);">
          {{ value }}%
        </div>
      </template>
    </v-slider>

    <v-expand-transition>
      <layout-picker v-if="!model.enableAdvancedMode" v-model="model.layout" />
    </v-expand-transition>

    <v-expansion-panels>
      <text-animation
        :animation.sync="model.animationText"
        :animation-options.sync="model.animationTextOptions"
      />
      <animation-in
        :animation.sync="model.animationIn"
        :animation-duration.sync="model.animationInDuration"
      />
      <animation-out
        :animation.sync="model.animationOut"
        :animation-duration.sync="model.animationOutDuration"
      />
      <v-expansion-panel>
        <v-expansion-panel-header>
          {{ translate('registry.goals.fontSettings') }}
        </v-expansion-panel-header>
        <v-expansion-panel-content>
          <font
            v-model="model.font"
            :parent="parent.font"
            :is-child="true"
            @input="model.font = $event"
          />
        </v-expansion-panel-content>
      </v-expansion-panel>
      <v-expansion-panel v-if="model.message">
        <v-expansion-panel-header>
          {{ translate('registry.alerts.message.setting') }}
        </v-expansion-panel-header>
        <v-expansion-panel-content>
          <font
            v-model="model.message.font"
            :parent="parent.fontMessage"
            :is-child="true"
          >
            <v-text-field
              v-if="model.message.minAmountToShow !== undefined"
              v-model="model.message.minAmountToShow"
              type="number"
              :label="translate('registry.alerts.minAmountToShow.name')"
              min="0"
              :placeholder="translate('registry.alerts.minAmountToShow.placeholder')"
            />

            <v-row v-if="model.message.allowEmotes !== undefined" class="pb-4">
              <v-col cols="auto">
                <label class="v-label theme--dark">
                  {{ translate('registry.alerts.allowEmotes.name') }}
                </label>
              </v-col>
              <v-col cols="auto">
                <v-checkbox
                  v-model="model.message.allowEmotes.twitch"
                  label="Twitch"
                  class="pa-0 ma-0"
                  hide-details
                />
              </v-col>
              <v-col cols="auto">
                <v-checkbox
                  v-model="model.message.allowEmotes.ffz"
                  label="FrankenFaceZ"
                  class="pa-0 ma-0"
                  hide-details
                />
              </v-col>
              <v-col cols="auto">
                <v-checkbox
                  v-model="model.message.allowEmotes.bttv"
                  label="BetterTTV"
                  class="pa-0 ma-0"
                  hide-details
                />
              </v-col>
            </v-row>
          </font>
        </v-expansion-panel-content>
      </v-expansion-panel>
      <tts v-model="model.tts" v-if="setableTTS"/>
      <v-expansion-panel>
        <v-expansion-panel-header>
          {{ translate('registry.alerts.image.setting') }}
        </v-expansion-panel-header>
        <v-expansion-panel-content>
          <media
            v-model="model.imageId"
            type="image"
            :volume="model.soundVolume"
            class="pb-2"
          />
          <v-slider
            v-model.number="model.imageOptions.scale"
            :label="translate('registry.alerts.scale.name')"
            min="0"
            max="500"
            step="1"
            :thumb-size="0"
            thumb-label="always"
          >
            <template #thumb-label="{ value }">
              <div style="transform: translateY(-8px);">
                {{ value }}%
              </div>
            </template>
          </v-slider>
          <v-slider
            v-model.number="model.imageOptions.translateX"
            :label="translate('registry.alerts.translateX.name')"
            min="-500"
            max="500"
            step="1"
            :thumb-size="0"
            thumb-label="always"
          >
            <template #thumb-label="{ value }">
              <div style="transform: translateY(-8px);">
                {{ value }}px
              </div>
            </template>
          </v-slider>
          <v-slider
            v-model.number="model.imageOptions.translateY"
            :label="translate('registry.alerts.translateY.name')"
            min="-500"
            max="500"
            step="1"
            :thumb-size="0"
            thumb-label="always"
          >
            <template #thumb-label="{ value }">
              <div style="transform: translateY(-8px);">
                {{ value }}px
              </div>
            </template>
          </v-slider>
        </v-expansion-panel-content>
      </v-expansion-panel>
      <v-expansion-panel>
        <v-expansion-panel-header>
          {{ translate('registry.alerts.sound.setting') }}
        </v-expansion-panel-header>
        <v-expansion-panel-content>
          <media
            v-model="model.soundId"
            type="audio"
            :volume="model.soundVolume"
          />
        </v-expansion-panel-content>
      </v-expansion-panel>
    </v-expansion-panels>

    <v-checkbox
      v-model="model.enableAdvancedMode"
      :label="translate('registry.alerts.enableAdvancedMode')"
    />

    <v-expand-transition>
      <div v-show="model.enableAdvancedMode">
        <v-tabs v-model="customTab">
          <v-tab>HTML</v-tab>
          <v-tab>JS</v-tab>
          <v-tab>CSS</v-tab>
        </v-tabs>
        <v-tabs-items v-model="customTab">
          <v-tab-item>
            <prism-editor
              v-model="model.advancedMode.html"
              style="border: 1px solid gray;"
              line-numbers
              :tab-size="4"
              :highlight="highlighterHTML"
            />
          </v-tab-item>
          <v-tab-item>
            <prism-editor
              v-model="model.advancedMode.js"
              style="border: 1px solid gray;"
              line-numbers
              :tab-size="4"
              :highlight="highlighterJS"
            />
          </v-tab-item>
          <v-tab-item>
            <prism-editor
              v-model="model.advancedMode.css"
              style="border: 1px solid gray;"
              line-numbers
              :tab-size="4"
              :highlight="highlighterCSS"
            />
          </v-tab-item>
        </v-tabs-items>
        <v-btn
          class="ml-auto"
          @click="revertCode"
        >
          {{ translate('registry.alerts.revertcode') }}
        </v-btn>
      </div>
    </v-expand-transition>
  </v-form>
</template>

<script lang="ts">
import {
  computed,
  defineAsyncComponent,
  defineComponent, onMounted, ref, watch,
} from '@nuxtjs/composition-api';
import translate from '@sogebot/ui-helpers/translate';

import type { AlertInterface, CommonSettingsInterface } from '~/.bot/src/database/entity/alert';
import { EventBus } from '~/functions/event-bus';
import {
  highlighterCSS, highlighterHTML, highlighterJS, PrismEditor,
} from '~/functions/prismjs';

type Props = {
  value: CommonSettingsInterface,
  parent: AlertInterface,
  event: string,
};

export default defineComponent({
  components: {
    PrismEditor,
    queryFilter:   defineAsyncComponent(() => import('~/components/registry/alerts/inputs/query-filter.vue')),
    font:          defineAsyncComponent(() => import('~/components/form/expansion/font.vue')),
    variant:       defineAsyncComponent(() => import('~/components/registry/alerts/inputs/variant.vue')),
    textAnimation: defineAsyncComponent(() => import('~/components/registry/alerts/inputs/text-animation.vue')),
    animationIn:   defineAsyncComponent(() => import('~/components/registry/alerts/inputs/animation-in.vue')),
    animationOut:  defineAsyncComponent(() => import('~/components/registry/alerts/inputs/animation-out.vue')),
    layoutPicker:  defineAsyncComponent(() => import('~/components/registry/alerts/inputs/layout-picker.vue')),
    tts:           defineAsyncComponent({ loader: () => import('~/components/form/expansion/tts.vue') }),
    media:         defineAsyncComponent(() => import('~/components/registry/alerts/inputs/media.vue')),
    rewards:       defineAsyncComponent({ loader: () => import('~/components/rewards.vue') }),
  },
  props: {
    value: Object, parent: Object, event: String,
  },
  setup (props: Props, ctx) {
    const valid = ref(true);
    const model = ref(props.value);
    const customTab = ref(0);
    const form1 = ref(null);

    const setableTTS = computed(() => {
      return ['tips', 'resubs', 'cheers', 'rewardredeems'].includes(props.event);
    });

    const rules = (type: string) => {
      switch (type) {
        case 'cheers':
        case 'subcommunitygifts':
        case 'tips':
        case 'hosts':
        case 'raids':
          return [['username', 'string'], ['amount', 'number']];
        case 'subs':
          return [['username', 'string'], ['tier', 'tier']];
        case 'resubs':
          return [['username', 'string'], ['tier', 'tier'], ['amount', 'number']];
        case 'subgifts':
          return [['username', 'string'], ['recipient', 'string'], ['amount', 'number']];
        case 'cmdredeems':
          return [['recipient', 'string'], ['amount', 'number'], ['name', 'string']];
        case 'rewardredeems':
          return [['recipient', 'string']];
      }
      return [['username', 'string']];
    };

    watch(model, (val) => {
      ctx.emit('input', val);
    }, { deep: true });

    onMounted(() => {
      EventBus.$on('alert::validate', (cb: any) => cb((form1.value as unknown as HTMLFormElement).validate()));
    });

    const revertCode = () => {
      if (customTab.value === 2) {
        model.value.advancedMode.css = '';
      } else if (customTab.value === 1) {
        fetch((process.env.isNuxtDev ? 'http://localhost:20000/' : '/') + 'assets/alerts-js.txt')
          .then(response => response.text())
          .then(data => (model.value.advancedMode.js = data));
      } else if (customTab.value === 0) {
        fetch((process.env.isNuxtDev ? 'http://localhost:20000/' : '/') + 'assets/alerts.txt')
          .then(response => response.text())
          .then(data => (model.value.advancedMode.html = data));
      }
    };

    return {
      // ref
      valid,
      form1,
      model,
      customTab,
      setableTTS,

      // functions
      revertCode,
      rules,

      // prism
      highlighterCSS,
      highlighterHTML,
      highlighterJS,

      // others
      translate,
    };
  },
});
</script>
