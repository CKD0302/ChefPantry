import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Building2, CheckCircle, XCircle, Clock, Mail } from "lucide-react";

export default function AcceptInvite() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [searchParams] = useState(() => new URLSearchParams(window.location.search));
  const queryClient = useQueryClient();
  
  const token = searchParams.get("token");
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("");

  // Fetch invite details by token (for specific token-based invites)
  const { data: inviteResponse, isLoading: loadingInvite } = useQuery({
    queryKey: ["business-company-invite", token],
    queryFn: async () => {
      if (!token) throw new Error("No invite token provided");
      const response = await apiRequest("GET", `/api/company/invite/${token}`);
      if (!response.ok) throw new Error("Failed to fetch invite");
      return response.json();
    },
    enabled: !!token,
  });

  // Fetch pending invites for current user (when no token provided)
  const { data: pendingInvitesResponse, isLoading: loadingPendingInvites } = useQuery({
    queryKey: ["pending-invites", user?.id],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/company/invites/pending");
      if (!response.ok) throw new Error("Failed to fetch pending invites");
      return response.json();
    },
    enabled: !!user?.id && !token, // Only fetch when no specific token
  });

  // Fetch user's companies for selection
  const { data: userCompanies, isLoading: loadingCompanies } = useQuery({
    queryKey: ["/api/company/mine", user?.id],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/company/mine");
      return response.json();
    },
    enabled: !!user?.id,
  });

  // Accept invite mutation (for specific token-based invites)
  const acceptInviteMutation = useMutation({
    mutationFn: async () => {
      if (!token) throw new Error("No invite token");
      const response = await apiRequest("POST", "/api/company/accept-invite", {
        token,
        companyId: selectedCompanyId || undefined,
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Invite Accepted",
        description: "You have successfully accepted the venue management invitation.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/company/mine"] });
      queryClient.invalidateQueries({ queryKey: ["pending-invites"] });
      navigate("/dashboard");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to accept invite. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Accept invite from pending list mutation
  const acceptPendingInviteMutation = useMutation({
    mutationFn: async ({ inviteToken, companyId }: { inviteToken: string; companyId?: string }) => {
      const response = await apiRequest("POST", "/api/company/accept-invite", {
        token: inviteToken,
        companyId: companyId || undefined,
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Invite Accepted",
        description: "You have successfully accepted the venue management invitation.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/company/mine"] });
      queryClient.invalidateQueries({ queryKey: ["pending-invites"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to accept invite. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleAcceptInvite = () => {
    acceptInviteMutation.mutate();
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-neutral-100 flex flex-col">
        <Navbar />
        <main className="flex-grow container mx-auto px-4 py-8 mt-16">
          <div className="bg-white shadow-sm rounded-lg p-6 text-center">
            <h1 className="text-2xl font-bold mb-4">Sign In Required</h1>
            <p className="text-neutral-600 mb-4">
              You need to be logged in to accept this invitation.
            </p>
            <Button onClick={() => navigate("/auth/signin")}>Sign In</Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Show pending invites list when no token provided
  if (!token) {
    return (
      <div className="min-h-screen bg-neutral-100 flex flex-col">
        <Navbar />
        <main className="flex-grow container mx-auto px-4 py-8 mt-16">
          <div className="max-w-4xl mx-auto">
            <div className="mb-6">
              <h1 className="text-2xl font-bold mb-2">Pending Invitations</h1>
              <p className="text-neutral-600">
                These are venue management invitations that are waiting for your response.
              </p>
            </div>

            {loadingPendingInvites ? (
              <div className="text-center py-8">
                <Clock className="h-12 w-12 text-neutral-300 mx-auto mb-4" />
                <p className="text-neutral-600">Loading invitations...</p>
              </div>
            ) : pendingInvitesResponse?.data?.length > 0 ? (
              <div className="space-y-4">
                {pendingInvitesResponse.data.map((invite: any) => (
                  <Card key={invite.id} data-testid={`pending-invite-${invite.id}`}>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Building2 className="h-5 w-5" />
                        {invite.businessName}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="grid md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="font-medium">Location:</span> {invite.businessLocation}
                          </div>
                          <div>
                            <span className="font-medium">Role:</span>{" "}
                            <Badge variant="secondary">{invite.role}</Badge>
                          </div>
                          <div>
                            <span className="font-medium">Invited:</span>{" "}
                            {new Date(invite.createdAt).toLocaleDateString()}
                          </div>
                          <div>
                            <span className="font-medium">Expires:</span>{" "}
                            {new Date(invite.expiresAt).toLocaleDateString()}
                          </div>
                        </div>

                        {/* Company selection if user has multiple companies */}
                        {userCompanies?.data?.length > 1 && (
                          <div className="pt-2">
                            <label className="text-sm font-medium">
                              Select company to manage this venue:
                            </label>
                            <Select onValueChange={(value) => setSelectedCompanyId(value)}>
                              <SelectTrigger className="mt-1">
                                <SelectValue placeholder="Choose your company" />
                              </SelectTrigger>
                              <SelectContent>
                                {userCompanies.data.map((company: any) => (
                                  <SelectItem key={company.id} value={company.id}>
                                    {company.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        )}

                        <div className="flex gap-2 pt-2">
                          <Button
                            onClick={() => acceptPendingInviteMutation.mutate({
                              inviteToken: invite.token,
                              companyId: userCompanies?.data?.length > 1 ? selectedCompanyId : undefined
                            })}
                            disabled={acceptPendingInviteMutation.isPending || (userCompanies?.data?.length > 1 && !selectedCompanyId)}
                            data-testid={`accept-invite-${invite.id}`}
                          >
                            {acceptPendingInviteMutation.isPending ? "Accepting..." : "Accept Invitation"}
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => navigate("/dashboard")}
                            data-testid="back-to-dashboard"
                          >
                            Back to Dashboard
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="text-center py-8">
                  <Mail className="h-12 w-12 text-neutral-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Pending Invitations</h3>
                  <p className="text-neutral-600 mb-4">
                    You don't have any pending venue management invitations.
                  </p>
                  <Button onClick={() => navigate("/dashboard")} data-testid="back-to-dashboard">
                    Back to Dashboard
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (loadingInvite || loadingCompanies) {
    return (
      <div className="min-h-screen bg-neutral-100 flex flex-col">
        <Navbar />
        <main className="flex-grow container mx-auto px-4 py-8 mt-16">
          <div className="max-w-md mx-auto text-center">
            <div className="animate-pulse">
              <div className="h-8 bg-neutral-200 rounded mb-4"></div>
              <div className="h-32 bg-neutral-200 rounded"></div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const invite = inviteResponse?.data;
  const companies = userCompanies?.data || [];
  const eligibleCompanies = companies.filter((company: any) => 
    company.members?.some((member: any) => 
      member.userId === user.id && ["owner", "admin"].includes(member.role)
    )
  );

  if (!invite) {
    return (
      <div className="min-h-screen bg-neutral-100 flex flex-col">
        <Navbar />
        <main className="flex-grow container mx-auto px-4 py-8 mt-16">
          <Card className="max-w-md mx-auto">
            <CardContent className="text-center pt-6">
              <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Invitation Not Found</h2>
              <p className="text-neutral-600 mb-4">
                This invitation link is invalid or has expired.
              </p>
              <Button onClick={() => navigate("/dashboard")}>
                Go to Dashboard
              </Button>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  if (invite.status !== "pending") {
    return (
      <div className="min-h-screen bg-neutral-100 flex flex-col">
        <Navbar />
        <main className="flex-grow container mx-auto px-4 py-8 mt-16">
          <Card className="max-w-md mx-auto">
            <CardContent className="text-center pt-6">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Already Processed</h2>
              <p className="text-neutral-600 mb-4">
                This invitation has already been {invite.status}.
              </p>
              <Button onClick={() => navigate("/dashboard")}>
                Go to Dashboard
              </Button>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  if (new Date() > new Date(invite.expiresAt)) {
    return (
      <div className="min-h-screen bg-neutral-100 flex flex-col">
        <Navbar />
        <main className="flex-grow container mx-auto px-4 py-8 mt-16">
          <Card className="max-w-md mx-auto">
            <CardContent className="text-center pt-6">
              <Clock className="h-12 w-12 text-orange-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Invitation Expired</h2>
              <p className="text-neutral-600 mb-4">
                This invitation has expired. Please contact the business to request a new invitation.
              </p>
              <Button onClick={() => navigate("/dashboard")}>
                Go to Dashboard
              </Button>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  if (eligibleCompanies.length === 0) {
    return (
      <div className="min-h-screen bg-neutral-100 flex flex-col">
        <Navbar />
        <main className="flex-grow container mx-auto px-4 py-8 mt-16">
          <Card className="max-w-md mx-auto">
            <CardContent className="text-center pt-6">
              <Building2 className="h-12 w-12 text-blue-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">No Eligible Companies</h2>
              <p className="text-neutral-600 mb-4">
                You need to be an owner or admin of a company to accept this invitation.
              </p>
              <div className="space-y-2">
                <Button onClick={() => navigate("/company/create")} className="w-full">
                  Create Company
                </Button>
                <Button variant="outline" onClick={() => navigate("/dashboard")} className="w-full">
                  Go to Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-100 flex flex-col">
      <Navbar />
      <main className="flex-grow container mx-auto px-4 py-8 mt-16">
        <div className="max-w-2xl mx-auto">
          <div className="mb-6 text-center">
            <Mail className="h-12 w-12 text-blue-600 mx-auto mb-4" />
            <h1 className="text-3xl font-bold tracking-tight">Company Management Invitation</h1>
            <p className="text-neutral-600 mt-2">
              You've been invited to manage a venue
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Invitation Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-neutral-500">Invited Email</p>
                  <p className="font-medium">{invite.inviteeEmail}</p>
                </div>
                <div>
                  <p className="text-sm text-neutral-500">Role</p>
                  <Badge variant="secondary">{invite.role}</Badge>
                </div>
                <div>
                  <p className="text-sm text-neutral-500">Expires</p>
                  <p className="font-medium">
                    {new Date(invite.expiresAt).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-neutral-500">Business ID</p>
                  <p className="font-medium text-sm">{invite.businessId}</p>
                </div>
              </div>

              {eligibleCompanies.length > 1 && (
                <div>
                  <label className="text-sm font-medium">
                    Select Company *
                  </label>
                  <Select
                    value={selectedCompanyId}
                    onValueChange={setSelectedCompanyId}
                  >
                    <SelectTrigger className="mt-1" data-testid="select-company">
                      <SelectValue placeholder="Choose which company will manage this venue" />
                    </SelectTrigger>
                    <SelectContent>
                      {eligibleCompanies.map((company: any) => (
                        <SelectItem key={company.id} value={company.id}>
                          {company.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-neutral-500 mt-1">
                    This venue will be managed by the selected company
                  </p>
                </div>
              )}

              <div className="flex gap-4 pt-4">
                <Button
                  variant="outline"
                  onClick={() => navigate("/dashboard")}
                  className="flex-1"
                  data-testid="button-decline"
                >
                  Decline
                </Button>
                <Button
                  onClick={handleAcceptInvite}
                  disabled={
                    acceptInviteMutation.isPending || 
                    (eligibleCompanies.length > 1 && !selectedCompanyId)
                  }
                  className="flex-1"
                  data-testid="button-accept"
                >
                  {acceptInviteMutation.isPending ? "Accepting..." : "Accept Invitation"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}