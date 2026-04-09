import React, { createContext, useContext, useState, useEffect } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { UserProfile } from '@/types';
import { showError } from '@/utils/toast';
import { useTranslation } from 'react-i18next';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: UserProfile | null;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { i18n } = useTranslation();

  useEffect(() => {
    const fetchSession = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) {
        showError("Erro ao carregar sessão: " + error.message);
      }
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
    };

    fetchSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const fetchProfile = async (userId: string) => {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*, organization:organization_id(*)')
        .eq('id', userId)
        .single();

      if (error) {
        showError("Erro ao carregar perfil: " + error.message);
        setProfile(null);
      } else {
        const userProfile = data as UserProfile;
        if (userProfile.deleted_at) {
          await supabase.auth.signOut();
          showError("Sua conta foi desativada.");
          setProfile(null);
          setUser(null);
          setSession(null);
        } else {
          setProfile(userProfile);
          // Ajustar idioma baseado na organização
          if (userProfile.organization?.language) {
            i18n.changeLanguage(userProfile.organization.language);
          }
        }
      }
      setIsLoading(false);
    };

    if (user) {
      fetchProfile(user.id);
    } else {
      setProfile(null);
      setIsLoading(false);
    }
  }, [user, i18n]);

  return (
    <AuthContext.Provider value={{ session, user, profile, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};