// File: frontend/src/components/Reports2/AdvancedReportDelivery.tsx

import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { format } from 'date-fns';
import { Button } from '../ui/button';
import { Switch } from '../ui/switch';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { ClientData, DailyReport, DeliveryOptions } from '../../types/reports';
import {
  SendHorizontal,
  Mail,
  Phone,
  Clock,
  AlertTriangle,
  CheckCircle2,
  X,
  Plus,
  UserPlus,
  CalendarClock,
  CalendarX,
  FileText,
  BarChart,
  FileCheck,
  UserCheck,
  Loader2,
  ExternalLink
} from 'lucide-react';

// Styled components with responsive design
const DeliveryContainer = styled.div`
  background-color: white;
  border-radius: 12px;
  overflow: hidden;
`;

const DeliveryHeader = styled.div`
  padding: 1rem;
  background-color: #10b981;
  color: white;
  display: flex;
  justify-content: space-between;
  align-items: center;
  
  @media (max-width: 480px) {
    padding: 0.75rem;
  }
`;

const HeaderTitle = styled.div`
  font-weight: 600;
  font-size: 1.125rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  
  @media (max-width: 480px) {
    font-size: 1rem;
  }
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.25rem;
  border-radius: 4px;
  
  &:hover {
    background-color: rgba(255, 255, 255, 0.2);
  }
`;

const DeliveryContent = styled.div`
  padding: 1rem;
  max-height: 70vh;
  overflow-y: auto;
  
  @media (max-width: 480px) {
    padding: 0.75rem;
  }
`;

const Section = styled.div`
  margin-bottom: 1.5rem;
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const SectionTitle = styled.h3`
  font-size: 1rem;
  font-weight: 600;
  margin-bottom: 0.75rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  
  @media (max-width: 480px) {
    font-size: 0.9375rem;
  }
`;

const ToggleGroup = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  background-color: #f9fafb;
  border-radius: 8px;
  margin-bottom: 0.75rem;
  
  @media (max-width: 480px) {
    padding: 0.5rem 0.75rem;
  }
`;

const ToggleLabel = styled.div`
  display: flex;
  flex-direction: column;
`;

const TogglePrimary = styled.div`
  font-weight: 500;
  font-size: 0.9375rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  
  @media (max-width: 480px) {
    font-size: 0.875rem;
  }
`;

const ToggleSecondary = styled.div`
  font-size: 0.8125rem;
  color: #6b7280;
  margin-top: 0.25rem;
  
  @media (max-width: 480px) {
    font-size: 0.75rem;
  }
`;

const InputGroup = styled.div`
  margin-bottom: 1rem;
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const InputRow = styled.div`
  display: flex;
  gap: 0.5rem;
  
  @media (max-width: 480px) {
    flex-direction: column;
  }
`;

const TextInput = styled.input`
  flex: 1;
  padding: 0.625rem 0.75rem;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  font-size: 0.9375rem;
  
  &:focus {
    outline: none;
    border-color: #10b981;
    box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.2);
  }
  
  @media (max-width: 480px) {
    font-size: 0.875rem;
    padding: 0.5rem 0.625rem;
    width: 100%;
  }
`;

const ErrorMessage = styled.div`
  color: #ef4444;
  font-size: 0.8125rem;
  margin-top: 0.25rem;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  
  @media (max-width: 480px) {
    font-size: 0.75rem;
  }
`;

const RecipientsList = styled.div`
  margin-top: 0.75rem;
`;

const RecipientItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0.75rem;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  margin-bottom: 0.5rem;
  
  &:last-child {
    margin-bottom: 0;
  }
  
  &:hover {
    background-color: #f9fafb;
  }
`;

const RecipientInfo = styled.div`
  display: flex;
  flex-direction: column;
  width: 85%;
`;

const RecipientPrimary = styled.div`
  font-weight: 500;
  font-size: 0.9375rem;
  
  @media (max-width: 480px) {
    font-size: 0.875rem;
  }
`;

const RecipientSecondary = styled.div`
  font-size: 0.8125rem;
  color: #6b7280;
  
  @media (max-width: 480px) {
    font-size: 0.75rem;
  }
  
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const RemoveButton = styled.button`
  background: none;
  border: none;
  color: #6b7280;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.25rem;
  border-radius: 4px;
  
  &:hover {
    background-color: #f3f4f6;
    color: #ef4444;
  }
`;

const ClientPreview = styled.div`
  padding: 0.75rem;
  background-color: #f9fafb;
  border-radius: 8px;
  margin-bottom: 1rem;
  
  @media (max-width: 480px) {
    padding: 0.5rem 0.75rem;
  }
`;

const ClientName = styled.div`
  font-weight: 600;
  font-size: 1rem;
  margin-bottom: 0.25rem;
  
  @media (max-width: 480px) {
    font-size: 0.9375rem;
  }
`;

const ClientDetail = styled.div`
  font-size: 0.875rem;
  color: #6b7280;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.25rem;
  
  &:last-child {
    margin-bottom: 0;
  }
  
  @media (max-width: 480px) {
    font-size: 0.8125rem;
  }
`;

const ReportPreview = styled.div`
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 1rem;
`;

const ReportHeader = styled.div`
  padding: 0.75rem;
  background-color: #f3f4f6;
  font-weight: 500;
  border-bottom: 1px solid #e5e7eb;
  
  @media (max-width: 480px) {
    padding: 0.5rem 0.75rem;
    font-size: 0.9375rem;
  }
`;

const ReportBody = styled.div`
  padding: 0.75rem;
  max-height: 150px;
  overflow-y: auto;
  
  @media (max-width: 480px) {
    padding: 0.5rem 0.75rem;
    max-height: 120px;
  }
`;

const ReportContent = styled.div`
  font-size: 0.875rem;
  color: #4b5563;
  line-height: 1.5;
  
  @media (max-width: 480px) {
    font-size: 0.8125rem;
  }
`;

const DateTimeContainer = styled.div`
  margin-top: 1rem;
`;

const DateTimeInput = styled.input`
  width: 100%;
  padding: 0.625rem 0.75rem;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  font-size: 0.9375rem;
  
  &:focus {
    outline: none;
    border-color: #10b981;
    box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.2);
  }
  
  @media (max-width: 480px) {
    font-size: 0.875rem;
    padding: 0.5rem 0.625rem;
  }
`;

const OptionsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.75rem;
  margin-top: 1rem;
  
  @media (max-width: 480px) {
    grid-template-columns: 1fr;
  }
`;

const OptionCard = styled.div`
  padding: 0.75rem;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  
  &:hover {
    background-color: #f9fafb;
  }
  
  @media (max-width: 480px) {
    padding: 0.5rem 0.75rem;
  }
`;

const OptionLabel = styled.div`
  display: flex;
  flex-direction: column;
`;

const OptionPrimary = styled.div`
  font-weight: 500;
  font-size: 0.9375rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  
  @media (max-width: 480px) {
    font-size: 0.875rem;
  }
`;

const OptionSecondary = styled.div`
  font-size: 0.8125rem;
  color: #6b7280;
  margin-top: 0.25rem;
  
  @media (max-width: 480px) {
    font-size: 0.75rem;
  }
`;

const StatusBadge = styled(Badge)<{ status: 'pending' | 'scheduled' | 'sent' | 'error' }>`
  text-transform: capitalize;
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.75rem;
  
  background-color: ${props => {
    switch(props.status) {
      case 'pending': return '#fef3c7';
      case 'scheduled': return '#e0f2fe';
      case 'sent': return '#d1fae5';
      case 'error': return '#fee2e2';
      default: return '#f3f4f6';
    }
  }};
  
  color: ${props => {
    switch(props.status) {
      case 'pending': return '#b45309';
      case 'scheduled': return '#0369a1';
      case 'sent': return '#047857';
      case 'error': return '#b91c1c';
      default: return '#4b5563';
    }
  }};
`;

const DeliveryFooter = styled.div`
  padding: 1rem;
  border-top: 1px solid #e5e7eb;
  display: flex;
  justify-content: space-between;
  align-items: center;
  
  @media (max-width: 480px) {
    padding: 0.75rem;
    flex-direction: column;
    gap: 0.75rem;
  }
`;

const FooterInfo = styled.div`
  font-size: 0.875rem;
  color: #6b7280;
  
  @media (max-width: 480px) {
    font-size: 0.8125rem;
    text-align: center;
    width: 100%;
  }
`;

const FooterButtons = styled.div`
  display: flex;
  gap: 0.75rem;
  
  @media (max-width: 480px) {
    width: 100%;
  }
`;

const LoadingButton = styled(Button)`
  @media (max-width: 480px) {
    flex: 1;
  }
`;

interface AdvancedReportDeliveryProps {
  client: ClientData | null;
  dailyReports: DailyReport[];
  deliveryOptions: DeliveryOptions;
  onDeliveryOptionsChange: (options: Partial<DeliveryOptions>) => void;
  onSend: () => Promise<void>;
  onClose: () => void;
}

/**
 * Advanced Report Delivery Component
 * 
 * Provides a comprehensive interface for configuring and sending reports
 * to multiple recipients through various channels.
 */
const AdvancedReportDelivery: React.FC<AdvancedReportDeliveryProps> = ({
  client,
  dailyReports,
  deliveryOptions,
  onDeliveryOptionsChange,
  onSend,
  onClose,
}) => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showSentConfirmation, setShowSentConfirmation] = useState<boolean>(false);
  
  // Form state
  const [newEmailRecipient, setNewEmailRecipient] = useState<string>('');
  const [newSmsRecipient, setNewSmsRecipient] = useState<string>('');
  const [newRecipientName, setNewRecipientName] = useState<string>('');
  const [emailError, setEmailError] = useState<string>('');
  const [phoneError, setPhoneError] = useState<string>('');
  const [scheduleTime, setScheduleTime] = useState<string>('');
  
  // Reset scheduled time when scheduling is toggled
  useEffect(() => {
    if (!deliveryOptions.scheduleDelivery) {
      setScheduleTime('');
    } else if (!scheduleTime) {
      // Set default time to next hour
      const nextHour = new Date();
      nextHour.setHours(nextHour.getHours() + 1);
      nextHour.setMinutes(0);
      nextHour.setSeconds(0);
      setScheduleTime(format(nextHour, "yyyy-MM-dd'T'HH:mm"));
    }
  }, [deliveryOptions.scheduleDelivery]);
  
  // Handle email toggle
  const handleEmailToggle = (checked: boolean) => {
    onDeliveryOptionsChange({ email: checked });
  };
  
  // Handle SMS toggle
  const handleSmsToggle = (checked: boolean) => {
    onDeliveryOptionsChange({ sms: checked });
  };
  
  // Handle scheduling toggle
  const handleSchedulingToggle = (checked: boolean) => {
    onDeliveryOptionsChange({ scheduleDelivery: checked });
  };
  
  // Handle scheduled time change
  const handleScheduleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setScheduleTime(e.target.value);
    const scheduledDate = new Date(e.target.value);
    onDeliveryOptionsChange({ deliveryDate: scheduledDate });
  };
  
  // Handle content options change
  const handleContentOptionChange = (option: keyof DeliveryOptions, value: boolean) => {
    onDeliveryOptionsChange({ [option]: value });
  };
  
  // Add email recipient
  const addEmailRecipient = () => {
    if (!newEmailRecipient) return;
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmailRecipient)) {
      setEmailError('Please enter a valid email address');
      return;
    }
    
    // Add recipient to the list
    const newRecipients = [...deliveryOptions.emailRecipients, newEmailRecipient];
    onDeliveryOptionsChange({ emailRecipients: newRecipients });
    
    // Clear form fields
    setNewEmailRecipient('');
    setNewRecipientName('');
    setEmailError('');
  };
  
  // Add SMS recipient
  const addSmsRecipient = () => {
    if (!newSmsRecipient) return;
    
    // Validate phone format (simple validation)
    const phoneRegex = /^\+?[0-9]{10,15}$/;
    if (!phoneRegex.test(newSmsRecipient.replace(/[\s-()]/g, ''))) {
      setPhoneError('Please enter a valid phone number');
      return;
    }
    
    // Format phone number
    const formattedPhone = newSmsRecipient.replace(/[\s-()]/g, '');
    
    // Add recipient to the list
    const newRecipients = [...deliveryOptions.smsRecipients, formattedPhone];
    onDeliveryOptionsChange({ smsRecipients: newRecipients });
    
    // Clear form fields
    setNewSmsRecipient('');
    setNewRecipientName('');
    setPhoneError('');
  };
  
  // Remove email recipient
  const removeEmailRecipient = (email: string) => {
    const newRecipients = deliveryOptions.emailRecipients.filter(r => r !== email);
    onDeliveryOptionsChange({ emailRecipients: newRecipients });
  };
  
  // Remove SMS recipient
  const removeSmsRecipient = (phone: string) => {
    const newRecipients = deliveryOptions.smsRecipients.filter(r => r !== phone);
    onDeliveryOptionsChange({ smsRecipients: newRecipients });
  };
  
  // Handle send button click
  const handleSend = async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    
    try {
      await onSend();
      setShowSentConfirmation(true);
      
      // Auto-close after confirmation
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (error) {
      console.error('Error sending report:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Get summary of delivery settings
  const getDeliverySummary = () => {
    const recipientCount = deliveryOptions.emailRecipients.length + deliveryOptions.smsRecipients.length;
    
    if (recipientCount === 0) {
      return 'Add recipients to send the report';
    }
    
    if (deliveryOptions.scheduleDelivery) {
      return `Scheduled delivery to ${recipientCount} recipient${recipientCount !== 1 ? 's' : ''}`;
    }
    
    return `Immediate delivery to ${recipientCount} recipient${recipientCount !== 1 ? 's' : ''}`;
  };
  
  // Get preview of daily reports
  const getDailyReportSummary = () => {
    // Find the latest daily report with content
    const reportWithContent = [...dailyReports]
      .reverse()
      .find(report => report.content && report.content.length > 0);
    
    if (reportWithContent) {
      return {
        day: reportWithContent.day,
        content: reportWithContent.content,
        status: reportWithContent.status,
        securityCode: reportWithContent.securityCode,
      };
    }
    
    return {
      day: 'No report available',
      content: 'No report content available for preview.',
      status: 'To update',
      securityCode: 'N/A',
    };
  };
  
  const report = getDailyReportSummary();
  
  return (
    <DeliveryContainer>
      <DeliveryHeader>
        <HeaderTitle>
          <SendHorizontal size={20} />
          Report Delivery Options
        </HeaderTitle>
        <CloseButton onClick={onClose}>
          <X size={20} />
        </CloseButton>
      </DeliveryHeader>
      
      <DeliveryContent>
        {showSentConfirmation ? (
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <CheckCircle2 size={48} color="#10b981" style={{ marginBottom: '1rem' }} />
            <div style={{ fontWeight: 600, fontSize: '1.125rem', marginBottom: '0.5rem' }}>
              Report Sent Successfully!
            </div>
            <div style={{ color: '#6b7280', fontSize: '0.9375rem' }}>
              Your report has been {deliveryOptions.scheduleDelivery ? 'scheduled' : 'sent'}.
            </div>
          </div>
        ) : (
          <>
            <Section>
              <SectionTitle>
                <UserCheck size={18} />
                Client Information
              </SectionTitle>
              
              {client ? (
                <ClientPreview>
                  <ClientName>{client.name}</ClientName>
                  {client.location && (
                    <ClientDetail>
                      <span>📍</span> {client.location}
                    </ClientDetail>
                  )}
                  {client.contactEmail && (
                    <ClientDetail>
                      <Mail size={14} /> {client.contactEmail}
                    </ClientDetail>
                  )}
                </ClientPreview>
              ) : (
                <div style={{ color: '#6b7280', fontSize: '0.9375rem', padding: '1rem', textAlign: 'center' }}>
                  No client information available
                </div>
              )}
            </Section>
            
            <Section>
              <SectionTitle>
                <FileCheck size={18} />
                Report Preview
              </SectionTitle>
              
              <ReportPreview>
                <ReportHeader>
                  {report.day} - {report.securityCode}
                </ReportHeader>
                <ReportBody>
                  <ReportContent>
                    {report.content}
                  </ReportContent>
                </ReportBody>
              </ReportPreview>
            </Section>
            
            <Section>
              <SectionTitle>
                <SendHorizontal size={18} />
                Delivery Methods
              </SectionTitle>
              
              <ToggleGroup>
                <ToggleLabel>
                  <TogglePrimary>
                    <Mail size={16} />
                    Email Delivery
                  </TogglePrimary>
                  <ToggleSecondary>
                    Send full PDF report via email
                  </ToggleSecondary>
                </ToggleLabel>
                <Switch
                  checked={deliveryOptions.email}
                  onCheckedChange={handleEmailToggle}
                />
              </ToggleGroup>
              
              {deliveryOptions.email && (
                <InputGroup>
                  <InputRow>
                    <TextInput
                      type="text"
                      placeholder="Recipient Name (optional)"
                      value={newRecipientName}
                      onChange={(e) => setNewRecipientName(e.target.value)}
                    />
                    <TextInput
                      type="email"
                      placeholder="Email Address"
                      value={newEmailRecipient}
                      onChange={(e) => {
                        setNewEmailRecipient(e.target.value);
                        setEmailError('');
                      }}
                      style={{ borderColor: emailError ? '#ef4444' : '#e5e7eb' }}
                    />
                    <Button onClick={addEmailRecipient}>
                      <Plus size={16} />
                      Add
                    </Button>
                  </InputRow>
                  
                  {emailError && (
                    <ErrorMessage>
                      <AlertTriangle size={14} />
                      {emailError}
                    </ErrorMessage>
                  )}
                  
                  {deliveryOptions.emailRecipients.length > 0 && (
                    <RecipientsList>
                      {deliveryOptions.emailRecipients.map((email, index) => (
                        <RecipientItem key={index}>
                          <RecipientInfo>
                            <RecipientPrimary>{email}</RecipientPrimary>
                            <RecipientSecondary>Email Recipient</RecipientSecondary>
                          </RecipientInfo>
                          <RemoveButton onClick={() => removeEmailRecipient(email)}>
                            <X size={16} />
                          </RemoveButton>
                        </RecipientItem>
                      ))}
                    </RecipientsList>
                  )}
                </InputGroup>
              )}
              
              <ToggleGroup>
                <ToggleLabel>
                  <TogglePrimary>
                    <Phone size={16} />
                    SMS Notification
                  </TogglePrimary>
                  <ToggleSecondary>
                    Send report summary with secure link
                  </ToggleSecondary>
                </ToggleLabel>
                <Switch
                  checked={deliveryOptions.sms}
                  onCheckedChange={handleSmsToggle}
                />
              </ToggleGroup>
              
              {deliveryOptions.sms && (
                <InputGroup>
                  <InputRow>
                    <TextInput
                      type="text"
                      placeholder="Recipient Name (optional)"
                      value={newRecipientName}
                      onChange={(e) => setNewRecipientName(e.target.value)}
                    />
                    <TextInput
                      type="tel"
                      placeholder="Phone Number"
                      value={newSmsRecipient}
                      onChange={(e) => {
                        setNewSmsRecipient(e.target.value);
                        setPhoneError('');
                      }}
                      style={{ borderColor: phoneError ? '#ef4444' : '#e5e7eb' }}
                    />
                    <Button onClick={addSmsRecipient}>
                      <Plus size={16} />
                      Add
                    </Button>
                  </InputRow>
                  
                  {phoneError && (
                    <ErrorMessage>
                      <AlertTriangle size={14} />
                      {phoneError}
                    </ErrorMessage>
                  )}
                  
                  {deliveryOptions.smsRecipients.length > 0 && (
                    <RecipientsList>
                      {deliveryOptions.smsRecipients.map((phone, index) => (
                        <RecipientItem key={index}>
                          <RecipientInfo>
                            <RecipientPrimary>{phone}</RecipientPrimary>
                            <RecipientSecondary>SMS Recipient</RecipientSecondary>
                          </RecipientInfo>
                          <RemoveButton onClick={() => removeSmsRecipient(phone)}>
                            <X size={16} />
                          </RemoveButton>
                        </RecipientItem>
                      ))}
                    </RecipientsList>
                  )}
                </InputGroup>
              )}
              
              <ToggleGroup>
                <ToggleLabel>
                  <TogglePrimary>
                    <Clock size={16} />
                    Schedule Delivery
                  </TogglePrimary>
                  <ToggleSecondary>
                    Send report at a later time
                  </ToggleSecondary>
                </ToggleLabel>
                <Switch
                  checked={deliveryOptions.scheduleDelivery}
                  onCheckedChange={handleSchedulingToggle}
                />
              </ToggleGroup>
              
              {deliveryOptions.scheduleDelivery && (
                <DateTimeContainer>
                  <Label htmlFor="schedule-time" style={{ display: 'block', marginBottom: '0.5rem' }}>
                    Delivery Date & Time:
                  </Label>
                  <DateTimeInput
                    id="schedule-time"
                    type="datetime-local"
                    value={scheduleTime}
                    onChange={handleScheduleTimeChange}
                    min={format(new Date(), "yyyy-MM-dd'T'HH:mm")}
                  />
                </DateTimeContainer>
              )}
            </Section>
            
            <Section>
              <SectionTitle>
                <FileText size={18} />
                Content Options
              </SectionTitle>
              
              <OptionsGrid>
                <OptionCard>
                  <OptionLabel>
                    <OptionPrimary>
                      <FileText size={16} />
                      Full Report Data
                    </OptionPrimary>
                    <OptionSecondary>
                      Include complete report content
                    </OptionSecondary>
                  </OptionLabel>
                  <Switch
                    checked={deliveryOptions.includeFullData}
                    onCheckedChange={(checked) => handleContentOptionChange('includeFullData', checked)}
                  />
                </OptionCard>
                
                <OptionCard>
                  <OptionLabel>
                    <OptionPrimary>
                      <BarChart size={16} />
                      Charts & Analytics
                    </OptionPrimary>
                    <OptionSecondary>
                      Include visualization data
                    </OptionSecondary>
                  </OptionLabel>
                  <Switch
                    checked={deliveryOptions.includeCharts}
                    onCheckedChange={(checked) => handleContentOptionChange('includeCharts', checked)}
                  />
                </OptionCard>
                
                <OptionCard>
                  <OptionLabel>
                    <OptionPrimary>
                      <ExternalLink size={16} />
                      Access Links
                    </OptionPrimary>
                    <OptionSecondary>
                      Include video access links
                    </OptionSecondary>
                  </OptionLabel>
                  <Switch
                    checked={deliveryOptions.includeMediaLinks || false}
                    onCheckedChange={(checked) => handleContentOptionChange('includeMediaLinks', checked)}
                  />
                </OptionCard>
                
                <OptionCard>
                  <OptionLabel>
                    <OptionPrimary>
                      <UserPlus size={16} />
                      Feedback Request
                    </OptionPrimary>
                    <OptionSecondary>
                      Request feedback from recipients
                    </OptionSecondary>
                  </OptionLabel>
                  <Switch
                    checked={deliveryOptions.requestFeedback || false}
                    onCheckedChange={(checked) => handleContentOptionChange('requestFeedback', checked)}
                  />
                </OptionCard>
              </OptionsGrid>
            </Section>
          </>
        )}
      </DeliveryContent>
      
      {!showSentConfirmation && (
        <DeliveryFooter>
          <FooterInfo>
            {getDeliverySummary()}
          </FooterInfo>
          
          <FooterButtons>
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            
            <LoadingButton
              variant="default"
              onClick={handleSend}
              disabled={isLoading || (deliveryOptions.emailRecipients.length === 0 && deliveryOptions.smsRecipients.length === 0)}
            >
              {isLoading ? (
                <>
                  <Loader2 size={16} className="mr-2 animate-spin" />
                  Sending...
                </>
              ) : deliveryOptions.scheduleDelivery ? (
                <>
                  <CalendarClock size={16} className="mr-2" />
                  Schedule
                </>
              ) : (
                <>
                  <SendHorizontal size={16} className="mr-2" />
                  Send Now
                </>
              )}
            </LoadingButton>
          </FooterButtons>
        </DeliveryFooter>
      )}
    </DeliveryContainer>
  );
};

export default AdvancedReportDelivery;