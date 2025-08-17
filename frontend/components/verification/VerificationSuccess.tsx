import React from 'react';
import { usePhoneVerification } from '../../contexts/PhoneVerificationContext';
import { Button } from '../ui/button';
import { CheckCircle, ArrowRight } from 'lucide-react';

interface VerificationSuccessProps {
  onComplete?: () => void;
}

export function VerificationSuccess({ onComplete }: VerificationSuccessProps) {
  const { verificationData } = usePhoneVerification();

  const handleContinue = () => {
    onComplete?.();
  };

  return (
    <div className="text-center space-y-6">
      <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
        <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
      </div>
      
      <div className="space-y-2">
        <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
          Phone Verified Successfully!
        </h3>
        <p className="text-slate-600 dark:text-slate-400">
          Your phone number {verificationData?.phone} has been verified.
        </p>
      </div>

      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
        <p className="text-sm text-green-800 dark:text-green-200">
          ✓ Phone verification completed<br/>
          ✓ Account security enhanced<br/>
          ✓ Ready to continue registration
        </p>
      </div>

      <Button 
        onClick={handleContinue}
        className="w-full"
        size="lg"
      >
        Continue Registration
        <ArrowRight className="w-4 h-4 ml-2" />
      </Button>
    </div>
  );
}