import { isUserLoggedIn } from '@sogebot/ui-helpers/isUserLoggedIn';
import { getSocket } from '@sogebot/ui-helpers/socket';
import { get } from 'lodash-es';

export default function ({ store, app }: { store: any, app: any }) {
  (async function init () {
    if (!store.state.isUILoaded) {
      setTimeout(() => init(), 10);
      return;
    }
    const socket = getSocket('/core/users', true);
    const user = await isUserLoggedIn(false, false);

    if (user) {
      socket.emit('theme::get', { userId: user.id }, (_: string | null, themeArg: string | null) => {
        localStorage.setItem('theme', themeArg || get(store.state.configuration, 'core.ui.theme', 'light'));
        app.vuetify.framework.theme.dark = localStorage.theme === 'dark';
      });
    }
    app.vuetify.framework.theme.dark = localStorage.theme === 'dark';
  })();
}