import { create } from "zustand";

const useThemeStore = create((set) => ({
  theme: localStorage.getItem("app-theme") || "dracula",
  setTheme: (theme) => {
    set({ theme });
    localStorage.setItem("app-theme", theme); // save theme to local storage, persists across page reloads
  },
}));

export default useThemeStore;
