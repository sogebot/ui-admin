import { NuxtAxiosInstance } from '@nuxtjs/axios';
import { AxiosRequestConfig } from 'axios';

const redirectLogin = () => {
  if (window.location.href.includes('popout')) {
    window.location.assign(window.location.origin + '/login#error=popout+must+be+logged');
  } else {
    window.location.assign(window.location.origin + '/login');
  }
};

const refreshToken = async (axios: NuxtAxiosInstance) => {
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
};

type GetRequest<T> = {
  data: T,
  _count?: number,
  _pagingCookie?: string,
};

type PostRequest<T> = T;

const api = {
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

  post: async <T>(axios: NuxtAxiosInstance, url: string, data: T, options?: AxiosRequestConfig) => {
    try {
      await refreshToken(axios);
      await axios.post<PostRequest<T>>(url,
        data,
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
