import React, { useState, useEffect } from 'react';
import { usePhoneVerification } from '../../contexts/PhoneVerificationContext';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Alert, AlertDescription } from '../ui/alert';
import { Loader2, MessageSquare, RotateCcw } from 'lucide-react';

export function VerificationCodeForm() {
  const { 
    verificationData, 
    verifyCode, 
    resendCode, 
    isLoading, 
    error 
  } = usePhoneVerification();
  
  const [code, setCode] = useState('');
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes
  const [canResend, setCanResend] = useState(false);

  // Countdown timer
  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [timeLeft]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (code.length !== 6) {
      return;
    }

    try {
      await verifyCode(code);
    } catch (err) {
      // Error is handled by context
    }
  };

  const handleResend = async () => {
    try {
      await resendCode();
      setTimeLeft(300);
      setCanResend(false);
      setCode('');
    } catch (err) {
      // Error is handled by context
    }
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setCode(value);
  };

  return (
    <div className="space-y-4">
      <div className="text-center">
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Verification code sent to
        </p>
        <p className="font-medium text-slate-900 dark:text-slate-100">
          {verificationData?.phone}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="code" className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            Verification Code
          </Label>
          <Input
            id="code"
            type="text"
            placeholder="000000"
            value={code}
            onChange={handleCodeChange}
            disabled={isLoading}
            className="text-center text-2xl tracking-widest font-mono"
            maxLength={6}
            autoComplete="one-time-code"
          />
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Enter the 6-digit code sent to your phone
          </p>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>
              {error}
            </AlertDescription>
          </Alert>
        )}

        <Button 
          type="submit" 
          className="w-full" 
          disabled={isLoading || code.length !== 6}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Verifying...
            </>
          ) : (
            'Verify Code'
          )}
        </Button>
      </form>

      <div className="text-center space-y-2">
        <p className="text-sm text-slate-600 dark:text-slate-400">
          {timeLeft > 0 ? (
            <>Code expires in {formatTime(timeLeft)}</>
          ) : (
            <>Verification code has expired</>
          )}
        </p>
        
        <Button
          variant="ghost"
          onClick={handleResend}
          disabled={!canResend || isLoading}
          className="text-sm"
        >
          <RotateCcw className="w-4 h-4 mr-1" />
          {canResend ? 'Resend Code' : 'Resend available soon'}
        </Button>
      </div>
    </div>
  );
}