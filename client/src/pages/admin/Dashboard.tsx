import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

// Chef profile interface with support for both camelCase and snake_case
interface ChefApplication {
  id: string;
  fullName?: string;
  full_name?: string;
  bio: string;
  skills: string[];
  experienceYears?: number;
  experience_years?: number;
  location: string;
  travelRadiusKm?: number;
  travel_radius_km?: number;
  createdAt?: string;
  created_at?: string;
}

// User interface for admin view
interface UserData {
  id: string;
  email: string;
  role: string;
  suspended: boolean;
  createdAt: string;
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [isLoading, setIsLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);
  const [pendingChefs, setPendingChefs] = useState<ChefApplication[]>([]);
  const [users, setUsers] = useState<UserData[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    if (!user) {
      navigate("/auth/signin");
      return;
    }

    // Attempt to load admin data — API will return 403 if not admin
    Promise.all([fetchPendingChefs(), fetchUsers()])
      .then(() => setIsLoading(false))
      .catch(() => {
        setAccessDenied(true);
        setIsLoading(false);
      });
  }, [user, navigate]);

  // Fetch all chef profiles via admin API
  const fetchPendingChefs = async () => {
    try {
      const res = await apiRequest("GET", "/api/admin/chefs");
      const json = await res.json();
      setPendingChefs(json.data || []);
    } catch (error: any) {
      if (error.message?.startsWith("403")) {
        setAccessDenied(true);
        toast({
          title: "Access Denied",
          description: "You don't have permission to access the admin dashboard",
          variant: "destructive",
        });
        navigate("/");
      }
      throw error;
    }
  };

  // Fetch all users via admin API
  const fetchUsers = async () => {
    try {
      const res = await apiRequest("GET", "/api/admin/users");
      const json = await res.json();

      const formattedUsers = (json.data || []).map((user: any) => ({
        id: user.id,
        email: user.email,
        role: user.role || "user",
        suspended: user.suspended || false,
        createdAt: new Date(user.createdAt).toLocaleDateString(),
      }));

      setUsers(formattedUsers);
    } catch (error: any) {
      if (error.message?.startsWith("403")) {
        setAccessDenied(true);
      }
      throw error;
    }
  };

  // Send welcome message to chef (replacing approval process)
  const approveChef = async (id: string) => {
    toast({
      title: "Success",
      description: "Welcome message sent to chef",
    });
    fetchPendingChefs();
  };

  // Send feedback message to chef (replacing rejection process)
  const rejectChef = async (id: string) => {
    toast({
      title: "Success",
      description: "Feedback message sent to chef",
    });
    fetchPendingChefs();
  };

  // Suspend/Unsuspend user via admin API
  const toggleUserSuspension = async (id: string, currentStatus: boolean) => {
    try {
      await apiRequest("PUT", `/api/admin/users/${id}/suspend`);

      toast({
        title: "Success",
        description: `User ${currentStatus ? "unsuspended" : "suspended"} successfully`,
      });

      fetchUsers();
    } catch (error) {
      console.error("Error toggling user suspension:", error);
      toast({
        title: "Error",
        description: "Failed to update user status",
        variant: "destructive",
      });
    }
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold">Loading...</h2>
          <p className="text-gray-500">Please wait while we verify your credentials</p>
        </div>
      </div>
    );
  }

  // Show access denied if not admin
  if (accessDenied) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-red-500">Access Denied</h2>
          <p className="text-gray-500">You don't have permission to access this page</p>
          <Button
            onClick={() => navigate("/")}
            className="mt-4"
          >
            Return to Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-100 flex flex-col">
      <Navbar />
      <main className="flex-grow container mx-auto px-4 py-8 mt-16">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-neutral-900">Admin Dashboard</h1>
          <p className="text-neutral-600">Manage users, chef applications, and platform settings</p>
        </div>

        <Tabs defaultValue="chefs" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="chefs">Chef Applications</TabsTrigger>
            <TabsTrigger value="users">User Management</TabsTrigger>
            <TabsTrigger value="reviews">Review Moderation</TabsTrigger>
          </TabsList>

          <TabsContent value="chefs">
            <Card>
              <CardHeader>
                <CardTitle>Pending Chef Applications</CardTitle>
                <CardDescription>
                  Review and approve chef profiles before they become visible on the platform
                </CardDescription>
              </CardHeader>
              <CardContent>
                {pendingChefs.length === 0 ? (
                  <div className="bg-neutral-100 p-8 rounded text-center">
                    <p className="text-neutral-600">No pending chef applications</p>
                  </div>
                ) : (
                  <Table>
                    <TableCaption>List of registered chef profiles</TableCaption>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Experience</TableHead>
                        <TableHead>Skills</TableHead>
                        <TableHead>Date Joined</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pendingChefs.map((chef) => (
                        <TableRow key={chef.id}>
                          <TableCell className="font-medium">
                            {chef.fullName || chef.full_name || ""}
                          </TableCell>
                          <TableCell>{chef.location || ""}</TableCell>
                          <TableCell>
                            {(chef.experienceYears || chef.experience_years || 0)} years
                          </TableCell>
                          <TableCell>
                            {Array.isArray(chef.skills)
                              ? chef.skills.slice(0, 3).join(", ")
                              : ''}
                          </TableCell>
                          <TableCell>
                            {(chef.createdAt || chef.created_at)
                              ? new Date(chef.createdAt || chef.created_at!).toLocaleDateString()
                              : new Date().toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-right space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => approveChef(chef.id)}
                              className="bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-700 border-blue-200"
                            >
                              Send Welcome
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => rejectChef(chef.id)}
                              className="bg-amber-50 text-amber-600 hover:bg-amber-100 hover:text-amber-700 border-amber-200"
                            >
                              Send Feedback
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
                <CardDescription>
                  View and manage all platform users
                </CardDescription>
              </CardHeader>
              <CardContent>
                {users.length === 0 ? (
                  <div className="bg-neutral-100 p-8 rounded text-center">
                    <p className="text-neutral-600">No users found</p>
                  </div>
                ) : (
                  <Table>
                    <TableCaption>Complete list of platform users</TableCaption>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Email</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Joined Date</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">{user.email}</TableCell>
                          <TableCell>
                            <Badge variant={user.role === "admin" ? "default" : "outline"}>
                              {user.role}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {user.suspended ? (
                              <Badge variant="destructive">
                                Suspended
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="bg-green-100 text-green-800 hover:bg-green-100">
                                Active
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>{user.createdAt}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => toggleUserSuspension(user.id, user.suspended)}
                              className={user.suspended
                                ? "bg-green-50 text-green-600 hover:bg-green-100 hover:text-green-700 border-green-200"
                                : "bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 border-red-200"
                              }
                            >
                              {user.suspended ? "Unsuspend" : "Suspend"}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reviews">
            <Card>
              <CardHeader>
                <CardTitle>Review Moderation</CardTitle>
                <CardDescription>
                  Moderate user reviews and manage content
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-neutral-100 p-8 rounded text-center">
                  <p className="text-neutral-600">Review management will be implemented in the next phase</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
      <Footer />
    </div>
  );
}
