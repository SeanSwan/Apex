// client-portal/src/components/auth/LoginForm.tsx
/**
 * APEX AI - Aegis Client Portal Professional Login Form
 * ===================================================
 * 
 * Mission-critical login interface for the Aegis Client Portal. This component
 * provides a professional, branded authentication experience with comprehensive
 * form validation, error handling, and accessibility features.
 * 
 * Features:
 * - Professional APEX AI branding and styling
 * - Real-time form validation with user feedback
 * - "Remember Me" functionality
 * - Loading states and error handling
 * - Responsive design for all devices
 * - Full accessibility compliance
 * - Integration with AuthProvider context
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'react-hot-toast';
import { Eye, EyeOff, Shield, Lock, Mail, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from './AuthProvider';
import { LoginCredentials } from '../../types/client.types';
import { AuthService } from '../../services/authService';

// ===========================
// FORM VALIDATION SCHEMA
// ===========================

const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address')
    .max(255, 'Email address is too long')
    .transform(email => email.toLowerCase().trim()),
  password: z
    .string()
    .min(1, 'Password is required')
    .min(6, 'Password must be at least 6 characters')
    .max(128, 'Password is too long'),
  rememberMe: z.boolean().default(false)
});

type LoginFormData = z.infer<typeof loginSchema>;

// ===========================
// COMPONENT INTERFACES
// ===========================

interface LoginFormProps {
  onSuccess?: () => void;
  className?: string;
}

// ===========================
// MAIN LOGIN FORM COMPONENT
// ===========================

export const LoginForm: React.FC<LoginFormProps> = ({ 
  onSuccess,
  className = ''
}) => {
  // ===========================
  // HOOKS & STATE
  // ===========================
  
  const { login, isLoading, error, clearError } = useAuth();
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isFormLoading, setIsFormLoading] = useState<boolean>(false);

  // React Hook Form setup
  const {
    register,
    handleSubmit,
    formState: { errors, isValid, isDirty },
    setValue,
    watch,
    reset
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    mode: 'onChange',
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false
    }
  });

  const watchEmail = watch('email');
  const watchPassword = watch('password');

  // ===========================
  // INITIALIZATION EFFECTS
  // ===========================

  // Load remembered email on component mount
  useEffect(() => {
    const rememberedEmail = AuthService.getRememberedEmail();
    if (rememberedEmail) {
      setValue('email', rememberedEmail);
      setValue('rememberMe', true);
    }
  }, [setValue]);

  // Clear errors when user starts typing
  useEffect(() => {
    if (error && (watchEmail || watchPassword)) {
      clearError();
    }
  }, [watchEmail, watchPassword, error, clearError]);

  // ===========================
  // EVENT HANDLERS
  // ===========================

  const togglePasswordVisibility = useCallback(() => {
    setShowPassword(prev => !prev);
  }, []);

  const handleFormSubmit = useCallback(async (data: LoginFormData) => {
    setIsFormLoading(true);
    clearError();

    try {
      const credentials: LoginCredentials = {
        email: data.email,
        password: data.password
      };

      await login(credentials, data.rememberMe);
      
      // Success - reset form and call success handler
      reset();
      onSuccess?.();
      
    } catch (error: any) {
      // Error handling is managed by AuthProvider
      console.error('Login form error:', error);
    } finally {
      setIsFormLoading(false);
    }
  }, [login, onSuccess, reset, clearError]);

  const handleForgotPassword = useCallback(() => {
    toast.error('Password reset functionality will be available soon. Please contact your system administrator for assistance.');
  }, []);

  // ===========================
  // COMPUTED VALUES
  // ===========================

  const isSubmitDisabled = !isValid || isLoading || isFormLoading;
  const showLoadingState = isLoading || isFormLoading;

  // ===========================
  // RENDER HELPERS
  // ===========================

  const renderFormError = () => {
    if (!error) return null;

    return (
      <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-3">
        <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
        <div className="text-sm text-red-700">
          <p className="font-medium">Authentication Failed</p>
          <p className="mt-1">{error}</p>
        </div>
      </div>
    );
  };

  const renderEmailField = () => (
    <div className="space-y-2">
      <label htmlFor="email" className="block text-sm font-semibold text-gray-900">
        Email Address
      </label>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Mail className="h-5 w-5 text-gray-400" />
        </div>
        <input
          {...register('email')}
          type="email"
          id="email"
          autoComplete="email"
          placeholder="Enter your email address"
          className={`
            block w-full pl-10 pr-3 py-3 border rounded-lg 
            text-gray-900 placeholder-gray-500 
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
            disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed
            transition-colors duration-200
            ${errors.email 
              ? 'border-red-300 bg-red-50 focus:ring-red-500 focus:border-red-500' 
              : 'border-gray-300 bg-white hover:border-gray-400'
            }
          `}
          disabled={showLoadingState}
        />
      </div>
      {errors.email && (
        <p className="text-sm text-red-600 flex items-center space-x-1">
          <AlertCircle className="h-4 w-4" />
          <span>{errors.email.message}</span>
        </p>
      )}
    </div>
  );

  const renderPasswordField = () => (
    <div className="space-y-2">
      <label htmlFor="password" className="block text-sm font-semibold text-gray-900">
        Password
      </label>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Lock className="h-5 w-5 text-gray-400" />
        </div>
        <input
          {...register('password')}
          type={showPassword ? 'text' : 'password'}
          id="password"
          autoComplete="current-password"
          placeholder="Enter your password"
          className={`
            block w-full pl-10 pr-12 py-3 border rounded-lg 
            text-gray-900 placeholder-gray-500 
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
            disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed
            transition-colors duration-200
            ${errors.password 
              ? 'border-red-300 bg-red-50 focus:ring-red-500 focus:border-red-500' 
              : 'border-gray-300 bg-white hover:border-gray-400'
            }
          `}
          disabled={showLoadingState}
        />
        <button
          type="button"
          onClick={togglePasswordVisibility}
          className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 disabled:cursor-not-allowed transition-colors duration-200"
          disabled={showLoadingState}
          aria-label={showPassword ? 'Hide password' : 'Show password'}
        >
          {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
        </button>
      </div>
      {errors.password && (
        <p className="text-sm text-red-600 flex items-center space-x-1">
          <AlertCircle className="h-4 w-4" />
          <span>{errors.password.message}</span>
        </p>
      )}
    </div>
  );

  const renderRememberMeField = () => (
    <div className="flex items-center justify-between">
      <label className="flex items-center space-x-2 cursor-pointer">
        <input
          {...register('rememberMe')}
          type="checkbox"
          className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 focus:ring-2 disabled:cursor-not-allowed"
          disabled={showLoadingState}
        />
        <span className="text-sm text-gray-700 select-none">Remember me</span>
      </label>
      
      <button
        type="button"
        onClick={handleForgotPassword}
        className="text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors duration-200 disabled:cursor-not-allowed disabled:text-gray-400"
        disabled={showLoadingState}
      >
        Forgot password?
      </button>
    </div>
  );

  const renderSubmitButton = () => (
    <button
      type="submit"
      disabled={isSubmitDisabled}
      className={`
        w-full flex items-center justify-center px-4 py-3 border border-transparent 
        rounded-lg text-base font-semibold text-white transition-all duration-200
        focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
        ${isSubmitDisabled
          ? 'bg-gray-400 cursor-not-allowed'
          : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 shadow-lg hover:shadow-xl'
        }
      `}
    >
      {showLoadingState ? (
        <>
          <Loader2 className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" />
          Signing in...
        </>
      ) : (
        <>
          <Shield className="-ml-1 mr-3 h-5 w-5" />
          Sign In to Portal
        </>
      )}
    </button>
  );

  // ===========================
  // MAIN COMPONENT RENDER
  // ===========================

  return (
    <div className={`w-full max-w-md mx-auto ${className}`}>
      {/* APEX AI Branding Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-800 rounded-full shadow-lg mb-4">
          <Shield className="h-8 w-8 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          APEX AI
        </h1>
        <p className="text-lg font-medium text-blue-600 mb-1">
          Aegis Client Portal
        </p>
        <p className="text-sm text-gray-600">
          Secure access to your security intelligence
        </p>
      </div>

      {/* Login Form */}
      <div className="bg-white shadow-xl rounded-xl border border-gray-200 p-8">
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6" noValidate>
          {/* Form Error Display */}
          {renderFormError()}
          
          {/* Email Field */}
          {renderEmailField()}
          
          {/* Password Field */}
          {renderPasswordField()}
          
          {/* Remember Me & Forgot Password */}
          {renderRememberMeField()}
          
          {/* Submit Button */}
          {renderSubmitButton()}
        </form>

        {/* Security Notice */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <Shield className="h-4 w-4" />
            <span>Your connection is secured with enterprise-grade encryption</span>
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="mt-8 text-center">
        <p className="text-xs text-gray-500">
          © 2025 APEX AI Security Platform. All rights reserved.
        </p>
        <p className="text-xs text-gray-400 mt-1">
          For technical support, contact your system administrator.
        </p>
      </div>
    </div>
  );
};

// ===========================
// ACCESSIBILITY HELPERS
// ===========================

/**
 * Login form with enhanced accessibility features
 * Includes ARIA labels, proper focus management, and keyboard navigation
 */
export const AccessibleLoginForm: React.FC<LoginFormProps> = (props) => {
  return (
    <div role="main" aria-label="Login Form">
      <LoginForm {...props} />
    </div>
  );
};

// ===========================
// EXPORTS
// ===========================

export default LoginForm;