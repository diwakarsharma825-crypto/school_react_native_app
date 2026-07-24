import { useLocalSearchParams } from 'expo-router';
import React, { useCallback } from 'react';

import { ArticleDetail } from '@/components/ui/ArticleDetail';
import { Screen } from '@/components/ui/Screen';
import { ErrorState, Loading } from '@/components/ui/states';
import { fetchNewsItem } from '@/data/api';
import { useFetch } from '@/hooks/use-fetch';

export default function NewsDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const fetcher = useCallback(() => fetchNewsItem(id), [id]);
  const { data, loading, error, refetch } = useFetch(fetcher, [id]);

  if (loading && !data) {
    return (
      <Screen scroll={false}>
        <Loading label="Loading news…" />
      </Screen>
    );
  }

  if (error || !data) {
    return (
      <Screen scroll={false}>
        <ErrorState message="Could not load this article." onRetry={refetch} />
      </Screen>
    );
  }

  return (
    <Screen>
      <ArticleDetail title={data.title} date={data.date} imageUrl={data.imageUrl} body={data.body} />
    </Screen>
  );
}
