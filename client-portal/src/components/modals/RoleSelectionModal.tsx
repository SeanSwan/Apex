// client-portal/src/components/modals/RoleSelectionModal.tsx
/**
 * APEX AI - Role Selection Modal
 * =============================
 * 
 * Futuristic modal overlay for selecting user access role.
 * Maintains video background with blur effect and glass-morphism design.
 * 
 * Features:
 * - Professional role selection interface
 * - Futuristic styling with glow effects
 * - Video background preservation with blur
 * - Smooth animations and transitions
 * - Role-based routing integration
 */

import React, { useState, useEffect } from 'react';
import { X, Shield, Monitor, Settings, Smartphone, Users, AlertTriangle, CheckCircle } from 'lucide-react';

// ===========================
// TYPES & INTERFACES
// ===========================

export type UserRole = 'client' | 'dispatcher' | 'administrator' | 'guard';

export interface ModalState {
  isVisible: boolean;
  selectedRole: UserRole | null;
  isAnimating: boolean;
}

export interface RoleSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRoleSelect: (role: UserRole) => void;
  backgroundVideoRef?: React.RefObject<HTMLVideoElement>;
}

interface RoleOption {
  id: UserRole;
  title: string;
  subtitle: string;
  description: string;
  icon: React.ElementType;
  color: string;
  glowColor: string;
  features: string[];
  status: 'available' | 'development' | 'restricted';
}

// ===========================
// ROLE CONFIGURATION
// ===========================

const ROLE_OPTIONS: RoleOption[] = [
  {
    id: 'client',
    title: 'Client Portal',
    subtitle: 'PROPERTY MANAGERS',
    description: 'Secure access for property managers and security stakeholders to view analytics, incident reports, and security intelligence.',
    icon: Users,
    color: 'cyan',
    glowColor: 'cyan',
    features: [
      'Executive dashboard & KPIs',
      'Incident browser & reports', 
      'Evidence locker access',
      'Analytics & reporting'
    ],
    status: 'available'
  },
  {
    id: 'dispatcher',
    title: 'Dispatch Console',
    subtitle: 'OPERATIONS TEAM',
    description: 'Advanced console for dispatchers and security staff to monitor live feeds and manage security operations in real-time.',
    icon: Monitor,
    color: 'purple',
    glowColor: 'purple',
    features: [
      'Live AI monitoring console',
      'Real-time dispatch system',
      'Voice AI coordination',
      'Threat detection alerts'
    ],
    status: 'available'
  },
  {
    id: 'administrator',
    title: 'Administrator',
    subtitle: 'SYSTEM MANAGEMENT',
    description: 'Full system administration access for IT staff and platform administrators to configure and manage the entire platform.',
    icon: Settings,
    color: 'orange',
    glowColor: 'orange',
    features: [
      'System configuration',
      'User management',
      'Platform monitoring',
      'Security settings'
    ],
    status: 'available'
  },
  {
    id: 'guard',
    title: 'Guard Portal',
    subtitle: 'MOBILE PATROL',
    description: 'Mobile-optimized interface for patrol guards to receive dispatches, update incident status, and coordinate with dispatch.',
    icon: Smartphone,
    color: 'green',
    glowColor: 'green',
    features: [
      'Mobile dispatch alerts',
      'Incident response tools',
      'GPS coordination',
      'Status reporting'
    ],
    status: 'available'
  }
];

// ===========================
// MAIN MODAL COMPONENT
// ===========================

export const RoleSelectionModal: React.FC<RoleSelectionModalProps> = ({
  isOpen,
  onClose,
  onRoleSelect,
  backgroundVideoRef
}) => {
  const [modalState, setModalState] = useState<ModalState>({
    isVisible: false,
    selectedRole: null,
    isAnimating: false
  });

  // ===========================
  // LIFECYCLE EFFECTS
  // ===========================

  useEffect(() => {
    if (isOpen) {
      setModalState(prev => ({ ...prev, isVisible: true }));
      // Blur background video if available
      if (backgroundVideoRef?.current) {
        backgroundVideoRef.current.style.filter = 'blur(8px)';
        backgroundVideoRef.current.style.transition = 'filter 0.3s ease';
      }
    } else {
      setModalState(prev => ({ ...prev, isVisible: false, selectedRole: null }));
      // Remove video blur
      if (backgroundVideoRef?.current) {
        backgroundVideoRef.current.style.filter = 'none';
      }
    }
  }, [isOpen, backgroundVideoRef]);

  // ===========================
  // EVENT HANDLERS
  // ===========================

  const handleRoleSelect = (role: UserRole) => {
    const roleOption = ROLE_OPTIONS.find(r => r.id === role);
    
    if (roleOption?.status !== 'available') {
      // Show status message for non-available roles
      setModalState(prev => ({ ...prev, selectedRole: role }));
      return;
    }

    setModalState(prev => ({ ...prev, isAnimating: true }));
    
    setTimeout(() => {
      onRoleSelect(role);
      onClose();
    }, 300);
  };

  const handleClose = () => {
    setModalState(prev => ({ ...prev, isAnimating: true }));
    setTimeout(() => {
      onClose();
    }, 200);
  };

  // ===========================
  // HELPER FUNCTIONS
  // ===========================

  const getColorClasses = (color: string, isAvailable: boolean) => {
    if (!isAvailable) {
      return {
        border: 'border-gray-600/30',
        bg: 'bg-gray-500/20',
        text: 'text-gray-400',
        button: 'bg-gray-600 text-gray-400 cursor-not-allowed'
      };
    }

    const colorMap = {
      cyan: {
        border: 'border-cyan-500/30 hover:border-cyan-400/50 tech-border hover-glow-cyan',
        bg: 'bg-cyan-500/20',
        text: 'text-cyan-400',
        button: 'bg-gradient-to-r from-cyan-500 to-cyan-600 text-white hover:from-cyan-400 hover:to-cyan-500 hover-glow-cyan glow-pulse-fast'
      },
      purple: {
        border: 'border-purple-500/30 hover:border-purple-400/50 tech-border hover-glow-teal',
        bg: 'bg-purple-500/20',
        text: 'text-purple-400',
        button: 'bg-gradient-to-r from-purple-500 to-purple-600 text-white hover:from-purple-400 hover:to-purple-500 hover-glow-teal glow-pulse-fast'
      },
      orange: {
        border: 'border-orange-500/30 hover:border-orange-400/50 tech-border hover-glow-teal',
        bg: 'bg-orange-500/20',
        text: 'text-orange-400',
        button: 'bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:from-orange-400 hover:to-orange-500 hover-glow-teal glow-pulse-fast'
      },
      green: {
        border: 'border-green-500/30 hover:border-green-400/50 tech-border hover-glow-teal',
        bg: 'bg-green-500/20',
        text: 'text-green-400',
        button: 'bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-400 hover:to-green-500 hover-glow-teal glow-pulse-fast'
      }
    };

    return colorMap[color as keyof typeof colorMap] || colorMap.cyan;
  };

  const getDotColor = (color: string, isAvailable: boolean) => {
    if (!isAvailable) return 'bg-gray-400';
    
    const dotMap = {
      cyan: 'bg-cyan-400',
      purple: 'bg-purple-400',
      orange: 'bg-orange-400',
      green: 'bg-green-400'
    };
    
    return dotMap[color as keyof typeof dotMap] || 'bg-cyan-400';
  };

  // ===========================
  // RENDER HELPERS
  // ===========================

  const renderStatusBadge = (status: RoleOption['status']) => {
    switch (status) {
      case 'available':
        return (
          <div className="flex items-center text-green-400 text-xs font-medium">
            <CheckCircle className="w-3 h-3 mr-1" />
            AVAILABLE
          </div>
        );
      case 'development':
        return (
          <div className="flex items-center text-yellow-400 text-xs font-medium">
            <AlertTriangle className="w-3 h-3 mr-1" />
            IN DEVELOPMENT
          </div>
        );
      case 'restricted':
        return (
          <div className="flex items-center text-red-400 text-xs font-medium">
            <Shield className="w-3 h-3 mr-1" />
            RESTRICTED ACCESS
          </div>
        );
      default:
        return null;
    }
  };

  const renderRoleCard = (role: RoleOption) => {
    const isSelected = modalState.selectedRole === role.id;
    const isAvailable = role.status === 'available';
    const colors = getColorClasses(role.color, isAvailable);
    
    return (
      <div
        key={role.id}
        className={`
          relative group cursor-pointer transition-all duration-300
          ${isAvailable ? 'hover:transform hover:scale-[1.02]' : 'opacity-60 cursor-not-allowed'}
          ${isSelected ? 'ring-2 ring-yellow-400' : ''}
        `}
        onClick={() => handleRoleSelect(role.id)}
      >
        {/* Card Background */}
        <div className={`
          bg-black/60 backdrop-blur-sm border rounded-xl p-6
          ${colors.border}
          ${isSelected ? 'bg-black/80' : ''}
        `}>
          
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center mr-4 ${colors.bg}`}>
                <role.icon className={`w-6 h-6 ${colors.text}`} />
              </div>
              <div>
                <h3 className={`text-xl font-bold mb-1 ${colors.text}`}>
                  {role.title}
                </h3>
                <p className={`text-xs uppercase tracking-wide ${colors.text.replace('400', '300')}`}>
                  {role.subtitle}
                </p>
              </div>
            </div>
            
            {/* Status Badge */}
            {renderStatusBadge(role.status)}
          </div>
          
          {/* Description */}
          <p className="text-gray-300 mb-4 text-sm leading-relaxed">
            {role.description}
          </p>
          
          {/* Features */}
          <ul className="space-y-2 mb-6">
            {role.features.map((feature, index) => (
              <li key={index} className="flex items-center text-gray-300 text-sm">
                <div className={`w-2 h-2 rounded-full mr-3 ${getDotColor(role.color, isAvailable)}`}></div>
                {feature}
              </li>
            ))}
          </ul>
          
          {/* Action Button */}
          <button
            className={`
              w-full py-3 px-4 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center
              ${colors.button}
            `}
            disabled={!isAvailable}
          >
            {isAvailable ? 'Access Portal' : role.status === 'development' ? 'Coming Soon' : 'Contact Administrator'}
          </button>
          
          {/* Selection Message */}
          {isSelected && role.status !== 'available' && (
            <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
              <p className="text-yellow-400 text-sm text-center">
                {role.status === 'development' 
                  ? 'This portal is currently under development and will be available soon.'
                  : 'This portal requires special authorization. Please contact your system administrator.'
                }
              </p>
            </div>
          )}
        </div>
      </div>
    );
  };

  // ===========================
  // MAIN RENDER
  // ===========================

  if (!modalState.isVisible) return null;

  return (
    <div className={`
      fixed inset-0 z-50 flex items-center justify-center p-4
      ${modalState.isAnimating ? 'animate-fade-out' : 'animate-fade-in'}
    `}>
      
      {/* Modal Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={handleClose}
      />
      
      {/* Modal Content */}
      <div className={`
        relative w-full max-w-6xl max-h-[90vh] overflow-y-auto
        bg-black/40 backdrop-blur-md border border-cyan-500/30 rounded-2xl
        tech-border glow-cyan
        ${modalState.isAnimating ? 'animate-scale-out' : 'animate-scale-in'}
      `}>
        
        {/* Header */}
        <div className="sticky top-0 bg-black/60 backdrop-blur-sm border-b border-cyan-500/30 p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center mb-2">
                <div className="w-8 h-8 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-lg flex items-center justify-center mr-3 glow-cyan">
                  <Shield className="w-4 h-4 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-white text-glow-teal">
                  APEX AI SECURITY PLATFORM
                </h2>
              </div>
              <p className="text-cyan-400 text-sm font-medium tracking-wide">
                Select Your Access Portal
              </p>
            </div>
            
            <button
              onClick={handleClose}
              className="w-10 h-10 bg-gray-800/50 hover:bg-gray-700/50 border border-gray-600 rounded-lg flex items-center justify-center transition-all duration-200 hover:border-cyan-400"
            >
              <X className="w-5 h-5 text-gray-400 hover:text-cyan-400" />
            </button>
          </div>
        </div>
        
        {/* Role Selection Grid */}
        <div className="p-6">
          <div className="grid md:grid-cols-2 gap-6">
            {ROLE_OPTIONS.map(renderRoleCard)}
          </div>
          
          {/* Footer Info */}
          <div className="mt-8 pt-6 border-t border-gray-600/30 text-center">
            <p className="text-gray-400 text-sm">
              Each portal provides role-specific access to the APEX AI Security Platform
            </p>
            <p className="text-gray-500 text-xs mt-1">
              Contact your administrator if you need access to restricted portals
            </p>
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
  @keyframes fade-in {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  
  @keyframes fade-out {
    from { opacity: 1; }
    to { opacity: 0; }
  }
  
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
  
  @keyframes scale-out {
    from { 
      opacity: 1; 
      transform: scale(1) translateY(0); 
    }
    to { 
      opacity: 0; 
      transform: scale(0.9) translateY(20px); 
    }
  }
  
  .animate-fade-in { animation: fade-in 0.3s ease-out; }
  .animate-fade-out { animation: fade-out 0.2s ease-in; }
  .animate-scale-in { animation: scale-in 0.3s ease-out; }
  .animate-scale-out { animation: scale-out 0.2s ease-in; }
`;

// Inject styles if not already present
if (typeof document !== 'undefined' && !document.getElementById('modal-animations')) {
  const styleSheet = document.createElement('style');
  styleSheet.id = 'modal-animations';
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);
}

export default RoleSelectionModal;
