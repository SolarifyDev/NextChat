import axios from "axios";
import { useOmeStore } from "../store/ome";

export const api = axios.create({
  baseURL: "https://api.example.com",
  timeout: 20000,
});

api.interceptors.request.use(
  async (config) => {
    const appConfig = useOmeStore.getState();

    const authorizeToken = appConfig?.token;

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
