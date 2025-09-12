import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useLocation } from 'wouter';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Settings, ArrowLeft, Save } from 'lucide-react';
import { apiRequest, queryClient } from '@/lib/queryClient';

interface CompanySettingsProps {
  companyId: string;
}

export default function CompanySettings({ companyId }: CompanySettingsProps) {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [companyName, setCompanyName] = useState('');
  const [taxCode, setTaxCode] = useState('');
  const [companyNumber, setCompanyNumber] = useState('');

  // Fetch company details
  const { data: company, isLoading } = useQuery({
    queryKey: ['company', companyId],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/company/${companyId}`);
      if (!response.ok) throw new Error('Failed to fetch company');
      return response.json();
    },
    enabled: !!user?.id
  });

  // Set initial company data when data loads
  useEffect(() => {
    if (company?.data) {
      setCompanyName(company.data.name || '');
      setTaxCode(company.data.taxCode || '');
      setCompanyNumber(company.data.companyNumber || '');
    }
  }, [company]);

  // Update company mutation
  const updateCompanyMutation = useMutation({
    mutationFn: async (data: { name: string; taxCode?: string; companyNumber?: string }) => {
      const response = await apiRequest('PUT', `/api/company/${companyId}`, data);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to update company');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Company settings updated successfully",
      });
      // Invalidate company queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['company', companyId] });
      queryClient.invalidateQueries({ queryKey: ['company-mine'] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update company settings. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    if (!companyName.trim()) {
      toast({
        title: "Validation Error",
        description: "Company name is required",
        variant: "destructive",
      });
      return;
    }

    updateCompanyMutation.mutate({ 
      name: companyName.trim(),
      taxCode: taxCode.trim() || undefined,
      companyNumber: companyNumber.trim() || undefined
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
                  You need to be logged in to access company settings.
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900">
        <Navbar />
        <div className="container mx-auto px-4 py-20">
          <div className="max-w-2xl mx-auto">
            <div className="animate-pulse">
              <div className="h-8 bg-neutral-200 dark:bg-neutral-800 rounded mb-6"></div>
              <div className="h-64 bg-neutral-200 dark:bg-neutral-800 rounded"></div>
            </div>
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
          <div className="mb-8">
            <Button 
              variant="ghost" 
              onClick={() => navigate(`/company/${companyId}/console`)}
              className="mb-4"
              data-testid="button-back"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Profile
            </Button>
            
            <div className="flex items-center gap-3 mb-2">
              <Settings className="h-8 w-8 text-blue-600" />
              <h1 className="text-3xl font-bold tracking-tight">Company Settings</h1>
            </div>
            <p className="text-neutral-600 dark:text-neutral-400">
              Update your company information and settings
            </p>
          </div>

          {/* Settings Form */}
          <Card>
            <CardHeader>
              <CardTitle>Company Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="company-name">Company Name</Label>
                <Input
                  id="company-name"
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Enter company name"
                  data-testid="input-company-name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tax-code">Tax Code (Optional)</Label>
                <Input
                  id="tax-code"
                  type="text"
                  value={taxCode}
                  onChange={(e) => setTaxCode(e.target.value)}
                  placeholder="Enter tax code (e.g., GB123456789)"
                  data-testid="input-tax-code"
                />
                <p className="text-sm text-neutral-500">
                  Company tax code for identification purposes
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="company-number">Company Number (Optional)</Label>
                <Input
                  id="company-number"
                  type="text"
                  value={companyNumber}
                  onChange={(e) => setCompanyNumber(e.target.value)}
                  placeholder="Enter company registration number"
                  data-testid="input-company-number"
                />
                <p className="text-sm text-neutral-500">
                  Official company registration number
                </p>
              </div>

              <div className="space-y-2">
                <Label>Company ID</Label>
                <Input
                  type="text"
                  value={companyId}
                  disabled
                  className="bg-neutral-100 dark:bg-neutral-800"
                />
                <p className="text-sm text-neutral-500">
                  Company ID cannot be changed
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  onClick={handleSave}
                  disabled={updateCompanyMutation.isPending}
                  data-testid="button-save-settings"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {updateCompanyMutation.isPending ? 'Saving...' : 'Save Changes'}
                </Button>
                
                <Button 
                  variant="outline"
                  onClick={() => navigate(`/company/${companyId}/console`)}
                  data-testid="button-cancel"
                >
                  Cancel
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