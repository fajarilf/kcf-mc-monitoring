"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { initialUsers, type AppUser, type UserStatus } from "@/lib/mock-data";

interface UsersState {
  users: AppUser[];
  addUser: (
    user: Omit<AppUser, "id" | "status" | "role" | "registeredAt">,
  ) => AppUser;
  setStatus: (id: string, status: UserStatus) => void;
  findByCredentials: (email: string, password: string) => AppUser | undefined;
}

export const useUsersStore = create<UsersState>()(
  persist(
    (set, get) => ({
      users: initialUsers,
      addUser: (input) => {
        const newUser: AppUser = {
          id: `U${Math.floor(Math.random() * 90000) + 10000}`,
          name: input.name,
          email: input.email,
          password: input.password,
          role: "user",
          status: "pending",
          registeredAt: new Date().toISOString(),
        };
        set({ users: [...get().users, newUser] });
        return newUser;
      },
      setStatus: (id, status) =>
        set({
          users: get().users.map((u) => (u.id === id ? { ...u, status } : u)),
        }),
      findByCredentials: (email, password) =>
        get().users.find(
          (u) =>
            u.email.toLowerCase() === email.toLowerCase() &&
            u.password === password,
        ),
    }),
    { name: "kcf-users" },
  ),
);
