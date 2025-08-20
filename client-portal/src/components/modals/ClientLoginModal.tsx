// client-portal/src/components/modals/ClientLoginModal.tsx
/**
 * APEX AI - Client Login Modal
 * ============================
 * 
 * Dedicated authentication modal for client portal access.
 * Maintains futuristic theme with video background and integrates 
 * seamlessly with existing backend authentication system.
 * 
 * Features:
 * - Professional login form design
 * - Video background preservation with blur
 * - Real-time validation and error handling
 * - Remember me functionality
 * - Secure authentication flow
 * - Loading states and smooth transitions
 */

import React, { useState, useEffect, useRef } from 'react';
import { X, Eye, EyeOff, Shield, Lock, Mail, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { AuthService } from '../../services/authService';
import { useAuth } from '../auth/AuthProvider';
import type { User, LoginCredentials } from '../../types/client.types';

// ===========================
// TYPES & INTERFACES
// ===========================

export interface LoginFormData {
  email: string;
  password: string;
  rememberMe: boolean;
}

export interface ClientLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: User) => void;
  backgroundVideoRef?: React.RefObject<HTMLVideoElement>;
}

interface FormState {
  data: LoginFormData;
  errors: Partial<LoginFormData>;
  isSubmitting: boolean;
  showPassword: boolean;
  submitAttempted: boolean;
}

interface ValidationResult {
  isValid: boolean;
  errors: Partial<LoginFormData>;
}

// ===========================
// VALIDATION HELPERS
// ===========================

const validateEmail = (email: string): string | null => {
  if (!email.trim()) return 'Email is required';
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.trim())) return 'Please enter a valid email address';
  
  return null;
};

const validatePassword = (password: string): string | null => {
  if (!password) return 'Password is required';
  if (password.length < 6) return 'Password must be at least 6 characters';
  
  return null;
};

const validateForm = (data: LoginFormData): ValidationResult => {
  const errors: Partial<LoginFormData> = {};
  
  const emailError = validateEmail(data.email);
  if (emailError) errors.email = emailError;
  
  const passwordError = validatePassword(data.password);
  if (passwordError) errors.password = passwordError;
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

// ===========================
// MAIN MODAL COMPONENT
// ===========================

export const ClientLoginModal: React.FC<ClientLoginModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
  backgroundVideoRef
}) => {
  // Get AuthProvider login method for React state synchronization
  const { login: authProviderLogin } = useAuth();
  const [formState, setFormState] = useState<FormState>({
    data: {
      email: '',
      password: '',
      rememberMe: false
    },
    errors: {},
    isSubmitting: false,
    showPassword: false,
    submitAttempted: false
  });

  const [authError, setAuthError] = useState<string | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  
  const emailInputRef = useRef<HTMLInputElement>(null);

  // ===========================
  // LIFECYCLE EFFECTS
  // ===========================

  useEffect(() => {
    if (isOpen) {
      setIsModalVisible(true);
      
      // Load remembered email if available
      const rememberedEmail = AuthService.getRememberedEmail();
      if (rememberedEmail) {
        setFormState(prev => ({
          ...prev,
          data: { ...prev.data, email: rememberedEmail, rememberMe: true }
        }));
      }
      
      // Blur background video
      if (backgroundVideoRef?.current) {
        backgroundVideoRef.current.style.filter = 'blur(12px)';
        backgroundVideoRef.current.style.transition = 'filter 0.3s ease';
      }
      
      // Focus email input after animation
      setTimeout(() => {
        emailInputRef.current?.focus();
      }, 300);
    } else {
      setIsModalVisible(false);
      
      // Reset form state
      setFormState({
        data: { email: '', password: '', rememberMe: false },
        errors: {},
        isSubmitting: false,
        showPassword: false,
        submitAttempted: false
      });
      setAuthError(null);
      
      // Remove video blur
      if (backgroundVideoRef?.current) {
        backgroundVideoRef.current.style.filter = 'none';
      }
    }
  }, [isOpen, backgroundVideoRef]);

  // ===========================
  // EVENT HANDLERS
  // ===========================

  const handleInputChange = (field: keyof LoginFormData, value: string | boolean) => {
    setFormState(prev => ({
      ...prev,
      data: { ...prev.data, [field]: value },
      errors: { ...prev.errors, [field]: undefined } // Clear field error on change
    }));
    
    // Clear auth error when user starts typing
    if (authError) {
      setAuthError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setFormState(prev => ({ ...prev, submitAttempted: true, isSubmitting: true }));
    setAuthError(null);
    
    // Validate form
    const validation = validateForm(formState.data);
    if (!validation.isValid) {
      setFormState(prev => ({
        ...prev,
        errors: validation.errors,
        isSubmitting: false
      }));
      return;
    }
    
    try {
      // FIXED: Use AuthProvider login for React state synchronization
      const credentials: LoginCredentials = {
        email: formState.data.email.trim(),
        password: formState.data.password
      };
      
      // Call AuthProvider login method to ensure React state updates immediately
      await authProviderLogin(credentials, formState.data.rememberMe);
      
      // Get updated user from AuthService (now synchronized)
      const user = AuthService.getCachedUser();
      if (!user) {
        throw new Error('Login successful but user data not available');
      }
      
      // Success - trigger callback and close modal
      onLoginSuccess(user);
      onClose();
      
    } catch (error: any) {
      setAuthError(error.message || 'Login failed. Please check your credentials and try again.');
      setFormState(prev => ({ ...prev, isSubmitting: false }));
    }
  };

  const handleClose = () => {
    if (!formState.isSubmitting) {
      onClose();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape' && !formState.isSubmitting) {
      onClose();
    }
  };

  // ===========================
  // RENDER HELPERS
  // ===========================

  const renderFormField = (
    field: keyof LoginFormData,
    label: string,
    type: string = 'text',
    icon: React.ElementType,
    placeholder?: string
  ) => {
    const hasError = formState.submitAttempted && formState.errors[field];
    const isPassword = field === 'password';
    
    return (
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-300">
          {label}
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            {React.createElement(icon, { 
              className: `w-5 h-5 ${hasError ? 'text-red-400' : 'text-gray-400'}` 
            })}
          </div>
          
          <input
            ref={field === 'email' ? emailInputRef : undefined}
            type={isPassword && !formState.showPassword ? 'password' : 'text'}
            value={formState.data[field] as string}
            onChange={(e) => handleInputChange(field, e.target.value)}
            placeholder={placeholder}
            disabled={formState.isSubmitting}
            className={`
              w-full pl-10 pr-4 py-3 
              bg-black/40 backdrop-blur-sm border rounded-lg
              text-white placeholder-gray-400
              focus:outline-none focus:ring-2 transition-all duration-200
              ${hasError 
                ? 'border-red-500/50 focus:border-red-400 focus:ring-red-400/20' 
                : 'border-gray-600/50 focus:border-cyan-400 focus:ring-cyan-400/20'
              }
              ${formState.isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          />
          
          {isPassword && (
            <button
              type="button"
              onClick={() => setFormState(prev => ({ ...prev, showPassword: !prev.showPassword }))}
              disabled={formState.isSubmitting}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-cyan-400 transition-colors"
            >
              {formState.showPassword ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
            </button>
          )}
        </div>
        
        {hasError && (
          <div className="flex items-center text-red-400 text-sm">
            <AlertCircle className="w-4 h-4 mr-1" />
            {formState.errors[field]}
          </div>
        )}
      </div>
    );
  };

  const renderAuthError = () => {
    if (!authError) return null;
    
    return (
      <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
        <div className="flex items-center text-red-400">
          <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
          <span className="text-sm">{authError}</span>
        </div>
      </div>
    );
  };

  const renderDemoCredentials = () => (
    <div className="mt-6 p-4 bg-cyan-500/10 border border-cyan-500/30 rounded-lg">
      <div className="flex items-start">
        <CheckCircle className="w-5 h-5 text-cyan-400 mr-2 mt-0.5 flex-shrink-0" />
        <div>
          <h4 className="text-cyan-400 font-medium text-sm mb-2">Demo Credentials</h4>
          <div className="text-xs text-gray-300 space-y-1">
            <div><strong>Email:</strong> sarah.johnson@luxeapartments.com</div>
            <div><strong>Password:</strong> Demo123!</div>
          </div>
        </div>
      </div>
    </div>
  );

  // ===========================
  // MAIN RENDER
  // ===========================

  if (!isModalVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onKeyDown={handleKeyPress}>
      
      {/* Modal Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={handleClose}
      />
      
      {/* Modal Content */}
      <div className="relative w-full max-w-md">
        <div className="bg-black/60 backdrop-blur-md border border-cyan-500/30 rounded-2xl tech-border glow-cyan animate-scale-in">
          
          {/* Header */}
          <div className="p-6 border-b border-cyan-500/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-lg flex items-center justify-center mr-3 glow-cyan">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white text-glow-teal">
                    Client Portal
                  </h2>
                  <p className="text-cyan-400 text-sm">
                    Property Manager Access
                  </p>
                </div>
              </div>
              
              <button
                onClick={handleClose}
                disabled={formState.isSubmitting}
                className="w-8 h-8 bg-gray-800/50 hover:bg-gray-700/50 border border-gray-600 rounded-lg flex items-center justify-center transition-all duration-200 hover:border-cyan-400 disabled:opacity-50"
              >
                <X className="w-4 h-4 text-gray-400 hover:text-cyan-400" />
              </button>
            </div>
          </div>
          
          {/* Form Content */}
          <div className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Auth Error Display */}
              {renderAuthError()}
              
              {/* Email Field */}
              {renderFormField('email', 'Email Address', 'email', Mail, 'Enter your email address')}
              
              {/* Password Field */}
              {renderFormField('password', 'Password', 'password', Lock, 'Enter your password')}
              
              {/* Remember Me Checkbox */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="rememberMe"
                  checked={formState.data.rememberMe}
                  onChange={(e) => handleInputChange('rememberMe', e.target.checked)}
                  disabled={formState.isSubmitting}
                  className="w-4 h-4 text-cyan-400 bg-black/40 border-gray-600 rounded focus:ring-cyan-400 focus:ring-2"
                />
                <label htmlFor="rememberMe" className="ml-2 text-sm text-gray-300">
                  Remember my email address
                </label>
              </div>
              
              {/* Submit Button */}
              <button
                type="submit"
                disabled={formState.isSubmitting}
                className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:from-cyan-400 hover:to-blue-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover-glow-cyan glow-pulse-fast flex items-center justify-center"
              >
                {formState.isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Authenticating...
                  </>
                ) : (
                  'Access Portal'
                )}
              </button>
            </form>
            
            {/* Demo Credentials */}
            {renderDemoCredentials()}
            
            {/* Footer */}
            <div className="mt-6 pt-4 border-t border-gray-600/30 text-center">
              <p className="text-gray-400 text-xs">
                Secure access to your property's security dashboard
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ===========================
// ANIMATION STYLES
// ===========================

const styles = `
  @keyframes scale-in {
    from { 
      opacity: 0; 
      transform: scale(0.9) translateY(20px); 
    }
    to { 
      opacity: 1; 
      transform: scale(1) translateY(0); 
    }
  }
  
  .animate-scale-in { 
    animation: scale-in 0.3s ease-out; 
  }
`;

// Inject styles if not already present
if (typeof document !== 'undefined' && !document.getElementById('client-login-modal-animations')) {
  const styleSheet = document.createElement('style');
  styleSheet.id = 'client-login-modal-animations';
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);
}

export default ClientLoginModal;
