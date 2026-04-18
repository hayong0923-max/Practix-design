import type { Meta, StoryObj } from '@storybook/react';
import SectionCard from './SectionCard';
import { Section } from '@/types';

const mockSection: Section = {
  id: 1,
  start: 30,
  end: 60,
  memo: '어려운 구간 - 연습 필요',
  recordedFiles: [],
};

const mockSectionWithRecordings: Section = {
  id: 2,
  start: 60,
  end: 90,
  memo: '빠른 리듬 구간',
  recordedFiles: [
    {
      id: 1,
      name: '녹음 1',
      uploadDate: '2024-01-15T10:00:00Z',
      data: '',
      tags: ['good'],
    },
    {
      id: 2,
      name: '녹음 2',
      uploadDate: '2024-01-15T11:00:00Z',
      data: '',
      tags: ['needs-work'],
    },
  ],
  backingTrack: {
    id: 1,
    name: 'Metronome',
    data: '',
    type: 'metronome',
    bpm: 120,
    timeSignature: '4/4',
  },
};

const defaultRecordingState = {
  isRecording: false,
  isCountingDown: false,
  countdown: 0,
  recordingTime: 0,
  audioLevel: 0,
  error: null,
};

const defaultRecordingActions = {
  onStartRecording: () => console.log('Start recording'),
  onStopRecording: () => console.log('Stop recording'),
  onCancelCountdown: () => console.log('Cancel countdown'),
};

const defaultLoopControls = {
  isLooping: false,
  onLoopToggle: () => console.log('Toggle loop'),
};

const defaultCountdownSettings = {
  countdownDuration: 3,
  onCountdownDurationChange: (duration: number) =>
    console.log('Countdown:', duration),
};

const meta: Meta<typeof SectionCard> = {
  title: 'Practice/SectionCard',
  component: SectionCard,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  argTypes: {
    index: {
      control: { type: 'number', min: 0, max: 10 },
      description: 'Section index (0-based)',
    },
    isUploading: {
      control: 'boolean',
      description: 'Recording upload in progress',
    },
    isDragging: {
      control: 'boolean',
      description: 'Card is being dragged',
    },
    isDragOver: {
      control: 'boolean',
      description: 'Another card is being dragged over this one',
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
type Story = StoryObj<typeof SectionCard>;

export const Default: Story = {
  args: {
    section: mockSection,
    index: 0,
    onDelete: () => console.log('Delete section'),
    onPlaySection: () => console.log('Play section'),
    onOpenPractice: () => console.log('Open practice'),
    onUploadRecording: () => console.log('Upload recording'),
    isUploading: false,
    recordingState: defaultRecordingState,
    recordingActions: defaultRecordingActions,
    hasBackingTrack: false,
    editingMemo: null,
    onEditMemo: () => console.log('Edit memo'),
    onSaveMemo: (memo: string) => console.log('Save memo:', memo),
    loopControls: defaultLoopControls,
    countdownSettings: defaultCountdownSettings,
    recordingsCount: 0,
  },
};

export const WithRecordings: Story = {
  args: {
    ...Default.args,
    section: mockSectionWithRecordings,
    index: 1,
    hasBackingTrack: true,
    recordingsCount: 2,
  },
};

export const RecordingInProgress: Story = {
  args: {
    ...Default.args,
    section: mockSection,
    recordingState: {
      ...defaultRecordingState,
      isRecording: true,
      recordingTime: 15.5,
      audioLevel: 0.7,
    },
  },
};

export const CountingDown: Story = {
  args: {
    ...Default.args,
    section: mockSection,
    recordingState: {
      ...defaultRecordingState,
      isCountingDown: true,
      countdown: 2,
    },
  },
};

export const WithError: Story = {
  args: {
    ...Default.args,
    section: mockSection,
    recordingState: {
      ...defaultRecordingState,
      error: '마이크 접근 권한이 필요합니다',
    },
  },
};

export const Uploading: Story = {
  args: {
    ...Default.args,
    section: mockSection,
    isUploading: true,
  },
};

export const Dragging: Story = {
  args: {
    ...Default.args,
    section: mockSection,
    isDragging: true,
    onDragStart: (index: number) => console.log('Drag start:', index),
    onDragOver: (index: number) => console.log('Drag over:', index),
    onDragEnd: () => console.log('Drag end'),
  },
};

export const DragOver: Story = {
  args: {
    ...Default.args,
    section: mockSection,
    isDragOver: true,
    onDragStart: (index: number) => console.log('Drag start:', index),
    onDragOver: (index: number) => console.log('Drag over:', index),
    onDragEnd: () => console.log('Drag end'),
  },
};
