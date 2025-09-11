import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useToast } from '@/hooks/use-toast';
import { Building2, Users, Shield } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export default function CreateCompany() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [companyName, setCompanyName] = useState('');

  // Create company mutation
  const createCompanyMutation = useMutation({
    mutationFn: async (name: string) => {
      const response = await apiRequest('POST', '/api/company/create', {
        name,
        userId: user?.id
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create company');
      }
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: 'Company Created',
        description: `${data.data.name} has been created successfully!`
      });
      
      // Invalidate companies query
      queryClient.invalidateQueries({ queryKey: ['companies', user?.id] });
      
      // Navigate to company console
      navigate(`/company/${data.data.id}/console`);
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!companyName.trim()) {
      toast({
        title: 'Error',
        description: 'Company name is required',
        variant: 'destructive'
      });
      return;
    }

    if (!user?.id) {
      toast({
        title: 'Error',
        description: 'You must be logged in to create a company',
        variant: 'destructive'
      });
      return;
    }

    createCompanyMutation.mutate(companyName.trim());
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
                  You need to be logged in to create a company.
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
              Create Your Company
            </h1>
            <p className="text-neutral-600 dark:text-neutral-400">
              Set up your company to manage multiple venues and collaborate with your team
            </p>
          </div>

          {/* Benefits */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardContent className="p-6 text-center">
                <Building2 className="h-8 w-8 text-blue-600 mx-auto mb-3" />
                <h3 className="font-semibold mb-2">Multi-Venue Management</h3>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  Manage multiple venues from a single company account
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6 text-center">
                <Users className="h-8 w-8 text-green-600 mx-auto mb-3" />
                <h3 className="font-semibold mb-2">Team Collaboration</h3>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  Invite team members with different permission levels
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6 text-center">
                <Shield className="h-8 w-8 text-purple-600 mx-auto mb-3" />
                <h3 className="font-semibold mb-2">Role-Based Access</h3>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  Control who can access what with flexible role management
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Create Company Form */}
          <Card>
            <CardHeader>
              <CardTitle>Company Information</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <Label htmlFor="companyName" className="text-base font-medium">
                    Company Name *
                  </Label>
                  <Input
                    id="companyName"
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="Enter your company name"
                    className="mt-2"
                    data-testid="company-name-input"
                    required
                  />
                  <p className="text-sm text-neutral-500 mt-1">
                    This will be visible to venues when you receive invitations
                  </p>
                </div>

                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                  <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                    What happens next?
                  </h4>
                  <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                    <li>• You'll become the company owner with full permissions</li>
                    <li>• You can invite team members and assign roles</li>
                    <li>• Venues can invite your company to manage their operations</li>
                    <li>• You'll have access to a centralized management console</li>
                  </ul>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate('/dashboard')}
                    data-testid="cancel-button"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={createCompanyMutation.isPending || !companyName.trim()}
                    data-testid="create-company-button"
                  >
                    {createCompanyMutation.isPending ? 'Creating...' : 'Create Company'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
      <Footer />
    </div>
  );
}