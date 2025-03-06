'use client'

import React, { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { AlertCircle, Users, Building, FileText, Settings, Bell } from 'lucide-react'

// Mock data for demonstration purposes
const performanceData = [
  { name: 'John Doe', punctuality: 95, patrolCompletion: 98, reportSubmission: 100 },
  { name: 'Jane Smith', punctuality: 92, patrolCompletion: 95, reportSubmission: 97 },
  { name: 'Bob Johnson', punctuality: 88, patrolCompletion: 90, reportSubmission: 95 },
]

const guardLocations = [
  { id: 1, name: 'John Doe', lat: 40.7128, lng: -74.0060 },
  { id: 2, name: 'Jane Smith', lat: 40.7282, lng: -73.7949 },
  { id: 3, name: 'Bob Johnson', lat: 40.7489, lng: -73.9680 },
]

export default function AdminDashboard() {
  const [selectedTab, setSelectedTab] = useState('analytics')

  return (
    <div className="container mx-auto p-4">
      <header className="mb-8">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-gray-500">Welcome back, Admin</p>
      </header>

      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="monitoring">Real-Time Monitoring</TabsTrigger>
          <TabsTrigger value="staff">Staff Management</TabsTrigger>
          <TabsTrigger value="clients">Client Management</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
          <TabsTrigger value="system">System Health</TabsTrigger>
        </TabsList>

        <TabsContent value="analytics">
          <AnalyticsDashboard />
        </TabsContent>

        <TabsContent value="monitoring">
          <RealTimeMonitoring />
        </TabsContent>

        <TabsContent value="staff">
          <StaffManagement />
        </TabsContent>

        <TabsContent value="clients">
          <ClientManagement />
        </TabsContent>

        <TabsContent value="reports">
          <ReportsGenerator />
        </TabsContent>

        <TabsContent value="system">
          <SystemHealth />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function AnalyticsDashboard() {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Staff Performance Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={performanceData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="punctuality" fill="#8884d8" />
              <Bar dataKey="patrolCompletion" fill="#82ca9d" />
              <Bar dataKey="reportSubmission" fill="#ffc658" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Operational Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <h3 className="font-semibold">Staffing Levels</h3>
              <p className="text-2xl">42 / 50</p>
            </div>
            <div>
              <h3 className="font-semibold">Overtime Hours</h3>
              <p className="text-2xl">126 hrs</p>
            </div>
            <div>
              <h3 className="font-semibold">Shift Coverage</h3>
              <p className="text-2xl">98%</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function RealTimeMonitoring() {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Live Location Tracking</CardTitle>
        </CardHeader>
        <CardContent>
          <div style={{ height: '400px', width: '100%' }}>
            <MapContainer center={[40.7128, -74.0060]} zoom={11} style={{ height: '100%', width: '100%' }}>
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              {guardLocations.map((guard) => (
                <Marker key={guard.id} position={[guard.lat, guard.lng]}>
                  <Popup>{guard.name}</Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Incident Reports</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Time</TableHead>
                <TableHead>Guard</TableHead>
                <TableHead>Incident Type</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell>09:45 AM</TableCell>
                <TableCell>John Doe</TableCell>
                <TableCell>Suspicious Activity</TableCell>
                <TableCell>
                  <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded">Pending</span>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>11:20 AM</TableCell>
                <TableCell>Jane Smith</TableCell>
                <TableCell>Maintenance Issue</TableCell>
                <TableCell>
                  <span className="bg-green-100 text-green-800 px-2 py-1 rounded">Resolved</span>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

function StaffManagement() {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>User Access Control</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="username">Username</Label>
                <Input id="username" placeholder="Enter username" />
              </div>
              <div>
                <Label htmlFor="role">Role</Label>
                <Select>
                  <SelectTrigger id="role">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="guard">Guard</SelectItem>
                    <SelectItem value="supervisor">Supervisor</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button>Add User</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Scheduling System</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Placeholder for a more complex scheduling component */}
          <p>Scheduling system component would go here</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Time-Off Approvals</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Start Date</TableHead>
                <TableHead>End Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell>John Doe</TableCell>
                <TableCell>2023-10-01</TableCell>
                <TableCell>2023-10-05</TableCell>
                <TableCell>Pending</TableCell>
                <TableCell>
                  <Button size="sm" className="mr-2">Approve</Button>
                  <Button size="sm" variant="destructive">Deny</Button>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

function ClientManagement() {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Property Profiles</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Property Name</TableHead>
                <TableHead>Address</TableHead>
                <TableHead>Assigned Guards</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell>Skyline Tower</TableCell>
                <TableCell>123 Main St, Cityville</TableCell>
                <TableCell>John Doe, Jane Smith</TableCell>
                <TableCell>
                  <Button size="sm">View Details</Button>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Client Feedback</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client</TableHead>
                <TableHead>Property</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead>Comment</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell>Acme Corp</TableCell>
                <TableCell>Skyline Tower</TableCell>
                <TableCell>4.5/5</TableCell>
                <TableCell>Great service, very responsive team.</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

function ReportsGenerator() {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Generate Custom Report</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="report-type">Report Type</Label>
                <Select>
                  <SelectTrigger id="report-type">
                    <SelectValue placeholder="Select report type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="performance">Staff Performance</SelectItem>
                    <SelectItem value="incidents">Incident Reports</SelectItem>
                    <SelectItem value="client-feedback">Client Feedback</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="date-range">Date Range</Label>
                <Input id="date-range" type="date" />
              </div>
            </div>
            <Button>Generate Report</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Reports</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Report Name</TableHead>
                <TableHead>Generated On</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell>Q3 Performance Report</TableCell>
                <TableCell>2023-10-01</TableCell>
                <TableCell>Staff Performance</TableCell>
                <TableCell>
                  <Button size="sm">Download</Button>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

function SystemHealth() {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>System Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <h3 className="font-semibold">Server Uptime</h3>
              <p className="text-2xl">99.9%</p>
            </div>
            <div>
              <h3 className="font-semibold">Database Status</h3>
              <p className="text-2xl text-green-500">Healthy</p>
            </div>
            <div>
              <h3 className="font-semibold">Last Backup</h3>
              <p className="text-2xl">2 hours ago</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Error Logs</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableHead>Error Type</TableHead>
                <TableHead>Message</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell>2023-09-25 14:30:22</TableCell>
                <TableCell>Database Connection</TableCell>
                <TableCell>Connection timeout</TableCell>
                <TableCell>
                  <span className="bg-red-100 text-red-800 px-2 py-1 rounded">Unresolved</span>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>System Updates</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span>Security Patch v2.3.1</span>
              <Button size="sm">Install</Button>
            </div>
            <div className="flex justify-between items-center">
              <span>Feature Update v4.0.0</span>
              <Button size="sm">Install</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}