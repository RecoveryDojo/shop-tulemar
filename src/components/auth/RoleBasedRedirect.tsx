import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

export function RoleBasedRedirect() {
  const { hasRole } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to appropriate dashboard based on primary role
    if (hasRole('shopper')) {
      navigate('/shopper');
    } else if (hasRole('driver')) {
      navigate('/driver');
    } else if (hasRole('concierge')) {
      navigate('/concierge');
    } else if (hasRole('store_manager')) {
      navigate('/store-manager');
    } else if (hasRole('admin') || hasRole('sysadmin')) {
      navigate('/admin');
    } else {
      // Default for clients/customers
      navigate('/');
    }
  }, [hasRole, navigate]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  );
}