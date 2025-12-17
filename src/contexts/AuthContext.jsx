import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext();

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const signOut = useCallback(async () => {
    // Limpar estado local
    setUser(null);

    // Fazer logout com Supabase (limpa automaticamente o storage)
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }

    // Redirecionar para login
    navigate('/login', { replace: true });
  }, [navigate]);

  // Self-healing function to create profile if missing
  const createProfileIfMissing = useCallback(async (sessionUser) => {
    const metadata = sessionUser.user_metadata || {};
    
    // Ensure user_type is present (CRITICAL for profile creation)
    const userType = metadata.user_type || metadata.userType || 'patient';
    if (!['patient', 'nutritionist'].includes(userType)) {
      console.error('Invalid user_type in metadata:', userType, 'Defaulting to "patient"');
    }
    
    // Extract required fields from metadata
    const profileData = {
      id: sessionUser.id,
      email: sessionUser.email,
      name: metadata.name || metadata.display_name || metadata.full_name || 'Usuário',
      user_type: ['patient', 'nutritionist'].includes(userType) ? userType : 'patient', // Fallback to 'patient' if invalid
      crn: metadata.crn || null,
      birth_date: metadata.birth_date || null,
      gender: metadata.gender || null,
      height: metadata.height ? parseFloat(metadata.height) : null,
      weight: metadata.weight ? parseFloat(metadata.weight) : null,
      goal: metadata.goal || null,
      nutritionist_id: metadata.nutritionist_id || null,
      phone: metadata.phone || null,
      cpf: metadata.cpf || null,
      occupation: metadata.occupation || null,
      civil_status: metadata.civil_status || null,
      observations: metadata.observations || null,
      address: metadata.address || null,
    };

    console.log('Attempting self-healing profile creation with data:', {
      id: profileData.id,
      email: profileData.email,
      name: profileData.name,
      user_type: profileData.user_type,
      hasMetadata: !!metadata,
      metadataKeys: Object.keys(metadata),
    });

    try {
      const { data: newProfile, error: insertError } = await supabase
        .from('user_profiles')
        .insert(profileData)
        .select()
        .single();

      if (insertError) {
        console.error('Error creating profile (self-healing):', {
          code: insertError.code,
          message: insertError.message,
          details: insertError.details,
          hint: insertError.hint,
          profileData: {
            id: profileData.id,
            name: profileData.name,
            user_type: profileData.user_type,
            email: profileData.email,
          },
        });
        return null;
      }

      console.log('Profile created successfully (self-healing):', {
        id: newProfile.id,
        name: newProfile.name,
        user_type: newProfile.user_type,
      });
      return newProfile;
    } catch (error) {
      console.error('Exception during profile creation (self-healing):', {
        error,
        message: error.message,
        stack: error.stack,
        profileData: {
          id: profileData.id,
          name: profileData.name,
          user_type: profileData.user_type,
        },
      });
      return null;
    }
  }, []);

  // Fetch or create profile
  const fetchOrCreateProfile = useCallback(async (sessionUser) => {
    // Try to fetch existing profile
    const { data: profile, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', sessionUser.id)
      .single();

    // If profile exists, return it
    if (profile && !error) {
      return profile;
    }

    // If error is PGRST116 (no rows found), try self-healing
    if (error?.code === 'PGRST116') {
      console.warn('Profile not found (PGRST116), attempting self-healing...');
      const newProfile = await createProfileIfMissing(sessionUser);
      if (newProfile) {
        return newProfile;
      }
      // If self-healing fails, return null (will be handled by caller)
      return null;
    }

    // For other errors, log and return null
    if (error) {
      console.error('Error fetching profile:', error);
      return null;
    }

    return null;
  }, [createProfileIfMissing]);

  useEffect(() => {
    setLoading(true);
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT') {
        setUser(null);
        setLoading(false);
        return;
      }
      
      if (session?.user) {
        const profile = await fetchOrCreateProfile(session.user);

        if (!profile) {
          console.error('Failed to fetch or create profile, signing out');
          await signOut();
          return;
        }

        setUser({ ...session.user, profile });
        
        // Auto-redirect after email confirmation or sign in
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          const redirectPath = profile.user_type === 'nutritionist' ? '/nutritionist' : '/patient';
          // Use setTimeout to ensure navigation happens after state update
          setTimeout(() => {
            navigate(redirectPath, { replace: true });
          }, 100);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [signOut, fetchOrCreateProfile, navigate]);

  const updateUserProfile = (newProfileData) => {
    setUser(currentUser => {
        if (!currentUser) return null;
        const updatedProfile = { ...currentUser.profile, ...newProfileData };
        return { ...currentUser, profile: updatedProfile };
    });
  }

  const value = {
    signUp: (data) => supabase.auth.signUp(data),
    signIn: (data) => supabase.auth.signInWithPassword(data),
    signOut,
    user,
    loading,
    updateUserProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}