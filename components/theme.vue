<template>
  <v-btn
    text
    @click="toggleTheme"
  >
    <v-icon
      v-if="theme === 'light'"
      style="color: rgb(253, 177, 0);"
    >
      {{ mdiWeatherSunny }}
    </v-icon>
    <v-icon
      v-else
      style="color: #d0d5d2;"
    >
      {{ mdiMoonWaxingCrescent }}
    </v-icon>
  </v-btn>
</template>

<script lang="ts">
import { mdiMoonWaxingCrescent, mdiWeatherSunny } from '@mdi/js';
import { isUserLoggedIn } from '@sogebot/ui-helpers/isUserLoggedIn';
import { getSocket } from '@sogebot/ui-helpers/socket';
import { defineComponent, ref } from '@vue/composition-api';

const socket = getSocket('/core/users', true);

export default defineComponent({
  setup (_props, context) {
    const theme = ref('light');

    const toggleTheme = () => {
      const _theme = localStorage.getItem('theme');
      if (_theme === null || _theme === 'light') {
        localStorage.setItem('theme', 'dark');
      }
      if (_theme === 'dark') {
        localStorage.setItem('theme', 'light');
      }
      loadTheme(localStorage.getItem('theme') || 'dark');
    };

    const loadTheme = async (themeArg: string) => {
      if (!['light', 'dark'].includes(themeArg)) {
        console.error(`Unknown theme ${themeArg}, setting light theme`);
        themeArg = 'light';
      }

      (context.root as any).$vuetify.theme.dark = themeArg === 'dark';
      theme.value = themeArg;

      // we need to save users preferred theme
      const user = await isUserLoggedIn(false, false);
      if (user) {
        socket.emit('theme::set', { theme: themeArg, userId: user.id }, () => {
          return true;
        });
      }
      localStorage.setItem('theme', themeArg);
    };
    return {
      theme, toggleTheme, mdiWeatherSunny, mdiMoonWaxingCrescent,
    };
  },
});
</script>
