// import axios from "axios";
// import { useAuthStore } from "../store/authStore";

// const api = axios.create({
//   baseURL: import.meta.env.VITE_API_URL || "https://hms-qrc3.onrender.com/api",
//   headers: {
//     "Content-Type": "application/json",
//   },
// });

// // Request Interceptor: Attach access token
// api.interceptors.request.use(
//   (config) => {
//     const token = localStorage.getItem("access_token");
//     if (token) {
//       config.headers.Authorization = `Bearer ${token}`;
//     }
//     return config;
//   },
//   (error) => Promise.reject(error)
// );

// // Response Interceptor: Handle token refresh and logout
// api.interceptors.response.use(
//   (response) => response,
//   async (error) => {
//     const originalRequest = error.config;
//     if (error.response?.status === 401 && !originalRequest._retry) {
//       originalRequest._retry = true;
//       try {
//         const refresh_token = localStorage.getItem("refresh_token");
//         const response = await axios.post("https://hms-qrc3.onrender.com/api/accounts/token/refresh/", {
//           refresh: refresh_token,
//         });
//         const { access } = response.data;
//         localStorage.setItem("access_token", access);
//         originalRequest.headers.Authorization = `Bearer ${access}`;
//         return api(originalRequest);
//       } catch (err) {
//         useAuthStore.getState().logout();
//         return Promise.reject(err);
//       }
//     }
//     return Promise.reject(error);
//   }
// );

// export default api;











import axios from "axios";
import { useAuthStore } from "../store/authStore";

const BASE_URL = import.meta.env.VITE_API_URL || "https://hms-qrc3.onrender.com/api";

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("access_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refresh_token = localStorage.getItem("refresh_token");

        const response = await axios.post(
          `${BASE_URL}/accounts/token/refresh/`,
          { refresh: refresh_token }
        );

        const { access } = response.data;

        localStorage.setItem("access_token", access);
        originalRequest.headers.Authorization = `Bearer ${access}`;

        return api(originalRequest);

      } catch (err) {
        useAuthStore.getState().logout();
        return Promise.reject(err);
      }
    }

    return Promise.reject(error);
  }
);

export default api;