import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Users, Settings, AlertCircle } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";

export default function MyCompanies() {
  const { data: companies, isLoading, error } = useQuery({
    queryKey: ["/api/company/mine"]
  });
  
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  // Redirect to sign-in if not authenticated
  useEffect(() => {
    if (!user && !isLoading) {
      setLocation("/auth/signin");
    }
  }, [user, isLoading, setLocation]);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8" data-testid="loading-companies">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-48 mb-4"></div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8" data-testid="error-companies">
        <Card className="text-center py-12">
          <CardContent>
            <div className="flex flex-col items-center gap-4">
              <div className="rounded-full bg-red-100 p-6">
                <AlertCircle className="h-12 w-12 text-red-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Failed to load companies</h3>
                <p className="text-gray-600 mt-1">
                  {(error as any)?.status === 401 || error.message.includes("401")
                    ? "Please sign in to view your companies" 
                    : "There was an error loading your companies. Please try again."}
                </p>
              </div>
              {((error as any)?.status === 401 || error.message.includes("401")) ? (
                <Link href="/auth/signin">
                  <Button data-testid="signin-button">Sign In</Button>
                </Link>
              ) : (
                <Button onClick={() => window.location.reload()} data-testid="retry-button">
                  Try Again
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const companyList = companies?.data || [];

  return (
    <div className="container mx-auto px-4 py-8" data-testid="my-companies-page">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900" data-testid="page-title">My Companies</h1>
          <p className="text-gray-600 mt-2" data-testid="page-description">Manage your company venues and teams</p>
        </div>
        <Link href="/company/create">
          <Button className="flex items-center gap-2" data-testid="create-company-button">
            <Plus className="h-4 w-4" />
            Create Company
          </Button>
        </Link>
      </div>

      {companyList.length === 0 ? (
        <Card className="text-center py-12" data-testid="empty-companies-state">
          <CardContent>
            <div className="flex flex-col items-center gap-4">
              <div className="rounded-full bg-gray-100 p-6">
                <Users className="h-12 w-12 text-gray-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900" data-testid="empty-title">No companies yet</h3>
                <p className="text-gray-600 mt-1" data-testid="empty-description">Create your first company to start managing venues</p>
              </div>
              <Link href="/company/create">
                <Button data-testid="create-first-company-button">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Company
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3" data-testid="companies-grid">
          {companyList.map((company: any) => (
            <Card key={company.id} className="hover:shadow-lg transition-shadow" data-testid={`company-card-${company.id}`}>
              <CardHeader>
                <CardTitle className="text-xl" data-testid={`company-name-${company.id}`}>{company.name}</CardTitle>
                <CardDescription data-testid={`company-description-${company.id}`}>{company.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Link href={`/company/${company.id}/members`}>
                    <Button variant="outline" size="sm" className="flex items-center gap-1" data-testid={`members-button-${company.id}`}>
                      <Users className="h-4 w-4" />
                      Members
                    </Button>
                  </Link>
                  <Link href={`/company/${company.id}/settings`}>
                    <Button variant="outline" size="sm" className="flex items-center gap-1" data-testid={`settings-button-${company.id}`}>
                      <Settings className="h-4 w-4" />
                      Settings
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}