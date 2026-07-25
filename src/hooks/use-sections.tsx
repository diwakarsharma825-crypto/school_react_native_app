import React, { createContext, useContext } from 'react';

import { ALL_SECTIONS_ENABLED, EnabledSections, SectionKey } from '@/data/app-status';

export type { EnabledSections, SectionKey };

const SectionsContext = createContext<EnabledSections>(ALL_SECTIONS_ENABLED);

export function SectionsProvider({
  value,
  children,
}: {
  value: EnabledSections;
  children: React.ReactNode;
}) {
  return <SectionsContext.Provider value={value}>{children}</SectionsContext.Provider>;
}

/** Whether an admin-controlled section is currently visible. Home/Contact/About are
 * always on and aren't part of this — see SectionKey in data/app-status.ts. */
export function useSectionEnabled(key: SectionKey): boolean {
  return useContext(SectionsContext)[key];
}

export function useSections(): EnabledSections {
  return useContext(SectionsContext);
}
