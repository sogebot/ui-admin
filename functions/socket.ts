import axios from 'axios';

type Configuration = {
  [x:string]: Configuration | string;
};
export const getConfiguration = async (): Promise<Configuration> => {
  const response = await axios.get(`/api/ui/configuration`, { headers: { authorization: `Bearer ${localStorage.accessToken}` } });
  return response.data;
};
