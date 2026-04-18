import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  calculateStats,
  formatDuration,
  getLastNDays,
  getAllRecordings,
} from '@/utils/statsUtils';
import { Song } from '@/types';

describe('statsUtils', () => {
  describe('formatDuration', () => {
    it('should format seconds under 60 as seconds', () => {
      expect(formatDuration(30)).toBe('30초');
      expect(formatDuration(59)).toBe('59초');
      expect(formatDuration(0)).toBe('0초');
    });

    it('should format seconds as minutes and seconds', () => {
      expect(formatDuration(60)).toBe('1분');
      expect(formatDuration(90)).toBe('1분 30초');
      expect(formatDuration(125)).toBe('2분 5초');
    });

    it('should format large values as hours and minutes', () => {
      expect(formatDuration(3600)).toBe('1시간');
      expect(formatDuration(3660)).toBe('1시간 1분');
      expect(formatDuration(7200)).toBe('2시간');
      expect(formatDuration(5400)).toBe('1시간 30분');
    });

    it('should round seconds properly', () => {
      expect(formatDuration(30.4)).toBe('30초');
      expect(formatDuration(30.6)).toBe('31초');
    });
  });

  describe('getLastNDays', () => {
    beforeEach(() => {
      // Mock Date to 2024-01-15
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2024-01-15T12:00:00Z'));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should return array of N days ending today', () => {
      const days = getLastNDays(7);
      expect(days).toHaveLength(7);
      expect(days[6]).toBe('2024-01-15'); // Today
      expect(days[0]).toBe('2024-01-09'); // 6 days ago
    });

    it('should return 1 day when n=1', () => {
      const days = getLastNDays(1);
      expect(days).toHaveLength(1);
      expect(days[0]).toBe('2024-01-15');
    });

    it('should return dates in ascending order', () => {
      const days = getLastNDays(3);
      expect(days[0]).toBe('2024-01-13');
      expect(days[1]).toBe('2024-01-14');
      expect(days[2]).toBe('2024-01-15');
    });
  });

  describe('getAllRecordings', () => {
    it('should return empty array for empty songs', () => {
      const result = getAllRecordings([]);
      expect(result).toEqual([]);
    });

    it('should extract all recordings with metadata', () => {
      const songs: Song[] = [
        {
          id: 1,
          name: 'Song 1',
          sessions: [
            {
              id: 101,
              name: 'Session 1',
              audioData: null,
              sections: [
                {
                  id: 1001,
                  start: 0,
                  end: 30,
                  recordedFiles: [
                    { id: 1, name: 'rec1', data: '', uploadDate: '2024-01-15', tags: ['good'] },
                  ],
                },
              ],
              markers: [],
            },
          ],
        },
      ];

      const result = getAllRecordings(songs);
      expect(result).toHaveLength(1);
      expect(result[0].songName).toBe('Song 1');
      expect(result[0].sessionName).toBe('Session 1');
      expect(result[0].sectionDuration).toBe(30);
      expect(result[0].recording.name).toBe('rec1');
    });

    it('should handle multiple songs, sessions, sections, and recordings', () => {
      const songs: Song[] = [
        {
          id: 1,
          name: 'Song 1',
          sessions: [
            {
              id: 101,
              name: 'Session 1',
              audioData: null,
              sections: [
                {
                  id: 1001,
                  start: 0,
                  end: 30,
                  recordedFiles: [
                    { id: 1, name: 'rec1', data: '', uploadDate: '2024-01-15', tags: [] },
                    { id: 2, name: 'rec2', data: '', uploadDate: '2024-01-15', tags: [] },
                  ],
                },
                {
                  id: 1002,
                  start: 30,
                  end: 60,
                  recordedFiles: [
                    { id: 3, name: 'rec3', data: '', uploadDate: '2024-01-14', tags: [] },
                  ],
                },
              ],
              markers: [],
            },
          ],
        },
        {
          id: 2,
          name: 'Song 2',
          sessions: [
            {
              id: 201,
              name: 'Session 2',
              audioData: null,
              sections: [
                {
                  id: 2001,
                  start: 0,
                  end: 45,
                  recordedFiles: [
                    { id: 4, name: 'rec4', data: '', uploadDate: '2024-01-13', tags: [] },
                  ],
                },
              ],
              markers: [],
            },
          ],
        },
      ];

      const result = getAllRecordings(songs);
      expect(result).toHaveLength(4);
    });
  });

  describe('calculateStats', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2024-01-15T12:00:00Z'));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should return zero stats for empty songs', () => {
      const stats = calculateStats([]);
      expect(stats.totalSongs).toBe(0);
      expect(stats.totalSessions).toBe(0);
      expect(stats.totalSections).toBe(0);
      expect(stats.totalRecordings).toBe(0);
      expect(stats.totalPracticeTime).toBe(0);
      expect(stats.todayRecordings).toBe(0);
      expect(stats.todayPracticeTime).toBe(0);
      expect(stats.currentStreak).toBe(0);
      expect(stats.longestStreak).toBe(0);
      expect(stats.mostPracticedSong).toBeNull();
    });

    it('should count total songs, sessions, and sections', () => {
      const songs: Song[] = [
        {
          id: 1,
          name: 'Song 1',
          sessions: [
            {
              id: 101,
              name: 'Session 1',
              audioData: null,
              sections: [
                { id: 1001, start: 0, end: 30, recordedFiles: [] },
                { id: 1002, start: 30, end: 60, recordedFiles: [] },
              ],
              markers: [],
            },
            {
              id: 102,
              name: 'Session 2',
              audioData: null,
              sections: [{ id: 1003, start: 0, end: 20, recordedFiles: [] }],
              markers: [],
            },
          ],
        },
        {
          id: 2,
          name: 'Song 2',
          sessions: [
            {
              id: 201,
              name: 'Session 3',
              audioData: null,
              sections: [{ id: 2001, start: 0, end: 15, recordedFiles: [] }],
              markers: [],
            },
          ],
        },
      ];

      const stats = calculateStats(songs);
      expect(stats.totalSongs).toBe(2);
      expect(stats.totalSessions).toBe(3);
      expect(stats.totalSections).toBe(4);
    });

    it('should calculate today stats correctly', () => {
      const songs: Song[] = [
        {
          id: 1,
          name: 'Song 1',
          sessions: [
            {
              id: 101,
              name: 'Session 1',
              audioData: null,
              sections: [
                {
                  id: 1001,
                  start: 0,
                  end: 30,
                  recordedFiles: [
                    { id: 1, name: 'rec1', data: '', uploadDate: '2024-01-15', tags: [] },
                    { id: 2, name: 'rec2', data: '', uploadDate: '2024-01-15', tags: [] },
                  ],
                },
                {
                  id: 1002,
                  start: 30,
                  end: 60,
                  recordedFiles: [
                    { id: 3, name: 'rec3', data: '', uploadDate: '2024-01-14', tags: [] }, // yesterday
                  ],
                },
              ],
              markers: [],
            },
          ],
        },
      ];

      const stats = calculateStats(songs);
      expect(stats.todayRecordings).toBe(2);
      expect(stats.todayPracticeTime).toBe(60); // 2 recordings * 30 seconds each
    });

    it('should calculate total practice time based on section duration', () => {
      const songs: Song[] = [
        {
          id: 1,
          name: 'Song 1',
          sessions: [
            {
              id: 101,
              name: 'Session 1',
              audioData: null,
              sections: [
                {
                  id: 1001,
                  start: 0,
                  end: 30, // 30 seconds
                  recordedFiles: [
                    { id: 1, name: 'rec1', data: '', uploadDate: '2024-01-15', tags: [] },
                    { id: 2, name: 'rec2', data: '', uploadDate: '2024-01-14', tags: [] },
                  ],
                },
                {
                  id: 1002,
                  start: 30,
                  end: 90, // 60 seconds
                  recordedFiles: [
                    { id: 3, name: 'rec3', data: '', uploadDate: '2024-01-15', tags: [] },
                  ],
                },
              ],
              markers: [],
            },
          ],
        },
      ];

      const stats = calculateStats(songs);
      // 2 recordings * 30 sec + 1 recording * 60 sec = 120 sec
      expect(stats.totalPracticeTime).toBe(120);
    });

    it('should count tags correctly', () => {
      const songs: Song[] = [
        {
          id: 1,
          name: 'Song 1',
          sessions: [
            {
              id: 101,
              name: 'Session 1',
              audioData: null,
              sections: [
                {
                  id: 1001,
                  start: 0,
                  end: 30,
                  recordedFiles: [
                    { id: 1, name: 'rec1', data: '', uploadDate: '2024-01-15', tags: ['good', 'timing'] },
                    { id: 2, name: 'rec2', data: '', uploadDate: '2024-01-15', tags: ['good'] },
                    { id: 3, name: 'rec3', data: '', uploadDate: '2024-01-15', tags: ['practice'] },
                  ],
                },
              ],
              markers: [],
            },
          ],
        },
      ];

      const stats = calculateStats(songs);
      expect(stats.tagCounts['good']).toBe(2);
      expect(stats.tagCounts['timing']).toBe(1);
      expect(stats.tagCounts['practice']).toBe(1);
    });

    it('should find most practiced song', () => {
      const songs: Song[] = [
        {
          id: 1,
          name: 'Song A',
          sessions: [
            {
              id: 101,
              name: 'Session 1',
              audioData: null,
              sections: [
                {
                  id: 1001,
                  start: 0,
                  end: 30,
                  recordedFiles: [
                    { id: 1, name: 'rec1', data: '', uploadDate: '2024-01-15', tags: [] },
                  ],
                },
              ],
              markers: [],
            },
          ],
        },
        {
          id: 2,
          name: 'Song B',
          sessions: [
            {
              id: 201,
              name: 'Session 2',
              audioData: null,
              sections: [
                {
                  id: 2001,
                  start: 0,
                  end: 30,
                  recordedFiles: [
                    { id: 2, name: 'rec2', data: '', uploadDate: '2024-01-15', tags: [] },
                    { id: 3, name: 'rec3', data: '', uploadDate: '2024-01-15', tags: [] },
                    { id: 4, name: 'rec4', data: '', uploadDate: '2024-01-15', tags: [] },
                  ],
                },
              ],
              markers: [],
            },
          ],
        },
      ];

      const stats = calculateStats(songs);
      expect(stats.mostPracticedSong).toEqual({ name: 'Song B', count: 3 });
    });

    it('should calculate last 7 days recordings and practice time', () => {
      const songs: Song[] = [
        {
          id: 1,
          name: 'Song 1',
          sessions: [
            {
              id: 101,
              name: 'Session 1',
              audioData: null,
              sections: [
                {
                  id: 1001,
                  start: 0,
                  end: 30,
                  recordedFiles: [
                    { id: 1, name: 'rec1', data: '', uploadDate: '2024-01-15', tags: [] }, // today
                    { id: 2, name: 'rec2', data: '', uploadDate: '2024-01-10', tags: [] }, // 5 days ago
                    { id: 3, name: 'rec3', data: '', uploadDate: '2024-01-05', tags: [] }, // 10 days ago (excluded)
                  ],
                },
              ],
              markers: [],
            },
          ],
        },
      ];

      const stats = calculateStats(songs);
      expect(stats.last7DaysRecordings).toBe(2); // Only today and 5 days ago
      expect(stats.last7DaysPracticeTime).toBe(60); // 2 * 30 seconds
    });

    it('should calculate practice streak correctly', () => {
      // Consecutive days: Jan 15 (today), 14, 13
      const songs: Song[] = [
        {
          id: 1,
          name: 'Song 1',
          sessions: [
            {
              id: 101,
              name: 'Session 1',
              audioData: null,
              sections: [
                {
                  id: 1001,
                  start: 0,
                  end: 30,
                  recordedFiles: [
                    { id: 1, name: 'rec1', data: '', uploadDate: '2024-01-15', tags: [] },
                    { id: 2, name: 'rec2', data: '', uploadDate: '2024-01-14', tags: [] },
                    { id: 3, name: 'rec3', data: '', uploadDate: '2024-01-13', tags: [] },
                    // Gap on Jan 12
                    { id: 4, name: 'rec4', data: '', uploadDate: '2024-01-11', tags: [] },
                    { id: 5, name: 'rec5', data: '', uploadDate: '2024-01-10', tags: [] },
                  ],
                },
              ],
              markers: [],
            },
          ],
        },
      ];

      const stats = calculateStats(songs);
      expect(stats.currentStreak).toBe(3); // 15, 14, 13
      expect(stats.longestStreak).toBe(3); // Same as current
    });

    it('should calculate longest streak when current is broken', () => {
      // Today: Jan 15, but no practice today or yesterday
      // Previous streak: Jan 10, 11, 12, 13 (4 days)
      vi.setSystemTime(new Date('2024-01-15T12:00:00Z'));

      const songs: Song[] = [
        {
          id: 1,
          name: 'Song 1',
          sessions: [
            {
              id: 101,
              name: 'Session 1',
              audioData: null,
              sections: [
                {
                  id: 1001,
                  start: 0,
                  end: 30,
                  recordedFiles: [
                    { id: 1, name: 'rec1', data: '', uploadDate: '2024-01-13', tags: [] },
                    { id: 2, name: 'rec2', data: '', uploadDate: '2024-01-12', tags: [] },
                    { id: 3, name: 'rec3', data: '', uploadDate: '2024-01-11', tags: [] },
                    { id: 4, name: 'rec4', data: '', uploadDate: '2024-01-10', tags: [] },
                  ],
                },
              ],
              markers: [],
            },
          ],
        },
      ];

      const stats = calculateStats(songs);
      expect(stats.currentStreak).toBe(0); // No practice today or yesterday
      expect(stats.longestStreak).toBe(4); // Jan 10-13
    });

    it('should count recordings by date', () => {
      const songs: Song[] = [
        {
          id: 1,
          name: 'Song 1',
          sessions: [
            {
              id: 101,
              name: 'Session 1',
              audioData: null,
              sections: [
                {
                  id: 1001,
                  start: 0,
                  end: 30,
                  recordedFiles: [
                    { id: 1, name: 'rec1', data: '', uploadDate: '2024-01-15', tags: [] },
                    { id: 2, name: 'rec2', data: '', uploadDate: '2024-01-15', tags: [] },
                    { id: 3, name: 'rec3', data: '', uploadDate: '2024-01-14', tags: [] },
                  ],
                },
              ],
              markers: [],
            },
          ],
        },
      ];

      const stats = calculateStats(songs);
      expect(stats.recordingsByDate['2024-01-15']).toBe(2);
      expect(stats.recordingsByDate['2024-01-14']).toBe(1);
    });
  });
});
