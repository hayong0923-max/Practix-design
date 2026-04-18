'use client';

import { useState } from 'react';
import {
  Upload,
  MousePointer2,
  Mic,
  Play,
  ArrowRight,
  ArrowLeft,
  X,
  Music,
  Repeat,
  BarChart3,
  Check
} from 'lucide-react';

interface OnboardingProps {
  onComplete: (dontShowAgain: boolean) => void;
  onSkip: (dontShowAgain: boolean) => void;
}

interface Step {
  id: number;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  tips: string[];
  image?: string;
}

const steps: Step[] = [
  {
    id: 1,
    icon: Upload,
    title: '음원 업로드',
    description: '연습할 곡의 음원 파일을 업로드하세요. MP3, WAV, M4A 등 대부분의 오디오 형식을 지원합니다.',
    tips: [
      '곡 목록에서 새 곡을 추가하세요',
      '세션을 만들고 오디오 파일을 업로드하세요',
      '파일은 브라우저에 안전하게 저장됩니다',
    ],
  },
  {
    id: 2,
    icon: MousePointer2,
    title: '구간 설정',
    description: '파형에서 연습할 구간을 드래그하여 선택하세요. 여러 구간을 만들어 체계적으로 연습할 수 있습니다.',
    tips: [
      '파형 위에서 드래그하면 구간이 생성됩니다',
      '각 구간마다 메모를 남길 수 있어요',
      '줌 기능으로 정확한 구간 설정이 가능합니다',
    ],
  },
  {
    id: 3,
    icon: Music,
    title: '반주 설정',
    description: '각 구간에 MR(반주)이나 메트로놈을 설정할 수 있습니다. 다양한 박자와 BPM을 지원합니다.',
    tips: [
      'MR 파일을 업로드하거나 메트로놈을 사용하세요',
      '4/4, 3/4, 6/8 등 다양한 박자 지원',
      '40~240 BPM까지 설정 가능합니다',
    ],
  },
  {
    id: 4,
    icon: Mic,
    title: '녹음하기',
    description: '카운트다운 후 녹음을 시작할 수 있습니다. 반주와 함께 녹음도 가능합니다.',
    tips: [
      '"녹음" 버튼으로 즉시 녹음 시작',
      '"3초" 버튼으로 카운트다운 후 녹음',
      '"+반주" 버튼으로 반주와 함께 녹음',
    ],
  },
  {
    id: 5,
    icon: Repeat,
    title: 'A/B 비교',
    description: '녹음된 파일을 선택하면 원곡과 비교할 수 있습니다. 동시 재생으로 차이점을 파악하세요.',
    tips: [
      '원곡과 녹음을 동시에 재생해 비교하세요',
      '각 트랙의 볼륨을 따로 조절할 수 있어요',
      '구간 반복으로 집중 연습이 가능합니다',
    ],
  },
];

export default function Onboarding({ onComplete, onSkip }: OnboardingProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      onComplete(dontShowAgain);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const step = steps[currentStep];
  const StepIcon = step.icon;
  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-blue-600 to-purple-700 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="relative">
          {/* Progress bar */}
          <div className="h-1 bg-gray-200">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Skip button */}
          <button
            onClick={() => onSkip(dontShowAgain)}
            className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Step indicator */}
          <div className="flex justify-center gap-2 pt-6 pb-2">
            {steps.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentStep(idx)}
                className={`w-2 h-2 rounded-full transition-all ${
                  idx === currentStep
                    ? 'w-6 bg-blue-500'
                    : idx < currentStep
                    ? 'bg-blue-300'
                    : 'bg-gray-200'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-8">
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-purple-100 rounded-2xl flex items-center justify-center">
              <StepIcon className="w-10 h-10 text-blue-600" />
            </div>
          </div>

          {/* Text */}
          <div className="text-center mb-6">
            <div className="text-sm text-blue-600 font-medium mb-2">
              STEP {step.id} / {steps.length}
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">{step.title}</h2>
            <p className="text-gray-600">{step.description}</p>
          </div>

          {/* Tips */}
          <div className="bg-gray-50 rounded-xl p-4 mb-6">
            <div className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              사용 팁
            </div>
            <ul className="space-y-2">
              {step.tips.map((tip, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm text-gray-600">
                  <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                  {tip}
                </li>
              ))}
            </ul>
          </div>

          {/* Navigation */}
          <div className="flex gap-3">
            {currentStep > 0 && (
              <button
                onClick={handlePrev}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                이전
              </button>
            )}

            <button
              onClick={handleNext}
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors"
            >
              {currentStep < steps.length - 1 ? (
                <>
                  다음
                  <ArrowRight className="w-5 h-5" />
                </>
              ) : (
                <>
                  <Play className="w-5 h-5" />
                  시작하기
                </>
              )}
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-8 pb-6">
          <label className="flex items-center justify-center gap-2 mb-3 cursor-pointer">
            <input
              type="checkbox"
              checked={dontShowAgain}
              onChange={(e) => setDontShowAgain(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-500">다시 보지 않기</span>
          </label>
          <button
            onClick={() => onSkip(dontShowAgain)}
            className="text-sm text-gray-400 hover:text-gray-600 transition-colors w-full"
          >
            건너뛰고 바로 시작하기
          </button>
        </div>
      </div>
    </div>
  );
}
