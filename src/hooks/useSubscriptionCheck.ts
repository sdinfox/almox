import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

interface UserProfile {
  id: string;
  email: string;
  role: 'super_admin' | 'owner' | 'manager' | 'operator';
  organization_id: string;
}

interface Organization {
  id: string;
  name: string;
  plan_type: string;
  expires_at: string;
}

export const useSubscriptionCheck = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isBlocked, setIsBlocked] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const checkSubscription = async () => {
      try {
        // Obter usuário atual
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError || !user) {
          navigate('/login');
          return;
        }

        // Obter perfil do usuário
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profileError || !profile) {
          console.error('Erro ao carregar perfil:', profileError);
          navigate('/login');
          return;
        }

        setUserProfile(profile);

        // Super Admin tem bypass total
        if (profile.role === 'super_admin') {
          setIsBlocked(false);
          setIsLoading(false);
          return;
        }

        // Para outros usuários, verificar organização
        const { data: org, error: orgError } = await supabase
          .from('organizations')
          .select('*')
          .eq('id', profile.organization_id)
          .single();

        if (orgError || !org) {
          console.error('Erro ao carregar organização:', orgError);
          setIsLoading(false);
          return;
        }

        setOrganization(org);

        // Verificar se a assinatura expirou
        const now = new Date();
        const expiresAt = new Date(org.expires_at);
        
        if (expiresAt < now) {
          setIsBlocked(true);
          navigate('/assinatura-vencida');
        } else {
          setIsBlocked(false);
        }

      } catch (error) {
        console.error('Erro ao verificar assinatura:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkSubscription();
  }, [navigate]);

  const daysUntilExpiration = organization ? 
    Math.ceil((new Date(organization.expires_at).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : 
    null;

  return {
    isLoading,
    isBlocked,
    userProfile,
    organization,
    daysUntilExpiration,
    isSuperAdmin: userProfile?.role === 'super_admin',
    isExpired: organization ? new Date(organization.expires_at) < new Date() : false
  };
};
