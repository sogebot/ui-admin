import { NuxtAxiosInstance } from '@nuxtjs/axios';
import { AxiosRequestConfig } from 'axios';
import { debounce } from 'lodash';

const redirectLogin = () => {
  if (window.location.href.includes('popout')) {
    window.location.assign(window.location.origin + '/credentials/login/#error=popout+must+be+logged');
  } else {
    window.location.assign(window.location.origin + '/credentials/login/');
  }
};

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
}, 1000, { leading: true });

type GetRequest<T> = {
  data: T,
  paging: null | {
    _limit: number,
    _page: number,
    count: number,
  },
};

type GetOneRequest<T> = T;

type PostRequest<T> = T;

type PatchRequest<T> = T;

const api = {
  getOne: async <T>(axios: NuxtAxiosInstance, url: string, id: string, options?: AxiosRequestConfig) => {
    try {
      await refreshToken(axios);
      if (url.endsWith('/')) {
        url = url.slice(0, -1);
      }
      const data = await axios.get<GetOneRequest<T>>(url + (id.length > 0 ? '/' + id : ''),
        {
          ...options,
          headers: {
            ...(options?.headers ?? {}),
            Authorization: 'Bearer ' + localStorage.accessToken,
          },
        });
      return data;
    } catch (e) {
      console.error(e);
      throw e; // rethrow
    }
  },
  get: async <T>(axios: NuxtAxiosInstance, url: string, options?: AxiosRequestConfig) => {
    try {
      await refreshToken(axios);
      const data = await axios.get<GetRequest<T>>(url,
        {
          ...options,
          headers: {
            ...(options?.headers ?? {}),
            Authorization: 'Bearer ' + localStorage.accessToken,
          },
        });
      return data;
    } catch (e) {
      console.error(e);
      throw e; // rethrow
    }
  },

  patch: async <T, R = T>(axios: NuxtAxiosInstance, url: string, data?: Partial<T>, options?: AxiosRequestConfig) => {
    try {
      await refreshToken(axios);
      const response = await axios.patch<PatchRequest<R>>(url,
        data,
        {
          ...options,
          headers: {
            ...(options?.headers ?? {}),
            Authorization: 'Bearer ' + localStorage.accessToken,
          },
        });
      return response.data;
    } catch (e) {
      console.error(e);
      throw e; // rethrow
    }
  },

  put: async <T, R = T>(axios: NuxtAxiosInstance, url: string, data?: T, options?: AxiosRequestConfig) => {
    try {
      await refreshToken(axios);
      const response = await axios.put<PostRequest<R>>(url,
        data,
        {
          ...options,
          headers: {
            ...(options?.headers ?? {}),
            Authorization: 'Bearer ' + localStorage.accessToken,
          },
        });
      return response.data;
    } catch (e) {
      console.error(e);
      throw e; // rethrow
    }
  },

  post: async <T, R = T>(axios: NuxtAxiosInstance, url: string, data?: T, options?: AxiosRequestConfig) => {
    try {
      await refreshToken(axios);
      const response = await axios.post<PostRequest<R>>(url,
        data,
        {
          ...options,
          headers: {
            ...(options?.headers ?? {}),
            Authorization: 'Bearer ' + localStorage.accessToken,
          },
        });
      return response.data;
    } catch (e) {
      console.error(e);
      throw e; // rethrow
    }
  },

  delete: async <T>(axios: NuxtAxiosInstance, url: string, options?: AxiosRequestConfig) => {
    try {
      await refreshToken(axios);
      await axios.delete<PostRequest<T>>(url,
        {
          ...options,
          headers: {
            ...(options?.headers ?? {}),
            Authorization: 'Bearer ' + localStorage.accessToken,
          },
        });
    } catch (e) {
      if (e.request.status !== 404) {
        // we are expecting 404 - for security reasons its for deleted item and not found item
        console.error(e);
        throw e; // rethrow
      }
    }
  },
};

export default api;
