'use client';

import { useState, useEffect } from 'react';
import MusicPracticeApp from '@/components/MusicPracticeApp';
import Onboarding from '@/components/Onboarding';

export default function AppPage() {
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // 방문 기록 저장
    localStorage.setItem('hasVisitedBefore', 'true');

    // 온보딩 표시 여부 확인
    const dontShowTutorial = localStorage.getItem('dontShowTutorial');
    const hasCompletedOnboarding = localStorage.getItem('hasCompletedOnboarding');

    if (dontShowTutorial !== 'true' && hasCompletedOnboarding !== 'true') {
      setShowOnboarding(true);
    }

    setIsLoaded(true);
  }, []);

  const handleOnboardingComplete = (dontShowAgain: boolean) => {
    if (dontShowAgain) {
      localStorage.setItem('dontShowTutorial', 'true');
    }
    localStorage.setItem('hasCompletedOnboarding', 'true');
    setShowOnboarding(false);
    setShowTutorial(false);
  };

  const handleSkipOnboarding = (dontShowAgain: boolean) => {
    if (dontShowAgain) {
      localStorage.setItem('dontShowTutorial', 'true');
    }
    localStorage.setItem('hasCompletedOnboarding', 'true');
    setShowOnboarding(false);
    setShowTutorial(false);
  };

  const handleShowTutorial = () => {
    setShowTutorial(true);
  };

  // 로딩 중 플래시 방지
  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">로딩 중...</div>
      </div>
    );
  }

  // 온보딩 표시
  if (showOnboarding || showTutorial) {
    return (
      <Onboarding
        onComplete={handleOnboardingComplete}
        onSkip={handleSkipOnboarding}
      />
    );
  }

  // 앱 표시
  return <MusicPracticeApp onShowTutorial={handleShowTutorial} />;
}
