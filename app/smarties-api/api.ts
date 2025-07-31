import axios from "axios";
import { useAppConfig } from "../store";

export const api = axios.create({
  baseURL: "https://api.example.com",
  timeout: 20000,
});

api.interceptors.request.use(
  async (config) => {
    const appConfig = useAppConfig.getState();

    const authorizeToken = appConfig?.omeToken;

    authorizeToken &&
      (config.headers.Authorization = `Bearer ${authorizeToken}`);

    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

api.interceptors.response.use(
  (response) => {
    if (response.data.code === 200) {
      return response.data;
    }

    return Promise.reject(response.data.msg ?? "");
  },
  async (error) => {
    console.log(error, "error");
  },
);
