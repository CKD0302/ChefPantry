import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { 
  Clock, 
  Calendar, 
  MapPin, 
  Users,
  Timer,
  CheckCircle,
  AlertCircle,
  XCircle,
  Check,
  X,
  FileText,
  QrCode,
  RefreshCw,
  Trash2
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useRoute } from "wouter";
import QRCode from "react-qr-code";

interface ShiftData {
  id: string;
  chefId: string;
  venueId: string;
  gigId: string | null;
  clockInAt: string;
  clockOutAt: string | null;
  status: string;
  breakMinutes: number;
  chefNote: string | null;
  venueNote: string | null;
  chef: {
    id: string;
    fullName: string;
    profileImageUrl: string | null;
    hourlyRate: number | null;
  } | null;
  gig: {
    id: string;
    title: string;
  } | null;
}

interface BusinessProfile {
  id: string;
  businessName: string;
  location: string;
}

interface QRToken {
  id: string;
  venueId: string;
  token: string;
  gigId: string | null;
  expiresAt: string;
  usedAt: string | null;
  usedBy: string | null;
  createdBy: string;
  createdAt: string;
}

export default function VenueTimesheets() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, params] = useRoute("/business/:id/timesheets");
  const venueId = params?.id;
  
  const [selectedTab, setSelectedTab] = useState("submitted");
  const [selectedShift, setSelectedShift] = useState<ShiftData | null>(null);
  const [actionType, setActionType] = useState<"approve" | "dispute" | null>(null);
  const [venueNote, setVenueNote] = useState("");
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [qrExpirationMinutes, setQrExpirationMinutes] = useState("30");

  // Fetch business profile
  const { data: businessProfile } = useQuery<BusinessProfile>({
    queryKey: ["/api/profiles/business", venueId],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/profiles/business/${venueId}`);
      const data = await response.json();
      return data?.data || data;
    },
    enabled: !!venueId,
  });

  // Fetch venue shifts
  const { data: shifts, isLoading } = useQuery<ShiftData[]>({
    queryKey: ["/api/time/shifts/venue", venueId],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/time/shifts/venue/${venueId}`);
      return response.json();
    },
    enabled: !!venueId && !!user?.id,
  });

  // Update shift status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ shiftId, status, note }: { shiftId: string; status: string; note?: string }) => {
      const response = await apiRequest("PATCH", `/api/time/shifts/${shiftId}/status`, { 
        status, 
        venueNote: note 
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update shift status");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: actionType === 'approve' ? "Shift Approved" : "Shift Disputed",
        description: actionType === 'approve' 
          ? "The shift has been approved successfully." 
          : "The shift has been marked as disputed.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/time/shifts/venue", venueId] });
      closeDialog();
    },
    onError: (error: Error) => {
      toast({
        title: "Action Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Fetch active QR tokens for this venue
  const { data: activeTokens, isLoading: loadingTokens } = useQuery<QRToken[]>({
    queryKey: ["/api/time/qr/venue", venueId],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/time/qr/venue/${venueId}`);
      return response.json();
    },
    enabled: !!venueId && !!user?.id && isQRModalOpen,
  });

  // Generate QR token mutation
  const generateQRMutation = useMutation({
    mutationFn: async (expiresInMinutes: number) => {
      const response = await apiRequest("POST", "/api/time/qr/generate", {
        venueId,
        expiresInMinutes,
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to generate QR code");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "QR Code Generated",
        description: "Chefs can now scan this code to clock in.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/time/qr/venue", venueId] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to Generate QR",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete QR token mutation
  const deleteTokenMutation = useMutation({
    mutationFn: async (tokenId: string) => {
      const response = await apiRequest("DELETE", `/api/time/qr/${tokenId}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete QR code");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "QR Code Deleted",
        description: "The QR code has been invalidated.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/time/qr/venue", venueId] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to Delete",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleGenerateQR = () => {
    generateQRMutation.mutate(parseInt(qrExpirationMinutes));
  };

  const formatExpiryTime = (expiresAt: string) => {
    const expiry = new Date(expiresAt);
    const now = new Date();
    const diffMs = expiry.getTime() - now.getTime();
    if (diffMs <= 0) return "Expired";
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 60) return `${diffMins} min left`;
    const diffHours = Math.floor(diffMins / 60);
    return `${diffHours}h ${diffMins % 60}m left`;
  };

  const openActionDialog = (shift: ShiftData, type: "approve" | "dispute") => {
    setSelectedShift(shift);
    setActionType(type);
    setVenueNote("");
  };

  const closeDialog = () => {
    setSelectedShift(null);
    setActionType(null);
    setVenueNote("");
  };

  const handleConfirmAction = () => {
    if (!selectedShift || !actionType) return;
    
    updateStatusMutation.mutate({
      shiftId: selectedShift.id,
      status: actionType === 'approve' ? 'approved' : 'disputed',
      note: venueNote || undefined,
    });
  };

  const formatDateTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('en-GB', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatShiftDuration = (clockInAt: string, clockOutAt: string | null) => {
    if (!clockOutAt) return "In progress";
    const start = new Date(clockInAt).getTime();
    const end = new Date(clockOutAt).getTime();
    const durationMs = end - start;
    const hours = Math.floor(durationMs / (1000 * 60 * 60));
    const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'open':
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">In Progress</Badge>;
      case 'submitted':
        return <Badge variant="secondary">Pending Review</Badge>;
      case 'approved':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Approved</Badge>;
      case 'disputed':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Disputed</Badge>;
      case 'void':
        return <Badge variant="outline" className="text-gray-500">Void</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const filterShiftsByStatus = (status: string) => {
    if (!shifts) return [];
    if (status === "all") return shifts;
    return shifts.filter(shift => shift.status.toLowerCase() === status);
  };

  // Calculate summary statistics
  const submittedShifts = filterShiftsByStatus('submitted');
  const approvedShifts = filterShiftsByStatus('approved');
  const disputedShifts = filterShiftsByStatus('disputed');
  
  const totalHoursApproved = approvedShifts.reduce((total, shift) => {
    if (!shift.clockOutAt) return total;
    const start = new Date(shift.clockInAt).getTime();
    const end = new Date(shift.clockOutAt).getTime();
    return total + (end - start) / (1000 * 60 * 60);
  }, 0);

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar />
        <main className="flex-grow container mx-auto px-4 py-8 mt-16">
          <div className="text-center">
            <h1 className="text-2xl font-bold">Please sign in to view timesheets</h1>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!venueId) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar />
        <main className="flex-grow container mx-auto px-4 py-8 mt-16">
          <div className="text-center">
            <h1 className="text-2xl font-bold">Venue not found</h1>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <main className="flex-grow container mx-auto px-4 py-8 mt-16">
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Timesheets</h1>
            <p className="text-gray-600 mt-2">
              {businessProfile?.businessName || 'Loading...'} - Review and approve staff shifts
            </p>
          </div>
          <Button
            onClick={() => setIsQRModalOpen(true)}
            className="flex items-center gap-2"
            data-testid="button-generate-qr"
          >
            <QrCode className="h-5 w-5" />
            Generate QR Code
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pending Review</p>
                  <p className="text-2xl font-bold text-orange-600">{submittedShifts.length}</p>
                </div>
                <Clock className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Approved</p>
                  <p className="text-2xl font-bold text-green-600">{approvedShifts.length}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Disputed</p>
                  <p className="text-2xl font-bold text-red-600">{disputedShifts.length}</p>
                </div>
                <AlertCircle className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Hours Approved</p>
                  <p className="text-2xl font-bold text-blue-600">{totalHoursApproved.toFixed(1)}h</p>
                </div>
                <Timer className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Shifts Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Staff Shifts
            </CardTitle>
            <CardDescription>
              Review and manage staff timesheets
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="submitted" className="text-xs sm:text-sm">
                  Pending ({submittedShifts.length})
                </TabsTrigger>
                <TabsTrigger value="approved" className="text-xs sm:text-sm">
                  Approved ({approvedShifts.length})
                </TabsTrigger>
                <TabsTrigger value="disputed" className="text-xs sm:text-sm">
                  Disputed ({disputedShifts.length})
                </TabsTrigger>
                <TabsTrigger value="all" className="text-xs sm:text-sm">
                  All ({shifts?.length || 0})
                </TabsTrigger>
              </TabsList>

              {['submitted', 'approved', 'disputed', 'all'].map((tabValue) => (
                <TabsContent key={tabValue} value={tabValue} className="mt-6">
                  {isLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
                    </div>
                  ) : filterShiftsByStatus(tabValue).length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Clock className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>No {tabValue === 'all' ? '' : tabValue} shifts found</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {filterShiftsByStatus(tabValue).map((shift) => (
                        <ShiftRow 
                          key={shift.id} 
                          shift={shift}
                          onApprove={() => openActionDialog(shift, 'approve')}
                          onDispute={() => openActionDialog(shift, 'dispute')}
                        />
                      ))}
                    </div>
                  )}
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>

        {/* Action Dialog */}
        <Dialog open={!!selectedShift && !!actionType} onOpenChange={(open) => !open && closeDialog()}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {actionType === 'approve' ? 'Approve Shift' : 'Dispute Shift'}
              </DialogTitle>
              <DialogDescription>
                {actionType === 'approve' 
                  ? 'Confirm approval of this shift. This action cannot be undone.'
                  : 'Mark this shift as disputed. You can add a note explaining the issue.'
                }
              </DialogDescription>
            </DialogHeader>

            {selectedShift && (
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-lg space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Chef:</span>
                    <span className="font-medium">{selectedShift.chef?.fullName || 'Unknown'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Date:</span>
                    <span className="font-medium">{formatDateTime(selectedShift.clockInAt)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Duration:</span>
                    <span className="font-medium">
                      {formatShiftDuration(selectedShift.clockInAt, selectedShift.clockOutAt)}
                    </span>
                  </div>
                  {selectedShift.gig && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Gig:</span>
                      <span className="font-medium">{selectedShift.gig.title}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="venueNote">
                    {actionType === 'approve' ? 'Add a note (optional)' : 'Reason for dispute'}
                  </Label>
                  <Textarea
                    id="venueNote"
                    placeholder={actionType === 'approve' 
                      ? 'Optional note about this shift...'
                      : 'Explain why this shift is being disputed...'
                    }
                    value={venueNote}
                    onChange={(e) => setVenueNote(e.target.value)}
                    data-testid="input-venue-note"
                  />
                </div>
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={closeDialog}>
                Cancel
              </Button>
              <Button 
                onClick={handleConfirmAction}
                disabled={updateStatusMutation.isPending}
                variant={actionType === 'dispute' ? 'destructive' : 'default'}
                data-testid={`button-confirm-${actionType}`}
              >
                {updateStatusMutation.isPending 
                  ? 'Processing...' 
                  : actionType === 'approve' ? 'Approve Shift' : 'Mark as Disputed'
                }
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* QR Code Generation Modal */}
        <Dialog open={isQRModalOpen} onOpenChange={setIsQRModalOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <QrCode className="h-5 w-5" />
                QR Clock-In Code
              </DialogTitle>
              <DialogDescription>
                Generate a QR code for chefs to scan and clock in at {businessProfile?.businessName || 'your venue'}.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              {/* Generate New QR Code Section */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="expiration">Code Expiration</Label>
                  <Select value={qrExpirationMinutes} onValueChange={setQrExpirationMinutes}>
                    <SelectTrigger id="expiration" data-testid="select-qr-expiration">
                      <SelectValue placeholder="Select expiration time" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15">15 minutes</SelectItem>
                      <SelectItem value="30">30 minutes</SelectItem>
                      <SelectItem value="60">1 hour</SelectItem>
                      <SelectItem value="120">2 hours</SelectItem>
                      <SelectItem value="480">8 hours (full shift)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  onClick={handleGenerateQR}
                  disabled={generateQRMutation.isPending}
                  className="w-full"
                  data-testid="button-create-qr"
                >
                  {generateQRMutation.isPending ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <QrCode className="h-4 w-4 mr-2" />
                      Generate New QR Code
                    </>
                  )}
                </Button>
              </div>

              {/* Active QR Codes */}
              <div className="space-y-3">
                <Label>Active QR Codes</Label>
                {loadingTokens ? (
                  <div className="flex items-center justify-center py-4">
                    <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
                  </div>
                ) : activeTokens && activeTokens.length > 0 ? (
                  <div className="space-y-4">
                    {activeTokens.map((token) => (
                      <div key={token.id} className="border rounded-lg p-4 space-y-3" data-testid={`qr-token-${token.id}`}>
                        <div className="flex justify-center bg-white p-4 rounded">
                          <QRCode
                            value={token.token}
                            size={180}
                            data-testid={`qr-code-${token.id}`}
                          />
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <Badge variant="secondary" className="text-xs">
                            {formatExpiryTime(token.expiresAt)}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => deleteTokenMutation.mutate(token.id)}
                            disabled={deleteTokenMutation.isPending}
                            data-testid={`button-delete-qr-${token.id}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <p className="text-xs text-center text-gray-500">
                          Chefs can scan this code to clock in
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 text-gray-500 bg-gray-50 rounded-lg">
                    <QrCode className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                    <p className="text-sm">No active QR codes</p>
                    <p className="text-xs">Generate one above for chefs to scan</p>
                  </div>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsQRModalOpen(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
      <Footer />
    </div>
  );
}

interface ShiftRowProps {
  shift: ShiftData;
  onApprove: () => void;
  onDispute: () => void;
}

function ShiftRow({ shift, onApprove, onDispute }: ShiftRowProps) {
  const formatDateTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('en-GB', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatShiftDuration = (clockInAt: string, clockOutAt: string | null) => {
    if (!clockOutAt) return "In progress";
    const start = new Date(clockInAt).getTime();
    const end = new Date(clockOutAt).getTime();
    const durationMs = end - start;
    const hours = Math.floor(durationMs / (1000 * 60 * 60));
    const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'open':
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">In Progress</Badge>;
      case 'submitted':
        return <Badge variant="secondary">Pending Review</Badge>;
      case 'approved':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Approved</Badge>;
      case 'disputed':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Disputed</Badge>;
      case 'void':
        return <Badge variant="outline" className="text-gray-500">Void</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const canTakeAction = shift.status.toLowerCase() === 'submitted';

  return (
    <div className="border rounded-lg p-4 hover:bg-gray-50 transition-colors" data-testid={`shift-row-${shift.id}`}>
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        {/* Chef Info */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
            {shift.chef?.profileImageUrl ? (
              <img 
                src={shift.chef.profileImageUrl} 
                alt={shift.chef.fullName}
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <Users className="h-5 w-5 text-gray-500" />
            )}
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold truncate">{shift.chef?.fullName || 'Unknown Chef'}</h3>
            {shift.gig && (
              <p className="text-sm text-gray-600 truncate">{shift.gig.title}</p>
            )}
          </div>
        </div>

        {/* Shift Details */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm flex-grow">
          <div>
            <span className="text-gray-500 block">Clock In</span>
            <span className="font-medium">{formatDateTime(shift.clockInAt)}</span>
          </div>
          <div>
            <span className="text-gray-500 block">Clock Out</span>
            <span className="font-medium">
              {shift.clockOutAt ? formatDateTime(shift.clockOutAt) : '-'}
            </span>
          </div>
          <div>
            <span className="text-gray-500 block">Duration</span>
            <span className="font-medium">{formatShiftDuration(shift.clockInAt, shift.clockOutAt)}</span>
          </div>
          <div>
            <span className="text-gray-500 block">Earnings</span>
            <span className="font-medium text-green-600" data-testid={`earnings-${shift.id}`}>
              {shift.clockOutAt && shift.chef?.hourlyRate ? (
                (() => {
                  const totalMs = new Date(shift.clockOutAt).getTime() - new Date(shift.clockInAt).getTime();
                  const breakMs = (shift.breakMinutes || 0) * 60 * 1000;
                  const workedHours = Math.max(0, (totalMs - breakMs) / (1000 * 60 * 60));
                  return `£${(workedHours * shift.chef.hourlyRate).toFixed(2)}`;
                })()
              ) : shift.chef?.hourlyRate ? (
                <span className="text-gray-400">£{shift.chef.hourlyRate}/hr</span>
              ) : (
                <span className="text-gray-400">No rate set</span>
              )}
            </span>
          </div>
        </div>

        {/* Status and Actions */}
        <div className="flex items-center gap-3 flex-shrink-0">
          {getStatusBadge(shift.status)}
          
          {canTakeAction && (
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                className="text-green-600 border-green-600 hover:bg-green-50"
                onClick={onApprove}
                data-testid={`button-approve-${shift.id}`}
              >
                <Check className="h-4 w-4 mr-1" />
                Approve
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="text-red-600 border-red-600 hover:bg-red-50"
                onClick={onDispute}
                data-testid={`button-dispute-${shift.id}`}
              >
                <X className="h-4 w-4 mr-1" />
                Dispute
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Notes */}
      {(shift.chefNote || shift.venueNote) && (
        <div className="mt-3 pt-3 border-t space-y-2">
          {shift.chefNote && (
            <div className="text-sm">
              <span className="text-gray-500">Chef note: </span>
              <span>{shift.chefNote}</span>
            </div>
          )}
          {shift.venueNote && (
            <div className="text-sm">
              <span className="text-gray-500">Your note: </span>
              <span>{shift.venueNote}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
