// File: frontend/src/pages/ReportsPage.component.tsx
/**
 * ReportsPage.component.tsx
 *
 * This component aggregates the entire report builder:
 *   - Header & Background customization (with theme, header image, custom background image & opacity)
 *   - Property Information & Intrusion Data display
 *   - Graphs section (with live form inputs for each day Mon-Sun)
 *   - Detailed report text area with signature input
 *   - A final export button that generates a multi-page PDF (via jsPDF)
 *
 * Future enhancements:
 *   - Persist state to local storage or backend for autosave.
 *   - Live preview mode with drag-drop reordering.
 *   - Integrate AI assistance in the detailed report text area.
 */

import React, { useState, useRef } from 'react';
import styled from 'styled-components';

// Import our report sub-components
import HeaderCustomization from '../components/Reports/HeaderCustomization';
import PropertyInfoPage from '../components/Reports/PropertyInfoPage';
import GraphsPage from '../components/Reports/GraphsPage';
import DetailedReportPage from '../components/Reports/DetailedReportPage';
import { exportToPDF } from '../components/Reports/ReportExport';

// Styled container for the entire page. We use relative positioning so we can layer a background overlay.
const PageWrapper = styled.div`
  position: relative;
  min-height: 100vh;
  padding: 2rem;
  overflow-y: auto;
`;

// This overlay renders the custom background image (if provided) with adjustable opacity.
const BackgroundOverlay = styled.div<{ backgroundImage?: string; backgroundOpacity: number }>`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: ${(props) =>
    props.backgroundImage ? `url(${props.backgroundImage})` : 'none'};
  background-size: cover;
  background-position: center;
  opacity: ${(props) => props.backgroundOpacity};
  z-index: -1;
`;

// Navigation for report sections (tabs)
const TabNav = styled.div`
  display: flex;
  gap: 1rem;
  margin: 1rem 0;
`;

// Button for each tab with an indicator for active state.
const TabButton = styled.button<{ active: boolean }>`
  padding: 0.75rem 1.25rem;
  border: none;
  border-bottom: ${(props) => (props.active ? '3px solid #007bff' : 'none')};
  background: transparent;
  font-size: 1rem;
  cursor: pointer;
  &:hover {
    color: #007bff;
  }
`;

// Export button styled component.
const ExportButton = styled.button`
  margin-top: 2rem;
  padding: 0.75rem 1.5rem;
  background-color: #28a745;
  color: #fff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  &:hover {
    background-color: #218838;
  }
`;

const ReportsPage: React.FC = () => {
  // State for header image and background theme.
  const [headerImage, setHeaderImage] = useState<string>('/images/header1.jpg');
  const [backgroundTheme, setBackgroundTheme] = useState<string>('theme-default');

  // New state for custom background image and its opacity.
  const [backgroundImage, setBackgroundImage] = useState<string>('');
  const [backgroundOpacity, setBackgroundOpacity] = useState<number>(0.5);

  // Report data state.
  const [propertyData, setPropertyData] = useState<any[]>([]);
  const [chartDataURL, setChartDataURL] = useState<string>(''); // Base64 image string of the chart (if captured)
  const [reportText, setReportText] = useState<string>('');
  const [signature, setSignature] = useState<string>('Default Signature');

  // Active tab: 0 = Property Info, 1 = Graphs, 2 = Detailed Report.
  const [activeTab, setActiveTab] = useState<number>(0);

  // Ref to the chart container for capturing as image (if needed).
  const chartRef = useRef<HTMLDivElement>(null);

  // Define the tabbed sections.
  const tabs = [
    {
      title: 'Property Info & Intrusions',
      component: <PropertyInfoPage setPropertyData={setPropertyData} />,
    },
    {
      title: 'Graphs',
      component: <GraphsPage chartRef={chartRef} setChartDataURL={setChartDataURL} />,
    },
    {
      title: 'Detailed Report',
      component: (
        <DetailedReportPage
          reportText={reportText}
          setReportText={setReportText}
          signature={signature}
          setSignature={setSignature}
        />
      ),
    },
  ];

  // Handler for exporting the report to PDF.
  const handleExport = async () => {
    // Future enhancement: Use html2canvas to capture chart as an image.
    // For now, we assume chartDataURL is updated via the GraphsPage inputs.
    exportToPDF(headerImage, propertyData, chartDataURL, reportText, signature, {
      backgroundImage,
      backgroundTheme,
    });
  };

  return (
    <PageWrapper>
      {/* Render the background overlay if a custom background image is provided */}
      {backgroundImage && (
        <BackgroundOverlay
          backgroundImage={backgroundImage}
          backgroundOpacity={backgroundOpacity}
        />
      )}
      {/* Header customization section now also controls the background image and opacity */}
      <HeaderCustomization
        headerImage={headerImage}
        setHeaderImage={setHeaderImage}
        backgroundTheme={backgroundTheme}
        setBackgroundTheme={setBackgroundTheme}
        backgroundImage={backgroundImage}
        setBackgroundImage={setBackgroundImage}
        backgroundOpacity={backgroundOpacity}
        setBackgroundOpacity={setBackgroundOpacity}
      />

      {/* Navigation Tabs for the report sections */}
      <TabNav>
        {tabs.map((tab, index) => (
          <TabButton key={index} active={activeTab === index} onClick={() => setActiveTab(index)}>
            {tab.title}
          </TabButton>
        ))}
      </TabNav>

      {/* Render the currently active tab */}
      <div>{tabs[activeTab].component}</div>

      {/* Button to export the complete report as a PDF */}
      <ExportButton onClick={handleExport}>Export to PDF</ExportButton>
    </PageWrapper>
  );
};

export default ReportsPage;
