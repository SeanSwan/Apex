// File: frontend/src/components/Reports/ClientSelector.tsx

import React, { useState } from 'react';
import styled from 'styled-components';
import { ClientData } from '../../types/reports';

// Styled components
const Section = styled.div`
  margin-bottom: 2rem;
`;

const SectionTitle = styled.h3`
  font-size: 1.25rem;
  margin-bottom: 1rem;
  color: #333;
  font-weight: 600;
  border-bottom: 2px solid #f0f0f0;
  padding-bottom: 0.5rem;
`;

const ClientGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1rem;
  margin-top: 1rem;
`;

const ClientCard = styled.div<{ active: boolean }>`
  padding: 1rem;
  border-radius: 8px;
  border: 2px solid ${props => props.active ? '#0070f3' : '#e0e0e0'};
  background-color: ${props => props.active ? '#f0f7ff' : '#fff'};
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
  }
`;

const ClientName = styled.h4`
  margin: 0 0 0.5rem 0;
  color: #333;
`;

const ClientDetail = styled.div`
  margin-bottom: 0.25rem;
  font-size: 0.875rem;
  color: #666;
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  font-size: 0.875rem;
  margin-bottom: 1rem;
  
  &:focus {
    border-color: #0070f3;
    outline: none;
    box-shadow: 0 0 0 2px rgba(0, 112, 243, 0.2);
  }
`;

const NoClients = styled.div`
  text-align: center;
  padding: 2rem;
  background-color: #f9f9f9;
  border-radius: 8px;
  color: #666;
`;

const ClientLabel = styled.span<{ type: string }>`
  display: inline-block;
  padding: 0.25rem 0.5rem;
  border-radius: 999px;
  font-size: 0.75rem;
  margin-right: 0.5rem;
  
  background-color: ${props => {
    switch (props.type) {
      case 'active': return '#e8f5e9';
      case 'new': return '#e3f2fd';
      case 'vip': return '#fef3e0';
      default: return '#f5f5f5';
    }
  }};
  
  color: ${props => {
    switch (props.type) {
      case 'active': return '#2e7d32';
      case 'new': return '#0d47a1';
      case 'vip': return '#e65100';
      default: return '#616161';
    }
  }};
`;

const StatsContainer = styled.div`
  display: flex;
  margin-top: 0.5rem;
  gap: 0.5rem;
`;

const Stat = styled.div`
  flex: 1;
  background-color: #f5f5f5;
  padding: 0.5rem;
  border-radius: 4px;
  text-align: center;
  font-size: 0.75rem;
  
  strong {
    display: block;
    font-size: 1rem;
    color: #333;
  }
`;

interface ClientSelectorProps {
  clients: ClientData[];
  selectedClient: ClientData | null;
  onSelectClient: (client: ClientData) => void;
}

const ClientSelector: React.FC<ClientSelectorProps> = ({
  clients,
  selectedClient,
  onSelectClient,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Filter clients based on search query
  const filteredClients = clients.filter(client => 
    client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.location?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.siteName?.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  return (
    <Section>
      <SectionTitle>Select Client</SectionTitle>
      
      {/* Search input */}
      <SearchInput
        type="text"
        placeholder="Search clients by name or location..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />
      
      {/* Client grid */}
      {filteredClients.length === 0 ? (
        <NoClients>
          <p>No clients found matching your search.</p>
        </NoClients>
      ) : (
        <ClientGrid>
          {filteredClients.map(client => (
            <ClientCard
              key={client.id}
              active={selectedClient?.id === client.id}
              onClick={() => onSelectClient(client)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <ClientName>{client.name}</ClientName>
                
                <div>
                  {client.isActive && <ClientLabel type="active">Active</ClientLabel>}
                  {client.isNew && <ClientLabel type="new">New</ClientLabel>}
                  {client.isVIP && <ClientLabel type="vip">VIP</ClientLabel>}
                </div>
              </div>
              
              <ClientDetail>{client.siteName || client.name} Site</ClientDetail>
              <ClientDetail>{client.location || 'Location not specified'}</ClientDetail>
              
              <StatsContainer>
                <Stat>
                  <strong>{client.cameras || 0}</strong>
                  Cameras
                </Stat>
                <Stat>
                  <strong>{client.lastReportDate ? new Date(client.lastReportDate).toLocaleDateString() : 'Never'}</strong>
                  Last Report
                </Stat>
              </StatsContainer>
            </ClientCard>
          ))}
        </ClientGrid>
      )}
    </Section>
  );
};

export default ClientSelector;