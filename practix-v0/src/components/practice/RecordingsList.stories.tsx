import type { Meta, StoryObj } from '@storybook/react';
import RecordingsList from './RecordingsList';
import { Recording, CustomTag } from '@/types';

const mockRecordings: Recording[] = [
  {
    id: 1,
    name: '첫 번째 녹음',
    uploadDate: '2024-01-15T10:00:00Z',
    data: '',
    tags: ['good'],
  },
  {
    id: 2,
    name: '두 번째 녹음 - 조금 더 나아짐',
    uploadDate: '2024-01-15T14:30:00Z',
    data: '',
    tags: ['needs-work', 'tempo-issue'],
  },
  {
    id: 3,
    name: '세 번째 시도',
    uploadDate: '2024-01-16T09:15:00Z',
    data: '',
    tags: ['best'],
  },
];

const mockCustomTags: CustomTag[] = [
  { id: 'custom-1', label: '고음 연습', color: '#ff6b6b', createdAt: new Date().toISOString() },
  { id: 'custom-2', label: '저음 연습', color: '#4ecdc4', createdAt: new Date().toISOString() },
];

const meta: Meta<typeof RecordingsList> = {
  title: 'Practice/RecordingsList',
  component: RecordingsList,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  argTypes: {
    selectedRecordingId: {
      control: { type: 'select' },
      options: [null, 1, 2, 3],
      description: '선택된 녹음 ID',
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
type Story = StoryObj<typeof RecordingsList>;

export const Default: Story = {
  args: {
    recordings: mockRecordings,
    selectedRecordingId: null,
    customTags: [],
    onSelectRecording: (id) => console.log('Select recording:', id),
    onRenameRecording: (id, name) => console.log('Rename:', id, name),
    onDeleteRecording: (id) => console.log('Delete:', id),
    onUpdateTags: (id, tags) => console.log('Update tags:', id, tags),
    onManageTags: () => console.log('Manage tags'),
  },
};

export const WithSelection: Story = {
  args: {
    ...Default.args,
    selectedRecordingId: 2,
  },
};

export const WithCustomTags: Story = {
  args: {
    ...Default.args,
    customTags: mockCustomTags,
  },
};

export const SingleRecording: Story = {
  args: {
    ...Default.args,
    recordings: [mockRecordings[0]],
    selectedRecordingId: 1,
  },
};

export const ManyRecordings: Story = {
  args: {
    ...Default.args,
    recordings: [
      ...mockRecordings,
      {
        id: 4,
        name: '네 번째 녹음',
        uploadDate: '2024-01-16T11:00:00Z',
        data: '',
        tags: [],
      },
      {
        id: 5,
        name: '다섯 번째 녹음 - 최종',
        uploadDate: '2024-01-16T15:00:00Z',
        data: '',
        tags: ['best', 'good'],
      },
      {
        id: 6,
        name: '여섯 번째 녹음',
        uploadDate: '2024-01-17T09:00:00Z',
        data: '',
        tags: ['needs-work'],
      },
    ],
    selectedRecordingId: 5,
  },
};

export const NoTags: Story = {
  args: {
    ...Default.args,
    recordings: [
      {
        id: 1,
        name: '태그 없는 녹음',
        uploadDate: '2024-01-15T10:00:00Z',
        data: '',
        tags: [],
      },
    ],
  },
};

export const Empty: Story = {
  args: {
    ...Default.args,
    recordings: [],
  },
};
