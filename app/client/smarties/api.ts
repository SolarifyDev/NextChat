import axios from "axios";

export const api = axios.create({ baseURL: "" });

api.interceptors.request.use(
  async (config) => {
    config.baseURL =
      process.env.SMARTIES_URL || "https://testsmarties.yamimeal.ca";

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
