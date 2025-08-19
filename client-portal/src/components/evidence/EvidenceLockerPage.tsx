// client-portal/src/components/evidence/EvidenceLockerPage.tsx
/**
 * Evidence Locker Management Page
 * ==============================
 * Main page component that orchestrates the evidence management interface
 * by combining the EvidenceLocker and EvidenceDetailsModal components
 */

import React, { useState } from 'react';
import { EvidenceLocker } from './EvidenceLocker';
import { EvidenceDetailsModal } from './EvidenceDetailsModal';
import { EvidenceFile } from '@/types/client.types';

// ===========================
// MAIN EVIDENCE LOCKER PAGE COMPONENT
// ===========================

export const EvidenceLockerPage: React.FC = () => {
  // ===========================
  // STATE MANAGEMENT
  // ===========================
  
  const [selectedEvidence, setSelectedEvidence] = useState<EvidenceFile | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // ===========================
  // EVENT HANDLERS
  // ===========================

  const handleEvidenceSelect = (evidence: EvidenceFile) => {
    setSelectedEvidence(evidence);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedEvidence(null);
  };

  // ===========================
  // RENDER
  // ===========================

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="apex-page-header">
        <div className="apex-page-title">
          <h1 className="apex-page-heading">Evidence Locker</h1>
          <p className="apex-page-description">
            Secure access to watermarked evidence files with comprehensive search and filtering capabilities
          </p>
        </div>
      </div>

      {/* Evidence Locker */}
      <div className="apex-main-panel">
        <EvidenceLocker
          onEvidenceSelect={handleEvidenceSelect}
          showHeader={false} // Header is handled by page component
          showStats={true}
          viewMode="grid"
        />
      </div>

      {/* Evidence Details Modal */}
      <EvidenceDetailsModal
        evidence={selectedEvidence}
        isOpen={isModalOpen}
        onClose={handleModalClose}
      />
    </div>
  );
};

export default EvidenceLockerPage;