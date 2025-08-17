import React, { useState } from 'react';
import { usePhoneVerification } from '../../contexts/PhoneVerificationContext';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Alert, AlertDescription } from '../ui/alert';
import { Loader2, Phone } from 'lucide-react';

export function PhoneInputForm() {
  const { sendVerificationCode, isLoading, error } = usePhoneVerification();
  const [phone, setPhone] = useState('');
  const [localError, setLocalError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');

    if (!phone.trim()) {
      setLocalError('Phone number is required');
      return;
    }

    try {
      await sendVerificationCode(phone);
    } catch (err) {
      // Error is handled by context
    }
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
    
    setPhone(value);
    setLocalError('');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="phone" className="flex items-center gap-2">
          <Phone className="w-4 h-4" />
          Phone Number
        </Label>
        <Input
          id="phone"
          type="tel"
          placeholder="+82 10 1234 5678"
          value={phone}
          onChange={handlePhoneChange}
          disabled={isLoading}
          className="text-lg"
        />
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Enter your Korean mobile number (format: +82XXXXXXXXX)
        </p>
      </div>

      {(error || localError) && (
        <Alert variant="destructive">
          <AlertDescription>
            {error || localError}
          </AlertDescription>
        </Alert>
      )}

      <Button 
        type="submit" 
        className="w-full" 
        disabled={isLoading || !phone.trim()}
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Sending Code...
          </>
        ) : (
          'Send Verification Code'
        )}
      </Button>

      <div className="text-center text-sm text-slate-600 dark:text-slate-400">
        <p>We'll send you a 6-digit verification code via SMS</p>
      </div>
    </form>
  );
}