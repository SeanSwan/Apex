// File: frontend/src/components/Reports/PropertyInfoPage.tsx
/**
 * PropertyInfoPage.tsx
 *
 * Displays property details along with intrusion data (e.g., human and vehicle intrusions).
 * Data is simulated here but could be fetched via an API.
 *
 * Future enhancements:
 *   - Integrate a map view for property location.
 *   - Update intrusion counts in real time via WebSockets.
 *   - Show additional property details (address, camera statuses, etc.)
 */

import React, { useEffect, useState } from 'react';
import styled from 'styled-components';

const Container = styled.div`
  padding: 1rem;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-bottom: 2rem;
`;

const Title = styled.h2`
  margin-bottom: 1rem;
`;

const DataTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  th, td {
    padding: 0.75rem;
    border: 1px solid #ddd;
    text-align: left;
  }
  th {
    background-color: #f5f5f5;
  }
`;

export interface IntrusionData {
  type: string;
  count: number;
}

interface PropertyInfoPageProps {
  setPropertyData: (data: IntrusionData[]) => void;
}

const PropertyInfoPage: React.FC<PropertyInfoPageProps> = ({ setPropertyData }) => {
  const [intrusions, setIntrusions] = useState<IntrusionData[]>([
    { type: 'Human Intrusions', count: 0 },
    { type: 'Vehicle Intrusions', count: 0 },
  ]);

  useEffect(() => {
    const fetchData = () => {
      const updatedData = [
        { type: 'Human Intrusions', count: Math.floor(Math.random() * 10) },
        { type: 'Vehicle Intrusions', count: Math.floor(Math.random() * 5) },
      ];
      setIntrusions(updatedData);
      setPropertyData(updatedData);
    };

    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [setPropertyData]);

  return (
    <Container>
      <Title>Property Information & Intrusion Data</Title>
      <DataTable>
        <thead>
          <tr>
            <th>Intrusion Type</th>
            <th>Count</th>
          </tr>
        </thead>
        <tbody>
          {intrusions.map((intrusion) => (
            <tr key={intrusion.type}>
              <td>{intrusion.type}</td>
              <td>{intrusion.count}</td>
            </tr>
          ))}
        </tbody>
      </DataTable>
    </Container>
  );
};

export default PropertyInfoPage;
