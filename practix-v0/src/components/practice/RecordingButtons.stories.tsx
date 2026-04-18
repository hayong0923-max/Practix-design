import type { Meta, StoryObj } from '@storybook/react';
import RecordingButtons from './RecordingButtons';

const defaultRecordingState = {
  isRecording: false,
  isCountingDown: false,
  countdown: 0,
  recordingTime: 0,
  audioLevel: 0,
};

const meta: Meta<typeof RecordingButtons> = {
  title: 'Practice/RecordingButtons',
  component: RecordingButtons,
  parameters: {
    layout: 'centered',
    backgrounds: {
      default: 'light',
      values: [
        { name: 'light', value: '#f5f5f5' },
        { name: 'dark', value: '#1a1a2e' },
      ],
    },
  },
  tags: ['autodocs'],
  argTypes: {
    hasBackingTrack: {
      control: 'boolean',
      description: '반주 트랙 유무',
    },
    disabled: {
      control: 'boolean',
      description: '버튼 비활성화',
    },
    countdownDuration: {
      control: { type: 'number', min: 0, max: 10 },
      description: '카운트다운 초',
    },
  },
  decorators: [
    (Story) => (
      <div style={{ padding: '20px', minWidth: '300px' }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof RecordingButtons>;

export const Default: Story = {
  args: {
    recordingState: defaultRecordingState,
    hasBackingTrack: false,
    disabled: false,
    countdownDuration: 3,
    onStartRecording: (countdown, withBacking) =>
      console.log('Start recording:', countdown, 'with backing:', withBacking),
    onStopRecording: () => console.log('Stop recording'),
    onCancelCountdown: () => console.log('Cancel countdown'),
    onCountdownDurationChange: (duration) => console.log('Duration:', duration),
  },
};

export const WithBackingTrack: Story = {
  args: {
    ...Default.args,
    hasBackingTrack: true,
  },
};

export const Recording: Story = {
  args: {
    ...Default.args,
    recordingState: {
      ...defaultRecordingState,
      isRecording: true,
      recordingTime: 15.5,
      audioLevel: 0.6,
    },
  },
};

export const RecordingHighLevel: Story = {
  args: {
    ...Default.args,
    recordingState: {
      ...defaultRecordingState,
      isRecording: true,
      recordingTime: 30.2,
      audioLevel: 0.9,
    },
  },
};

export const CountingDown3: Story = {
  args: {
    ...Default.args,
    recordingState: {
      ...defaultRecordingState,
      isCountingDown: true,
      countdown: 3,
    },
  },
};

export const CountingDown2: Story = {
  args: {
    ...Default.args,
    recordingState: {
      ...defaultRecordingState,
      isCountingDown: true,
      countdown: 2,
    },
  },
};

export const CountingDown1: Story = {
  args: {
    ...Default.args,
    recordingState: {
      ...defaultRecordingState,
      isCountingDown: true,
      countdown: 1,
    },
  },
};

export const Disabled: Story = {
  args: {
    ...Default.args,
    disabled: true,
  },
};

export const NoCountdown: Story = {
  args: {
    ...Default.args,
    countdownDuration: 0,
  },
};

export const LongCountdown: Story = {
  args: {
    ...Default.args,
    countdownDuration: 5,
  },
};
