import { getSocket } from '@sogebot/ui-helpers/socket';

export default async () => {
  return await new Promise((resolve) => {
    getSocket('/', true).emit('translations', (translations) => {
      if (process.env.IS_DEV) {
        console.groupCollapsed('GET=>Translations');
        console.debug({
          translations,
        });
        console.groupEnd();
      }
      resolve(translations);
    });
  });
};
