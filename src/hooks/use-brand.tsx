import React, { createContext, useContext } from 'react';

export interface BrandOverride {
  logoUrl: string | null;
  appTitle?: string | null;
  primaryColor: string | null;
  accentColor: string | null;
  splashColor?: string | null;
  headerColor?: string | null;
  achieversDisplay: 'marks' | 'grade';
}

const EMPTY_BRAND: BrandOverride = { logoUrl: null, appTitle: null, primaryColor: null, accentColor: null, splashColor: null, headerColor: null, achieversDisplay: 'marks' };

const BrandContext = createContext<BrandOverride>(EMPTY_BRAND);

/** Admin-set logo + brand colors from App Control, applied at runtime.
 * Falls back to the bundled defaults (theme.ts's Brand.blue/saffron, the
 * static app icon) wherever a field is null — this never blocks rendering
 * on a slow/failed app_status fetch. */
export function BrandProvider({ value, children }: { value: BrandOverride; children: React.ReactNode }) {
  return <BrandContext.Provider value={value}>{children}</BrandContext.Provider>;
}

export function useBrand(): BrandOverride {
  return useContext(BrandContext);
}
