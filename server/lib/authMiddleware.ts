import { Request, Response, NextFunction } from 'express';
import { supabaseService } from './supabaseService';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email?: string;
    user_metadata?: any;
  };
}

/**
 * Authentication middleware to verify Supabase JWT tokens
 * Extracts user information and adds it to the request object
 */
export async function authenticateUser(
  req: AuthenticatedRequest, 
  res: Response, 
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ 
        message: 'Authentication required. Missing or invalid authorization header.' 
      });
      return;
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    if (!token) {
      res.status(401).json({ 
        message: 'Authentication required. No token provided.' 
      });
      return;
    }

    // Verify the JWT token with Supabase
    const { data: { user }, error } = await supabaseService.auth.getUser(token);
    
    if (error || !user) {
      console.error('Auth verification error:', error);
      res.status(401).json({ 
        message: 'Invalid or expired authentication token.' 
      });
      return;
    }

    // Add user information to request object
    req.user = {
      id: user.id,
      email: user.email,
      user_metadata: user.user_metadata,
    };

    next();
  } catch (error) {
    console.error('Authentication middleware error:', error);
    res.status(500).json({ 
      message: 'Authentication service error.' 
    });
  }
}

/**
 * Middleware to verify notification ownership
 * Must be used after authenticateUser middleware
 */
export async function verifyNotificationOwnership(
  req: AuthenticatedRequest, 
  res: Response, 
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ 
        message: 'Authentication required.' 
      });
      return;
    }

    const notificationId = req.params.id;
    if (!notificationId) {
      res.status(400).json({ 
        message: 'Notification ID is required.' 
      });
      return;
    }

    // Import storage dynamically to avoid circular dependency
    const { storage } = await import('../storage');
    
    // Get the notification to verify ownership
    const notification = await storage.getNotificationById(notificationId);
    
    if (!notification) {
      res.status(404).json({ 
        message: 'Notification not found.' 
      });
      return;
    }

    // Verify the authenticated user owns this notification
    if (notification.userId !== req.user.id) {
      res.status(403).json({ 
        message: 'Access denied. You can only access your own notifications.' 
      });
      return;
    }

    next();
  } catch (error) {
    console.error('Notification ownership verification error:', error);
    res.status(500).json({ 
      message: 'Failed to verify notification ownership.' 
    });
  }
}