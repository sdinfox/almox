import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/layout/Layout';
import { Skeleton } from './ui/skeleton';

const ProtectedRoute: React.FC = () => {
  const { session, profile, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex min-h-screen bg-muted/40">
        <div className="w-64 border-r bg-sidebar p-4 hidden md:block">
          <Skeleton className="h-8 w-3/4 mb-6" />
          <Skeleton className="h-10 w-full mb-2" />
          <Skeleton className="h-10 w-full mb-2" />
        </div>
        <div className="flex-1">
          <div className="h-16 border-b bg-background p-4 flex items-center justify-end">
            <Skeleton className="h-10 w-10 rounded-full" />
          </div>
          <div className="p-6">
            <Skeleton className="h-12 w-1/3 mb-6" />
            <Skeleton className="h-40 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  // Verificação de Paywall (Assinatura Expirada)
  if (profile?.organization?.expires_at) {
    const expiryDate = new Date(profile.organization.expires_at);
    const isExpired = expiryDate < new Date();
    
    if (isExpired && location.pathname !== '/assinatura-vencida') {
      return <Navigate to="/assinatura-vencida" replace />;
    }
  }

  return (
    <Layout>
      <Outlet />
    </Layout>
  );
};

export default ProtectedRoute;