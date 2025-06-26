// Data Flow Monitor - Debug Component for Daily Reports Issue
import React from 'react';
import styled from 'styled-components';
import { useReportData } from '../../context/ReportDataContext';

const MonitorContainer = styled.div`
  position: fixed;
  top: 10px;
  right: 10px;
  width: 350px;
  background: rgba(0, 0, 0, 0.9);
  color: #e0e0e0;
  padding: 1rem;
  border-radius: 8px;
  font-size: 0.75rem;
  z-index: 9999;
  border: 1px solid #333;
  max-height: 400px;
  overflow-y: auto;
`;

const MonitorTitle = styled.h4`
  margin: 0 0 0.5rem 0;
  color: #FFD700;
  font-size: 0.875rem;
`;

const StatusItem = styled.div<{ $status: 'good' | 'warning' | 'error' }>`
  margin-bottom: 0.25rem;
  color: ${props => {
    switch(props.$status) {
      case 'good': return '#2ecc71';
      case 'warning': return '#f1c40f';
      case 'error': return '#e74c3c';
      default: return '#e0e0e0';
    }
  }};
`;

const ReportDetail = styled.div`
  margin-left: 1rem;
  font-size: 0.7rem;
  color: #999;
`;

const DataFlowMonitor: React.FC = () => {
  const {
    client,
    dailyReports,
    summaryNotes,
    signature,
    contactEmail,
    themeSettings,
    metrics,
    chartDataURL
  } = useReportData();

  const reportsWithContent = dailyReports?.filter(r => r.content && r.content.trim()) || [];
  const totalContentLength = reportsWithContent.reduce((sum, r) => sum + (r.content?.length || 0), 0);
  const reportsWithSecurityCodes = dailyReports?.filter(r => r.securityCode) || [];
  const securityCodeBreakdown = dailyReports?.reduce((acc, r) => {
    if (r.securityCode) {
      acc[r.securityCode] = (acc[r.securityCode] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>) || {};

  return (
    <MonitorContainer>
      <MonitorTitle>🔍 ENHANCED Daily Reports Data Monitor</MonitorTitle>
      
      <StatusItem $status={client ? 'good' : 'error'}>
        Client: {client ? `✅ ${client.name}` : '❌ No client selected'}
      </StatusItem>
      
      <StatusItem $status={dailyReports?.length ? 'good' : 'error'}>
        Daily Reports Count: {dailyReports?.length || 0}
      </StatusItem>
      
      <StatusItem $status={reportsWithContent.length > 0 ? 'good' : 'error'}>
        Reports with Content: {reportsWithContent.length}/{dailyReports?.length || 0}
      </StatusItem>
      
      <StatusItem $status={reportsWithSecurityCodes.length > 0 ? 'good' : 'warning'}>
        Security Codes: {reportsWithSecurityCodes.length}/{dailyReports?.length || 0}
      </StatusItem>
      
      {Object.keys(securityCodeBreakdown).length > 0 && (
        <ReportDetail>
          Codes: {Object.entries(securityCodeBreakdown).map(([code, count]) => `${code} (${count})`).join(', ')}
        </ReportDetail>
      )}
      
      <StatusItem $status={totalContentLength > 100 ? 'good' : 'warning'}>
        Total Content: {totalContentLength} chars
      </StatusItem>
      
      <StatusItem $status={summaryNotes && summaryNotes.trim() ? 'good' : 'warning'}>
        Summary Notes: {summaryNotes && summaryNotes.trim() ? `✅ ${summaryNotes.length} chars` : '⚠️ Empty'}
      </StatusItem>
      
      {dailyReports?.map(report => (
        <ReportDetail key={report.day}>
          {report.day}: {report.content ? `${report.content.length}c` : 'NO CONTENT'}
          {report.securityCode && ` [${report.securityCode}]`}
          {report.status && ` (${report.status})`}
        </ReportDetail>
      ))}
      
      <StatusItem $status={signature ? 'good' : 'warning'}>
        Signature: {signature || 'Default (Sean Swan)'}
      </StatusItem>
      
      <StatusItem $status={contactEmail ? 'good' : 'warning'}>
        Email: {contactEmail || 'Default (it@defenseic.com)'}
      </StatusItem>
      
      <StatusItem $status={chartDataURL ? 'good' : 'warning'}>
        Chart: {chartDataURL ? '✅ Generated' : '⚠️ Missing'}
      </StatusItem>
      
      <StatusItem $status={metrics ? 'good' : 'error'}>
        Metrics: {metrics ? '✅ Loaded' : '❌ Missing'}
      </StatusItem>
      
      <div style={{ marginTop: '0.5rem', fontSize: '0.65rem', color: '#666' }}>
        Last Updated: {new Date().toLocaleTimeString()}
      </div>
      
      <div style={{ 
        marginTop: '0.5rem', 
        fontSize: '0.65rem', 
        color: summaryNotes && summaryNotes.trim() ? '#2ecc71' : '#e74c3c',
        fontWeight: 'bold'
      }}>
        PREVIEW SUMMARY: {summaryNotes && summaryNotes.trim() ? 'WILL SHOW CUSTOM' : 'WILL SHOW DEFAULT'}
      </div>
      
      <div style={{ 
        marginTop: '0.25rem', 
        fontSize: '0.6rem', 
        color: '#999'
      }}>
        Summary Preview: {summaryNotes ? summaryNotes.substring(0, 30) + '...' : 'NO CUSTOM SUMMARY'}
      </div>
    </MonitorContainer>
  );
};

export default DataFlowMonitor;