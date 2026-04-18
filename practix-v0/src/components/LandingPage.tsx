'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Play, Mic, Music, Repeat, BarChart3, Smartphone, ArrowRight, Check } from 'lucide-react';
import NotificationSignup from './NotificationSignup';

const features = [
  {
    icon: Music,
    title: '구간 설정',
    description: '연습하고 싶은 구간을 파형에서 직접 드래그하여 설정',
  },
  {
    icon: Repeat,
    title: 'A/B 비교',
    description: '원곡과 내 녹음을 동시에 재생하여 비교 분석',
  },
  {
    icon: Mic,
    title: '녹음 기능',
    description: '반주와 함께 녹음하고 메모와 태그로 관리',
  },
  {
    icon: BarChart3,
    title: '메트로놈',
    description: '다양한 박자와 BPM으로 정확한 연습',
  },
];

const benefits = [
  '무료로 모든 기능 사용 가능',
  '회원가입 없이 바로 시작',
  '데이터는 브라우저에 안전하게 저장',
  '모바일 웹에서도 사용 가능',
];

export default function LandingPage() {
  const router = useRouter();
  const [showNotification, setShowNotification] = useState(false);

  const goToApp = () => {
    router.push('/app');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
        <Image src="/logo.png" alt="Practix" width={160} height={53} className="h-12 md:h-14 w-auto" />
        <button
          onClick={goToApp}
          className="flex items-center gap-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium"
        >
          앱 사용하기
        </button>
      </div>

      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-6xl mx-auto px-4 pt-12 pb-24">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 rounded-full text-blue-700 text-sm font-medium mb-6">
              <Music className="w-4 h-4" />
              음악 연습의 새로운 방법
            </div>

            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6 leading-snug md:leading-tight">
              연습은 <span className="text-blue-600">스마트</span>하게,<br />
              실력은 <span className="text-purple-600">확실</span>하게
            </h1>

            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed">
              구간 반복, A/B 비교, 녹음 기능을 하나의 앱에서.<br />
              당신의 음악 연습을 완전히 바꿔드립니다.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <button
                onClick={goToApp}
                className="flex items-center gap-2 px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-lg shadow-lg shadow-blue-200 transition-all hover:scale-105"
              >
                <Play className="w-5 h-5" />
                무료로 시작하기
                <ArrowRight className="w-5 h-5" />
              </button>

              <button
                onClick={() => setShowNotification(true)}
                className="flex items-center gap-2 px-8 py-4 bg-white hover:bg-gray-50 text-gray-700 rounded-xl font-semibold text-lg border-2 border-gray-200 transition-all"
              >
                <Smartphone className="w-5 h-5" />
                모바일 앱 알림 받기
              </button>
            </div>
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse"></div>
      </div>

      {/* Features Section */}
      <div className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              효과적인 연습을 위한 모든 기능
            </h2>
            <p className="text-lg text-gray-600">
              프로 뮤지션들이 사용하는 연습 방법을 누구나 쉽게
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, idx) => (
              <div
                key={idx}
                className="p-6 rounded-2xl bg-gradient-to-br from-gray-50 to-white border border-gray-100 hover:shadow-lg transition-shadow"
              >
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* How it works */}
      <div className="py-20 bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              3단계로 시작하는 스마트 연습
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 text-white rounded-2xl flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                1
              </div>
              <h3 className="text-xl font-semibold mb-2">음원 업로드</h3>
              <p className="text-gray-600">연습할 곡의 음원 파일을 업로드하세요</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-purple-600 text-white rounded-2xl flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                2
              </div>
              <h3 className="text-xl font-semibold mb-2">구간 설정</h3>
              <p className="text-gray-600">파형에서 연습할 구간을 드래그로 선택하세요</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-pink-600 text-white rounded-2xl flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                3
              </div>
              <h3 className="text-xl font-semibold mb-2">녹음 & 비교</h3>
              <p className="text-gray-600">녹음하고 원곡과 비교하며 실력을 키우세요</p>
            </div>
          </div>
        </div>
      </div>

      {/* Benefits */}
      <div className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-3xl p-8 md:p-12 text-white">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold mb-4">지금 바로 시작하세요</h2>
              <p className="text-blue-100">복잡한 가입 절차 없이 바로 사용할 수 있습니다</p>
            </div>

            <div className="grid md:grid-cols-2 gap-4 mb-8">
              {benefits.map((benefit, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <Check className="w-4 h-4" />
                  </div>
                  <span>{benefit}</span>
                </div>
              ))}
            </div>

            <div className="text-center">
              <button
                onClick={goToApp}
                className="inline-flex items-center gap-2 px-8 py-4 bg-white text-blue-600 rounded-xl font-semibold text-lg hover:bg-blue-50 transition-colors"
              >
                <Play className="w-5 h-5" />
                무료로 체험하기
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile App Coming Soon */}
      <div className="py-20 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-100 rounded-full text-purple-700 text-sm font-medium mb-6">
            <Smartphone className="w-4 h-4" />
            Coming Soon
          </div>

          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            모바일 앱 출시 예정
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            iOS / Android 앱이 곧 출시됩니다.<br />
            알림을 신청하시면 출시 즉시 알려드립니다.
          </p>

          <button
            onClick={() => setShowNotification(true)}
            className="inline-flex items-center gap-2 px-8 py-4 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-semibold text-lg transition-colors"
          >
            <Smartphone className="w-5 h-5" />
            출시 알림 신청하기
          </button>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-8 bg-gray-900 text-gray-400 text-center text-sm">
        <p>Practix - 음악 연습의 새로운 기준</p>
      </footer>

      {/* Modals */}
      {showNotification && (
        <NotificationSignup onClose={() => setShowNotification(false)} />
      )}
    </div>
  );
}
