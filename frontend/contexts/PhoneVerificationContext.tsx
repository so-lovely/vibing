import React, { createContext, useContext, useState } from 'react';
import { authApi } from '../services/authApi';

export interface VerificationData {
  phone: string;
  code: string;
  isVerified: boolean;
  expiryTime?: Date;
}

interface PhoneVerificationContextType {
  verificationData: VerificationData | null;
  isLoading: boolean;
  error: string | null;
  step: 'phone' | 'code' | 'verified';
  sendVerificationCode: (phone: string) => Promise<void>;
  verifyCode: (code: string) => Promise<boolean>;
  resendCode: () => Promise<void>;
  resetVerification: () => void;
  setInitialPhone: (phone: string) => void;
}

const PhoneVerificationContext = createContext<PhoneVerificationContextType | undefined>(undefined);

// Mock verification codes for testing specific phone numbers
const mockVerificationCodes: Record<string, string> = {
  '+821012345678': '123456',
  '+821087654321': '654321',
  '+821033334444': '111111',
  '+821055556666': '999999',
  '+821077778888': '555555',
  '+821011112222': '000000',
  '+821099998888': '123123',
  '+821044445555': '456456',
};

export function PhoneVerificationProvider({ children }: { children: React.ReactNode }) {
  const [verificationData, setVerificationData] = useState<VerificationData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<'phone' | 'code' | 'verified'>('phone');

  const sendVerificationCode = async (phone: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Validate phone format (Korean format)
      const phoneRegex = /^\+82\d{9,10}$/;
      if (!phoneRegex.test(phone)) {
        throw new Error('Invalid phone number format. Use +82XXXXXXXXX');
      }

      // Call real API
      const response = await authApi.sendVerificationCode(phone);
      
      // Generate expiry time (5 minutes from now)
      const expiryTime = new Date();
      expiryTime.setMinutes(expiryTime.getMinutes() + 5);
      
      setVerificationData({
        phone,
        code: '',
        isVerified: false,
        expiryTime
      });
      
      setStep('code');
      
      // Show mock code info in development mode
      if (mockVerificationCodes[phone]) {
        console.log(`Development mode - Mock verification code for ${phone}: ${mockVerificationCodes[phone]}`);
      } else if (response.code) {
        console.log(`Development mode - Verification code for ${phone}: ${response.code}`);
      }
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send verification code');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const verifyCode = async (code: string): Promise<boolean> => {
    if (!verificationData) {
      throw new Error('No verification data found');
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Check if code is expired
      if (verificationData.expiryTime && new Date() > verificationData.expiryTime) {
        throw new Error('Verification code has expired');
      }
      
      // Call real API
      await authApi.verifyPhone(verificationData.phone, code);
      
      setVerificationData(prev => prev ? {
        ...prev,
        code,
        isVerified: true
      } : null);
      
      setStep('verified');
      return true;
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const resendCode = async () => {
    if (!verificationData?.phone) {
      throw new Error('No phone number found');
    }
    
    await sendVerificationCode(verificationData.phone);
  };

  const resetVerification = () => {
    setVerificationData(null);
    setError(null);
    setStep('phone');
  };

  const setInitialPhone = (phone: string) => {
    setVerificationData({
      phone,
      code: '',
      isVerified: false
    });
    setStep('code');
  };

  const value: PhoneVerificationContextType = {
    verificationData,
    isLoading,
    error,
    step,
    sendVerificationCode,
    verifyCode,
    resendCode,
    resetVerification,
    setInitialPhone
  };

  return (
    <PhoneVerificationContext.Provider value={value}>
      {children}
    </PhoneVerificationContext.Provider>
  );
}

export function usePhoneVerification() {
  const context = useContext(PhoneVerificationContext);
  if (context === undefined) {
    throw new Error('usePhoneVerification must be used within a PhoneVerificationProvider');
  }
  return context;
}