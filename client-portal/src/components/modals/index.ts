// client-portal/src/components/modals/index.ts
/**
 * APEX AI - Modal Components Export Index
 * =====================================
 * 
 * Centralized exports for all modal components used throughout the application.
 * Maintains clean imports and consistent modal system architecture.
 */

export { RoleSelectionModal } from './RoleSelectionModal';
export { ClientLoginModal } from './ClientLoginModal';

// Type exports for modal props and state
export type { 
  RoleSelectionModalProps,
  UserRole,
  ModalState 
} from './RoleSelectionModal';

export type { 
  ClientLoginModalProps,
  LoginFormData 
} from './ClientLoginModal';
