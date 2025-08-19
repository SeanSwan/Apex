// client-portal/src/components/incidents/IncidentsPage.tsx
/**
 * Incidents Management Page
 * =========================
 * Main page component that orchestrates the incident investigation interface
 * by combining the IncidentBrowser and IncidentDetailsModal components
 */

import React, { useState } from 'react';
import { IncidentBrowser } from './IncidentBrowser';
import { IncidentDetailsModal } from './IncidentDetailsModal';
import { Incident } from '@/types/client.types';

// ===========================
// MAIN INCIDENTS PAGE COMPONENT
// ===========================

export const IncidentsPage: React.FC = () => {
  // ===========================
  // STATE MANAGEMENT
  // ===========================
  
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // ===========================
  // EVENT HANDLERS
  // ===========================

  const handleIncidentSelect = (incident: Incident) => {
    setSelectedIncident(incident);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedIncident(null);
  };

  // ===========================
  // RENDER
  // ===========================

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="apex-page-header">
        <div className="apex-page-title">
          <h1 className="apex-page-heading">Security Incidents</h1>
          <p className="apex-page-description">
            Comprehensive incident investigation and analysis tools for security event management
          </p>
        </div>
      </div>

      {/* Incident Browser */}
      <div className="apex-main-panel">
        <IncidentBrowser
          onIncidentSelect={handleIncidentSelect}
          showHeader={false} // Header is handled by page component
          showExport={true}
        />
      </div>

      {/* Incident Details Modal */}
      <IncidentDetailsModal
        incident={selectedIncident}
        isOpen={isModalOpen}
        onClose={handleModalClose}
      />
    </div>
  );
};

export default IncidentsPage;