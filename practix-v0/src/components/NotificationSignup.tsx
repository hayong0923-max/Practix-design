'use client';

import { useState } from 'react';
import { X, Smartphone, Check, Mail, Bell } from 'lucide-react';

interface NotificationSignupProps {
  onClose: () => void;
}

export default function NotificationSignup({ onClose }: NotificationSignupProps) {
  const [email, setEmail] = useState('');
  const [platform, setPlatform] = useState<'ios' | 'android' | 'both'>('both');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const notifications = JSON.parse(localStorage.getItem('mobileNotifications') || '[]');
      const isDuplicate = notifications.some((n: { email: string }) => n.email === email.trim().toLowerCase());
      if (isDuplicate) {
        setError('이미 등록된 이메일입니다.');
        setIsLoading(false);
        return;
      }

      notifications.push({
        email: email.trim().toLowerCase(),
        platform,
        timestamp: new Date().toISOString(),
      });
      localStorage.setItem('mobileNotifications', JSON.stringify(notifications));

      setIsSubmitted(true);
    } catch (err) {
      console.error('Signup error:', err);
      setError('오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-foreground/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-border rounded-xl max-w-md w-full overflow-hidden animate-scale-in">
        {/* Header */}
        <div className="bg-primary p-6 text-primary-foreground relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 hover:bg-primary-foreground/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-primary-foreground/20 rounded-xl flex items-center justify-center">
              <Smartphone className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold">모바일 앱 출시 알림</h2>
              <p className="text-primary-foreground/70 text-sm">iOS / Android</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {isSubmitted ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-success" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">
                알림 신청 완료!
              </h3>
              <p className="text-muted-foreground mb-6">
                앱이 출시되면 이메일로 알려드리겠습니다.
              </p>
              <button
                onClick={onClose}
                className="px-6 py-2.5 bg-secondary hover:bg-secondary/80 text-secondary-foreground rounded-lg font-medium transition-colors"
              >
                닫기
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <p className="text-muted-foreground mb-6">
                모바일 앱이 출시되면 가장 먼저 알려드립니다.
                이메일 주소를 남겨주세요.
              </p>

              {/* Email Input */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-foreground mb-2">
                  이메일 주소
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    required
                    className="w-full pl-10 pr-4 py-3 border border-input bg-background text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              </div>

              {/* Platform Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-foreground mb-2">
                  관심 있는 플랫폼
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: 'ios', label: 'iOS' },
                    { value: 'android', label: 'Android' },
                    { value: 'both', label: '둘 다' },
                  ].map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setPlatform(option.value as typeof platform)}
                      className={`py-2.5 px-4 rounded-lg text-sm font-medium transition-colors ${
                        platform === option.value
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive">
                  {error}
                </div>
              )}

              {/* Benefits */}
              <div className="bg-accent/10 rounded-xl p-4 mb-6">
                <div className="flex items-center gap-2 text-accent font-medium mb-2">
                  <Bell className="w-4 h-4" />
                  알림 신청 혜택
                </div>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>- 앱 출시 시 가장 먼저 알림</li>
                  <li>- 얼리버드 할인 혜택 (예정)</li>
                  <li>- 베타 테스터 우선 초대</li>
                </ul>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading || !email.trim()}
                className="w-full py-3 bg-accent hover:opacity-90 disabled:opacity-50 text-accent-foreground rounded-lg font-semibold transition-opacity flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <span>처리 중...</span>
                ) : (
                  <>
                    <Bell className="w-5 h-5" />
                    알림 신청하기
                  </>
                )}
              </button>

              <p className="text-xs text-muted-foreground text-center mt-4">
                스팸 메일을 보내지 않습니다. 언제든 구독 취소 가능합니다.
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
