import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useLocation } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useToast } from '@/hooks/use-toast';
import { Building2, CheckCircle, AlertTriangle, Clock } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

export default function AcceptInvite() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [selectedCompanyId, setSelectedCompanyId] = useState('');
  
  // Get token from URL params
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get('token');

  // Fetch invite details by token
  const { data: invite, isLoading: loadingInvite, error: inviteError } = useQuery({
    queryKey: ['invite-by-token', token],
    queryFn: async () => {
      if (!token) throw new Error('No invitation token found');
      
      // First get all invites for the current user
      const response = await apiRequest('GET', `/api/company/invites/mine`);
      if (!response.ok) throw new Error('Failed to fetch invitation details');
      const result = await response.json();
      
      // Find the invite with matching token
      const matchingInvite = result.data?.find((inv: any) => inv.token === token);
      if (!matchingInvite) throw new Error('Invitation not found or invalid');
      
      return { data: matchingInvite };
    },
    enabled: !!user?.email && !!token
  });

  // Fetch user's companies (ones they own or admin)
  const { data: companies, isLoading: loadingCompanies } = useQuery({
    queryKey: ['companies', user?.id],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/company/mine`);
      if (!response.ok) throw new Error('Failed to fetch companies');
      return response.json();
    },
    enabled: !!user?.id
  });

  // Accept invitation mutation
  const acceptInviteMutation = useMutation({
    mutationFn: async () => {
      if (!token || !selectedCompanyId || !user?.id) {
        throw new Error('Missing required information');
      }
      
      const response = await apiRequest('POST', '/api/company/accept-invite', {
        token,
        company_id: selectedCompanyId
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to accept invitation');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Invitation Accepted!',
        description: 'You can now manage this venue through your company console.'
      });
      
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['accessible-businesses'] });
      queryClient.invalidateQueries({ queryKey: ['companies', user?.id] });
      
      // Navigate to company console
      navigate(`/company/${selectedCompanyId}/console`);
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  const handleAcceptInvite = () => {
    if (!selectedCompanyId) {
      toast({
        title: 'Error',
        description: 'Please select a company to accept the invitation for',
        variant: 'destructive'
      });
      return;
    }
    
    acceptInviteMutation.mutate();
  };

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
                  You need to be logged in to accept company invitations.
                </p>
                <Button onClick={() => navigate('/auth/signin')} data-testid="signin-button">
                  Sign In
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!token) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900">
        <Navbar />
        <div className="container mx-auto px-4 py-20">
          <div className="max-w-md mx-auto">
            <Card>
              <CardContent className="p-6 text-center">
                <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <h1 className="text-2xl font-bold mb-4">Invalid Invitation</h1>
                <p className="text-neutral-600 dark:text-neutral-400 mb-4">
                  This invitation link is invalid or has expired.
                </p>
                <Button onClick={() => navigate('/dashboard')} data-testid="back-to-dashboard">
                  Go to Dashboard
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (loadingInvite || loadingCompanies) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900">
        <Navbar />
        <div className="container mx-auto px-4 py-20">
          <div className="max-w-md mx-auto">
            <Card>
              <CardContent className="p-6 text-center">
                <Clock className="h-12 w-12 text-blue-500 mx-auto mb-4" />
                <h1 className="text-2xl font-bold mb-4">Loading Invitation...</h1>
                <p className="text-neutral-600 dark:text-neutral-400">
                  Please wait while we verify your invitation.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (inviteError || !invite?.data) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900">
        <Navbar />
        <div className="container mx-auto px-4 py-20">
          <div className="max-w-md mx-auto">
            <Card>
              <CardContent className="p-6 text-center">
                <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <h1 className="text-2xl font-bold mb-4">Invitation Not Found</h1>
                <p className="text-neutral-600 dark:text-neutral-400 mb-4">
                  This invitation may have expired, been revoked, or you may not have permission to view it.
                </p>
                <Button onClick={() => navigate('/dashboard')} data-testid="back-to-dashboard">
                  Go to Dashboard
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const userCompanies = companies?.data || [];
  // Filter to companies where user is owner or admin (for now, we'll assume all returned companies are valid)
  const ownerOrAdminCompanies = userCompanies.filter((company: any) => company.ownerUserId === user.id);

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900">
      <Navbar />
      <div className="container mx-auto px-4 py-20">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-blue-100 rounded-full">
                <Building2 className="h-8 w-8 text-blue-600" />
              </div>
            </div>
            <h1 className="text-3xl font-bold tracking-tight mb-2" data-testid="page-title">
              Venue Management Invitation
            </h1>
            <p className="text-neutral-600 dark:text-neutral-400">
              You've been invited to manage a venue on Chef Pantry
            </p>
          </div>

          {/* Invitation Details */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Invitation Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                  Role
                </Label>
                <p className="text-lg capitalize">{invite.data.role}</p>
              </div>
              
              <div>
                <Label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                  Invited to manage
                </Label>
                <p className="text-lg">Business ID: {invite.data.businessId}</p>
              </div>
              
              <div>
                <Label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                  Invitation expires
                </Label>
                <p className="text-lg">
                  {new Date(invite.data.expiresAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
              
              <div>
                <Label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                  Status
                </Label>
                <p className="text-lg capitalize font-medium text-green-600">{invite.data.status}</p>
              </div>
            </CardContent>
          </Card>

          {/* Company Selection */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Select Company</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {ownerOrAdminCompanies.length > 0 ? (
                <div>
                  <Label htmlFor="company-select" className="text-sm font-medium">
                    Choose which company will manage this venue
                  </Label>
                  <Select 
                    value={selectedCompanyId} 
                    onValueChange={setSelectedCompanyId}
                    data-testid="company-select"
                  >
                    <SelectTrigger className="mt-2">
                      <SelectValue placeholder="Select a company..." />
                    </SelectTrigger>
                    <SelectContent>
                      {ownerOrAdminCompanies.map((company: any) => (
                        <SelectItem key={company.id} value={company.id}>
                          {company.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-neutral-500 mt-1">
                    Only companies where you are the owner are shown
                  </p>
                </div>
              ) : (
                <div className="text-center py-6">
                  <Building2 className="h-12 w-12 text-neutral-300 mx-auto mb-4" />
                  <h3 className="font-medium mb-2">No Companies Found</h3>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4">
                    You need to create a company or be the owner of one to accept this invitation.
                  </p>
                  <Button
                    onClick={() => navigate('/company/create')}
                    data-testid="create-company-button"
                  >
                    Create Company
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          {ownerOrAdminCompanies.length > 0 && (
            <div className="flex gap-3 justify-center">
              <Button
                variant="outline"
                onClick={() => navigate('/dashboard')}
                data-testid="decline-invite-button"
              >
                Decline
              </Button>
              <Button
                onClick={handleAcceptInvite}
                disabled={!selectedCompanyId || acceptInviteMutation.isPending}
                data-testid="accept-invite-button"
              >
                {acceptInviteMutation.isPending ? (
                  'Accepting...'
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Accept Invitation
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}