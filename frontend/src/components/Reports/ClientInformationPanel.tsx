// File: frontend/src/components/Reports/ClientInformationPanel.tsx

import React from 'react';
import { Card } from '../ui/card';
import { Label } from '../ui/label';
import { ClientData } from '../../types/reports';

interface ClientInformationPanelProps {
  client: ClientData | null;
}

/**
 * ClientInformationPanel Component
 * Displays detailed information about a selected client in a formatted card layout.
 * Includes badges for client status (Active, VIP, New).
 * 
 * @param {ClientInformationPanelProps} props - Component properties
 * @returns {JSX.Element | null} - Rendered component or null if no client selected
 */
const ClientInformationPanel: React.FC<ClientInformationPanelProps> = ({ client }) => {
  if (!client) return null;

  return (
    <Card className="p-6 mb-6">
      <h3 className="text-lg font-medium mb-4">Client Information</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label className="text-sm text-gray-500">Name</Label>
          <p className="font-medium">{client.name}</p>
        </div>
        <div>
          <Label className="text-sm text-gray-500">Location</Label>
          <p className="font-medium">{client.location}</p>
        </div>
        <div>
          <Label className="text-sm text-gray-500">Contact Email</Label>
          <p className="font-medium">{client.contactEmail}</p>
        </div>
        <div>
          <Label className="text-sm text-gray-500">Camera Type</Label>
          <p className="font-medium">{client.cameraType}</p>
        </div>
        <div>
          <Label className="text-sm text-gray-500">Total Cameras</Label>
          <p className="font-medium">{client.cameras}</p>
        </div>
        <div>
          <Label className="text-sm text-gray-500">Status</Label>
          <div className="flex gap-2">
            {client.isActive ? (
              <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded">
                Active
              </span>
            ) : (
              <span className="bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded">
                Inactive
              </span>
            )}
            {client.isVIP && (
              <span className="bg-purple-100 text-purple-800 text-xs font-medium px-2.5 py-0.5 rounded">
                VIP
              </span>
            )}
            {client.isNew && (
              <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">
                New
              </span>
            )}
          </div>
        </div>
        {client.cameraDetails && (
          <div className="col-span-2">
            <Label className="text-sm text-gray-500">Camera Details</Label>
            <p className="font-medium">{client.cameraDetails}</p>
          </div>
        )}
        <div>
          <Label className="text-sm text-gray-500">Address</Label>
          <p className="font-medium">
            {client.location}, {client.city}, {client.state} {client.zipCode}
          </p>
        </div>
        <div>
          <Label className="text-sm text-gray-500">Last Report</Label>
          <p className="font-medium">{new Date(client.lastReportDate).toLocaleDateString()}</p>
        </div>
      </div>
      
      {client.contacts && client.contacts.length > 0 && (
        <div className="mt-6">
          <h4 className="text-md font-medium mb-3">Contact Persons</h4>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {client.contacts.map((contact, index) => (
              <div key={index} className="border rounded-md p-3">
                <div className="flex justify-between">
                  <span className="font-medium">{contact.name}</span>
                  {contact.isPrimary && (
                    <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-0.5 rounded">
                      Primary
                    </span>
                  )}
                </div>
                <div className="text-sm mt-2 text-gray-600">{contact.email}</div>
                <div className="text-sm text-gray-600">{contact.phone}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
};

export default ClientInformationPanel;