import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Mail, Calendar, UserCheck, AlertTriangle, X, Clock } from "lucide-react";
import { format } from "date-fns";

interface OutboundInvite {
  id: string;
  inviteeEmail: string;
  role: string;
  status: string;
  createdAt: string;
  expiresAt: string;
}

interface OutboundInvitesData {
  business: {
    id: string;
    name: string;
    location: string;
  } | null;
  invites: OutboundInvite[];
}

interface ManageOutboundInvitesProps {
  businessId: string;
  trigger?: React.ReactNode;
}

export default function ManageOutboundInvites({ businessId, trigger }: ManageOutboundInvitesProps) {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: outboundInvites, isLoading } = useQuery<OutboundInvitesData>({
    queryKey: ["outbound-invites", businessId],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/company/invites/outbound/${businessId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch outbound invites");
      }
      return response.json().then(result => result.data);
    },
    enabled: isOpen // Only fetch when modal is open
  });

  const revokeInviteMutation = useMutation({
    mutationFn: async (inviteId: string) => {
      const response = await apiRequest("DELETE", `/api/company/invites/${inviteId}/revoke`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to revoke invite");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Invite Revoked",
        description: "The invitation has been revoked successfully.",
      });
      // Invalidate queries to refresh the list
      queryClient.invalidateQueries({ queryKey: ["outbound-invites", businessId] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleRevokeInvite = (inviteId: string) => {
    if (confirm("Are you sure you want to revoke this invitation? This action cannot be undone.")) {
      revokeInviteMutation.mutate(inviteId);
    }
  };

  const getStatusBadge = (status: string, expiresAt: string) => {
    const isExpired = new Date(expiresAt) < new Date();
    
    if (isExpired && status === "pending") {
      return <Badge variant="secondary" className="gap-1"><Clock className="h-3 w-3" />Expired</Badge>;
    }
    
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="gap-1"><Mail className="h-3 w-3" />Pending</Badge>;
      case "accepted":
        return <Badge variant="default" className="gap-1"><UserCheck className="h-3 w-3" />Accepted</Badge>;
      case "revoked":
        return <Badge variant="destructive" className="gap-1"><X className="h-3 w-3" />Revoked</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getRoleBadge = (role: string) => {
    const roleColors = {
      manager: "bg-blue-100 text-blue-800",
      finance: "bg-green-100 text-green-800", 
      viewer: "bg-gray-100 text-gray-800",
    };
    
    return (
      <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium capitalize ${roleColors[role as keyof typeof roleColors] || 'bg-gray-100 text-gray-800'}`}>
        {role}
      </span>
    );
  };

  const pendingInvites = outboundInvites?.invites?.filter(invite => 
    invite.status === "pending" && new Date(invite.expiresAt) > new Date()
  ) || [];

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" className="gap-2" data-testid="manage-invites-button">
            <Mail className="h-4 w-4" />
            Manage Invites ({pendingInvites.length})
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Manage Company Invitations</DialogTitle>
          <DialogDescription>
            {outboundInvites?.business && (
              <>View and manage invitations sent for <strong>{outboundInvites.business.name}</strong></>
            )}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading invitations...</p>
          </div>
        ) : !outboundInvites?.invites || outboundInvites.invites.length === 0 ? (
          <div className="p-8 text-center">
            <Mail className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Invitations Sent</h3>
            <p className="text-gray-600">You haven't sent any company management invitations yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Summary Stats */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-blue-50 p-3 rounded-lg text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {outboundInvites.invites.filter(invite => 
                    invite.status === "pending" && new Date(invite.expiresAt) > new Date()
                  ).length}
                </div>
                <div className="text-sm text-blue-800">Pending</div>
              </div>
              <div className="bg-green-50 p-3 rounded-lg text-center">
                <div className="text-2xl font-bold text-green-600">
                  {outboundInvites.invites.filter(invite => invite.status === "accepted").length}
                </div>
                <div className="text-sm text-green-800">Accepted</div>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg text-center">
                <div className="text-2xl font-bold text-gray-600">
                  {outboundInvites.invites.filter(invite => 
                    invite.status === "revoked" || (invite.status === "pending" && new Date(invite.expiresAt) < new Date())
                  ).length}
                </div>
                <div className="text-sm text-gray-800">Inactive</div>
              </div>
            </div>

            {/* Invitations List */}
            <div className="space-y-3">
              {outboundInvites.invites.map((invite) => {
                const isExpired = new Date(invite.expiresAt) < new Date();
                const isPending = invite.status === "pending" && !isExpired;
                
                return (
                  <Card key={invite.id} className="relative">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <Mail className="h-4 w-4 text-gray-500" />
                            <span className="font-medium">{invite.inviteeEmail}</span>
                            {getRoleBadge(invite.role)}
                            {getStatusBadge(invite.status, invite.expiresAt)}
                          </div>
                          
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              <span>Sent {format(new Date(invite.createdAt), 'MMM dd, yyyy')}</span>
                            </div>
                            {isPending && (
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                <span>Expires {format(new Date(invite.expiresAt), 'MMM dd, yyyy')}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2">
                          {isPending && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRevokeInvite(invite.id)}
                              disabled={revokeInviteMutation.isPending}
                              className="gap-1 text-red-600 border-red-200 hover:bg-red-50"
                              data-testid={`revoke-invite-${invite.id}`}
                            >
                              {revokeInviteMutation.isPending ? (
                                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-red-600"></div>
                              ) : (
                                <X className="h-3 w-3" />
                              )}
                              Revoke
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}