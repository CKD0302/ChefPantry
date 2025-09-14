import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useLocation, useRoute } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Building2, ArrowLeft, Users, Plus, Trash2 } from "lucide-react";
import { CompanyMember } from "@shared/schema";

export default function CompanyMembers() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [match, params] = useRoute("/company/:id/members");
  const queryClient = useQueryClient();
  const companyId = params?.id;

  // Fetch company details
  const { data: company, isLoading: loadingCompany } = useQuery({
    queryKey: ["company", companyId],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/company/${companyId}`);
      if (!response.ok) throw new Error("Failed to fetch company");
      return response.json();
    },
    enabled: !!companyId && !!user?.id,
  });

  // Fetch company members
  const { data: membersResponse, isLoading: loadingMembers } = useQuery({
    queryKey: ["company-members", companyId],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/company/${companyId}/members`);
      if (!response.ok) throw new Error("Failed to fetch members");
      return response.json();
    },
    enabled: !!companyId && !!user?.id,
  });

  // Remove member mutation
  const removeMemberMutation = useMutation({
    mutationFn: async (userId: string) => {
      const response = await apiRequest("DELETE", `/api/company/${companyId}/members/${userId}`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Member Removed",
        description: "The team member has been removed from the company.",
      });
      queryClient.invalidateQueries({ queryKey: ["company-members", companyId] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to remove member. Please try again.",
        variant: "destructive",
      });
    },
  });

  if (!user) {
    return (
      <div className="min-h-screen bg-neutral-100 flex flex-col">
        <Navbar />
        <main className="flex-grow container mx-auto px-4 py-8 mt-16">
          <div className="bg-white shadow-sm rounded-lg p-6 text-center">
            <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
            <p className="text-neutral-600 mb-4">You need to be logged in to view this page.</p>
            <Button onClick={() => navigate("/auth/signin")}>Sign In</Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!match || !companyId) {
    return (
      <div className="min-h-screen bg-neutral-100 flex flex-col">
        <Navbar />
        <main className="flex-grow container mx-auto px-4 py-8 mt-16">
          <div className="bg-white shadow-sm rounded-lg p-6 text-center">
            <h1 className="text-2xl font-bold mb-4">Invalid Company</h1>
            <p className="text-neutral-600 mb-4">The company ID is invalid.</p>
            <Button onClick={() => navigate("/dashboard")}>Back to Dashboard</Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (loadingCompany || loadingMembers) {
    return (
      <div className="min-h-screen bg-neutral-100 flex flex-col">
        <Navbar />
        <main className="flex-grow container mx-auto px-4 py-8 mt-16">
          <div className="animate-pulse">
            <div className="h-8 bg-neutral-200 rounded mb-6"></div>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 bg-neutral-200 rounded"></div>
              ))}
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const members = membersResponse?.data || [];
  const userMembership = members.find((member: CompanyMember) => member.userId === user.id);
  const canManageMembers = userMembership && ["owner", "admin"].includes(userMembership.role);

  return (
    <div className="min-h-screen bg-neutral-100 flex flex-col">
      <Navbar />
      <main className="flex-grow container mx-auto px-4 py-8 mt-16">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <Button
              variant="ghost"
              onClick={() => navigate("/dashboard")}
              className="mb-4"
              data-testid="button-back"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Building2 className="h-8 w-8 text-blue-600" />
                <div>
                  <h1 className="text-3xl font-bold tracking-tight">Team Members</h1>
                  <p className="text-neutral-600">
                    {company?.data?.name} - Manage your team members and roles
                  </p>
                </div>
              </div>
              {canManageMembers && (
                <Button className="gap-2" data-testid="button-invite-member">
                  <Plus className="h-4 w-4" />
                  Invite Member
                </Button>
              )}
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Team Members ({members.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {members.length > 0 ? (
                <div className="space-y-4">
                  {members.map((member: CompanyMember) => (
                    <div
                      key={member.userId}
                      className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg"
                      data-testid={`member-${member.userId}`}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <Users className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <h4 className="font-medium">{member.userId}</h4>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant={
                              member.role === "owner" ? "default" : 
                              member.role === "admin" ? "secondary" : "outline"
                            }>
                              {member.role}
                            </Badge>
                            <span className="text-sm text-neutral-500">
                              Joined {new Date(member.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      {canManageMembers && member.role !== "owner" && member.userId !== user.id && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeMemberMutation.mutate(member.userId)}
                          disabled={removeMemberMutation.isPending}
                          data-testid={`remove-member-${member.userId}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-neutral-300 mx-auto mb-4" />
                  <p className="text-neutral-600">No team members yet</p>
                  <p className="text-sm text-neutral-500 mt-1">
                    Invite team members to help manage your company
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {!canManageMembers && (
            <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-amber-800 text-sm">
                <strong>Note:</strong> You need owner or admin permissions to manage team members.
              </p>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}