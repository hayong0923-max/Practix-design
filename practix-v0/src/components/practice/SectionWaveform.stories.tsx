import type { Meta, StoryObj } from '@storybook/react';
import SectionWaveform from './SectionWaveform';

// Generate mock waveform data
const generateWaveformData = (length: number = 500): number[] => {
  const data: number[] = [];
  for (let i = 0; i < length; i++) {
    // Simulate audio waveform with some variation
    const base = 0.3 + Math.sin(i * 0.1) * 0.2;
    const noise = Math.random() * 0.3;
    data.push(Math.min(1, Math.max(0, base + noise)));
  }
  return data;
};

const meta: Meta<typeof SectionWaveform> = {
  title: 'Practice/SectionWaveform',
  component: SectionWaveform,
  parameters: {
    layout: 'padded',
    backgrounds: {
      default: 'dark',
      values: [
        { name: 'dark', value: '#1f2937' },
        { name: 'light', value: '#ffffff' },
      ],
    },
  },
  tags: ['autodocs'],
  argTypes: {
    waveformData: {
      control: false,
      description: 'Array of amplitude values (0-1)',
    },
    duration: {
      control: { type: 'number', min: 10, max: 300, step: 10 },
      description: 'Total audio duration in seconds',
    },
    sectionStart: {
      control: { type: 'number', min: 0, max: 300, step: 1 },
      description: 'Section start time in seconds',
    },
    sectionEnd: {
      control: { type: 'number', min: 0, max: 300, step: 1 },
      description: 'Section end time in seconds',
    },
    currentTime: {
      control: { type: 'number', min: 0, max: 100, step: 0.1 },
      description: 'Current playback time relative to section start',
    },
    isPlaying: {
      control: 'boolean',
      description: 'Whether audio is currently playing',
    },
    showHandles: {
      control: 'boolean',
      description: 'Show boundary adjustment handles',
    },
    onSeek: {
      action: 'seek',
      description: 'Called when user seeks to a position',
    },
    onSectionBoundaryChange: {
      action: 'boundaryChange',
      description: 'Called when section boundaries are adjusted',
    },
  },
  decorators: [
    (Story) => (
      <div style={{ width: '100%', maxWidth: '800px', padding: '20px' }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof SectionWaveform>;

// Default story showing a section in the middle of the track
export const Default: Story = {
  args: {
    waveformData: generateWaveformData(500),
    duration: 180, // 3 minutes
    sectionStart: 30, // Start at 30 seconds
    sectionEnd: 60, // End at 60 seconds
    currentTime: 10, // 10 seconds into the section
    isPlaying: false,
    showHandles: true,
    onSeek: (time) => console.log('Seek to:', time),
    onSectionBoundaryChange: (start, end) =>
      console.log('Boundary changed:', start, end),
  },
};

// Playing state
export const Playing: Story = {
  args: {
    ...Default.args,
    isPlaying: true,
    currentTime: 15,
  },
};

// At the beginning of the track
export const AtTrackStart: Story = {
  args: {
    waveformData: generateWaveformData(500),
    duration: 180,
    sectionStart: 0,
    sectionEnd: 30,
    currentTime: 5,
    isPlaying: false,
    showHandles: true,
  },
};

// At the end of the track
export const AtTrackEnd: Story = {
  args: {
    waveformData: generateWaveformData(500),
    duration: 180,
    sectionStart: 150,
    sectionEnd: 180,
    currentTime: 10,
    isPlaying: false,
    showHandles: true,
  },
};

// Very short section
export const ShortSection: Story = {
  args: {
    waveformData: generateWaveformData(500),
    duration: 180,
    sectionStart: 60,
    sectionEnd: 65, // Only 5 seconds
    currentTime: 2,
    isPlaying: false,
    showHandles: true,
  },
};

// Without handles (read-only view)
export const WithoutHandles: Story = {
  args: {
    waveformData: generateWaveformData(500),
    duration: 180,
    sectionStart: 30,
    sectionEnd: 60,
    currentTime: 15,
    isPlaying: false,
    showHandles: false,
  },
};

// No waveform data (loading state)
export const Loading: Story = {
  args: {
    waveformData: null,
    duration: 180,
    sectionStart: 30,
    sectionEnd: 60,
    currentTime: 0,
    isPlaying: false,
    showHandles: true,
  },
};
