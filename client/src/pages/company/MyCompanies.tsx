import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "wouter";
import { Building2, Users, MapPin, Calendar, Plus } from "lucide-react";
import { format } from "date-fns";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function MyCompanies() {
  const { user } = useAuth();
  const [, navigate] = useLocation();

  // Fetch user's companies (where they are owner or member)
  const { data: companies, isLoading, error } = useQuery({
    queryKey: ["/api/company/mine", user?.id],
    enabled: !!user,
  }) as { data: { data?: any[] } | undefined, isLoading: boolean, error: any };

  // If not authenticated, show unauthorized message
  if (!user) {
    return (
      <div className="min-h-screen bg-neutral-100 flex flex-col">
        <Navbar />
        <main className="flex-grow container mx-auto px-4 py-8 mt-16">
          <div className="bg-white shadow-sm rounded-lg p-6 text-center" data-testid="access-denied">
            <h1 className="text-2xl font-bold mb-4" data-testid="page-title">Access Denied</h1>
            <p className="text-neutral-600 mb-4">You need to be logged in to access this page.</p>
            <Button onClick={() => navigate("/auth/signin")} data-testid="signin-button">
              Sign In
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-100 flex flex-col">
      <Navbar />
      <main className="flex-grow container mx-auto px-4 py-8 mt-16">
        <div className="bg-white shadow-sm rounded-lg p-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
            <div>
              <h1 className="text-2xl font-bold text-neutral-900" data-testid="page-title">My Companies</h1>
              <p className="text-neutral-600">Manage your companies and linked venues</p>
            </div>
            <Button 
              className="bg-primary hover:bg-primary-dark text-white mt-4 md:mt-0"
              onClick={() => navigate("/company/create")}
              data-testid="create-company-button"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Company
            </Button>
          </div>

          {isLoading ? (
            <div className="text-center py-8">
              <p className="text-neutral-600">Loading your companies...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-red-600">Failed to load companies. Please try again.</p>
            </div>
          ) : companies?.data && companies.data.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {companies.data.map((company: any) => (
                <Card key={company.id} className="hover:shadow-lg transition-shadow" data-testid={`company-card-${company.id}`}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Building2 className="h-5 w-5 text-blue-600" />
                      {company.name}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {company.role === 'owner' ? 'Owner' : 
                         company.role === 'admin' ? 'Admin' : 
                         company.role === 'finance' ? 'Finance' : 'Viewer'}
                      </Badge>
                      <span className="text-xs text-neutral-500">
                        <Calendar className="h-3 w-3 inline mr-1" />
                        Created {format(new Date(company.createdAt), 'MMM d, yyyy')}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm text-neutral-600">
                        <Users className="h-4 w-4" />
                        <span>{company.memberCount || 0} member{company.memberCount !== 1 ? 's' : ''}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-neutral-600">
                        <MapPin className="h-4 w-4" />
                        <span>{company.linkedVenues || 0} linked venue{company.linkedVenues !== 1 ? 's' : ''}</span>
                      </div>
                      <div className="pt-3">
                        <Button 
                          variant="outline" 
                          className="w-full"
                          onClick={() => navigate(`/company/${company.id}/console`)}
                          data-testid={`manage-company-${company.id}`}
                        >
                          Manage Company
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Building2 className="h-16 w-16 text-neutral-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-neutral-900 mb-2">No Companies Yet</h3>
              <p className="text-neutral-600 mb-6">Create your first company to start managing multiple venues</p>
              <Button 
                className="bg-primary hover:bg-primary-dark text-white"
                onClick={() => navigate("/company/create")}
                data-testid="create-first-company"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Company
              </Button>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}