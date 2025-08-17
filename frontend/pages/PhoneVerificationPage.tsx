import React from 'react';
import { usePhoneVerification } from '../contexts/PhoneVerificationContext';
import { PhoneInputForm } from '../components/verification/PhoneInputForm';
import { VerificationCodeForm } from '../components/verification/VerificationCodeForm';
import { VerificationSuccess } from '../components/verification/VerificationSuccess';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { ArrowLeft, Shield } from 'lucide-react';
import { Button } from '../components/ui/button';

interface PhoneVerificationPageProps {
  onBack?: () => void;
  onComplete?: () => void;
  title?: string;
  description?: string;
}

export function PhoneVerificationPage({ 
  onBack, 
  onComplete,
  title = "Phone Verification",
  description = "Please verify your phone number to continue with registration"
}: PhoneVerificationPageProps) {
  const { step, verificationData } = usePhoneVerification();

  const renderContent = () => {
    switch (step) {
      case 'phone':
        return <PhoneInputForm />;
      case 'code':
        return <VerificationCodeForm />;
      case 'verified':
        return <VerificationSuccess onComplete={onComplete} />;
      default:
        return <PhoneInputForm />;
    }
  };

  const getDescription = () => {
    if (step === 'code' && verificationData?.phone) {
      return `Enter the 6-digit code sent to ${verificationData.phone}`;
    }
    return description;
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {onBack && (
          <Button
            variant="ghost"
            onClick={onBack}
            className="mb-4 flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
        )}
        
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mb-4">
              <Shield className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <CardTitle className="text-2xl">{title}</CardTitle>
            <CardDescription className="text-center">
              {getDescription()}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {renderContent()}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}