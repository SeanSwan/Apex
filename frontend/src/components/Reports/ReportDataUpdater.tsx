// ReportDataUpdater.tsx - Critical component for syncing data to context
import { useEffect } from 'react';
import { useReportData } from '../../context/ReportDataContext';
import { ClientData, MetricsData, ThemeSettings, DailyReport, DateRange } from '../../types/reports';

interface ReportDataUpdaterProps {
  client: ClientData | null;
  metrics: MetricsData;
  themeSettings: ThemeSettings;
  dailyReports: DailyReport[];
  dateRange: DateRange;
  summaryNotes: string;
  signature: string;
  contactEmail: string;
  chartDataURL: string;
}

/**
 * This component ensures that context data stays synchronized with the 
 * parent component's state. Critical for fixing the preview data issues.
 */
const ReportDataUpdater: React.FC<ReportDataUpdaterProps> = ({
  client,
  metrics,
  themeSettings,
  dailyReports,
  dateRange,
  summaryNotes,
  signature,
  contactEmail,
  chartDataURL
}) => {
  const {
    setClient,
    setMetrics,
    setThemeSettings,
    setDailyReports,
    setDateRange,
    setSummaryNotes,
    setSignature,
    setContactEmail,
    setChartDataURL
  } = useReportData();

  // Sync all data in a single effect to prevent race conditions
  useEffect(() => {
    console.log('🔄 ReportDataUpdater: Syncing ALL data to context:', {
      clientName: client?.name,
      hasMetrics: !!metrics,
      themeBackgroundImage: themeSettings?.backgroundImage,
      reportsCount: dailyReports?.length,
      hasChartData: !!chartDataURL,
      signature: signature || 'Empty',
      contactEmail: contactEmail || 'Empty'
    });

    // Update all context data at once
    setClient(client);
    setMetrics(metrics);
    setThemeSettings(themeSettings);
    setDailyReports(dailyReports);
    setDateRange(dateRange);
    setSummaryNotes(summaryNotes);
    setSignature(signature);
    setContactEmail(contactEmail);
    setChartDataURL(chartDataURL);

    console.log('✅ ReportDataUpdater: All data synced to context');
  }, [
    client,
    metrics,
    themeSettings,
    dailyReports,
    dateRange,
    summaryNotes,
    signature,
    contactEmail,
    chartDataURL,
    setClient,
    setMetrics,
    setThemeSettings,
    setDailyReports,
    setDateRange,
    setSummaryNotes,
    setSignature,
    setContactEmail,
    setChartDataURL
  ]);

  return null; // This component doesn't render anything
};

export default ReportDataUpdater;