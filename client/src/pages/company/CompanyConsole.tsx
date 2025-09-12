import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Building2, Users, ExternalLink, Settings, Bell, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { apiRequest } from '@/lib/queryClient';

interface CompanyConsoleProps {
  companyId: string;
}

export default function CompanyConsole({ companyId }: CompanyConsoleProps) {
  const { user } = useAuth();
  const [, navigate] = useLocation();

  // Fetch company details
  const { data: company, isLoading: loadingCompany } = useQuery({
    queryKey: ['company', companyId],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/company/${companyId}`);
      if (!response.ok) throw new Error('Failed to fetch company');
      return response.json();
    },
    enabled: !!user?.id
  });

  // Fetch accessible businesses
  const { data: businesses, isLoading: loadingBusinesses } = useQuery({
    queryKey: ['accessible-businesses', user?.id],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/company/accessible-businesses?userId=${user?.id}`);
      if (!response.ok) throw new Error('Failed to fetch businesses');
      return response.json();
    },
    enabled: !!user?.id
  });

  // Fetch company members
  const { data: members, isLoading: loadingMembers } = useQuery({
    queryKey: ['company-members', companyId],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/company/${companyId}/members?userId=${user?.id}`);
      if (!response.ok) throw new Error('Failed to fetch members');
      return response.json();
    },
    enabled: !!user?.id
  });

  if (!user) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900">
        <Navbar />
        <div className="container mx-auto px-4 py-20">
          <div className="max-w-md mx-auto">
            <Card>
              <CardContent className="p-6 text-center">
                <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
                <p className="text-neutral-600 dark:text-neutral-400 mb-4">
                  You need to be logged in to access the company console.
                </p>
                <Button onClick={() => navigate('/auth/signin')}>Sign In</Button>
              </CardContent>
            </Card>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (loadingCompany || loadingBusinesses || loadingMembers) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900">
        <Navbar />
        <div className="container mx-auto px-4 py-20">
          <div className="max-w-6xl mx-auto">
            <div className="animate-pulse">
              <div className="h-8 bg-neutral-200 dark:bg-neutral-800 rounded mb-6"></div>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-32 bg-neutral-200 dark:bg-neutral-800 rounded"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const accessibleBusinesses = businesses?.data || [];
  const companyMembers = members?.data || [];

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900">
      <Navbar />
      <div className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <Settings className="h-8 w-8 text-blue-600" />
              <h1 className="text-3xl font-bold tracking-tight" data-testid="company-name">
                Company Profile
              </h1>
            </div>
            <p className="text-neutral-600 dark:text-neutral-400">
              Manage your company settings and profile information
            </p>
          </div>

          {/* Company Info Card */}
          <Card className="mb-8">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Company Information
                </CardTitle>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => navigate(`/company/${companyId}/settings`)}
                  data-testid="button-edit-profile"
                >
                  Edit Profile
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-neutral-600 dark:text-neutral-400">Company Name</label>
                  <p className="text-lg font-semibold">{company?.data?.name || 'Not specified'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-neutral-600 dark:text-neutral-400">Company ID</label>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">{companyId}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-neutral-600 dark:text-neutral-400">Created</label>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">
                    {company?.data?.createdAt ? format(new Date(company.data.createdAt), 'PPP') : 'Not available'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                      Managed Venues
                    </p>
                    <p className="text-2xl font-bold">{accessibleBusinesses.length}</p>
                  </div>
                  <Building2 className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                      Team Members
                    </p>
                    <p className="text-2xl font-bold">{companyMembers.length}</p>
                  </div>
                  <Users className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                      Active Invites
                    </p>
                    <p className="text-2xl font-bold">0</p>
                  </div>
                  <Bell className="h-8 w-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Settings Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Company Management</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                <Button
                  variant="outline"
                  className="justify-start h-auto p-4"
                  onClick={() => navigate(`/company/${companyId}/settings`)}
                  data-testid="company-settings-button"
                >
                  <Settings className="h-5 w-5 mr-2" />
                  <div className="text-left">
                    <div className="font-medium">Company Settings</div>
                    <div className="text-sm text-neutral-500">Update company name and details</div>
                  </div>
                </Button>
                
                <Button
                  variant="outline"
                  className="justify-start h-auto p-4"
                  onClick={() => navigate("/dashboard")}
                  data-testid="back-to-dashboard-button"
                >
                  <ExternalLink className="h-5 w-5 mr-2" />
                  <div className="text-left">
                    <div className="font-medium">Back to Dashboard</div>
                    <div className="text-sm text-neutral-500">Return to main company dashboard</div>
                  </div>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      <Footer />
    </div>
  );
}