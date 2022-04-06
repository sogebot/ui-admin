import { Context } from '@nuxt/types';
import { getSocket } from '@sogebot/ui-helpers/socket';

export default function ({ app }: Context) {
  getSocket('/', true).emit('version', async (version: string) => {
    app.store?.commit('setVersion', ['current', version]);
    const { response } = await new Promise<{ response: Record<string, any>}>((resolve) => {
      const request = new XMLHttpRequest();
      request.open('GET', 'https://api.github.com/repos/sogehige/sogebot/releases/latest', true);

      request.onload = function () {
        if (!(this.status >= 200 && this.status < 400)) {
          console.error('Error getting version from git', this.status, this.response);
        }
        resolve({ response: JSON.parse(this.response) });
      };
      request.onerror = function () {
        console.error('Connection error to github');
        resolve({ response: {} });
      };

      request.send();
    });
    const botVersion = version.replace('-SNAPSHOT', '').split('.').map(o => Number(o));
    const gitVersion = (response.tag_name as string).split('.').map(o => Number(o));
    console.debug({ botVersion, gitVersion });

    let isNewer = false;
    for (let index = 0; index < botVersion.length; index++) {
      if (botVersion[index] < gitVersion[index]) {
        isNewer = true;
        break;
      } else if (botVersion[index] === gitVersion[index]) {
        continue;
      } else {
        isNewer = false;
        break;
      }
    }

    if (isNewer) {
      app.store?.commit('setVersion', ['next', gitVersion.join('.')]);
    } else {
      app.store?.commit('setVersion', ['next', null]);
    }
  });
}
