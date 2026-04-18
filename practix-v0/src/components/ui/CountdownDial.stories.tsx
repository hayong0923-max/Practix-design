import type { Meta, StoryObj } from '@storybook/react';
import CountdownDial from './CountdownDial';

const meta: Meta<typeof CountdownDial> = {
  title: 'UI/CountdownDial',
  component: CountdownDial,
  parameters: {
    layout: 'centered',
    backgrounds: {
      default: 'gray',
      values: [
        { name: 'gray', value: '#f0f0f0' },
        { name: 'dark', value: '#1a1a2e' },
      ],
    },
  },
  tags: ['autodocs'],
  argTypes: {
    value: {
      control: { type: 'range', min: 0, max: 10, step: 0.5 },
      description: '현재 카운트다운 값 (초)',
    },
    min: {
      control: { type: 'number', min: 0, max: 5 },
      description: '최소값',
    },
    max: {
      control: { type: 'number', min: 1, max: 20 },
      description: '최대값',
    },
    step: {
      control: { type: 'select' },
      options: [0.5, 1, 2],
      description: '증가 단위',
    },
  },
  decorators: [
    (Story) => (
      <div style={{ padding: '40px' }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof CountdownDial>;

export const Default: Story = {
  args: {
    value: 3,
    min: 0.5,
    max: 5,
    step: 0.5,
    onChange: (value) => console.log('Countdown changed to:', value),
    onClose: () => console.log('Dial closed'),
  },
};

export const ZeroSeconds: Story = {
  args: {
    ...Default.args,
    value: 0,
    min: 0,
  },
};

export const HalfSecond: Story = {
  args: {
    ...Default.args,
    value: 0.5,
  },
};

export const OneSecond: Story = {
  args: {
    ...Default.args,
    value: 1,
  },
};

export const TwoSeconds: Story = {
  args: {
    ...Default.args,
    value: 2,
  },
};

export const FiveSeconds: Story = {
  args: {
    ...Default.args,
    value: 5,
  },
};

export const ExtendedRange: Story = {
  args: {
    ...Default.args,
    value: 5,
    min: 1,
    max: 10,
    step: 1,
  },
};

export const WholeSecondsOnly: Story = {
  args: {
    ...Default.args,
    value: 3,
    min: 1,
    max: 5,
    step: 1,
  },
};
