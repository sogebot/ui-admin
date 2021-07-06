<template>
  <div
    style="flex: 1 1 auto;"
    v-html="filter(value)"
  />
</template>

<script lang="ts">
import { defineComponent } from '@nuxtjs/composition-api';
import translate from '@sogebot/ui-helpers/translate';
import {
  isNil, keys, sortBy,
} from 'lodash';

import { flatten } from '~/functions/flatten';

export default defineComponent({
  props: { value: String },
  setup () {
    const filter = (val: string) => {
      const filtersRegExp = new RegExp('\\$(' + sortBy(keys(flatten(translate('responses.variable', true))), o => -o.length).join('|') + ')', 'g');
      val = val.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
      const matches = val.match(filtersRegExp);
      let output = val;
      if (!isNil(matches)) {
        for (const match of matches) {
          output = output.replace(match,
            `<code>${translate('responses.variable.' + match.replace('$', ''))}</code>`);
        }
      }
      return output;
    };
    return { filter };
  },
});
</script>
