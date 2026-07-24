import { useLocalSearchParams } from 'expo-router';
import React, { useCallback } from 'react';

import { ArticleDetail } from '@/components/ui/ArticleDetail';
import { Screen } from '@/components/ui/Screen';
import { ErrorState, Loading } from '@/components/ui/states';
import { fetchEvent } from '@/data/api';
import { useFetch } from '@/hooks/use-fetch';

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const fetcher = useCallback(() => fetchEvent(id), [id]);
  const { data, loading, error, refetch } = useFetch(fetcher, [id]);

  if (loading && !data) {
    return (
      <Screen scroll={false}>
        <Loading label="Loading event…" />
      </Screen>
    );
  }

  if (error || !data) {
    return (
      <Screen scroll={false}>
        <ErrorState message="Could not load this event." onRetry={refetch} />
      </Screen>
    );
  }

  return (
    <Screen>
      <ArticleDetail
        title={data.title}
        date={data.date}
        imageUrl={data.imageUrl}
        body={data.body}
        meta={data.location}
      />
    </Screen>
  );
}
