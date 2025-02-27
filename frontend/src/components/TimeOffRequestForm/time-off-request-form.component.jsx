'use client';

import React, { useState, useContext } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import axios from 'axios'; // Ensure axios is installed: npm install axios
import { AuthContext } from '../../context/AuthContext';

export default function TimeOffRequestForm() {
  const [formData, setFormData] = useState({
    startDate: '',
    endDate: '',
    reason: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { user } = useContext(AuthContext);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      // Replace with your actual API endpoint
      await axios.post(
        '/api/time-off-requests',
        {
          ...formData,
          username: user.username, // Associate request with the user
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`, // Include token if required
          },
        }
      );
      setSuccess('Time-off request submitted successfully!');
      setFormData({ startDate: '', endDate: '', reason: '' });
    } catch (err) {
      console.error('Time-off request submission failed:', err);
      setError('Failed to submit time-off request. Please try again.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <p className="text-red-500">{error}</p>}
      {success && <p className="text-green-500">{success}</p>}
      <div>
        <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">
          Start Date
        </label>
        <Input
          type="date"
          id="startDate"
          name="startDate"
          value={formData.startDate}
          onChange={handleChange}
          required
          className="mt-1 block w-full"
        />
      </div>
      <div>
        <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">
          End Date
        </label>
        <Input
          type="date"
          id="endDate"
          name="endDate"
          value={formData.endDate}
          onChange={handleChange}
          required
          className="mt-1 block w-full"
        />
      </div>
      <div>
        <label htmlFor="reason" className="block text-sm font-medium text-gray-700">
          Reason
        </label>
        <Textarea
          id="reason"
          name="reason"
          value={formData.reason}
          onChange={handleChange}
          required
          className="mt-1 block w-full"
          placeholder="Enter the reason for your time-off request..."
        />
      </div>
      <Button type="submit" className="w-full bg-blue-500 text-white hover:bg-blue-600">
        Submit Request
      </Button>
    </form>
  );
}