import { create } from "zustand";
import { jwtDecode } from "jwt-decode";

const getSafeGroups = () => {
  try {
    const stored = localStorage.getItem("user_groups");
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error("Failed to parse user groups", error);
    return [];
  }
};

export const useAuthStore = create((set) => ({
  user: null,
  isAuthenticated: !!localStorage.getItem("access_token"),
  groups: getSafeGroups(),
  isInitialized: false,

  login: (access, refresh) => {
    localStorage.setItem("access_token", access);
    localStorage.setItem("refresh_token", refresh);
    
    try {
      const decoded = jwtDecode(access);
      const groups = decoded.groups || [];
      localStorage.setItem("user_groups", JSON.stringify(groups));
      
      set({
        user: decoded,
        isAuthenticated: true,
        groups: groups,
        isInitialized: true,
      });
    } catch (error) {
      console.error("Token decoding failed", error);
      set({
        user: null,
        isAuthenticated: false,
        groups: [],
        isInitialized: true,
      });
    }
  },

  logout: () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user_groups");
    set({
      user: null,
      isAuthenticated: false,
      groups: [],
      isInitialized: true,
    });
  },

  checkAuth: () => {
    const token = localStorage.getItem("access_token");
    if (token) {
      try {
        const decoded = jwtDecode(token);
        if (decoded.exp * 1000 < Date.now()) {
          set({ isInitialized: true });
          return;
        }
        set({
          user: decoded,
          groups: decoded.groups || [],
          isAuthenticated: true,
          isInitialized: true,
        });
      } catch (error) {
        set({ isAuthenticated: false, user: null, groups: [], isInitialized: true });
      }
    } else {
      set({ isInitialized: true });
    }
  },
}));
