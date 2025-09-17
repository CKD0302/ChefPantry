import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Users, Settings, AlertCircle, Mail, UserPlus } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

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
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar />
        <main className="flex-grow container mx-auto px-4 py-8 mt-16" data-testid="loading-companies">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-48 mb-4"></div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-32 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar />
        <main className="flex-grow container mx-auto px-4 py-8 mt-16" data-testid="error-companies">
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
        </main>
        <Footer />
      </div>
    );
  }

  const companyList = (companies as any)?.data || [];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <main className="flex-grow container mx-auto px-4 py-8 mt-16" data-testid="my-companies-page">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900" data-testid="page-title">My Company</h1>
            <p className="text-gray-600 mt-2" data-testid="page-description">Manage your company venues and teams</p>
          </div>
          {companyList.length === 0 && (
            <Link href="/company/create">
              <Button className="flex items-center gap-2" data-testid="create-company-button">
                <Plus className="h-4 w-4" />
                Create Company
              </Button>
            </Link>
          )}
        </div>

        {companyList.length === 0 ? (
          <Card className="text-center py-12" data-testid="empty-companies-state">
            <CardContent>
              <div className="flex flex-col items-center gap-4">
                <div className="rounded-full bg-gray-100 p-6">
                  <Users className="h-12 w-12 text-gray-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900" data-testid="empty-title">No company yet</h3>
                  <p className="text-gray-600 mt-1" data-testid="empty-description">Create your company to start managing venues</p>
                </div>
                <Link href="/company/create">
                  <Button data-testid="create-first-company-button">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your Company
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="max-w-2xl" data-testid="company-details">
            {companyList.map((company: any) => (
              <Card key={company.id} className="w-full" data-testid={`company-card-${company.id}`}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-2xl" data-testid={`company-name-${company.id}`}>{company.name}</CardTitle>
                      <CardDescription className="mt-2" data-testid={`company-description-${company.id}`}>
                        {company.description || "No description provided"}
                      </CardDescription>
                    </div>
                    <Link href={`/company/${company.id}/settings`}>
                      <Button variant="outline" size="sm" className="flex items-center gap-1" data-testid={`edit-company-button-${company.id}`}>
                        <Settings className="h-4 w-4" />
                        Edit Company
                      </Button>
                    </Link>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Link href={`/company/${company.id}/members`}>
                      <Button variant="outline" className="w-full flex items-center justify-center gap-2" data-testid={`members-button-${company.id}`}>
                        <Users className="h-4 w-4" />
                        Manage Team Members
                      </Button>
                    </Link>
                    <Link href={`/company/${company.id}/venues`}>
                      <Button variant="outline" className="w-full flex items-center justify-center gap-2" data-testid={`venues-button-${company.id}`}>
                        <Settings className="h-4 w-4" />
                        Manage Venues
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Company Actions Section */}
        {companyList.length > 0 && (
          <div className="mt-8 max-w-2xl">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Company Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Accept Invites Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="h-5 w-5" />
                    Accept Invites
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-neutral-600 mb-4">
                    Review and accept pending team member invites
                  </p>
                  <Link href="/company/invites/accept">
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      data-testid="accept-invites-button"
                    >
                      <UserPlus className="h-4 w-4 mr-2" />
                      View Invites
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              {/* Company Settings Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Company Settings
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-neutral-600 mb-4">
                    Update company details and preferences
                  </p>
                  {companyList.length > 0 && (
                    <Link href={`/company/${companyList[0].id}/settings`}>
                      <Button
                        variant="outline"
                        className="w-full justify-start"
                        data-testid="company-settings-button"
                      >
                        <Settings className="h-4 w-4 mr-2" />
                        Manage Settings
                      </Button>
                    </Link>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}