'use client'

import React, { useState, useEffect, useMemo } from 'react'
import {
  format,
  startOfMonth,
  endOfMonth,
  parseISO,
  differenceInHours,
  isWithinInterval,
} from 'date-fns'
import {
  Calendar as CalendarIcon,
  DollarSign,
  FileText,
  Download,
  Upload,
  RefreshCw,
  Phone,
  Mail,
  MapPin,
  BarChart2,
  Edit,
  Save,
  Send,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Toast } from '@/components/ui/toast' // Correct import for toast function
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ReTooltip,
  ResponsiveContainer,
} from 'recharts'

// Updated theme colors
const themeColors = {
  textBlack: 'text-black',
  goldText: 'text-yellow-500',
  goldBg: 'bg-yellow-500',
  whiteText: 'text-white',
  whiteBg: 'bg-white',
  darkGrayText: 'text-gray-800',
  darkGrayBg: 'bg-gray-800',
}

// Mock data for employees
const employees = [
  {
    id: 1,
    name: 'John Doe',
    position: 'Security Guard',
    hourlyRate: 15,
    taxRate: 0.2,
    deductions: { health: 50, retirement: 100 },
    phone: '(555) 123-4567',
    email: 'john.doe@example.com',
    address: '123 Main St, Anytown, USA',
    image_url: '/images/guard1.jpg',
  },
  {
    id: 2,
    name: 'Jane Smith',
    position: 'Shift Supervisor',
    hourlyRate: 20,
    taxRate: 0.25,
    deductions: { health: 75, retirement: 150 },
    phone: '(555) 987-6543',
    email: 'jane.smith@example.com',
    address: '456 Oak Ave, Somewhere, USA',
    image_url: '/images/guard2.jpg',
  },
  {
    id: 3,
    name: 'Mike Johnson',
    position: 'Security Guard',
    hourlyRate: 15,
    taxRate: 0.2,
    deductions: { health: 50, retirement: 100 },
    phone: '(555) 246-8135',
    email: 'mike.johnson@example.com',
    address: '789 Pine Rd, Nowhere, USA',
    image_url: '/images/guard3.jpg',
  },
]

// Mock data for timeclock entries
const timeclockEntries = [
  { id: 1, employeeId: 1, date: '2023-06-01', clockIn: '07:55', clockOut: '16:05' },
  { id: 2, employeeId: 1, date: '2023-06-02', clockIn: '07:50', clockOut: '16:10' },
  { id: 3, employeeId: 2, date: '2023-06-01', clockIn: '15:55', clockOut: '00:05' },
  { id: 4, employeeId: 2, date: '2023-06-02', clockIn: '15:58', clockOut: '00:03' },
  { id: 5, employeeId: 3, date: '2023-06-01', clockIn: '23:57', clockOut: '08:02' },
  { id: 6, employeeId: 3, date: '2023-06-02', clockIn: '23:59', clockOut: '08:05' },
]

// Mock data for attendance issues
const attendanceIssues = [
  { id: 1, employeeId: 1, date: '2023-06-03', type: 'call-off', reason: 'Sick' },
  { id: 2, employeeId: 3, date: '2023-06-04', type: 'no-show', reason: 'Unknown' },
]

export default function PayrollPage() {
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [payrollData, setPayrollData] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterPosition, setFilterPosition] = useState('all') // Changed from ''
  const [isProcessing, setIsProcessing] = useState(false)
  const [processProgress, setProcessProgress] = useState(0)
  const [selectedEmployee, setSelectedEmployee] = useState(null)
  const [selectedTab, setSelectedTab] = useState('payroll')
  const [isEditing, setIsEditing] = useState(false)

  useEffect(() => {
    fetchPayrollData()
  }, [selectedDate])

  const fetchPayrollData = async () => {
    setIsLoading(true)
    try {
      // Simulating API call
      await new Promise((resolve) => setTimeout(resolve, 1000))

      const startDate = startOfMonth(selectedDate)
      const endDate = endOfMonth(selectedDate)

      const calculatedPayroll = employees.map((employee) => {
        const employeeEntries = timeclockEntries.filter(
          (entry) =>
            entry.employeeId === employee.id &&
            isWithinInterval(parseISO(entry.date), { start: startDate, end: endDate })
        )

        const totalHours = employeeEntries.reduce((total, entry) => {
          const clockIn = parseISO(`${entry.date}T${entry.clockIn}`)
          const clockOut = parseISO(`${entry.date}T${entry.clockOut}`)
          return total + differenceInHours(clockOut, clockIn)
        }, 0)

        const grossPay = totalHours * (employee.hourlyRate || 0)
        const taxAmount = grossPay * (employee.taxRate || 0)
        const deductions = Object.values(employee.deductions || {}).reduce((a, b) => a + b, 0)
        const netPay = grossPay - taxAmount - deductions

        const employeeIssues = attendanceIssues.filter(
          (issue) =>
            issue.employeeId === employee.id &&
            isWithinInterval(parseISO(issue.date), { start: startDate, end: endDate })
        )

        return {
          ...employee,
          totalHours,
          grossPay,
          taxAmount,
          deductions,
          netPay,
          timeclockEntries: employeeEntries,
          attendanceIssues: employeeIssues,
        }
      })

      setPayrollData(calculatedPayroll)
    } catch (error) {
      console.error('Error fetching payroll data:', error)
      toast({
        title: 'Error',
        description: 'Failed to fetch payroll data. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const filteredPayrollData = useMemo(() => {
    return payrollData
      .filter((employee) => employee.name.toLowerCase().includes(searchTerm.toLowerCase()))
      .filter((employee) =>
        filterPosition !== 'all' ? employee.position === filterPosition : true
      )
  }, [payrollData, searchTerm, filterPosition])

  const processPayroll = async () => {
    setIsProcessing(true)
    setProcessProgress(0)

    for (let i = 0; i <= 100; i += 10) {
      setProcessProgress(i)
      await new Promise((resolve) => setTimeout(resolve, 200))
    }

    setIsProcessing(false)
    toast({
      title: 'Success',
      description: 'Payroll processed successfully!',
      variant: 'default',
    })
  }

  const formatCurrency = (value) => {
    return value ? `$${value.toFixed(2)}` : '$0.00'
  }

  const formatNumber = (value) => {
    return value ? value.toFixed(2) : '0.00'
  }

  const handleEditToggle = () => {
    setIsEditing(!isEditing)
  }

  const handleEmployeeUpdate = (field, value) => {
    setSelectedEmployee({ ...selectedEmployee, [field]: value })
  }

  const exportToPDF = () => {
    // Implement PDF export functionality here
    toast({
      title: 'Export',
      description: 'Payroll report exported as PDF.',
      variant: 'default',
    })
  }

  const emailPayslip = () => {
    // Implement email functionality here
    toast({
      title: 'Email Sent',
      description: 'Payslip emailed to the employee.',
      variant: 'default',
    })
  }

  const renderEmployeeDetails = () => {
    if (!selectedEmployee) return null

    return (
      <div className="space-y-4">
        <div className="flex items-center space-x-4">
          <img
            src={selectedEmployee.image_url}
            alt={selectedEmployee.name}
            className="h-24 w-24 object-cover rounded-full"
          />
          <div>
            <h2 className="text-2xl font-bold">{selectedEmployee.name}</h2>
            <div className="flex items-center mt-2">
              <Phone className="mr-2 h-4 w-4" />
              <span>{selectedEmployee.phone}</span>
            </div>
            <div className="flex items-center mt-1">
              <Mail className="mr-2 h-4 w-4" />
              <span>{selectedEmployee.email}</span>
            </div>
          </div>
        </div>
        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList>
            <TabsTrigger value="payroll">Payroll</TabsTrigger>
            <TabsTrigger value="timeclock">Timeclock</TabsTrigger>
            <TabsTrigger value="attendance">Attendance</TabsTrigger>
            <TabsTrigger value="contact">Contact</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>
          <TabsContent value="payroll">
            <Card className="border-0">
              <CardHeader>
                <CardTitle className={themeColors.textBlack}>Payroll Details</CardTitle>
                <div className="flex space-x-2">
                  <Button variant="outline" onClick={exportToPDF}>
                    <Download className="mr-2 h-4 w-4" />
                    Export PDF
                  </Button>
                  <Button variant="outline" onClick={emailPayslip}>
                    <Send className="mr-2 h-4 w-4" />
                    Email Payslip
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="font-medium">Hourly Rate:</p>
                    {isEditing ? (
                      <Input
                        type="number"
                        value={selectedEmployee.hourlyRate}
                        onChange={(e) =>
                          handleEmployeeUpdate('hourlyRate', parseFloat(e.target.value))
                        }
                      />
                    ) : (
                      <p>{formatCurrency(selectedEmployee.hourlyRate)}</p>
                    )}
                  </div>
                  <div>
                    <p className="font-medium">Total Hours:</p>
                    <p>{formatNumber(selectedEmployee.totalHours)}</p>
                  </div>
                  <div>
                    <p className="font-medium">Gross Pay:</p>
                    <p>{formatCurrency(selectedEmployee.grossPay)}</p>
                  </div>
                  <div>
                    <p className="font-medium">Tax Amount:</p>
                    <p>{formatCurrency(selectedEmployee.taxAmount)}</p>
                  </div>
                  <div>
                    <p className="font-medium">Deductions:</p>
                    <p>{formatCurrency(selectedEmployee.deductions)}</p>
                  </div>
                  <div>
                    <p className="font-medium">Net Pay:</p>
                    <p>{formatCurrency(selectedEmployee.netPay)}</p>
                  </div>
                </div>
                <div className="mt-4">
                  {isEditing ? (
                    <Button variant="success" onClick={handleEditToggle}>
                      <Save className="mr-2 h-4 w-4" />
                      Save Changes
                    </Button>
                  ) : (
                    <Button variant="outline" onClick={handleEditToggle}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="timeclock">
            <Card className="border-0">
              <CardHeader>
                <CardTitle className={themeColors.textBlack}>Timeclock Entries</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Clock In</TableHead>
                      <TableHead>Clock Out</TableHead>
                      <TableHead>Total Hours</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedEmployee.timeclockEntries.map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell>{entry.date}</TableCell>
                        <TableCell>{entry.clockIn}</TableCell>
                        <TableCell>{entry.clockOut}</TableCell>
                        <TableCell>
                          {formatNumber(
                            differenceInHours(
                              parseISO(`${entry.date}T${entry.clockOut}`),
                              parseISO(`${entry.date}T${entry.clockIn}`)
                            )
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="attendance">
            <Card className="border-0">
              <CardHeader>
                <CardTitle className={themeColors.textBlack}>Attendance Issues</CardTitle>
              </CardHeader>
              <CardContent>
                {selectedEmployee.attendanceIssues.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Reason</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedEmployee.attendanceIssues.map((issue) => (
                        <TableRow key={issue.id}>
                          <TableCell>{issue.date}</TableCell>
                          <TableCell>
                            <Badge
                              variant={issue.type === 'call-off' ? 'secondary' : 'destructive'}
                            >
                              {issue.type}
                            </Badge>
                          </TableCell>
                          <TableCell>{issue.reason}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p>No attendance issues recorded for this period.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="contact">
            <Card className="border-0">
              <CardHeader>
                <CardTitle className={themeColors.textBlack}>Contact Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <Phone className="mr-2 h-4 w-4" />
                    {isEditing ? (
                      <Input
                        value={selectedEmployee.phone}
                        onChange={(e) => handleEmployeeUpdate('phone', e.target.value)}
                      />
                    ) : (
                      <span>{selectedEmployee.phone}</span>
                    )}
                  </div>
                  <div className="flex items-center">
                    <Mail className="mr-2 h-4 w-4" />
                    {isEditing ? (
                      <Input
                        value={selectedEmployee.email}
                        onChange={(e) => handleEmployeeUpdate('email', e.target.value)}
                      />
                    ) : (
                      <span>{selectedEmployee.email}</span>
                    )}
                  </div>
                  <div className="flex items-center">
                    <MapPin className="mr-2 h-4 w-4" />
                    {isEditing ? (
                      <Input
                        value={selectedEmployee.address}
                        onChange={(e) => handleEmployeeUpdate('address', e.target.value)}
                      />
                    ) : (
                      <span>{selectedEmployee.address}</span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="analytics">
            <Card className="border-0">
              <CardHeader>
                <CardTitle className={themeColors.textBlack}>Payroll Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={selectedEmployee.timeclockEntries}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <ReTooltip />
                    <Line
                      type="monotone"
                      dataKey={(entry) =>
                        differenceInHours(
                          parseISO(`${entry.date}T${entry.clockOut}`),
                          parseISO(`${entry.date}T${entry.clockIn}`)
                        )
                      }
                      stroke="#8884d8"
                      name="Hours Worked"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className={`text-3xl font-bold mb-6 ${themeColors.goldText}`}>Payroll Management</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card className={`${themeColors.darkGrayBg} ${themeColors.whiteText}`}>
          <CardHeader>
            <CardTitle className="text-white">Payroll Period</CardTitle>
          </CardHeader>
          <CardContent>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal text-white border-white"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {format(selectedDate, 'MMMM yyyy')}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && setSelectedDate(date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </CardContent>
        </Card>
        <Card className={`${themeColors.darkGrayBg} ${themeColors.whiteText}`}>
          <CardHeader>
            <CardTitle className="text-white">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="flex space-x-2">
            <Button onClick={processPayroll} disabled={isProcessing} className="bg-yellow-500">
              <DollarSign className="mr-2 h-4 w-4" />
              Process Payroll
            </Button>
            <Button variant="outline" className="text-white border-white">
              <FileText className="mr-2 h-4 w-4" />
              Generate Reports
            </Button>
          </CardContent>
        </Card>
        <Card className={`${themeColors.darkGrayBg} ${themeColors.whiteText}`}>
          <CardHeader>
            <CardTitle className="text-white">Payroll Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm">Total Gross Pay</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(
                    payrollData.reduce((sum, employee) => sum + (employee.grossPay || 0), 0)
                  )}
                </p>
              </div>
              <div>
                <p className="text-sm">Total Net Pay</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(
                    payrollData.reduce((sum, employee) => sum + (employee.netPay || 0), 0)
                  )}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-white">
        <CardHeader>
          <CardTitle className={themeColors.textBlack}>Employee Payroll Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap space-x-2 mb-4">
            <Input
              type="text"
              placeholder="Search employees..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
            <Select value={filterPosition} onValueChange={setFilterPosition}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by position" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Positions</SelectItem>
                <SelectItem value="Security Guard">Security Guard</SelectItem>
                <SelectItem value="Shift Supervisor">Shift Supervisor</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={fetchPayrollData}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          </div>
          {isLoading ? (
            <div className="flex justify-center items-center h-40">
              <RefreshCw className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Position</TableHead>
                  <TableHead>Hours</TableHead>
                  <TableHead>Gross Pay</TableHead>
                  <TableHead>Taxes</TableHead>
                  <TableHead>Deductions</TableHead>
                  <TableHead>Net Pay</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPayrollData.map((employee) => (
                  <TableRow key={employee.id}>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Avatar>
                          {employee.image_url ? (
                            <AvatarImage src={employee.image_url} alt={employee.name} />
                          ) : (
                            <AvatarFallback>
                              {employee.name
                                .split(' ')
                                .map((n) => n[0])
                                .join('')}
                            </AvatarFallback>
                          )}
                        </Avatar>
                        <span>{employee.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>{employee.position}</TableCell>
                    <TableCell>{formatNumber(employee.totalHours)}</TableCell>
                    <TableCell>{formatCurrency(employee.grossPay)}</TableCell>
                    <TableCell>{formatCurrency(employee.taxAmount)}</TableCell>
                    <TableCell>{formatCurrency(employee.deductions)}</TableCell>
                    <TableCell>{formatCurrency(employee.netPay)}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        onClick={() => {
                          setSelectedEmployee(employee)
                          setSelectedTab('payroll')
                        }}
                      >
                        Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {selectedEmployee && (
        <Dialog open={!!selectedEmployee} onOpenChange={() => setSelectedEmployee(null)}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle className={themeColors.goldText}>
                Employee Details: {selectedEmployee.name}
              </DialogTitle>
              <DialogDescription>
                View detailed information about {selectedEmployee.name}.
              </DialogDescription>
            </DialogHeader>
            {renderEmployeeDetails()}
          </DialogContent>
        </Dialog>
      )}

      {isProcessing && (
        <Dialog open={isProcessing} onOpenChange={setIsProcessing}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Processing Payroll</DialogTitle>
            </DialogHeader>
            <Progress value={processProgress} className="w-full" />
            <p className="text-center">{processProgress}% Complete</p>
          </DialogContent>
        </Dialog>
      )}

      <div className="mt-6 flex justify-end space-x-2">
        <Button variant="outline">
          <Upload className="mr-2 h-4 w-4" />
          Import Data
        </Button>
        <Button variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Export Payroll
        </Button>
        <Button variant="outline">
          <BarChart2 className="mr-2 h-4 w-4" />
          Analytics
        </Button>
      </div>
    </div>
  )
}