import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Clock, 
  Play, 
  Square, 
  Calendar, 
  MapPin, 
  Building,
  Timer,
  History,
  CheckCircle,
  AlertCircle,
  XCircle
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

interface OpenShiftData {
  shift: {
    id: string;
    chefId: string;
    venueId: string;
    gigId: string | null;
    clockInAt: string;
    clockOutAt: string | null;
    status: string;
    breakMinutes: number;
  } | null;
  venue: {
    id: string;
    name: string;
    location: string;
  } | null;
  gig: {
    id: string;
    title: string;
  } | null;
}

interface ShiftHistoryItem {
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
  venue: {
    id: string;
    name: string;
    location: string;
  } | null;
  gig: {
    id: string;
    title: string;
  } | null;
}

interface AcceptedGig {
  applicationId: string;
  gig: {
    id: string;
    title: string;
    startDate: string;
    endDate: string;
    startTime: string;
    endTime: string;
    location: string;
    venueType: string;
  };
  venue: {
    id: string;
    name: string;
    location: string;
  } | null;
}

interface VenueStaff {
  id: string;
  venueId: string;
  chefId: string;
  isActive: boolean;
  role: string | null;
  venue: {
    id: string;
    name: string;
    location: string;
  } | null;
}

export default function ChefTime() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedTab, setSelectedTab] = useState("all");
  const [selectedClockInOption, setSelectedClockInOption] = useState<string>("");
  const [elapsedTime, setElapsedTime] = useState<number>(0);

  // Fetch current open shift
  const { data: openShiftData, isLoading: loadingOpenShift } = useQuery<OpenShiftData>({
    queryKey: ["/api/time/shifts/open"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/time/shifts/open");
      return response.json();
    },
    enabled: !!user?.id,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Fetch shift history
  const { data: shiftHistory, isLoading: loadingHistory } = useQuery<ShiftHistoryItem[]>({
    queryKey: ["/api/time/shifts/my"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/time/shifts/my");
      return response.json();
    },
    enabled: !!user?.id,
  });

  // Fetch accepted gigs for clock-in dropdown
  const { data: acceptedGigs } = useQuery<AcceptedGig[]>({
    queryKey: ["/api/time/gigs/accepted"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/time/gigs/accepted");
      return response.json();
    },
    enabled: !!user?.id,
  });

  // Fetch staff venues for clock-in dropdown
  const { data: staffVenues } = useQuery<VenueStaff[]>({
    queryKey: ["/api/time/venues/staff"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/time/venues/staff");
      return response.json();
    },
    enabled: !!user?.id,
  });

  // Clock in mutation
  const clockInMutation = useMutation({
    mutationFn: async (data: { venueId: string; gigId?: string }) => {
      const response = await apiRequest("POST", "/api/time/clock-in", data);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to clock in");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Clocked In",
        description: "Your shift has started. Have a great work day!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/time/shifts/open"] });
      queryClient.invalidateQueries({ queryKey: ["/api/time/shifts/my"] });
      setSelectedClockInOption("");
    },
    onError: (error: Error) => {
      toast({
        title: "Clock In Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Clock out mutation
  const clockOutMutation = useMutation({
    mutationFn: async (shiftId: string) => {
      const response = await apiRequest("POST", "/api/time/clock-out", { shiftId });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to clock out");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Clocked Out",
        description: "Your shift has been recorded. Great work!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/time/shifts/open"] });
      queryClient.invalidateQueries({ queryKey: ["/api/time/shifts/my"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Clock Out Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Timer effect for running shift
  useEffect(() => {
    if (openShiftData?.shift?.clockInAt) {
      const updateElapsed = () => {
        const clockInTime = new Date(openShiftData.shift!.clockInAt).getTime();
        const now = Date.now();
        setElapsedTime(Math.floor((now - clockInTime) / 1000));
      };
      
      updateElapsed();
      const interval = setInterval(updateElapsed, 1000);
      return () => clearInterval(interval);
    } else {
      setElapsedTime(0);
    }
  }, [openShiftData?.shift?.clockInAt]);

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
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

  const formatDateTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('en-GB', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleClockIn = () => {
    if (!selectedClockInOption) {
      toast({
        title: "Select a venue or gig",
        description: "Please select where you want to clock in.",
        variant: "destructive",
      });
      return;
    }

    // Parse the selected option
    const [type, id, venueId] = selectedClockInOption.split(":");
    
    if (type === "gig") {
      clockInMutation.mutate({ venueId: venueId, gigId: id });
    } else {
      clockInMutation.mutate({ venueId: id });
    }
  };

  const handleClockOut = () => {
    if (openShiftData?.shift?.id) {
      clockOutMutation.mutate(openShiftData.shift.id);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'open':
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">In Progress</Badge>;
      case 'submitted':
        return <Badge variant="secondary">Submitted</Badge>;
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
    if (!shiftHistory) return [];
    if (status === "all") return shiftHistory;
    return shiftHistory.filter(shift => shift.status.toLowerCase() === status);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar />
        <main className="flex-grow container mx-auto px-4 py-8 mt-16">
          <div className="text-center">
            <h1 className="text-2xl font-bold">Please sign in to track time</h1>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const isCurrentlyWorking = !!openShiftData?.shift;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <main className="flex-grow container mx-auto px-4 py-8 mt-16">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Time Tracking</h1>
          <p className="text-gray-600 mt-2">Clock in and out of your shifts</p>
        </div>

        {/* Clock In/Out Card */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Timer className="h-5 w-5" />
              {isCurrentlyWorking ? "Currently Working" : "Clock In"}
            </CardTitle>
            <CardDescription>
              {isCurrentlyWorking 
                ? `You're clocked in at ${openShiftData?.venue?.name || 'a venue'}`
                : "Select a gig or venue to start your shift"
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingOpenShift ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
              </div>
            ) : isCurrentlyWorking ? (
              <div className="space-y-6">
                {/* Timer Display */}
                <div className="text-center">
                  <div className="text-5xl font-mono font-bold text-primary mb-2" data-testid="text-elapsed-time">
                    {formatDuration(elapsedTime)}
                  </div>
                  <p className="text-gray-500">Time elapsed</p>
                </div>

                {/* Shift Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Building className="h-4 w-4 text-gray-500" />
                    <span className="text-sm">
                      <strong>Venue:</strong> {openShiftData?.venue?.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-gray-500" />
                    <span className="text-sm">
                      <strong>Location:</strong> {openShiftData?.venue?.location}
                    </span>
                  </div>
                  {openShiftData?.gig && (
                    <div className="flex items-center gap-2 md:col-span-2">
                      <Clock className="h-4 w-4 text-gray-500" />
                      <span className="text-sm">
                        <strong>Gig:</strong> {openShiftData.gig.title}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Play className="h-4 w-4 text-gray-500" />
                    <span className="text-sm">
                      <strong>Started:</strong> {formatDateTime(openShiftData?.shift?.clockInAt || '')}
                    </span>
                  </div>
                </div>

                {/* Clock Out Button */}
                <div className="flex justify-center">
                  <Button 
                    size="lg" 
                    variant="destructive"
                    onClick={handleClockOut}
                    disabled={clockOutMutation.isPending}
                    className="px-8"
                    data-testid="button-clock-out"
                  >
                    <Square className="h-5 w-5 mr-2" />
                    {clockOutMutation.isPending ? "Clocking Out..." : "Clock Out"}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Clock In Selection */}
                <div className="space-y-4">
                  <Select value={selectedClockInOption} onValueChange={setSelectedClockInOption}>
                    <SelectTrigger className="w-full" data-testid="select-clock-in-venue">
                      <SelectValue placeholder="Select a gig or venue..." />
                    </SelectTrigger>
                    <SelectContent>
                      {/* Accepted Gigs */}
                      {acceptedGigs && acceptedGigs.length > 0 && (
                        <>
                          <div className="px-2 py-1.5 text-sm font-semibold text-gray-500">
                            Accepted Gigs
                          </div>
                          {acceptedGigs.map((item) => (
                            <SelectItem 
                              key={`gig-${item.gig.id}`} 
                              value={`gig:${item.gig.id}:${item.venue?.id || ''}`}
                            >
                              <div className="flex flex-col">
                                <span>{item.gig.title}</span>
                                <span className="text-xs text-gray-500">
                                  {item.venue?.name} - {item.gig.location}
                                </span>
                              </div>
                            </SelectItem>
                          ))}
                        </>
                      )}
                      
                      {/* Staff Venues */}
                      {staffVenues && staffVenues.length > 0 && (
                        <>
                          <div className="px-2 py-1.5 text-sm font-semibold text-gray-500 mt-2">
                            Your Venues (Staff)
                          </div>
                          {staffVenues.filter(s => s.isActive).map((staff) => (
                            <SelectItem 
                              key={`venue-${staff.venueId}`} 
                              value={`venue:${staff.venueId}:`}
                            >
                              <div className="flex flex-col">
                                <span>{staff.venue?.name}</span>
                                <span className="text-xs text-gray-500">
                                  {staff.venue?.location} {staff.role && `- ${staff.role}`}
                                </span>
                              </div>
                            </SelectItem>
                          ))}
                        </>
                      )}

                      {/* No options available */}
                      {(!acceptedGigs || acceptedGigs.length === 0) && 
                       (!staffVenues || staffVenues.filter(s => s.isActive).length === 0) && (
                        <div className="px-2 py-4 text-center text-gray-500 text-sm">
                          No gigs or venues available. Apply for gigs or get added as staff.
                        </div>
                      )}
                    </SelectContent>
                  </Select>

                  <div className="flex justify-center">
                    <Button 
                      size="lg" 
                      onClick={handleClockIn}
                      disabled={!selectedClockInOption || clockInMutation.isPending}
                      className="px-8"
                      data-testid="button-clock-in"
                    >
                      <Play className="h-5 w-5 mr-2" />
                      {clockInMutation.isPending ? "Clocking In..." : "Clock In"}
                    </Button>
                  </div>
                </div>

                {/* Help Text */}
                <div className="text-center text-sm text-gray-500 p-4 bg-gray-50 rounded-lg">
                  <p>Select a gig you've been accepted for, or a venue where you're registered as staff.</p>
                  <p className="mt-1">Your time will be tracked and submitted for approval.</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Shift History */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Shift History
            </CardTitle>
            <CardDescription>
              View your past shifts and their approval status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="all" className="text-xs sm:text-sm">
                  All ({shiftHistory?.length || 0})
                </TabsTrigger>
                <TabsTrigger value="submitted" className="text-xs sm:text-sm">
                  Pending ({filterShiftsByStatus('submitted').length})
                </TabsTrigger>
                <TabsTrigger value="approved" className="text-xs sm:text-sm">
                  Approved ({filterShiftsByStatus('approved').length})
                </TabsTrigger>
                <TabsTrigger value="disputed" className="text-xs sm:text-sm">
                  Disputed ({filterShiftsByStatus('disputed').length})
                </TabsTrigger>
              </TabsList>

              {['all', 'submitted', 'approved', 'disputed'].map((tabValue) => (
                <TabsContent key={tabValue} value={tabValue} className="mt-6">
                  {loadingHistory ? (
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
                        <ShiftCard key={shift.id} shift={shift} />
                      ))}
                    </div>
                  )}
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
}

interface ShiftCardProps {
  shift: ShiftHistoryItem;
}

function ShiftCard({ shift }: ShiftCardProps) {
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
        return <Badge variant="secondary">Submitted</Badge>;
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

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'approved':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'disputed':
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      case 'void':
        return <XCircle className="h-5 w-5 text-gray-400" />;
      default:
        return <Clock className="h-5 w-5 text-blue-600" />;
    }
  };

  return (
    <div className="border rounded-lg p-4 hover:bg-gray-50 transition-colors" data-testid={`shift-card-${shift.id}`}>
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-start gap-3">
          {getStatusIcon(shift.status)}
          <div>
            <h3 className="font-semibold">
              {shift.venue?.name || 'Unknown Venue'}
            </h3>
            {shift.gig && (
              <p className="text-sm text-gray-600">{shift.gig.title}</p>
            )}
          </div>
        </div>
        {getStatusBadge(shift.status)}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
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
          <span className="text-gray-500 block">Location</span>
          <span className="font-medium text-gray-600 flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            {shift.venue?.location || 'N/A'}
          </span>
        </div>
      </div>

      {(shift.chefNote || shift.venueNote) && (
        <div className="mt-3 pt-3 border-t space-y-2">
          {shift.chefNote && (
            <div className="text-sm">
              <span className="text-gray-500">Your note: </span>
              <span>{shift.chefNote}</span>
            </div>
          )}
          {shift.venueNote && (
            <div className="text-sm">
              <span className="text-gray-500">Venue note: </span>
              <span>{shift.venueNote}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
