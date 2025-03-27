// Central types file for the application

/**
 * Particle Animation types
 */
export interface Particle {
  size: number;
  top: number;
  left: number;
  opacity: number;
  duration: number;
  delay: number;
  initialScale: number;
  animationIndex: number;
  colorClass: string;
}

export interface ParticleAnimationProps {
  fullPage?: boolean;
  particleCount?: number;
  particleColor?: string;
}

/**
 * Form hook types
 */
export interface UseSubscriptionFormProps {
  onSuccess?: () => void;
  successMessage?: string;
}

/**
 * Tool entity type definition
 */
export interface Tool {
  title: string;
  description: string;
  status: 'live' | 'coming-soon';
  features: string[];
  category: string;
  url?: string; // Optional URL for live tools
  estimatedRelease?: string; // For coming soon tools
}

/**
 * Form submission types
 */
export interface SubscriptionFormData {
  email: string;
  firstName?: string;
  toolName?: string;
}

export interface SubscriptionResponse {
  success: boolean;
  message: string;
  error?: string;
}

/**
 * Comment system types
 */
export interface User {
  id: string;
  name?: string;
  email: string;
  avatar?: string;
}

export interface Comment {
  id: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  author: User;
  parentId?: string;
  postId: string;
  votes: number;
  editHistory?: CommentEdit[];
}

export interface CommentEdit {
  content: string;
  editedAt: string;
}

/**
 * Blog post types
 */
export interface Category {
  title: string;
  slug: string;
  description?: string;
}

export interface Author {
  name: string;
  slug: string;
  bio?: string;
  avatar?: string;
}

export interface Post {
  title: string;
  slug: string;
  excerpt?: string;
  content?: unknown; // Portable Text content
  publishedAt: string;
  author?: Author;
  categories?: Category[];
  coverImage?: string;
  readingTime?: number;
}

/**
 * UI component prop types
 */
export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export interface WaitlistModalProps extends ModalProps {
  toolName?: string;
}

export interface EmailSignupProps {
  customTitle?: string;
  customDescription?: string;
  position?: 'top' | 'bottom' | 'inline';
}
