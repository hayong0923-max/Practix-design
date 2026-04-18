import type { Meta, StoryObj } from '@storybook/react';
import BottomControlBar from './BottomControlBar';

const meta: Meta<typeof BottomControlBar> = {
  title: 'Practice/BottomControlBar',
  component: BottomControlBar,
  parameters: {
    layout: 'fullscreen',
    backgrounds: {
      default: 'dark',
      values: [
        { name: 'dark', value: '#0f0f1a' },
      ],
    },
  },
  tags: ['autodocs'],
  argTypes: {
    currentTime: {
      control: { type: 'range', min: 0, max: 300, step: 1 },
      description: 'Current playback time in seconds',
    },
    duration: {
      control: { type: 'number', min: 60, max: 600 },
      description: 'Total duration in seconds',
    },
    isPlaying: {
      control: 'boolean',
      description: 'Whether audio is playing',
    },
    playbackRate: {
      control: { type: 'select' },
      options: [0.5, 0.75, 1, 1.25, 1.5],
      description: 'Playback speed',
    },
    isLooping: {
      control: 'boolean',
      description: 'Loop mode enabled',
    },
  },
  decorators: [
    (Story) => (
      <div style={{ height: '200px', position: 'relative' }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof BottomControlBar>;

export const Default: Story = {
  args: {
    currentTime: 45,
    duration: 180,
    isPlaying: false,
    playbackRate: 1,
    isLooping: false,
    sectionMarkStart: null,
    onPlayPause: () => console.log('Play/Pause'),
    onSeek: (time) => console.log('Seek:', time),
    onPlayFromTime: (time) => console.log('Play from:', time),
    onSkipBack: () => console.log('Skip back'),
    onSkipForward: () => console.log('Skip forward'),
    onSkipToBeginning: () => console.log('Skip to beginning'),
    onSectionMarker: () => console.log('Section marker'),
    onLoopToggle: () => console.log('Loop toggle'),
    onPlaybackRateChange: (rate) => console.log('Rate:', rate),
  },
};

export const Playing: Story = {
  args: {
    ...Default.args,
    isPlaying: true,
    currentTime: 90,
  },
};

export const WithSectionMark: Story = {
  args: {
    ...Default.args,
    sectionMarkStart: 30,
    currentTime: 60,
  },
};

export const Looping: Story = {
  args: {
    ...Default.args,
    isLooping: true,
  },
};

export const SlowPlayback: Story = {
  args: {
    ...Default.args,
    playbackRate: 0.75,
  },
};

export const FastPlayback: Story = {
  args: {
    ...Default.args,
    playbackRate: 1.5,
  },
};

export const NearEnd: Story = {
  args: {
    ...Default.args,
    currentTime: 175,
    duration: 180,
    isPlaying: true,
  },
};
