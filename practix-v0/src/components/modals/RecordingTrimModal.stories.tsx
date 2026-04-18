import type { Meta, StoryObj } from '@storybook/react';
import RecordingTrimModal from './RecordingTrimModal';
import { Recording } from '@/types';

const mockRecording: Recording = {
  id: 1,
  name: '녹음 2024-01-15 오후 3시',
  uploadDate: '2024-01-15T15:00:00Z',
  data: '',
  tags: ['good'],
};

const meta: Meta<typeof RecordingTrimModal> = {
  title: 'Modals/RecordingTrimModal',
  component: RecordingTrimModal,
  parameters: {
    layout: 'fullscreen',
    backgrounds: {
      default: 'dark-overlay',
      values: [
        { name: 'dark-overlay', value: 'rgba(0, 0, 0, 0.5)' },
        { name: 'white', value: '#ffffff' },
      ],
    },
  },
  tags: ['autodocs'],
  argTypes: {
    show: {
      control: 'boolean',
      description: 'Whether the modal is visible',
    },
    onClose: {
      action: 'close',
      description: 'Called when modal is closed',
    },
    onSave: {
      action: 'save',
      description: 'Called with (trimStart, trimEnd) when user saves',
    },
  },
};

export default meta;
type Story = StoryObj<typeof RecordingTrimModal>;

// Note: AudioBuffer and AudioContext cannot be created in Storybook
// This shows the visual appearance of the modal

export const Default: Story = {
  args: {
    show: true,
    recording: mockRecording,
    audioBuffer: null,
    audioContext: null,
    onClose: () => console.log('Close modal'),
    onSave: (trimStart, trimEnd) =>
      console.log('Save trim:', trimStart, '-', trimEnd),
  },
};

export const LongRecordingName: Story = {
  args: {
    ...Default.args,
    recording: {
      ...mockRecording,
      name: '아주 긴 녹음 이름입니다 - 연습 세션 2024년 1월 15일 오후 3시 30분 서울',
    },
  },
};

export const Hidden: Story = {
  args: {
    ...Default.args,
    show: false,
  },
};
