import { Context } from '@nuxt/types';
import { NuxtAxiosInstance } from '@nuxtjs/axios';
// eslint-disable-next-line camelcase
import jwt_decode from 'jwt-decode';
import { debounce } from 'lodash';

const refreshToken = debounce(async (axios: NuxtAxiosInstance) => {
  try {
    const token = localStorage.getItem('refreshToken');
    if (token === '' || token === null) {
      return;
    }
    const validation = await axios.get(`${process.env.isNuxtDev ? 'http://localhost:20000' : window.location.origin}/socket/refresh`, { headers: { 'x-twitch-token': token } });
    localStorage.setItem('accessToken', validation.data.accessToken);
    localStorage.setItem('refreshToken', validation.data.refreshToken);
    localStorage.setItem('userType', validation.data.userType);
  } catch (e) {
    console.error(e);
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('code');
    localStorage.removeItem('clientId');
    localStorage.setItem('userType', 'unauthorized');
    redirectLogin();
  }
}, 30000, { leading: true });

const redirectLogin = () => {
  if (window.location.href.includes('popout')) {
    window.location.assign(window.location.origin + '/credentials/login/#error=popout+must+be+logged');
  } else {
    window.location.assign(window.location.origin + '/credentials/login/');
  }
};

export default ({ $axios }: Context) => {
  setInterval(() => {
    if (localStorage.accessToken) {
      // we just need to check if token is expired
      const { exp } = jwt_decode<{exp: number}>(localStorage.accessToken);
      const expirationTime = (exp * 1000) - 60000;
      if (Date.now() >= expirationTime) {
        refreshToken($axios);
      }
    }
  }, 1000);
};
