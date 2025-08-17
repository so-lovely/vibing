import { useState } from 'react';
import { Eye, EyeOff, User, Mail, Lock, UserCheck, Phone } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Alert, AlertDescription } from '../ui/alert';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import type { SignupData } from '../../types/auth';
import { useAuth } from '../../contexts/AuthContext';
import { PhoneVerificationProvider, usePhoneVerification } from '../../contexts/PhoneVerificationContext';
import { PhoneVerificationPage } from '../../pages/PhoneVerificationPage';

interface SignupDialogProps {
  children: React.ReactNode;
  onSignupSuccess?: (user: any, token: string) => void;
}

function SignupDialogContent({ onSignupSuccess }: { onSignupSuccess?: (user: any, token: string) => void }) {
  const { signup } = useAuth();
  const { verificationData, resetVerification, setInitialPhone, sendVerificationCode } = usePhoneVerification();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showVerification, setShowVerification] = useState(false);
  const [formData, setFormData] = useState<SignupData>({
    email: '',
    password: '',
    name: '',
    role: 'buyer',
    phone: ''
  });

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    // Validate form data
    if (!formData.email || !formData.password || !formData.name || !formData.phone) {
      setError('All fields are required');
      setLoading(false);
      return;
    }

    try {
      // Set the phone number and send verification code directly
      setInitialPhone(formData.phone);
      await sendVerificationCode(formData.phone);
      setShowVerification(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send verification code');
    } finally {
      setLoading(false);
    }
  };

  const handleVerificationComplete = async () => {
    if (!verificationData?.isVerified) {
      setError('Phone verification not completed');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await signup(
        formData.email, 
        formData.password, 
        formData.name, 
        formData.role,
        formData.phone,
        true // phoneVerified
      );
      
      if (onSignupSuccess) {
        const savedUser = localStorage.getItem('auth-user');
        const savedToken = localStorage.getItem('auth-token');
        if (savedUser && savedToken) {
          onSignupSuccess(JSON.parse(savedUser), savedToken);
        }
      }
      
      // Reset form
      setFormData({ email: '', password: '', name: '', role: 'buyer', phone: '' });
      setShowVerification(false);
      resetVerification();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  const handleBackFromVerification = () => {
    setShowVerification(false);
    resetVerification();
  };

  const handleInputChange = (field: keyof SignupData, value: string | 'buyer' | 'seller') => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (error) setError(null);
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    
    // Auto-format Korean phone number
    if (value && !value.startsWith('+82')) {
      if (value.startsWith('0')) {
        value = '+82' + value.slice(1);
      } else if (value.startsWith('82')) {
        value = '+' + value;
      } else if (!value.startsWith('+')) {
        value = '+82' + value;
      }
    }
    
    setFormData(prev => ({ ...prev, phone: value }));
    if (error) setError(null);
  };

  if (showVerification) {
    return (
      <PhoneVerificationPage
        onBack={handleBackFromVerification}
        onComplete={handleVerificationComplete}
        title="Phone Verification Required"
        description="Please verify your phone number to complete registration"
      />
    );
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle className="text-center text-2xl font-semibold">회원가입</DialogTitle>
        <DialogDescription className="text-center text-muted-foreground">
          새 계정을 생성하여 Vibing에 참여하세요
        </DialogDescription>
      </DialogHeader>
      
      <form onSubmit={handleFormSubmit} className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">이름</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  id="name"
                  type="text"
                  placeholder="홍길동"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="pl-10"
                  required
                  disabled={loading}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="signup-email">이메일</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  id="signup-email"
                  type="email"
                  placeholder="your@example.com"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="pl-10"
                  required
                  disabled={loading}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="signup-password">비밀번호</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  id="signup-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="8자 이상 입력해주세요"
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  className="pl-10 pr-10"
                  required
                  minLength={8}
                  disabled={loading}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="signup-phone">휴대폰 번호</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  id="signup-phone"
                  type="tel"
                  placeholder="+82 10 1234 5678"
                  value={formData.phone}
                  onChange={handlePhoneChange}
                  className="pl-10"
                  required
                  disabled={loading}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                전화번호 인증이 필요합니다
              </p>
            </div>
            
            <div className="space-y-3">
              <Label>계정 유형</Label>
              <RadioGroup
                value={formData.role}
                onValueChange={(value) => handleInputChange('role', value as 'buyer' | 'seller')}
                className="grid grid-cols-2 gap-4"
                disabled={loading}
              >
                <div className="flex items-center space-x-2 border rounded-lg p-3 cursor-pointer hover:bg-muted/50">
                  <RadioGroupItem value="buyer" id="buyer" />
                  <Label htmlFor="buyer" className="flex items-center space-x-2 cursor-pointer flex-1">
                    <UserCheck className="w-4 h-4" />
                    <span>구매자</span>
                  </Label>
                </div>
                <div className="flex items-center space-x-2 border rounded-lg p-3 cursor-pointer hover:bg-muted/50">
                  <RadioGroupItem value="seller" id="seller" />
                  <Label htmlFor="seller" className="flex items-center space-x-2 cursor-pointer flex-1">
                    <User className="w-4 h-4" />
                    <span>판매자</span>
                  </Label>
                </div>
              </RadioGroup>
            </div>
          </div>
          
          <div className="space-y-4">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? '인증 진행 중...' : '전화번호 인증하기'}
            </Button>
            
            <div className="text-center text-sm text-muted-foreground">
              이미 계정이 있으신가요?{' '}
              <Button variant="link" className="p-0 h-auto font-medium text-primary">
                로그인
              </Button>
            </div>
          </div>
        </form>
      </>
    );
}

export function SignupDialog({ children, onSignupSuccess }: SignupDialogProps) {
  const [open, setOpen] = useState(false);

  return (
    <PhoneVerificationProvider>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          {children}
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <SignupDialogContent onSignupSuccess={onSignupSuccess} />
        </DialogContent>
      </Dialog>
    </PhoneVerificationProvider>
  );
}