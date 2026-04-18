import type { Meta, StoryObj } from '@storybook/react';
import SheetMusicSection from './SheetMusicSection';
import { Section, SheetMusic } from '@/types';

const mockSections: Section[] = [
  { id: 1, start: 0, end: 30, recordedFiles: [] },
  { id: 2, start: 30, end: 60, recordedFiles: [] },
  { id: 3, start: 60, end: 90, recordedFiles: [] },
];

const meta: Meta<typeof SheetMusicSection> = {
  title: 'Practice/SheetMusicSection',
  component: SheetMusicSection,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  argTypes: {
    isDark: {
      control: 'boolean',
      description: 'Dark mode',
    },
    currentTime: {
      control: { type: 'range', min: 0, max: 180, step: 1 },
      description: 'Current playback time',
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
type Story = StoryObj<typeof SheetMusicSection>;

export const Empty: Story = {
  args: {
    sheetMusic: null,
    sections: mockSections,
    selectedSectionId: null,
    currentTime: 0,
    isDark: false,
    onEditClick: () => console.log('Edit click'),
    onSectionClick: (id) => console.log('Section click:', id),
  },
};

export const WithSheetMusic: Story = {
  args: {
    ...Empty.args,
    sheetMusic: {
      id: 'sheet-1',
      imageData: 'https://via.placeholder.com/600x400?text=Sheet+Music',
      originalWidth: 600,
      originalHeight: 400,
      regions: [
        { id: 'r1', sectionId: 1, x: 0, y: 0, width: 200, height: 100, color: '#ef4444', order: 0 },
        { id: 'r2', sectionId: 2, x: 200, y: 0, width: 200, height: 100, color: '#22c55e', order: 1 },
        { id: 'r3', sectionId: 3, x: 400, y: 0, width: 200, height: 100, color: '#3b82f6', order: 2 },
      ],
      createdAt: '2024-01-15T10:00:00Z',
      updatedAt: '2024-01-15T10:00:00Z',
    },
  },
};

export const DarkModeEmpty: Story = {
  args: {
    ...Empty.args,
    isDark: true,
  },
  parameters: {
    backgrounds: { default: 'dark' },
  },
};
