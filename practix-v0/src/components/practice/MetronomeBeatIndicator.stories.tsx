import type { Meta, StoryObj } from '@storybook/react';
import MetronomeBeatIndicator from './MetronomeBeatIndicator';
import { TimeSignature } from '@/types';

const meta: Meta<typeof MetronomeBeatIndicator> = {
  title: 'Practice/MetronomeBeatIndicator',
  component: MetronomeBeatIndicator,
  parameters: {
    layout: 'centered',
    backgrounds: {
      default: 'green',
      values: [
        { name: 'green', value: '#dcfce7' },
        { name: 'dark', value: '#1a1a2e' },
      ],
    },
  },
  tags: ['autodocs'],
  argTypes: {
    currentBeat: {
      control: { type: 'range', min: 1, max: 6, step: 1 },
      description: '현재 박자',
    },
    bpm: {
      control: { type: 'range', min: 40, max: 200, step: 1 },
      description: 'BPM',
    },
    isPlaying: {
      control: 'boolean',
      description: '재생 중 여부',
    },
    beatsPerMeasure: {
      control: { type: 'select' },
      options: [2, 3, 4, 6],
      description: '마디당 박자 수',
    },
    timeSignature: {
      control: { type: 'select' },
      options: ['2/4', '3/4', '4/4', '6/8'],
      description: '박자표',
    },
  },
  decorators: [
    (Story) => (
      <div style={{ padding: '20px', minWidth: '200px' }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof MetronomeBeatIndicator>;

export const FourFourBeat1: Story = {
  args: {
    currentBeat: 1,
    bpm: 120,
    isPlaying: true,
    beatsPerMeasure: 4,
    timeSignature: '4/4' as TimeSignature,
  },
};

export const FourFourBeat2: Story = {
  args: {
    ...FourFourBeat1.args,
    currentBeat: 2,
  },
};

export const FourFourBeat3: Story = {
  args: {
    ...FourFourBeat1.args,
    currentBeat: 3,
  },
};

export const FourFourBeat4: Story = {
  args: {
    ...FourFourBeat1.args,
    currentBeat: 4,
  },
};

export const ThreeFour: Story = {
  args: {
    currentBeat: 1,
    bpm: 100,
    isPlaying: true,
    beatsPerMeasure: 3,
    timeSignature: '3/4' as TimeSignature,
  },
};

export const TwoFour: Story = {
  args: {
    currentBeat: 1,
    bpm: 80,
    isPlaying: true,
    beatsPerMeasure: 2,
    timeSignature: '2/4' as TimeSignature,
  },
};

export const SixEightBeat1: Story = {
  args: {
    currentBeat: 1,
    bpm: 140,
    isPlaying: true,
    beatsPerMeasure: 6,
    timeSignature: '6/8' as TimeSignature,
  },
};

export const SixEightBeat4: Story = {
  args: {
    ...SixEightBeat1.args,
    currentBeat: 4,
  },
};

export const NotPlaying: Story = {
  args: {
    ...FourFourBeat1.args,
    isPlaying: false,
  },
};

export const ZeroBpm: Story = {
  args: {
    ...FourFourBeat1.args,
    bpm: 0,
  },
};

export const FastBpm: Story = {
  args: {
    ...FourFourBeat1.args,
    bpm: 180,
  },
};

export const SlowBpm: Story = {
  args: {
    ...FourFourBeat1.args,
    bpm: 60,
  },
};

export const AllTimeSignatures: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <p style={{ marginBottom: '8px', fontSize: '12px', fontWeight: 'bold' }}>2/4 박자</p>
        <MetronomeBeatIndicator
          currentBeat={1}
          bpm={120}
          isPlaying={true}
          beatsPerMeasure={2}
          timeSignature="2/4"
        />
      </div>
      <div>
        <p style={{ marginBottom: '8px', fontSize: '12px', fontWeight: 'bold' }}>3/4 박자</p>
        <MetronomeBeatIndicator
          currentBeat={2}
          bpm={120}
          isPlaying={true}
          beatsPerMeasure={3}
          timeSignature="3/4"
        />
      </div>
      <div>
        <p style={{ marginBottom: '8px', fontSize: '12px', fontWeight: 'bold' }}>4/4 박자</p>
        <MetronomeBeatIndicator
          currentBeat={3}
          bpm={120}
          isPlaying={true}
          beatsPerMeasure={4}
          timeSignature="4/4"
        />
      </div>
      <div>
        <p style={{ marginBottom: '8px', fontSize: '12px', fontWeight: 'bold' }}>6/8 박자</p>
        <MetronomeBeatIndicator
          currentBeat={4}
          bpm={120}
          isPlaying={true}
          beatsPerMeasure={6}
          timeSignature="6/8"
        />
      </div>
    </div>
  ),
};
