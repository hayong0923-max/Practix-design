import type { Meta, StoryObj } from '@storybook/react';
import BasicRecordingSection from './BasicRecordingSection';
import { Recording } from '@/types';

const mockRecordings: Recording[] = [
  {
    id: 1,
    name: '녹음 2024-01-15 오후 3시',
    uploadDate: '2024-01-15T15:00:00Z',
    data: '',
    tags: ['good'],
  },
  {
    id: 2,
    name: '녹음 2024-01-15 오후 4시',
    uploadDate: '2024-01-15T16:00:00Z',
    data: '',
    tags: ['needs-work'],
  },
];

const meta: Meta<typeof BasicRecordingSection> = {
  title: 'Practice/BasicRecordingSection',
  component: BasicRecordingSection,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  argTypes: {
    isDark: {
      control: 'boolean',
      description: 'Dark mode',
    },
    isRecording: {
      control: 'boolean',
      description: 'Recording in progress',
    },
    isCountingDown: {
      control: 'boolean',
      description: 'Countdown in progress',
    },
    countdown: {
      control: { type: 'number', min: 1, max: 10 },
      description: 'Countdown value',
    },
    recordingTime: {
      control: { type: 'number', min: 0, max: 300 },
      description: 'Recording time in seconds',
    },
    audioLevel: {
      control: { type: 'range', min: 0, max: 1, step: 0.1 },
      description: 'Audio level (0-1)',
    },
    countdownDuration: {
      control: { type: 'number', min: 1, max: 10 },
      description: 'Default countdown duration',
    },
  },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: '500px', margin: '0 auto' }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof BasicRecordingSection>;

export const Empty: Story = {
  args: {
    recordings: [],
    selectedRecordingId: null,
    recordedAudioBuffer: {},
    recordedIsPlaying: {},
    recordedCurrentTime: {},
    isRecording: false,
    isCountingDown: false,
    countdown: 0,
    recordingTime: 0,
    audioLevel: 0,
    countdownDuration: 3,
    isDark: false,
    onSelectRecording: (id) => console.log('Select:', id),
    onTogglePlay: (id) => console.log('Toggle play:', id),
    onSeek: (id, time) => console.log('Seek:', id, time),
    onStartRecording: (countdown) => console.log('Start recording:', countdown),
    onStopRecording: () => console.log('Stop recording'),
    onCancelCountdown: () => console.log('Cancel countdown'),
    onDeleteRecording: (id) => console.log('Delete:', id),
    onTrimRecording: (rec) => console.log('Trim:', rec),
    onCountdownDurationChange: (d) => console.log('Countdown:', d),
    getEffectiveDuration: () => 30,
  },
};

export const WithRecordings: Story = {
  args: {
    ...Empty.args,
    recordings: mockRecordings,
    selectedRecordingId: 1,
  },
};

export const RecordingInProgress: Story = {
  args: {
    ...Empty.args,
    isRecording: true,
    recordingTime: 15.5,
    audioLevel: 0.65,
  },
};

export const CountingDown: Story = {
  args: {
    ...Empty.args,
    isCountingDown: true,
    countdown: 2,
  },
};

export const DarkMode: Story = {
  args: {
    ...Empty.args,
    recordings: mockRecordings,
    selectedRecordingId: 1,
    isDark: true,
  },
  parameters: {
    backgrounds: { default: 'dark' },
  },
};

export const DarkModeRecording: Story = {
  args: {
    ...Empty.args,
    isDark: true,
    isRecording: true,
    recordingTime: 45.2,
    audioLevel: 0.8,
  },
  parameters: {
    backgrounds: { default: 'dark' },
  },
};
