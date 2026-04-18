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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-6xl mx-auto px-6 h-16 flex justify-between items-center">
          <Image src="/logo.png" alt="Practix" width={120} height={40} className="h-8 w-auto" />
          <button
            onClick={goToApp}
            className="px-5 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
          >
            앱 사용하기
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="max-w-3xl">
            <p className="text-sm font-medium text-accent mb-6 tracking-wide uppercase">
              음악 연습의 새로운 방법
            </p>

            <h1 className="font-serif text-5xl md:text-7xl font-bold text-foreground mb-8 leading-tight text-balance">
              연습은 스마트하게,
              <br />
              실력은 확실하게
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground mb-12 leading-relaxed max-w-xl">
              구간 반복, A/B 비교, 녹음 기능을 하나의 앱에서.
              당신의 음악 연습을 완전히 바꿔드립니다.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={goToApp}
                className="inline-flex items-center justify-center gap-3 px-8 py-4 bg-primary text-primary-foreground rounded-lg font-semibold text-base hover:opacity-90 transition-all"
              >
                <Play className="w-5 h-5" />
                무료로 시작하기
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => setShowNotification(true)}
                className="inline-flex items-center justify-center gap-3 px-8 py-4 bg-secondary text-secondary-foreground rounded-lg font-medium text-base hover:bg-secondary/80 transition-colors"
              >
                <Smartphone className="w-5 h-5" />
                모바일 앱 알림 받기
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-6 bg-card border-y border-border">
        <div className="max-w-6xl mx-auto">
          <div className="mb-16">
            <p className="text-sm font-medium text-accent mb-4 tracking-wide uppercase">
              Features
            </p>
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-foreground text-balance">
              효과적인 연습을 위한 모든 기능
            </h2>
            <p className="text-muted-foreground mt-4 text-lg">
              프로 뮤지션들이 사용하는 연습 방법을 누구나 쉽게
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, idx) => (
              <div
                key={idx}
                className="group p-6 rounded-xl bg-background border border-border hover:border-foreground/20 transition-all"
              >
                <div className="w-12 h-12 rounded-lg bg-secondary flex items-center justify-center mb-5 group-hover:bg-accent group-hover:text-accent-foreground transition-colors">
                  <feature.icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-sm font-medium text-accent mb-4 tracking-wide uppercase">
              How it works
            </p>
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-foreground">
              3단계로 시작하는 스마트 연습
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-12">
            {[
              { step: '01', title: '음원 업로드', desc: '연습할 곡의 음원 파일을 업로드하세요' },
              { step: '02', title: '구간 설정', desc: '파형에서 연습할 구간을 드래그로 선택하세요' },
              { step: '03', title: '녹음 & 비교', desc: '녹음하고 원곡과 비교하며 실력을 키우세요' },
            ].map((item, idx) => (
              <div key={idx} className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-secondary text-foreground font-serif text-xl font-bold mb-6">
                  {item.step}
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-3">{item.title}</h3>
                <p className="text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits CTA */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-primary text-primary-foreground rounded-2xl p-10 md:p-14">
            <div className="text-center mb-10">
              <h2 className="font-serif text-3xl md:text-4xl font-bold mb-4">지금 바로 시작하세요</h2>
              <p className="text-primary-foreground/70 text-lg">복잡한 가입 절차 없이 바로 사용할 수 있습니다</p>
            </div>

            <div className="grid md:grid-cols-2 gap-4 mb-10 max-w-2xl mx-auto">
              {benefits.map((benefit, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-primary-foreground/20 flex items-center justify-center flex-shrink-0">
                    <Check className="w-3 h-3" />
                  </div>
                  <span className="text-sm">{benefit}</span>
                </div>
              ))}
            </div>

            <div className="text-center">
              <button
                onClick={goToApp}
                className="inline-flex items-center gap-3 px-8 py-4 bg-primary-foreground text-primary rounded-lg font-semibold text-base hover:opacity-90 transition-opacity"
              >
                <Play className="w-5 h-5" />
                무료로 체험하기
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Mobile App Coming Soon */}
      <section className="py-24 px-6 bg-secondary/50 border-t border-border">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-accent/10 text-accent rounded-full text-sm font-medium mb-6">
            Coming Soon
          </div>

          <h2 className="font-serif text-3xl md:text-4xl font-bold text-foreground mb-4">
            모바일 앱 출시 예정
          </h2>
          <p className="text-muted-foreground text-lg mb-10 max-w-lg mx-auto">
            iOS / Android 앱이 곧 출시됩니다.
            알림을 신청하시면 출시 즉시 알려드립니다.
          </p>

          <button
            onClick={() => setShowNotification(true)}
            className="inline-flex items-center gap-3 px-8 py-4 bg-accent text-accent-foreground rounded-lg font-semibold text-base hover:opacity-90 transition-opacity"
          >
            <Smartphone className="w-5 h-5" />
            출시 알림 신청하기
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 px-6 bg-card border-t border-border">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-muted-foreground text-sm">Practix - 음악 연습의 새로운 기준</p>
        </div>
      </footer>

      {/* Modals */}
      {showNotification && (
        <NotificationSignup onClose={() => setShowNotification(false)} />
      )}
    </div>
  );
}
