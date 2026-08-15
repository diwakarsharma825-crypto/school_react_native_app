import React, { createContext, useContext } from 'react';

export interface BrandOverride {
  logoUrl: string | null;
  appTitle?: string | null;
  primaryColor: string | null;
  accentColor: string | null;
  splashColor?: string | null;
  headerColor?: string | null;
  achieversDisplay: 'marks' | 'grade';
  mode?: 'school' | 'institute' | 'tutor';
  labels?: {
    teacher?: string;
    class?: string;
    student?: string;
  };
}

const EMPTY_BRAND: BrandOverride = {
  logoUrl: null,
  appTitle: null,
  primaryColor: null,
  accentColor: null,
  splashColor: null,
  headerColor: null,
  achieversDisplay: 'marks',
  mode: 'school',
  labels: {
    teacher: 'Teacher',
    class: 'Class',
    student: 'Student',
  },
};

const BrandContext = createContext<BrandOverride>(EMPTY_BRAND);

export function BrandProvider({ value, children }: { value: BrandOverride; children: React.ReactNode }) {
  return <BrandContext.Provider value={{ ...EMPTY_BRAND, ...value }}>{children}</BrandContext.Provider>;
}

export function useBrand(): BrandOverride {
  return useContext(BrandContext);
}
