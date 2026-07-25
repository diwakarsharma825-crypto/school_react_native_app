import React from 'react';

import { Screen } from './Screen';
import { EmptyState } from './states';

/** Shown when a screen is reached (e.g. a stale deep link) for a section the
 * admin has turned off. The nav entry point is already hidden — this is the
 * fallback for anyone who lands here anyway. */
export function SectionUnavailable() {
  return (
    <Screen scroll={false}>
      <EmptyState message="This section isn't available right now." icon="lock-closed-outline" />
    </Screen>
  );
}
