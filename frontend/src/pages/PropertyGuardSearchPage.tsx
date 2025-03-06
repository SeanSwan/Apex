'use client'

import React, { useState, useEffect } from 'react'
import {
  Search,
  Building,
  User,
  Star,
  Phone,
  AlertTriangle,
  Calendar,
  Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

// Mock data for properties and guards
const properties = [
  { id: 1, name: 'Sonesta Redondo Beach & Marina', address: '300 N Harbor Dr, Redondo Beach, CA 90277', rating: 4.5, image_url: '/placeholder.svg?height=300&width=300', client_since: '2020-01-15' },
  { id: 2, name: 'Llewellyn Apartments', address: '1101 N Main St, Los Angeles, CA 90012', rating: 4.2, image_url: '/placeholder.svg?height=300&width=300', client_since: '2019-06-22' },
  { id: 3, name: 'Tustin Plaza', address: 'Tustin, CA (address not provided)', rating: 4.0, image_url: '/placeholder.svg?height=300&width=300', client_since: '2021-03-10' },
  { id: 4, name: 'Elinor', address: 'Address to be determined', rating: 4.3, image_url: '/placeholder.svg?height=300&width=300', client_since: '2018-05-14' },
  { id: 5, name: 'Arq', address: 'Address to be determined', rating: 4.1, image_url: '/placeholder.svg?height=300&width=300', client_since: '2020-11-09' },
  { id: 6, name: 'The Alfred', address: 'Address to be determined', rating: 4.4, image_url: '/placeholder.svg?height=300&width=300', client_since: '2017-04-03' },
  { id: 7, name: 'The Remi San Bernardino', address: 'San Bernardino, CA (address not provided)', rating: 4.6, image_url: '/placeholder.svg?height=300&width=300', client_since: '2016-02-29' },
  { id: 8, name: 'Westhaven', address: 'Address to be determined', rating: 4.2, image_url: '/placeholder.svg?height=300&width=300', client_since: '2020-10-19' },
  { id: 9, name: 'Villa Park', address: 'Address to be determined', rating: 4.3, image_url: '/placeholder.svg?height=300&width=300', client_since: '2019-07-11' },
  { id: 10, name: 'Ami-On Olive', address: 'Address to be determined', rating: 4.1, image_url: '/placeholder.svg?height=300&width=300', client_since: '2021-09-16' },
  { id: 11, name: 'Remi Living at Noho', address: 'North Hollywood, CA (address not provided)', rating: 4.5, image_url: '/placeholder.svg?height=300&width=300', client_since: '2018-03-25' },
  { id: 12, name: 'Sonesta R/B Modera', address: 'Address to be determined', rating: 4.0, image_url: '/placeholder.svg?height=300&width=300', client_since: '2021-05-01' },
  { id: 13, name: 'Circa', address: 'Address to be determined', rating: 4.6, image_url: '/placeholder.svg?height=300&width=300', client_since: '2016-08-20' },
  { id: 14, name: 'Kurve', address: 'Address to be determined', rating: 4.4, image_url: '/placeholder.svg?height=300&width=300', client_since: '2020-12-04' },
  { id: 15, name: 'San Bernardino', address: 'Address to be determined', rating: 4.3, image_url: '/placeholder.svg?height=300&width=300', client_since: '2017-11-08' },
  { id: 16, name: 'Wakaba', address: 'Address to be determined', rating: 4.2, image_url: '/placeholder.svg?height=300&width=300', client_since: '2021-02-14' },
  { id: 17, name: 'Sunset', address: 'Address to be determined', rating: 4.1, image_url: '/placeholder.svg?height=300&width=300', client_since: '2019-06-17' },
  { id: 18, name: 'Opus', address: 'Address to be determined', rating: 4.5, image_url: '/placeholder.svg?height=300&width=300', client_since: '2016-10-05' },
  { id: 19, name: 'Emerald', address: 'Address to be determined', rating: 4.6, image_url: '/placeholder.svg?height=300&width=300', client_since: '2017-12-19' },
  { id: 20, name: 'Onyx DTLA', address: 'Address to be determined', rating: 4.7, image_url: '/placeholder.svg?height=300&width=300', client_since: '2021-07-14' },
  { id: 21, name: 'Topaz', address: 'Address to be determined', rating: 4.4, image_url: '/placeholder.svg?height=300&width=300', client_since: '2020-05-06' },
  { id: 22, name: 'The Remi M-F Bell South', address: 'Bell, CA (address not provided)', rating: 4.3, image_url: '/placeholder.svg?height=300&width=300', client_since: '2017-08-24' },
  { id: 23, name: 'Zen Hollywood', address: 'Hollywood, CA (address not provided)', rating: 4.6, image_url: '/placeholder.svg?height=300&width=300', client_since: '2019-01-30' },
  { id: 24, name: 'Solamonte', address: 'Rancho Cucamonga, CA (address not provided)', rating: 4.5, image_url: '/placeholder.svg?height=300&width=300', client_since: '2018-06-13' },
  { id: 25, name: 'Mirador Apt', address: 'Address to be determined', rating: 4.2, image_url: '/placeholder.svg?height=300&width=300', client_since: '2017-04-09' },
  { id: 26, name: 'Watermark', address: 'Address to be determined', rating: 4.3, image_url: '/placeholder.svg?height=300&width=300', client_since: '2016-09-18' },
  { id: 27, name: 'La Plaza', address: 'Address to be determined', rating: 4.4, image_url: '/placeholder.svg?height=300&width=300', client_since: '2020-12-31' },
  { id: 28, name: 'Westbury', address: 'Address to be determined', rating: 4.5, image_url: '/placeholder.svg?height=300&width=300', client_since: '2018-11-26' },
  { id: 29, name: 'Access', address: 'Address to be determined', rating: 4.6, image_url: '/placeholder.svg?height=300&width=300', client_since: '2019-05-18' },
  { id: 30, name: 'CC Tan', address: 'Address to be determined', rating: 4.3, image_url: '/placeholder.svg?height=300&width=300', client_since: '2021-03-22' }
];


const guards = [
  {
    id: 1,
    name: 'John Doe',
    rating: 4.8,
    image_url: '/guard1.jpg',
    number: '(555) 123-4567',
    emergency_number: '(555) 987-6543',
  },
  // ... rest of the guards
]

export default function PropertyGuardSearchPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedTab, setSelectedTab] = useState('properties')
  const [selectedItem, setSelectedItem] = useState(null)
  const [items, setItems] = useState([])
  const [sortBy, setSortBy] = useState('name')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      setError(null)
      try {
        // Simulating API call with setTimeout
        await new Promise((resolve) => setTimeout(resolve, 1000))
        const data = selectedTab === 'properties' ? properties : guards
        const filteredData = data.filter((item) =>
          item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (item.address &&
            item.address.toLowerCase().includes(searchTerm.toLowerCase()))
        )
        const sortedData = filteredData.sort((a, b) => {
          if (sortBy === 'name') return a.name.localeCompare(b.name)
          if (sortBy === 'rating') return b.rating - a.rating
          return 0
        })
        setItems(sortedData)
      } catch (err) {
        setError('Failed to fetch data. Please try again.')
        // Handle error appropriately
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [searchTerm, selectedTab, sortBy])

  const handleSelectItem = (item) => {
    setSelectedItem(item)
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Property and Guard Search</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Search</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex space-x-2 mb-4">
              <Input
                type="text"
                placeholder="Search properties or guards..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-grow"
              />
              <Button variant="outline">
                <Search className="h-4 w-4 mr-2" />
                Search
              </Button>
            </div>
            <Tabs value={selectedTab} onValueChange={setSelectedTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="properties">Properties</TabsTrigger>
                <TabsTrigger value="guards">Guards</TabsTrigger>
              </TabsList>
              <TabsContent value="properties">
                <PropertyTable
                  items={items}
                  onSelectItem={handleSelectItem}
                  isLoading={isLoading}
                />
              </TabsContent>
              <TabsContent value="guards">
                <GuardTable
                  items={items}
                  onSelectItem={handleSelectItem}
                  isLoading={isLoading}
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Details</CardTitle>
          </CardHeader>
          <CardContent>
            {selectedItem ? (
              <div>
                <div className="mb-4 flex justify-center">
                  <img
                    src={selectedItem.image_url}
                    alt={selectedItem.name}
                    className="h-40 w-40 object-cover rounded"
                  />
                </div>
                <h2 className="text-2xl font-bold mb-2">{selectedItem.name}</h2>
                {selectedItem.address && (
                  <p className="text-gray-600 mb-2">
                    <Building className="inline-block mr-2 h-4 w-4" />
                    {selectedItem.address}
                  </p>
                )}
                <p className="flex items-center mb-2">
                  <Star className="mr-2 h-4 w-4 text-yellow-400" />
                  Rating: {selectedItem.rating}
                </p>
                {selectedItem.number && (
                  <p className="flex items-center mb-2">
                    <Phone className="mr-2 h-4 w-4" />
                    {selectedItem.number}
                  </p>
                )}
                {selectedItem.emergency_number && (
                  <p className="flex items-center mb-2">
                    <AlertTriangle className="mr-2 h-4 w-4 text-red-500" />
                    Emergency: {selectedItem.emergency_number}
                  </p>
                )}
                {selectedItem.client_since && (
                  <p className="flex items-center mb-2">
                    <Calendar className="mr-2 h-4 w-4" />
                    Client Since:{' '}
                    {new Date(selectedItem.client_since).toLocaleDateString()}
                  </p>
                )}
                {/* Video Canvas for Properties */}
                {selectedTab === 'properties' && selectedItem.video_url && (
                  <div className="mt-4">
                    <h3 className="text-lg font-semibold mb-2">Property Video</h3>
                    <video
                      controls
                      src={selectedItem.video_url}
                      className="w-full h-64 bg-black"
                    />
                  </div>
                )}
              </div>
            ) : (
              <p className="text-center text-gray-500">
                Select an item to view details
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function PropertyTable({ items, onSelectItem, isLoading }) {
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-40">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Address</TableHead>
          <TableHead>Rating</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((item) => (
          <TableRow
            key={item.id}
            onClick={() => onSelectItem(item)}
            className="cursor-pointer hover:bg-gray-100"
          >
            <TableCell>{item.name}</TableCell>
            <TableCell>{item.address}</TableCell>
            <TableCell>{item.rating}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

function GuardTable({ items, onSelectItem, isLoading }) {
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-40">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Rating</TableHead>
          <TableHead>Phone</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((item) => (
          <TableRow
            key={item.id}
            onClick={() => onSelectItem(item)}
            className="cursor-pointer hover:bg-gray-100"
          >
            <TableCell>{item.name}</TableCell>
            <TableCell>{item.rating}</TableCell>
            <TableCell>{item.number}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}