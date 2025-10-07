"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"

interface SidebarConfig {
  isCollapsed: boolean
  isBasicMode: boolean
  basicSections: string[]
  toggleCollapsed: () => void
  toggleMode: () => void
  setBasicSections: (sections: string[]) => void
}

export const useSidebarConfig = create<SidebarConfig>()(
  persist(
    (set) => ({
      isCollapsed: false,
      isBasicMode: false,
      basicSections: ["/", "/documents", "/chat", "/taxes", "/payroll"],
      toggleCollapsed: () => set((state) => ({ isCollapsed: !state.isCollapsed })),
      toggleMode: () => set((state) => ({ isBasicMode: !state.isBasicMode })),
      setBasicSections: (sections) => set({ basicSections: sections }),
    }),
    {
      name: "sidebar-config",
    },
  ),
)
