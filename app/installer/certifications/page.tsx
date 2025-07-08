'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  Award, 
  Calendar, 
  CheckCircle,
  Clock,
  Download,
  Upload,
  AlertCircle,
  BookOpen,
  Video
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface Certification {
  id: number;
  name: string;
  issuer: string;
  status: 'active' | 'expired' | 'pending';
  issueDate: string;
  expiryDate: string;
  credentialId: string;
  category: string;
  required: boolean;
}

interface TrainingCourse {
  id: number;
  title: string;
  duration: string;
  progress: number;
  type: 'video' | 'document' | 'quiz';
  mandatory: boolean;
  dueDate?: string;
}

const certifications: Certification[] = [
  {
    id: 1,
    name: 'Professional Window Treatment Installer',
    issuer: 'Window Covering Safety Council',
    status: 'active',
    issueDate: '2023-06-15',
    expiryDate: '2025-06-15',
    credentialId: 'WCSC-2023-1234',
    category: 'Safety',
    required: true,
  },
  {
    id: 2,
    name: 'Motorized Blinds Specialist',
    issuer: 'Smart Home Institute',
    status: 'active',
    issueDate: '2023-09-20',
    expiryDate: '2024-09-20',
    credentialId: 'SHI-MOT-5678',
    category: 'Technical',
    required: false,
  },
  {
    id: 3,
    name: 'Child Safety Certification',
    issuer: 'Consumer Product Safety Commission',
    status: 'expired',
    issueDate: '2022-03-10',
    expiryDate: '2024-03-10',
    credentialId: 'CPSC-2022-9012',
    category: 'Safety',
    required: true,
  },
  {
    id: 4,
    name: 'Commercial Installation License',
    issuer: 'State Contractor Board',
    status: 'pending',
    issueDate: '',
    expiryDate: '',
    credentialId: '',
    category: 'License',
    required: false,
  },
];

const trainingCourses: TrainingCourse[] = [
  {
    id: 1,
    title: 'Safety Best Practices 2024',
    duration: '45 min',
    progress: 100,
    type: 'video',
    mandatory: true,
  },
  {
    id: 2,
    title: 'Smart Home Integration Guide',
    duration: '1.5 hours',
    progress: 65,
    type: 'video',
    mandatory: false,
  },
  {
    id: 3,
    title: 'Customer Service Excellence',
    duration: '30 min',
    progress: 0,
    type: 'document',
    mandatory: true,
    dueDate: '2024-08-15',
  },
  {
    id: 4,
    title: 'Installation Techniques Quiz',
    duration: '20 min',
    progress: 0,
    type: 'quiz',
    mandatory: true,
    dueDate: '2024-07-31',
  },
];

export default function CertificationsPage() {
  const [selectedCert, setSelectedCert] = useState<Certification | null>(null);
  const [showUpload, setShowUpload] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'expired':
        return 'destructive';
      case 'pending':
        return 'warning';
      default:
        return 'secondary';
    }
  };

  const getCourseIcon = (type: string) => {
    switch (type) {
      case 'video':
        return <Video className="h-4 w-4" />;
      case 'document':
        return <BookOpen className="h-4 w-4" />;
      case 'quiz':
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const activeCerts = certifications.filter(c => c.status === 'active').length;
  const expiredCerts = certifications.filter(c => c.status === 'expired').length;
  const pendingCourses = trainingCourses.filter(c => c.progress < 100).length;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Certifications & Training</h1>
          <p className="text-gray-600 mt-2">
            Manage your professional certifications and complete training
          </p>
        </div>
        <Dialog open={showUpload} onOpenChange={setShowUpload}>
          <DialogTrigger asChild>
            <Button>
              <Upload className="h-4 w-4 mr-2" />
              Upload Certificate
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Upload New Certification</DialogTitle>
              <DialogDescription>
                Add a new certification to your profile
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Upload your certification documents in PDF or image format. 
                  We'll verify and add them to your profile within 24 hours.
                </AlertDescription>
              </Alert>
              <div className="border-2 border-dashed rounded-lg p-8 text-center">
                <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-sm text-gray-600">
                  Drag and drop your certificate here, or click to browse
                </p>
                <Button variant="outline" className="mt-4">
                  Select File
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Certifications</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeCerts}</div>
            <p className="text-xs text-muted-foreground">Valid credentials</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expiring Soon</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{expiredCerts}</div>
            <p className="text-xs text-muted-foreground">Need renewal</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Training Progress</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingCourses}</div>
            <p className="text-xs text-muted-foreground">Courses to complete</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Compliance Score</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">85%</div>
            <Progress value={85} className="mt-2 h-1" />
          </CardContent>
        </Card>
      </div>

      {/* Certifications List */}
      <Card>
        <CardHeader>
          <CardTitle>Your Certifications</CardTitle>
          <CardDescription>
            Professional certifications and licenses
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {certifications.map((cert) => (
              <div
                key={cert.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
                onClick={() => setSelectedCert(cert)}
              >
                <div className="flex items-center gap-4">
                  <Award className={`h-8 w-8 ${
                    cert.status === 'active' ? 'text-green-500' :
                    cert.status === 'expired' ? 'text-red-500' : 'text-yellow-500'
                  }`} />
                  <div>
                    <h4 className="font-semibold">{cert.name}</h4>
                    <p className="text-sm text-gray-600">{cert.issuer}</p>
                    {cert.credentialId && (
                      <p className="text-xs text-gray-500">ID: {cert.credentialId}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    {cert.status !== 'pending' && (
                      <>
                        <p className="text-sm text-gray-600">
                          Expires: {new Date(cert.expiryDate).toLocaleDateString()}
                        </p>
                        {cert.status === 'expired' && (
                          <p className="text-xs text-red-600">
                            Expired {Math.floor((new Date().getTime() - new Date(cert.expiryDate).getTime()) / (1000 * 60 * 60 * 24))} days ago
                          </p>
                        )}
                      </>
                    )}
                  </div>
                  <div className="flex flex-col gap-1">
                    <Badge variant={getStatusColor(cert.status) as any}>
                      {cert.status}
                    </Badge>
                    {cert.required && (
                      <Badge variant="outline" className="text-xs">
                        Required
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Training Courses */}
      <Card>
        <CardHeader>
          <CardTitle>Training & Development</CardTitle>
          <CardDescription>
            Complete required training to maintain your certifications
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {trainingCourses.map((course) => (
              <div key={course.id} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    {getCourseIcon(course.type)}
                    <div>
                      <h4 className="font-semibold">{course.title}</h4>
                      <p className="text-sm text-gray-600">
                        Duration: {course.duration}
                        {course.dueDate && (
                          <span className="text-red-600 ml-2">
                            • Due: {new Date(course.dueDate).toLocaleDateString()}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {course.mandatory && (
                      <Badge variant="outline" className="text-xs">
                        Mandatory
                      </Badge>
                    )}
                    {course.progress === 100 ? (
                      <Badge variant="success">Completed</Badge>
                    ) : (
                      <Button size="sm">
                        {course.progress > 0 ? 'Continue' : 'Start'}
                      </Button>
                    )}
                  </div>
                </div>
                {course.progress > 0 && course.progress < 100 && (
                  <div className="mt-3">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">Progress</span>
                      <span>{course.progress}%</span>
                    </div>
                    <Progress value={course.progress} className="h-2" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Certification Details Dialog */}
      <Dialog open={!!selectedCert} onOpenChange={() => setSelectedCert(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedCert?.name}</DialogTitle>
            <DialogDescription>
              Certification details and actions
            </DialogDescription>
          </DialogHeader>
          {selectedCert && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Issuer</p>
                  <p className="font-medium">{selectedCert.issuer}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Category</p>
                  <p className="font-medium">{selectedCert.category}</p>
                </div>
                {selectedCert.issueDate && (
                  <div>
                    <p className="text-sm text-gray-600">Issue Date</p>
                    <p className="font-medium">
                      {new Date(selectedCert.issueDate).toLocaleDateString()}
                    </p>
                  </div>
                )}
                {selectedCert.expiryDate && (
                  <div>
                    <p className="text-sm text-gray-600">Expiry Date</p>
                    <p className="font-medium">
                      {new Date(selectedCert.expiryDate).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>

              {selectedCert.credentialId && (
                <div>
                  <p className="text-sm text-gray-600">Credential ID</p>
                  <p className="font-mono text-sm bg-gray-100 p-2 rounded">
                    {selectedCert.credentialId}
                  </p>
                </div>
              )}

              <div className="flex gap-2">
                {selectedCert.status === 'active' && (
                  <Button variant="outline" className="flex-1">
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                )}
                {selectedCert.status === 'expired' && (
                  <Button className="flex-1">
                    Renew Certification
                  </Button>
                )}
                {selectedCert.status === 'pending' && (
                  <Button className="flex-1">
                    Check Status
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}