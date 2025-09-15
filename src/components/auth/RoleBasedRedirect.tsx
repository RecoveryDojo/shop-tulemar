import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

export function RoleBasedRedirect() {
  const { hasRole, loading, roles } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Wait for roles to load to avoid redirecting to home prematurely
    if (loading) return;

    if (hasRole('shopper')) { navigate('/shopper'); return; }
    if (hasRole('driver')) { navigate('/driver'); return; }
    if (hasRole('concierge')) { navigate('/concierge'); return; }
    if (hasRole('store_manager')) { navigate('/store-manager'); return; }
    if (hasRole('admin') || hasRole('sysadmin')) { navigate('/admin'); return; }

    // Default for clients/customers
    navigate('/');
  }, [loading, roles, hasRole, navigate]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  );
}