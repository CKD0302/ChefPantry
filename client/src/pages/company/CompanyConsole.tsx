import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useLocation } from 'wouter';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Building2, Users, ExternalLink, Bell, MapPin, Calendar, Check } from 'lucide-react';
import { format } from 'date-fns';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface CompanyConsoleProps {
  companyId: string;
}

export default function CompanyConsole({ companyId }: CompanyConsoleProps) {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();

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

  // Fetch company invites
  const { data: invites, isLoading: loadingInvites } = useQuery({
    queryKey: ['company-invites', user?.id],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/company/invites/mine`);
      if (!response.ok) throw new Error('Failed to fetch invites');
      return response.json();
    },
    enabled: !!user?.id
  });

  // Accept invite mutation - using secure endpoint with company ID from URL
  const acceptInviteMutation = useMutation({
    mutationFn: async (invite: any) => {
      const response = await apiRequest('POST', `/api/company/${companyId}/accept-invite`, {
        token: invite.token
        // Note: company ID now comes from URL params, not client body for security
      });
      if (!response.ok) throw new Error('Failed to accept invite');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accessible-businesses', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['company-invites', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['company', companyId] });
      toast({
        title: "Invite Accepted",
        description: "Successfully accepted business management invite.",
      });
    },
    onError: (error: any) => {
      const errorMessage = error?.message || "Failed to accept invite. Please try again.";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    }
  });

  // Calculate pending invites count
  const pendingInvites = invites?.filter((invite: any) => invite.status === 'pending') || [];
  const activeInvitesCount = pendingInvites.length;

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
              <Building2 className="h-8 w-8 text-blue-600" />
              <h1 className="text-3xl font-bold tracking-tight" data-testid="company-name">
                Company Dashboard
              </h1>
            </div>
            <p className="text-neutral-600 dark:text-neutral-400">
              Overview of your company and managed venues
            </p>
          </div>

          {/* Company Info Card */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Company Information
              </CardTitle>
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
                    <p className="text-2xl font-bold" data-testid="text-active-invites">
                      {loadingInvites ? '...' : activeInvitesCount}
                    </p>
                  </div>
                  <Bell className="h-8 w-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Pending Business-to-Company Invites */}
          {pendingInvites.length > 0 && (
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Business Management Invites ({pendingInvites.length})
                </CardTitle>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  Venues inviting this company to manage their operations, bookings, and invoices.
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {pendingInvites.map((invite: any, index: number) => (
                    <div 
                      key={invite.id} 
                      className="flex items-center justify-between p-4 border rounded-lg"
                      data-testid={`invite-row-${index}`}
                    >
                      <div>
                        <p className="font-medium" data-testid={`invite-business-${index}`}>
                          {invite.businessName || 'Business Venue'}
                        </p>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400">
                          Venue requesting management services
                        </p>
                        <div className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400">
                          <span>Role: {invite.role || 'Member'}</span>
                          {invite.expiresAt && (
                            <>
                              <span>•</span>
                              <Calendar className="h-4 w-4" />
                              <span>Expires: {format(new Date(invite.expiresAt), 'PPP')}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          onClick={() => acceptInviteMutation.mutate(invite)}
                          disabled={acceptInviteMutation.isPending}
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                          data-testid={`button-accept-invite-${index}`}
                        >
                          <Check className="h-4 w-4 mr-1" />
                          {acceptInviteMutation.isPending ? 'Accepting...' : 'Accept'}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Managed Venues */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Managed Venues ({accessibleBusinesses.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {accessibleBusinesses.length === 0 ? (
                <div className="text-center py-8 text-neutral-500">
                  <Building2 className="h-12 w-12 mx-auto mb-4 text-neutral-300" />
                  <p className="mb-2">No venues currently managed</p>
                  <p className="text-sm">Venues will appear here once they accept your company's management invites</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {accessibleBusinesses.map((business: any) => (
                    <div key={business.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">
                      <div className="flex items-center gap-3">
                        <Building2 className="h-5 w-5 text-blue-600" />
                        <div>
                          <p className="font-medium">{business.businessName}</p>
                          <p className="text-sm text-neutral-600 dark:text-neutral-400">
                            {business.location}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">
                          {business.venueType || 'Venue'}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/business-profile/${business.id}`)}
                          data-testid={`button-view-venue-${business.id}`}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      <Footer />
    </div>
  );
}