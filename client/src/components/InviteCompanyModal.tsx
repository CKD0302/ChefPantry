import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Mail, Building2 } from "lucide-react";

const inviteCompanySchema = z.object({
  inviteeEmail: z.string().email("Please enter a valid email address"),
  role: z.enum(["admin", "member"], {
    required_error: "Please select a role",
  }),
});

type InviteCompanyForm = z.infer<typeof inviteCompanySchema>;

interface InviteCompanyModalProps {
  businessId: string;
  trigger?: React.ReactNode;
}

export default function InviteCompanyModal({ businessId, trigger }: InviteCompanyModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const queryClient = useQueryClient();

  const form = useForm<InviteCompanyForm>({
    resolver: zodResolver(inviteCompanySchema),
    defaultValues: {
      inviteeEmail: "",
      role: "member",
    },
  });

  const inviteCompanyMutation = useMutation({
    mutationFn: async (data: InviteCompanyForm) => {
      const response = await apiRequest("POST", "/api/company/invite-business", {
        businessId,
        inviteeEmail: data.inviteeEmail,
        role: data.role,
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Invitation Sent",
        description: "The company invitation has been sent successfully.",
      });
      setIsOpen(false);
      form.reset();
      // Invalidate any relevant queries
      queryClient.invalidateQueries({ queryKey: ["business-company-invites", businessId] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send invitation. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InviteCompanyForm) => {
    inviteCompanyMutation.mutate(data);
  };

  const defaultTrigger = (
    <Button className="gap-2" data-testid="button-invite-company">
      <Mail className="h-4 w-4" />
      Invite Company
    </Button>
  );

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-blue-600" />
            Invite Company to Manage Venue
          </DialogTitle>
          <DialogDescription>
            Invite a company to help manage this venue. They'll be able to handle operations, 
            gig postings, and invoice management on your behalf.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="inviteeEmail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Company Email *</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="email"
                      placeholder="company@example.com"
                      data-testid="input-company-email"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Access Level *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-role">
                        <SelectValue placeholder="Select access level" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="member">
                        Member - Can view and manage basic operations
                      </SelectItem>
                      <SelectItem value="admin">
                        Admin - Full management access including team management
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsOpen(false)}
                className="flex-1"
                data-testid="button-cancel"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={inviteCompanyMutation.isPending}
                className="flex-1"
                data-testid="button-send-invite"
              >
                {inviteCompanyMutation.isPending ? "Sending..." : "Send Invitation"}
              </Button>
            </div>
          </form>
        </Form>

        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Note:</strong> The invited company will receive an email with instructions 
            to accept this invitation and start managing your venue.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}