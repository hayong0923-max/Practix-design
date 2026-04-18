import type { Meta, StoryObj } from '@storybook/react';
import MiniWaveform from './MiniWaveform';

const meta: Meta<typeof MiniWaveform> = {
  title: 'Practice/MiniWaveform',
  component: MiniWaveform,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  argTypes: {
    currentTime: {
      control: { type: 'range', min: 0, max: 30, step: 0.1 },
      description: '현재 재생 위치 (초)',
    },
    duration: {
      control: { type: 'number', min: 1, max: 60 },
      description: '전체 길이 (초)',
    },
    color: {
      control: { type: 'select' },
      options: ['blue', 'red', 'green'],
      description: '파형 색상',
    },
    height: {
      control: { type: 'range', min: 20, max: 100, step: 5 },
      description: '파형 높이 (px)',
    },
  },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: '400px', margin: '0 auto', padding: '20px' }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof MiniWaveform>;

// Note: AudioBuffer cannot be created in Storybook
// These stories show the empty/loading state

export const BlueEmpty: Story = {
  args: {
    buffer: null,
    currentTime: 0,
    duration: 30,
    onSeek: (time) => console.log('Seek to:', time),
    color: 'blue',
    height: 40,
  },
};

export const RedEmpty: Story = {
  args: {
    ...BlueEmpty.args,
    color: 'red',
  },
};

export const GreenEmpty: Story = {
  args: {
    ...BlueEmpty.args,
    color: 'green',
  },
};

export const TallWaveform: Story = {
  args: {
    ...BlueEmpty.args,
    height: 60,
  },
};

export const ShortWaveform: Story = {
  args: {
    ...BlueEmpty.args,
    height: 24,
  },
};

export const ProgressMiddle: Story = {
  args: {
    ...BlueEmpty.args,
    currentTime: 15,
    duration: 30,
  },
};

export const ProgressNearEnd: Story = {
  args: {
    ...BlueEmpty.args,
    currentTime: 28,
    duration: 30,
  },
};

export const AllColors: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div>
        <p style={{ marginBottom: '4px', fontSize: '12px', color: '#666' }}>Blue (원곡)</p>
        <MiniWaveform
          buffer={null}
          currentTime={10}
          duration={30}
          onSeek={() => {}}
          color="blue"
          height={36}
        />
      </div>
      <div>
        <p style={{ marginBottom: '4px', fontSize: '12px', color: '#666' }}>Red (녹음)</p>
        <MiniWaveform
          buffer={null}
          currentTime={15}
          duration={30}
          onSeek={() => {}}
          color="red"
          height={36}
        />
      </div>
      <div>
        <p style={{ marginBottom: '4px', fontSize: '12px', color: '#666' }}>Green (반주)</p>
        <MiniWaveform
          buffer={null}
          currentTime={20}
          duration={30}
          onSeek={() => {}}
          color="green"
          height={36}
        />
      </div>
    </div>
  ),
};
