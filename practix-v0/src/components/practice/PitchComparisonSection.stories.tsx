import type { Meta, StoryObj } from '@storybook/react';
import PitchComparisonSection from './PitchComparisonSection';
import { PitchAnalysisResult } from '@/utils/pitchDetection';

const meta: Meta<typeof PitchComparisonSection> = {
  title: 'Practice/PitchComparisonSection',
  component: PitchComparisonSection,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  argTypes: {
    isExpanded: {
      control: 'boolean',
      description: 'Section expanded state',
    },
    isAnalyzing: {
      control: 'boolean',
      description: 'Analysis in progress',
    },
    hasAudioBuffer: {
      control: 'boolean',
      description: 'Has original audio buffer',
    },
    hasRecordingBuffer: {
      control: 'boolean',
      description: 'Has recording buffer',
    },
    isDark: {
      control: 'boolean',
      description: 'Dark mode',
    },
    currentTime: {
      control: { type: 'range', min: 0, max: 180, step: 1 },
    },
    duration: {
      control: { type: 'number', min: 60, max: 300 },
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
type Story = StoryObj<typeof PitchComparisonSection>;

export const Collapsed: Story = {
  args: {
    isExpanded: false,
    originalPitch: null,
    recordingPitch: null,
    matchPercentage: null,
    isAnalyzing: false,
    error: null,
    currentTime: 0,
    duration: 180,
    hasAudioBuffer: true,
    hasRecordingBuffer: true,
    isDark: false,
    onToggleExpand: () => console.log('Toggle expand'),
    onAnalyzeOriginal: () => console.log('Analyze original'),
    onAnalyzeRecording: () => console.log('Analyze recording'),
    onClearAnalysis: () => console.log('Clear analysis'),
  },
};

export const Expanded: Story = {
  args: {
    ...Collapsed.args,
    isExpanded: true,
  },
};

export const Analyzing: Story = {
  args: {
    ...Collapsed.args,
    isExpanded: true,
    isAnalyzing: true,
  },
};

const mockOriginalPitch: PitchAnalysisResult = {
  pitchData: [
    { time: 0, frequency: 440, confidence: 0.9, note: 'A4', cents: 0 },
    { time: 0.5, frequency: 442, confidence: 0.85, note: 'A4', cents: 8 },
    { time: 1, frequency: 445, confidence: 0.88, note: 'A4', cents: 20 },
    { time: 1.5, frequency: 440, confidence: 0.92, note: 'A4', cents: 0 },
    { time: 2, frequency: 438, confidence: 0.87, note: 'A4', cents: -8 },
  ],
  duration: 2.5,
  sampleRate: 44100,
  minFreq: 438,
  maxFreq: 445,
};

const mockRecordingPitch: PitchAnalysisResult = {
  pitchData: [
    { time: 0, frequency: 438, confidence: 0.85, note: 'A4', cents: -8 },
    { time: 0.5, frequency: 440, confidence: 0.88, note: 'A4', cents: 0 },
    { time: 1, frequency: 443, confidence: 0.82, note: 'A4', cents: 12 },
    { time: 1.5, frequency: 439, confidence: 0.9, note: 'A4', cents: -4 },
    { time: 2, frequency: 437, confidence: 0.86, note: 'A4', cents: -12 },
  ],
  duration: 2.5,
  sampleRate: 44100,
  minFreq: 437,
  maxFreq: 443,
};

export const WithResults: Story = {
  args: {
    ...Collapsed.args,
    isExpanded: true,
    originalPitch: mockOriginalPitch,
    recordingPitch: mockRecordingPitch,
    matchPercentage: 85,
  },
};

export const WithError: Story = {
  args: {
    ...Collapsed.args,
    isExpanded: true,
    error: '분석에 실패했습니다. 다시 시도해주세요.',
  },
};

export const DarkMode: Story = {
  args: {
    ...Collapsed.args,
    isExpanded: true,
    isDark: true,
  },
  parameters: {
    backgrounds: { default: 'dark' },
  },
};
