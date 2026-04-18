import type { Meta, StoryObj } from '@storybook/react';
import { AudioComparePlayer } from './AudioComparePlayer';
import { Section, Recording, BackingTrack, TimeSignature } from '@/types';

const mockSection: Section = {
  id: 1,
  start: 30,
  end: 60,
  memo: '연습 구간',
  recordedFiles: [],
};

const mockRecording: Recording = {
  id: 1,
  name: '녹음 2024-01-15 오후 3시',
  uploadDate: '2024-01-15T15:00:00Z',
  data: '',
  tags: ['good'],
  syncOffset: 0.5,
};

const mockRecordings: Recording[] = [
  {
    id: 1,
    name: '첫 번째 녹음',
    uploadDate: '2024-01-15T10:00:00Z',
    data: '',
    tags: ['good'],
    syncOffset: 0,
  },
  {
    id: 2,
    name: '두 번째 녹음',
    uploadDate: '2024-01-15T11:00:00Z',
    data: '',
    tags: ['needs-work'],
    syncOffset: 0.3,
  },
  {
    id: 3,
    name: '세 번째 녹음',
    uploadDate: '2024-01-15T12:00:00Z',
    data: '',
    tags: ['best'],
    syncOffset: -0.2,
  },
];

const mockMRBackingTrack: BackingTrack = {
  id: 1,
  name: 'Backing Track.mp3',
  data: '',
  type: 'mr',
};

const mockMetronomeBackingTrack: BackingTrack = {
  id: 2,
  name: 'Metronome',
  data: '',
  type: 'metronome',
  bpm: 120,
  timeSignature: '4/4',
};

const meta: Meta<typeof AudioComparePlayer> = {
  title: 'Practice/AudioComparePlayer',
  component: AudioComparePlayer,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  argTypes: {
    isLooping: {
      control: 'boolean',
      description: 'Loop playback enabled',
    },
    backingTrackVolume: {
      control: { type: 'range', min: 0, max: 1, step: 0.1 },
      description: 'Backing track volume',
    },
  },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof AudioComparePlayer>;

// Note: AudioContext and AudioBuffer cannot be created in Storybook
// This shows the visual appearance of the player

export const Default: Story = {
  args: {
    audioContext: null,
    originalBuffer: null,
    recordedBuffer: null,
    section: mockSection,
    recording: mockRecording,
    sectionStart: 30,
    sectionEnd: 60,
    backingTrack: null,
    backingTrackCurrentTime: 0,
    backingTrackDuration: 30,
    backingTrackIsPlaying: false,
    backingTrackVolume: 1,
    metronomeBeat: 1,
    metronomeBpm: 120,
    metronomeIsPlaying: false,
    metronomeBeatsPerMeasure: 4,
    metronomeTimeSignature: '4/4' as TimeSignature,
    isLooping: false,
    onBackingTrackToggle: () => console.log('Toggle backing track'),
    onBackingTrackSeek: (time) => console.log('Seek backing track:', time),
    onBackingTrackVolumeChange: (volume) => console.log('Backing volume:', volume),
    onSyncEdit: () => console.log('Sync edit'),
    onLoopToggle: () => console.log('Toggle loop'),
  },
};

export const WithMRBackingTrack: Story = {
  args: {
    ...Default.args,
    backingTrack: mockMRBackingTrack,
    backingTrackCurrentTime: 10,
    backingTrackDuration: 30,
  },
};

export const WithMetronome: Story = {
  args: {
    ...Default.args,
    backingTrack: mockMetronomeBackingTrack,
    metronomeBeat: 2,
    metronomeBpm: 120,
    metronomeIsPlaying: true,
    metronomeBeatsPerMeasure: 4,
    metronomeTimeSignature: '4/4' as TimeSignature,
  },
};

export const MetronomePlaying: Story = {
  args: {
    ...Default.args,
    backingTrack: mockMetronomeBackingTrack,
    metronomeBeat: 3,
    metronomeBpm: 100,
    metronomeIsPlaying: true,
    metronomeBeatsPerMeasure: 4,
    metronomeTimeSignature: '4/4' as TimeSignature,
    backingTrackIsPlaying: true,
  },
};

export const Looping: Story = {
  args: {
    ...Default.args,
    isLooping: true,
  },
};

export const WithSyncOffset: Story = {
  args: {
    ...Default.args,
    recording: {
      ...mockRecording,
      syncOffset: -0.25,
    },
  },
};

export const AllFeaturesEnabled: Story = {
  args: {
    ...Default.args,
    backingTrack: mockMRBackingTrack,
    backingTrackCurrentTime: 15,
    backingTrackDuration: 30,
    backingTrackIsPlaying: true,
    isLooping: true,
    recording: {
      ...mockRecording,
      syncOffset: 0.3,
    },
  },
};

// 🆕 녹음 전환 기능 스토리
export const WithMultipleRecordings: Story = {
  args: {
    ...Default.args,
    recording: mockRecordings[0],
    allRecordings: mockRecordings,
    currentRecordingIndex: 0,
    onRecordingChange: (index) => console.log('Recording changed to:', index),
  },
};

export const MultipleRecordingsMiddle: Story = {
  args: {
    ...Default.args,
    recording: mockRecordings[1],
    allRecordings: mockRecordings,
    currentRecordingIndex: 1,
    onRecordingChange: (index) => console.log('Recording changed to:', index),
  },
};

export const MultipleRecordingsLast: Story = {
  args: {
    ...Default.args,
    recording: mockRecordings[2],
    allRecordings: mockRecordings,
    currentRecordingIndex: 2,
    onRecordingChange: (index) => console.log('Recording changed to:', index),
  },
};

export const SingleRecording: Story = {
  args: {
    ...Default.args,
    recording: mockRecording,
    allRecordings: [mockRecording],
    currentRecordingIndex: 0,
    onRecordingChange: (index) => console.log('Recording changed to:', index),
  },
};

export const FullFeaturedWithNavigation: Story = {
  args: {
    ...Default.args,
    backingTrack: mockMRBackingTrack,
    backingTrackCurrentTime: 10,
    backingTrackDuration: 30,
    isLooping: true,
    recording: mockRecordings[1],
    allRecordings: mockRecordings,
    currentRecordingIndex: 1,
    onRecordingChange: (index) => console.log('Recording changed to:', index),
  },
};
