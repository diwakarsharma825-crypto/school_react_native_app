// NOTE: the backend has no dedicated top-students/ranking endpoint (the
// /students list carries no score/position field) — this is the same
// static achiever content the original app shipped with, shared between
// the Home screen spotlight and the full Top Students screen.
export interface Achiever {
  name: string;
  classLabel: string;
  position: string;
  score: number;
  total: number;
  percent: number;
}

export const ACHIEVERS: Achiever[] = [
  { name: 'Akhsay', classLabel: '12th', position: 'Second Position', score: 475, total: 500, percent: 95 },
  { name: 'Ruby', classLabel: '12th', position: 'Third Position', score: 470, total: 500, percent: 94 },
];
