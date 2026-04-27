"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Role = "admin" | "user";

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: Role;
}

interface AuthState {
  user: SessionUser | null;
  isLoggedIn: boolean;
  login: (user: SessionUser) => void;
  logout: () => void;
}

export const useAuth = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isLoggedIn: false,
      login: (user) => set({ user, isLoggedIn: true }),
      logout: () => set({ user: null, isLoggedIn: false }),
    }),
    { name: "kcf-auth" },
  ),
);
