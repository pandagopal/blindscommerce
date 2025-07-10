'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Map, MapPin, Clock, Navigation, Route, Car } from 'lucide-react';

interface RouteStop {
  id: string;
  customerName: string;
  address: string;
  appointment_time: string;
  type: 'installation' | 'measurement' | 'repair';
  estimated_duration: number;
  status: 'pending' | 'completed' | 'skipped';
  notes: string;
}

interface DailyRoute {
  id: string;
  date: string;
  total_stops: number;
  estimated_duration: number;
  actual_duration?: number;
  total_distance: number;
  status: 'planned' | 'in_progress' | 'completed';
  stops: RouteStop[];
}

export default function InstallerRoutesPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [routes, setRoutes] = useState<DailyRoute[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<DailyRoute | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/v2/auth/me');
        if (!res.ok) {
          router.push('/login?redirect=/installer/routes');
          return;
        }
        const result = await res.json();
        const data = result.data || result;if (data.user.role !== 'installer' && data.user.role !== 'admin') {
          router.push('/');
          return;
        }
        setUser(data.user);
      } catch (error) {
        console.error('Auth check failed:', error);
        router.push('/login?redirect=/installer/routes');
      }
    };

    checkAuth();
  }, [router]);

  useEffect(() => {
    if (user) {
      fetchRoutes();
    }
  }, [user]);

  const fetchRoutes = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/v2/installer/routes');
      
      if (res.ok) {
        const data = await res.json();
        setRoutes(data.data || []);
      } else {
        setRoutes([]);
      }
    } catch (error) {
      console.error('Error fetching routes:', error);
      setRoutes([]);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (timeString: string) => {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      planned: 'default',
      'in_progress': 'secondary',
      completed: 'success',
      pending: 'warning',
      skipped: 'destructive'
    } as const;

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'default'}>
        {status.replace('_', ' ').toUpperCase()}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading routes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Installation Routes
            </h1>
            <p className="text-gray-600">Optimize your daily routes and track progress</p>
          </div>
          
          <Button className="bg-primary-red hover:bg-red-700">
            <Route className="h-4 w-4 mr-2" />
            Optimize Route
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Routes List */}
          <div className="lg:col-span-1">
            <Card className="border-purple-100 shadow-lg">
              <CardHeader>
                <CardTitle className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                  Daily Routes
                </CardTitle>
              </CardHeader>
              <CardContent>
                {routes.length === 0 ? (
                  <div className="text-center py-8">
                    <Route className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-md font-medium text-gray-900 mb-2">No Routes Found</h3>
                    <p className="text-sm text-gray-600">No routes have been assigned yet.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {routes.map((route) => (
                      <div
                        key={route.id}
                        className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                          selectedRoute?.id === route.id
                            ? 'border-purple-300 bg-purple-50'
                            : 'border-gray-200 hover:border-purple-200 hover:bg-purple-25'
                        }`}
                        onClick={() => setSelectedRoute(route)}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-medium">{formatDate(route.date)}</h4>
                          {getStatusBadge(route.status)}
                        </div>
                        <div className="text-sm text-gray-600 space-y-1">
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            <span>{route.total_stops} stops</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            <span>
                              {route.actual_duration 
                                ? `${formatDuration(route.actual_duration)} (actual)`
                                : `${formatDuration(route.estimated_duration)} (estimated)`
                              }
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Car className="h-4 w-4" />
                            <span>{route.total_distance} miles</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Route Details */}
          <div className="lg:col-span-2">
            {selectedRoute ? (
              <Card className="border-purple-100 shadow-lg">
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                        Route Details - {formatDate(selectedRoute.date)}
                      </CardTitle>
                      <div className="flex gap-4 mt-2 text-sm text-gray-600">
                        <span>{selectedRoute.total_stops} stops</span>
                        <span>{selectedRoute.total_distance} miles</span>
                        <span>{formatDuration(selectedRoute.estimated_duration)}</span>
                      </div>
                    </div>
                    {getStatusBadge(selectedRoute.status)}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {selectedRoute.stops.map((stop, index) => (
                      <div key={stop.id} className="flex items-start gap-4 p-4 border rounded-lg">
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-medium">
                            {index + 1}
                          </div>
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h4 className="font-medium">{stop.customerName}</h4>
                              <p className="text-sm text-gray-600">{stop.address}</p>
                            </div>
                            <div className="text-right">
                              {getStatusBadge(stop.status)}
                              <Badge variant="outline" className="ml-2">
                                {stop.type.toUpperCase()}
                              </Badge>
                            </div>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              <span>{formatTime(stop.appointment_time)}</span>
                            </div>
                            <span>Est. {formatDuration(stop.estimated_duration)}</span>
                          </div>
                          {stop.notes && (
                            <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                              {stop.notes}
                            </p>
                          )}
                          <div className="flex gap-2 mt-3">
                            <Button size="sm" variant="outline">
                              <Navigation className="h-4 w-4 mr-1" />
                              Navigate
                            </Button>
                            {stop.status === 'pending' && (
                              <Button size="sm">
                                Start Job
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-purple-100 shadow-lg">
                <CardContent className="text-center py-12">
                  <Map className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium text-gray-600 mb-2">Select a Route</h3>
                  <p className="text-gray-500">Choose a route from the list to view details and navigation.</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}