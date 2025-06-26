// Test component to verify data synchronization
import React from 'react';
import { useReportData } from '../../context/ReportDataContext';

const TestDataSync: React.FC = () => {
  const {
    client,
    themeSettings,
    metrics,
    dailyReports,
    chartDataURL,
    signature,
    contactEmail,
    summaryNotes
  } = useReportData();

  return (
    <div style={{ 
      padding: '1rem', 
      backgroundColor: '#1e1e1e', 
      color: '#e5c76b',
      margin: '1rem 0',
      borderRadius: '8px',
      border: '2px solid #444'
    }}>
      <h3 style={{ color: '#e5c76b', marginBottom: '1rem' }}>🔍 Data Sync Debug Panel</h3>
      <div style={{ fontSize: '0.85rem', fontFamily: 'monospace', lineHeight: '1.4' }}>
        <div><strong>Client:</strong> {client?.name || 'None Selected'}</div>
        <div><strong>Contact Email:</strong> {client?.contactEmail || 'N/A'}</div>
        <div><strong>Report Contact Email:</strong> {contactEmail || 'N/A'}</div>
        <div><strong>Signature:</strong> {signature || 'N/A'}</div>
        <div><strong>Has Metrics:</strong> {!!metrics ? 'Yes' : 'No'}</div>
        <div><strong>Daily Reports:</strong> {dailyReports?.length || 0}</div>
        <div><strong>Summary Notes Length:</strong> {summaryNotes?.length || 0}</div>
        <div><strong>Has Chart:</strong> {!!chartDataURL ? 'Yes' : 'No'}</div>
        <div style={{ marginTop: '0.5rem', borderTop: '1px solid #555', paddingTop: '0.5rem' }}>
          <strong>Theme Settings:</strong>
        </div>
        <div style={{ marginLeft: '1rem' }}>
          <div><strong>Background Image:</strong> {themeSettings?.backgroundImage ? 'Set' : 'Not set'}</div>
          <div><strong>Header Image:</strong> {themeSettings?.headerImage ? 'Set' : 'Not set'}</div>
          <div><strong>Report Title:</strong> {themeSettings?.reportTitle || 'Not set'}</div>
          <div><strong>Background Opacity:</strong> {themeSettings?.backgroundOpacity ?? 'Not set'}</div>
          <div><strong>Primary Color:</strong> {themeSettings?.primaryColor || 'Not set'}</div>
          <div><strong>Secondary Color:</strong> {themeSettings?.secondaryColor || 'Not set'}</div>
        </div>
      </div>
    </div>
  );
};

export default TestDataSync;
