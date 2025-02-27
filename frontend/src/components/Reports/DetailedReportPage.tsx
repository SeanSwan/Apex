// File: frontend/src/components/Reports/DetailedReportPage.tsx
/**
 * DetailedReportPage.tsx
 *
 * Provides a text area for writing the detailed report (narrative for Mon-Sun) along with an input
 * for adding or selecting a signature. The text area scrolls if content overflows.
 *
 * Future enhancements:
 *   - Replace the textarea with a rich text editor (e.g., Draft.js or Quill).
 *   - Split the report into separate daily sections.
 *   - Integrate AI-based suggestions or auto-corrections.
 */

import React, { ChangeEvent } from 'react';
import styled from 'styled-components';

const Container = styled.div`
  padding: 1rem;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-bottom: 2rem;
`;

const Label = styled.label`
  font-weight: bold;
  display: block;
  margin-bottom: 0.5rem;
`;

const TextArea = styled.textarea`
  width: 100%;
  min-height: 200px;
  padding: 0.5rem;
  resize: vertical;
  margin-bottom: 1rem;
  border: 1px solid #ccc;
  border-radius: 4px;
`;

const SignatureInput = styled.input`
  width: 100%;
  padding: 0.5rem;
  margin-bottom: 1rem;
  border: 1px solid #ccc;
  border-radius: 4px;
`;

interface DetailedReportPageProps {
  reportText: string;
  setReportText: (text: string) => void;
  signature: string;
  setSignature: (text: string) => void;
}

const DetailedReportPage: React.FC<DetailedReportPageProps> = ({
  reportText,
  setReportText,
  signature,
  setSignature,
}) => {
  const handleTextChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setReportText(e.target.value);
  };

  const handleSignatureChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSignature(e.target.value);
  };

  return (
    <Container>
      <Label>Detailed Report (Mon-Sun):</Label>
      <TextArea value={reportText} onChange={handleTextChange} placeholder="Enter your detailed report here..." />
      <Label>Signature:</Label>
      <SignatureInput type="text" value={signature} onChange={handleSignatureChange} placeholder="Enter your signature" />
      {/* Future Enhancement: Allow saving and selecting from multiple signature presets */}
    </Container>
  );
};

export default DetailedReportPage;
