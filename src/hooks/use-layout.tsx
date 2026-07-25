import React, { createContext, useContext } from 'react';

import { DEFAULT_BOTTOM_TABS, DEFAULT_HOME_TILES } from '@/data/app-status';
import type { LayoutItem } from '@/lib/layout';

export interface LayoutConfig {
  homeTiles: LayoutItem[];
  bottomTabs: LayoutItem[];
}

const DEFAULT_LAYOUT: LayoutConfig = { homeTiles: DEFAULT_HOME_TILES, bottomTabs: DEFAULT_BOTTOM_TABS };

const LayoutContext = createContext<LayoutConfig>(DEFAULT_LAYOUT);

/** Admin-configured Home quick-action tiles + bottom tab bar, from App
 * Control → App Layout. Falls back to the app's original fixed 4+4 if the
 * backend hasn't set anything (or the request hasn't resolved yet). */
export function LayoutProvider({ value, children }: { value: LayoutConfig; children: React.ReactNode }) {
  return <LayoutContext.Provider value={value}>{children}</LayoutContext.Provider>;
}

export function useLayout(): LayoutConfig {
  return useContext(LayoutContext);
}
