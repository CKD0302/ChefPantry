import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useLocation } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useToast } from '@/hooks/use-toast';
import { Building2, Mail, Users, CheckCircle, Clock, X, Plus } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

interface CompanyAccessProps {
  businessId: string;
}

export default function CompanyAccess({ businessId }: CompanyAccessProps) {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [isInviteFormOpen, setIsInviteFormOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('manager');

  // Fetch business profile to ensure user owns this business
  const { data: businessProfile, isLoading: loadingProfile } = useQuery({
    queryKey: ['business-profile', businessId],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/business-profiles/${businessId}`);
      if (!response.ok) throw new Error('Failed to fetch business profile');
      return response.json();
    },
    enabled: !!user?.id && !!businessId
  });

  // Fetch existing invites for this business
  const { data: invites, isLoading: loadingInvites } = useQuery({
    queryKey: ['business-company-invites', businessId],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/company/invites/business/${businessId}`);
      if (!response.ok) throw new Error('Failed to fetch invites');
      return response.json();
    },
    enabled: !!user?.id && !!businessId
  });

  // Send company invitation mutation
  const sendInviteMutation = useMutation({
    mutationFn: async (inviteData: { email: string; role: string }) => {
      const response = await apiRequest('POST', '/api/company/invite-company', {
        business_id: businessId,
        invitee_email: inviteData.email,
        role: inviteData.role,
        created_by: user?.id
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to send invitation');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Invitation Sent!',
        description: 'The company has been invited to manage your venue.'
      });
      
      // Reset form
      setInviteEmail('');
      setInviteRole('manager');
      setIsInviteFormOpen(false);
      
      // Refresh invites
      queryClient.invalidateQueries({ queryKey: ['business-company-invites', businessId] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  const handleSendInvite = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inviteEmail.trim()) {
      toast({
        title: 'Error',
        description: 'Email address is required',
        variant: 'destructive'
      });
      return;
    }
    
    if (!inviteRole) {
      toast({
        title: 'Error',
        description: 'Please select a role',
        variant: 'destructive'
      });
      return;
    }
    
    sendInviteMutation.mutate({
      email: inviteEmail.trim(),
      role: inviteRole
    });
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
                  You need to be logged in to manage company access.
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

  if (loadingProfile) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900">
        <Navbar />
        <div className="container mx-auto px-4 py-20">
          <div className="max-w-6xl mx-auto">
            <div className="animate-pulse">
              <div className="h-8 bg-neutral-200 dark:bg-neutral-800 rounded mb-6"></div>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="h-64 bg-neutral-200 dark:bg-neutral-800 rounded"></div>
                <div className="h-64 bg-neutral-200 dark:bg-neutral-800 rounded"></div>
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // Check if user owns this business
  const isBusinessOwner = businessProfile?.data?.id === user.id;

  if (!isBusinessOwner) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900">
        <Navbar />
        <div className="container mx-auto px-4 py-20">
          <div className="max-w-md mx-auto">
            <Card>
              <CardContent className="p-6 text-center">
                <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
                <p className="text-neutral-600 dark:text-neutral-400 mb-4">
                  You can only manage company access for your own business.
                </p>
                <Button onClick={() => navigate('/dashboard')}>Go to Dashboard</Button>
              </CardContent>
            </Card>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const businessInvites = invites?.data || [];

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900">
      <Navbar />
      <div className="container mx-auto px-4 py-20">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <Building2 className="h-8 w-8 text-blue-600" />
                  <h1 className="text-3xl font-bold tracking-tight" data-testid="page-title">
                    Company Access Management
                  </h1>
                </div>
                <p className="text-neutral-600 dark:text-neutral-400">
                  Invite companies to manage your venue operations and staff
                </p>
              </div>
              
              <Button
                onClick={() => setIsInviteFormOpen(true)}
                data-testid="invite-company-button"
              >
                <Plus className="h-4 w-4 mr-2" />
                Invite Company
              </Button>
            </div>
          </div>

          {/* Info Alert */}
          <Alert className="mb-6">
            <Building2 className="h-4 w-4" />
            <AlertDescription>
              Company management allows professional service companies to handle venue operations, 
              including gig bookings, staff management, and invoice processing on your behalf.
            </AlertDescription>
          </Alert>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Invite Form */}
            {isInviteFormOpen && (
              <Card className="lg:col-span-2">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Send Company Invitation</CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsInviteFormOpen(false)}
                    data-testid="close-invite-form"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSendInvite} className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="invite-email" className="text-base font-medium">
                          Company Email Address *
                        </Label>
                        <Input
                          id="invite-email"
                          type="email"
                          value={inviteEmail}
                          onChange={(e) => setInviteEmail(e.target.value)}
                          placeholder="company@example.com"
                          className="mt-2"
                          data-testid="invite-email-input"
                          required
                        />
                        <p className="text-sm text-neutral-500 mt-1">
                          Email address of the company representative
                        </p>
                      </div>
                      
                      <div>
                        <Label htmlFor="invite-role" className="text-base font-medium">
                          Access Level *
                        </Label>
                        <Select 
                          value={inviteRole} 
                          onValueChange={setInviteRole}
                          data-testid="invite-role-select"
                        >
                          <SelectTrigger className="mt-2">
                            <SelectValue placeholder="Select access level..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="manager">Manager - Full venue operations</SelectItem>
                            <SelectItem value="staff">Staff - Limited operations</SelectItem>
                          </SelectContent>
                        </Select>
                        <p className="text-sm text-neutral-500 mt-1">
                          Determines what the company can manage
                        </p>
                      </div>
                    </div>

                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                      <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                        What happens next?
                      </h4>
                      <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                        <li>• The company will receive an email invitation</li>
                        <li>• They must accept using their existing company account</li>
                        <li>• Once accepted, they can manage your venue through their console</li>
                        <li>• You can revoke access at any time</li>
                      </ul>
                    </div>

                    <div className="flex gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsInviteFormOpen(false)}
                        data-testid="cancel-invite-button"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={sendInviteMutation.isPending || !inviteEmail.trim()}
                        data-testid="send-invite-button"
                      >
                        {sendInviteMutation.isPending ? 'Sending...' : 'Send Invitation'}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}

            {/* Existing Invitations */}
            <Card className={isInviteFormOpen ? "lg:col-span-2" : ""}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Company Invitations
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loadingInvites ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-16 bg-neutral-100 dark:bg-neutral-800 rounded animate-pulse"></div>
                    ))}
                  </div>
                ) : businessInvites.length > 0 ? (
                  <div className="space-y-3">
                    {businessInvites.map((invite: any) => (
                      <div
                        key={invite.id}
                        className="flex items-center justify-between p-4 bg-neutral-50 dark:bg-neutral-800 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-full ${
                            invite.status === 'pending' ? 'bg-orange-100' :
                            invite.status === 'accepted' ? 'bg-green-100' :
                            'bg-red-100'
                          }`}>
                            {invite.status === 'pending' && <Clock className="h-4 w-4 text-orange-600" />}
                            {invite.status === 'accepted' && <CheckCircle className="h-4 w-4 text-green-600" />}
                            {invite.status === 'expired' && <X className="h-4 w-4 text-red-600" />}
                          </div>
                          
                          <div>
                            <h4 className="font-medium">{invite.inviteeEmail}</h4>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="secondary" className="text-xs">
                                {invite.role}
                              </Badge>
                              <Badge 
                                variant={
                                  invite.status === 'pending' ? 'default' :
                                  invite.status === 'accepted' ? 'secondary' :
                                  'destructive'
                                }
                                className="text-xs"
                              >
                                {invite.status}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        
                        <div className="text-right text-sm text-neutral-500">
                          <div>Sent {new Date(invite.createdAt).toLocaleDateString()}</div>
                          {invite.status === 'pending' && (
                            <div>Expires {new Date(invite.expiresAt).toLocaleDateString()}</div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Mail className="h-12 w-12 text-neutral-300 mx-auto mb-4" />
                    <p className="text-neutral-600 dark:text-neutral-400">No company invitations sent yet</p>
                    <p className="text-sm text-neutral-500 mt-1">
                      Send your first invitation to get started
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Current Company Access (if any) */}
            {!isInviteFormOpen && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Active Company Access
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 text-neutral-300 mx-auto mb-4" />
                    <p className="text-neutral-600 dark:text-neutral-400">No companies managing this venue</p>
                    <p className="text-sm text-neutral-500 mt-1">
                      Companies with accepted invitations will appear here
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}