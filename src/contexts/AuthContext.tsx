import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export type UserRole = 'admin' | 'driver' | 'client' | 'concierge' | 'sysadmin' | 'store_manager' | 'shopper';

interface UserProfile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  email: string | null;
  phone: string | null;
  preferences?: any;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  roles: UserRole[];
  loading: boolean;
  hasRole: (role: UserRole) => boolean;
  isAdmin: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, displayName?: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  assignRole: (userId: string, role: any) => Promise<{ error: any }>;
  removeRole: (userId: string, role: any) => Promise<{ error: any }>;
  updateProfile: () => Promise<void>;
  hasCompletedOnboarding: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCurrentUserContext = async (userId: string) => {
    try {
      // Fetch profile and roles in parallel
      const [profileResult, rolesResult] = await Promise.allSettled([
        supabase.from('profiles').select('*').eq('id', userId).single(),
        supabase.from('user_roles').select('role').eq('user_id', userId)
      ]);

      // Handle profile result
      if (profileResult.status === 'fulfilled' && !profileResult.value.error) {
        setProfile(profileResult.value.data);
      } else {
        const error = profileResult.status === 'rejected' 
          ? profileResult.reason 
          : profileResult.value.error;
        
        toast({
          title: "Profile Load Error",
          description: "Could not load user profile. Some features may be limited.",
          variant: "destructive",
        });
        setProfile(null);
      }

      // Handle roles result - default to ['client'] on error
      if (rolesResult.status === 'fulfilled' && !rolesResult.value.error) {
        const userRoles = rolesResult.value.data?.map(r => r.role as UserRole) || ['client'];
        setRoles(userRoles.length > 0 ? userRoles : ['client']);
      } else {
        const error = rolesResult.status === 'rejected' 
          ? rolesResult.reason 
          : rolesResult.value.error;
        
        toast({
          title: "Roles Load Error", 
          description: "Could not load user roles. Defaulting to client access.",
          variant: "destructive",
        });
        setRoles(['client']);
      }
    } catch (error: any) {
      toast({
        title: "Authentication Error",
        description: "Failed to load user context. Please try refreshing.",
        variant: "destructive",
      });
      setProfile(null);
      setRoles(['client']);
    }
  };

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Defer Supabase calls with setTimeout to prevent deadlock
          setTimeout(() => {
            fetchCurrentUserContext(session.user.id);
          }, 0);
        } else {
          setProfile(null);
          setRoles([]);
        }
        
        setLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        setTimeout(() => {
          fetchCurrentUserContext(session.user.id);
        }, 0);
      }
      
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      toast({
        title: "Sign In Error",
        description: error.message,
        variant: "destructive",
      });
    }

    return { error };
  };

  const signUp = async (email: string, password: string, displayName?: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          display_name: displayName,
        }
      }
    });

    if (error) {
      toast({
        title: "Sign Up Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Check your email for a verification link!",
      });
    }

    return { error };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        title: "Sign Out Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const assignRole = async (userId: string, role: any) => {
    try {
      const { data, error } = await supabase
        .rpc('assign_user_role', {
          target_user_id: userId,
          target_role: role
        });

      if (error) {
        toast({
          title: "Role Assignment Error",
          description: error.message,
          variant: "destructive",
        });
        return { error };
      }

      const result = data as { success: boolean; error?: string; message?: string };
      
      if (!result.success) {
        toast({
          title: "Role Assignment Error",
          description: result.error || "Failed to assign role",
          variant: "destructive",
        });
        return { error: new Error(result.error || "Failed to assign role") };
      }

      toast({
        title: "Success",
        description: result.message || "Role assigned successfully",
      });
      
      // Refresh user context if it's current user
      if (userId === user?.id) {
        fetchCurrentUserContext(userId);
      }

      return { error: null };
    } catch (error: any) {
      toast({
        title: "Role Assignment Error",
        description: error.message,
        variant: "destructive",
      });
      return { error };
    }
  };

  const removeRole = async (userId: string, role: any) => {
    try {
      const { data, error } = await supabase
        .rpc('remove_user_role', {
          target_user_id: userId,
          target_role: role
        });

      if (error) {
        toast({
          title: "Role Removal Error",
          description: error.message,
          variant: "destructive",
        });
        return { error };
      }

      const result = data as { success: boolean; error?: string; message?: string };
      
      if (!result.success) {
        toast({
          title: "Role Removal Error",
          description: result.error || "Failed to remove role",
          variant: "destructive",
        });
        return { error: new Error(result.error || "Failed to remove role") };
      }

      toast({
        title: "Success",
        description: result.message || "Role removed successfully",
      });
      
      // Refresh user context if it's current user
      if (userId === user?.id) {
        fetchCurrentUserContext(userId);
      }

      return { error: null };
    } catch (error: any) {
      toast({
        title: "Role Removal Error",
        description: error.message,
        variant: "destructive",
      });
      return { error };
    }
  };

  const hasRole = (role: UserRole): boolean => {
    return roles.includes(role);
  };

  const isAdmin = hasRole('admin') || hasRole('sysadmin');

  const updateProfile = async () => {
    if (!user) return;
    await fetchCurrentUserContext(user.id);
  };

  const hasCompletedOnboarding = () => {
    return profile?.preferences?.onboardingCompleted === true;
  };

  const value = {
    user,
    session,
    profile,
    roles,
    loading,
    hasRole,
    isAdmin,
    signIn,
    signUp,
    signOut,
    assignRole,
    removeRole,
    updateProfile,
    hasCompletedOnboarding,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};