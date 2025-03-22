import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import styled from 'styled-components';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '../ui/select';
import { Icons } from '../icons/icons.jsx'; // Custom icons component

/**
 * Styled Components for enhanced layout using CSS Grid and Flexbox
 * These components create a responsive, accessible form that works on all screen sizes
 */

// Main container using flexbox for vertical centering and alignment
const FormContainer = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 480px;
  margin: 2rem auto;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.1);
  background-color: white;
  
  /* Responsive adjustments for smaller screens */
  @media (max-width: 768px) {
    padding: 1.5rem;
    margin: 1rem auto;
  }
  
  /* Ultra-wide screen adjustments */
  @media (min-width: 2560px) {
    max-width: 560px;
    padding: 2.5rem;
    font-size: 1.1rem;
  }
`;

// Form title with responsive font sizing
const FormTitle = styled.h2`
  font-size: 1.75rem;
  font-weight: 700;
  text-align: center;
  margin-bottom: 1.5rem;
  color: #333;
  
  @media (max-width: 480px) {
    font-size: 1.5rem;
  }
  
  @media (min-width: 2560px) {
    font-size: 2rem;
  }
`;

// Form layout using CSS Grid for consistent spacing
const FormContent = styled.form`
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.25rem;
`;

// Input groups using flexbox for vertical layout
const InputGroup = styled.div`
  display: flex;
  flex-direction: column;
  position: relative;
`;

// Error message styling
const ErrorMessage = styled.span`
  color: #e53e3e;
  font-size: 0.875rem;
  margin-top: 0.25rem;
`;

// Password input wrapper for positioning the toggle button
const PasswordWrapper = styled.div`
  position: relative;
  width: 100%;
`;

// Password visibility toggle button
const PasswordToggle = styled.button`
  position: absolute;
  right: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: #6b7280;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:hover {
    color: #4a6cf7;
  }
`;

// Loading spinner animation
const LoadingSpinner = styled.div`
  display: inline-block;
  width: 1rem;
  height: 1rem;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: white;
  animation: spin 1s ease-in-out infinite;
  margin-left: 0.5rem;
  
  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
`;

// Help text for additional information
const HelpText = styled.p`
  color: #6b7280;
  font-size: 0.875rem;
  margin-top: 0.5rem;
`;

// Message container for success/error notifications
const MessageContainer = styled.div`
  padding: 0.75rem;
  margin-bottom: 1rem;
  border-radius: 4px;
  font-weight: 500;
  
  &.success {
    background-color: #f0fff4;
    color: #2f855a;
    border: 1px solid #c6f6d5;
  }
  
  &.error {
    background-color: #fff5f5;
    color: #c53030;
    border: 1px solid #fed7d7;
  }
`;

/**
 * UniversalAuthForm - A sophisticated component that handles both login and signup
 * functionality with responsive design and enhanced user experience.
 * 
 * Features:
 * - Responsive design using CSS Grid and Flexbox
 * - Toggle between login and signup modes
 * - Form validation with error messages
 * - Password visibility toggle
 * - Loading state during form submission
 * - Role selection for signup
 * - Accessible form elements with ARIA attributes
 */
const UniversalAuthForm = () => {
  // Access authentication methods from context
  const { login, register } = useAuth();
  
  // State management
  const [isLogin, setIsLogin] = useState(true); // Toggle between login and signup modes
  const [showPassword, setShowPassword] = useState(false); // Toggle password visibility
  const [isLoading, setIsLoading] = useState(false); // Track loading state during submission
  const [errors, setErrors] = useState({}); // Track validation errors
  const [successMessage, setSuccessMessage] = useState(''); // Success message after operations
  
  // Form data with all potential fields needed for registration
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    email: '',
    first_name: '',
    last_name: '',
    role: 'guard', // Default role
  });
  
  /**
   * Handles changes to form inputs and updates the formData state
   * @param {Object} e - The change event from the input
   */
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Clear errors when a field is modified
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ''
      });
    }
    
    // Clear success message on any input change
    if (successMessage) {
      setSuccessMessage('');
    }
    
    setFormData({
      ...formData,
      [name]: value,
    });
  };
  
  /**
   * Handles changes from the role select component
   * @param {string} value - The selected role value
   */
  const handleRoleChange = (value) => {
    setFormData({
      ...formData,
      role: value,
    });
    
    // Clear role error if exists
    if (errors.role) {
      setErrors({
        ...errors,
        role: ''
      });
    }
  };
  
  /**
   * Validates form data based on current mode (login or signup)
   * @returns {boolean} True if validation passed, false otherwise
   */
  const validateForm = () => {
    const newErrors = {};
    
    // Validate username
    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    } else if (formData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    }
    
    // Validate password
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    // Additional validation for signup
    if (!isLogin) {
      // Email validation if provided
      if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
        newErrors.email = 'Email address is invalid';
      }
      
      // First name validation
      if (!formData.first_name) {
        newErrors.first_name = 'First name is required';
      } else if (formData.first_name.length < 2) {
        newErrors.first_name = 'First name is too short';
      }
      
      // Last name validation
      if (!formData.last_name) {
        newErrors.last_name = 'Last name is required';
      } else if (formData.last_name.length < 2) {
        newErrors.last_name = 'Last name is too short';
      }
      
      // Role validation
      if (!formData.role) {
        newErrors.role = 'Please select a role';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  /**
   * Handles form submission for both login and signup
   * @param {Object} e - The form submission event
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Clear any existing messages
    setSuccessMessage('');
    
    // Validate form before submission
    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);
    
    try {
      if (isLogin) {
        // Login mode - only send username and password
        await login(formData.username, formData.password);
        // No need for success message here as login redirects
      } else {
        // Signup mode - send all form data
        await register(formData);
        // Show success message and switch to login mode
        setSuccessMessage('Registration successful! Please log in.');
        // Reset form after successful registration
        setFormData({
          username: '',
          password: '',
          email: '',
          first_name: '',
          last_name: '',
          role: 'guard',
        });
        // Switch to login mode after successful registration
        setIsLogin(true);
      }
    } catch (error) {
      // Handle API errors
      const errorMessage = error.response?.data?.message || 'An error occurred';
      
      // Map error messages to specific fields if possible
      if (errorMessage.includes('username')) {
        setErrors({ ...errors, username: errorMessage });
      } else if (errorMessage.includes('password')) {
        setErrors({ ...errors, password: errorMessage });
      } else if (errorMessage.includes('email')) {
        setErrors({ ...errors, email: errorMessage });
      } else {
        // General error not tied to a specific field
        setErrors({ 
          ...errors, 
          general: errorMessage 
        });
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  /**
   * Toggles between login and signup modes
   * Resets form data and error states
   */
  const toggleAuthMode = () => {
    // Reset form and errors when toggling modes
    setErrors({});
    setSuccessMessage('');
    setIsLogin(!isLogin);
    
    // Reset form data for clean state
    setFormData({
      username: '',
      password: '',
      email: '',
      first_name: '',
      last_name: '',
      role: 'guard',
    });
  };
  
  return (
    <FormContainer>
      <FormTitle>
        {isLogin ? 'Login to Your Account' : 'Create a New Account'}
      </FormTitle>
      
      {/* Success message display */}
      {successMessage && (
        <MessageContainer className="success">
          {successMessage}
        </MessageContainer>
      )}
      
      {/* General error message display */}
      {errors.general && (
        <MessageContainer className="error">
          {errors.general}
        </MessageContainer>
      )}
      
      <FormContent onSubmit={handleSubmit}>
        {/* Username Field */}
        <InputGroup>
          <Label htmlFor="username" className="mb-2">Username</Label>
          <Input
            id="username"
            type="text"
            name="username"
            placeholder="Enter your username"
            value={formData.username}
            onChange={handleChange}
            className={errors.username ? 'border-red-500' : ''}
            aria-invalid={errors.username ? 'true' : 'false'}
            aria-describedby={errors.username ? 'username-error' : undefined}
            autoComplete="username"
            required
          />
          {errors.username && (
            <ErrorMessage id="username-error">{errors.username}</ErrorMessage>
          )}
        </InputGroup>
        
        {/* Password Field with Show/Hide Toggle */}
        <InputGroup>
          <Label htmlFor="password" className="mb-2">Password</Label>
          <PasswordWrapper>
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              name="password"
              placeholder="Enter your password"
              value={formData.password}
              onChange={handleChange}
              className={`pr-10 ${errors.password ? 'border-red-500' : ''}`}
              aria-invalid={errors.password ? 'true' : 'false'}
              aria-describedby={errors.password ? 'password-error' : undefined}
              autoComplete={isLogin ? 'current-password' : 'new-password'}
              required
            />
            <PasswordToggle
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? (
                <Icons.eyeOff className="h-5 w-5" />
              ) : (
                <Icons.eye className="h-5 w-5" />
              )}
            </PasswordToggle>
          </PasswordWrapper>
          {errors.password && (
            <ErrorMessage id="password-error">{errors.password}</ErrorMessage>
          )}
        </InputGroup>
        
        {/* Additional Fields for Signup Mode */}
        {!isLogin && (
          <>
            {/* Email Field */}
            <InputGroup>
              <Label htmlFor="email" className="mb-2">Email Address</Label>
              <Input
                id="email"
                type="email"
                name="email"
                placeholder="Enter your email address"
                value={formData.email}
                onChange={handleChange}
                className={errors.email ? 'border-red-500' : ''}
                aria-invalid={errors.email ? 'true' : 'false'}
                aria-describedby={errors.email ? 'email-error' : undefined}
                autoComplete="email"
              />
              {errors.email && (
                <ErrorMessage id="email-error">{errors.email}</ErrorMessage>
              )}
            </InputGroup>
            
            {/* First Name Field */}
            <InputGroup>
              <Label htmlFor="first_name" className="mb-2">First Name</Label>
              <Input
                id="first_name"
                type="text"
                name="first_name"
                placeholder="Enter your first name"
                value={formData.first_name}
                onChange={handleChange}
                className={errors.first_name ? 'border-red-500' : ''}
                aria-invalid={errors.first_name ? 'true' : 'false'}
                aria-describedby={errors.first_name ? 'first-name-error' : undefined}
                autoComplete="given-name"
                required
              />
              {errors.first_name && (
                <ErrorMessage id="first-name-error">{errors.first_name}</ErrorMessage>
              )}
            </InputGroup>
            
            {/* Last Name Field */}
            <InputGroup>
              <Label htmlFor="last_name" className="mb-2">Last Name</Label>
              <Input
                id="last_name"
                type="text"
                name="last_name"
                placeholder="Enter your last name"
                value={formData.last_name}
                onChange={handleChange}
                className={errors.last_name ? 'border-red-500' : ''}
                aria-invalid={errors.last_name ? 'true' : 'false'}
                aria-describedby={errors.last_name ? 'last-name-error' : undefined}
                autoComplete="family-name"
                required
              />
              {errors.last_name && (
                <ErrorMessage id="last-name-error">{errors.last_name}</ErrorMessage>
              )}
            </InputGroup>
            
            {/* Role Selection */}
            <InputGroup>
              <Label htmlFor="role" className="mb-2">Role</Label>
              <Select value={formData.role} onValueChange={handleRoleChange}>
                <SelectTrigger 
                  id="role"
                  className={errors.role ? 'border-red-500' : ''}
                  aria-invalid={errors.role ? 'true' : 'false'}
                  aria-describedby={errors.role ? 'role-error' : undefined}
                >
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="guard">Guard</SelectItem>
                  <SelectItem value="regional_manager">Regional Manager</SelectItem>
                  <SelectItem value="dispatch">Dispatch</SelectItem>
                  <SelectItem value="operations_manager">Operations Manager</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="payroll">Payroll</SelectItem>
                  <SelectItem value="CTO">CTO</SelectItem>
                </SelectContent>
              </Select>
              {errors.role && (
                <ErrorMessage id="role-error">{errors.role}</ErrorMessage>
              )}
              <HelpText>
                Note: Role selection may require administrator approval.
              </HelpText>
            </InputGroup>
          </>
        )}
        
        {/* Submit Button with Loading State */}
        <Button 
          type="submit" 
          className="w-full bg-gold-500 text-black hover:bg-gold-600 focus:ring-gold-500"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              {isLogin ? 'Logging in...' : 'Signing up...'}
              <LoadingSpinner />
            </>
          ) : (
            isLogin ? 'Login' : 'Sign Up'
          )}
        </Button>
      </FormContent>
      
      {/* Toggle Between Login and Signup */}
      <Button 
        type="button" 
        variant="link"
        onClick={toggleAuthMode}
        className="mt-4 w-full"
        disabled={isLoading}
      >
        {isLogin ? 'Need an account? Sign Up' : 'Already have an account? Login'}
      </Button>
    </FormContainer>
  );
};

export default UniversalAuthForm;