import type { ApiAchiever } from './types';

export interface Achiever {
  name: string;
  classLabel: string;
  position: string;
  score: number;
  total: number;
  percent: number;
  photoUrl: string | null;
}

export function toAchiever(a: ApiAchiever): Achiever {
  return {
    name: a.name,
    classLabel: a.class_label,
    position: a.position_label,
    score: a.score,
    total: a.total,
    percent: a.percent,
    photoUrl: a.photo_url,
  };
}
