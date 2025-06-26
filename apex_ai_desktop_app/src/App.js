/**
 * APEX AI DESKTOP MONITOR - MAIN APP COMPONENT
 * ============================================
 * Root React component for the desktop AI monitoring application
 * Features: Live AI Monitor, AI Alert Log, CTO AI Console
 */

import React, { useState, useEffect } from 'react';
import styled, { ThemeProvider, createGlobalStyle } from 'styled-components';
import LiveAIMonitor from './components/LiveAIMonitor/LiveAIMonitor';
import AIAlertLog from './components/AIAlertLog/AIAlertLog';
import CTOAIConsole from './components/CTOAIConsole/CTOAIConsole';
import StatusBar from './components/StatusBar/StatusBar';

// Theme for the application
const theme = {
  colors: {
    primary: '#00ff88',
    primaryDark: '#00cc6a',
    secondary: '#0080ff',
    background: '#0a0a0a',
    backgroundLight: '#1a1a1a',
    backgroundCard: '#2a2a2a',
    text: '#ffffff',
    textSecondary: '#b0b0b0',
    textMuted: '#808080',
    success: '#00ff88',
    warning: '#ffaa00',
    error: '#ff4444',
    border: '#333333',
    borderLight: '#444444'
  },
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
    xxl: '48px'
  },
  borderRadius: {
    sm: '4px',
    md: '8px',
    lg: '12px'
  },
  typography: {
    fontFamily: '-apple-system, BlinkMacSystemFont, \"Segoe UI\", \"Roboto\", sans-serif',
    fontSize: {
      xs: '12px',
      sm: '14px',
      md: '16px',
      lg: '18px',
      xl: '24px',
      xxl: '32px'
    },
    fontWeight: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700
    }
  },
  shadows: {
    sm: '0 2px 4px rgba(0,0,0,0.3)',
    md: '0 4px 8px rgba(0,0,0,0.4)',
    lg: '0 8px 16px rgba(0,0,0,0.5)'
  }
};

// Global styles
const GlobalStyle = createGlobalStyle`
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  body {
    font-family: ${props => props.theme.typography.fontFamily};
    background-color: ${props => props.theme.colors.background};
    color: ${props => props.theme.colors.text};
    overflow: hidden;
    user-select: none;
  }

  /* Custom scrollbar */
  ::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }

  ::-webkit-scrollbar-track {
    background: ${props => props.theme.colors.backgroundLight};
  }

  ::-webkit-scrollbar-thumb {
    background: ${props => props.theme.colors.border};
    border-radius: 4px;
  }

  ::-webkit-scrollbar-thumb:hover {
    background: ${props => props.theme.colors.borderLight};
  }
`;

const AppContainer = styled.div`
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%);
`;

const TabContainer = styled.div`
  display: flex;
  background-color: ${props => props.theme.colors.backgroundLight};
  border-bottom: 2px solid ${props => props.theme.colors.border};
  padding: 0 ${props => props.theme.spacing.md};
`;

const Tab = styled.button`
  background: none;
  border: none;
  padding: ${props => props.theme.spacing.md} ${props => props.theme.spacing.lg};
  color: ${props => props.active ? props.theme.colors.primary : props.theme.colors.textSecondary};
  font-size: ${props => props.theme.typography.fontSize.md};
  font-weight: ${props => props.theme.typography.fontWeight.medium};
  cursor: pointer;
  transition: all 0.2s ease;
  border-bottom: 3px solid ${props => props.active ? props.theme.colors.primary : 'transparent'};
  position: relative;

  &:hover {
    color: ${props => props.active ? props.theme.colors.primary : props.theme.colors.text};
    background-color: rgba(255, 255, 255, 0.05);
  }

  &:active {
    transform: translateY(1px);
  }
`;

const ContentArea = styled.div`
  flex: 1;
  overflow: hidden;
  position: relative;
`;

const TabContent = styled.div`
  width: 100%;
  height: 100%;
  display: ${props => props.active ? 'block' : 'none'};
`;

function App() {
  const [activeTab, setActiveTab] = useState('live-monitor');
  const [appInfo, setAppInfo] = useState(null);
  const [aiEngineStatus, setAIEngineStatus] = useState('disconnected');

  // Tab definitions
  const tabs = [
    {
      id: 'live-monitor',
      label: 'Live AI Monitor',
      icon: '🎥',
      component: LiveAIMonitor
    },
    {
      id: 'alert-log',
      label: 'AI Alert Log',
      icon: '🚨',
      component: AIAlertLog
    },
    {
      id: 'cto-console',
      label: 'CTO AI Console',
      icon: '⚙️',
      component: CTOAIConsole
    }
  ];

  // Initialize app and set up AI engine communication
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Get app information
        if (window.electronAPI) {
          const info = await window.electronAPI.getAppInfo();
          setAppInfo(info);
          
          // Set initial AI engine status
          setAIEngineStatus(info.pythonAIEngineRunning ? 'connected' : 'disconnected');
        }

        // Set up AI engine message listener
        if (window.electronAPI) {
          window.electronAPI.onAIEngineMessage((message) => {
            console.log('🧠 AI Engine Message:', message);
            
            // Update AI engine status based on messages
            setAIEngineStatus('connected');
            
            // Handle different types of AI messages
            handleAIEngineMessage(message);
          });
        }

        console.log('🚀 Apex AI Desktop Monitor initialized');
        
      } catch (error) {
        console.error('❌ Failed to initialize app:', error);
      }
    };

    initializeApp();

    // Cleanup
    return () => {
      if (window.electronAPI) {
        window.electronAPI.removeAIEngineListener();
      }
    };
  }, []);

  // Handle AI engine messages
  const handleAIEngineMessage = (message) => {
    switch (message.type) {
      case 'detection':
        // Handle AI detection results
        console.log('🎯 Detection received:', message.data);
        break;
      
      case 'alert':
        // Handle AI alerts
        console.log('🚨 Alert received:', message.data);
        break;
      
      case 'status':
        // Handle status updates
        console.log('📊 Status update:', message.data);
        break;
      
      default:
        console.log('📝 Unknown message type:', message.type);
    }
  };

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
  };

  return (
    <ThemeProvider theme={theme}>
      <GlobalStyle />
      <AppContainer>
        {/* Tab Navigation */}
        <TabContainer>
          {tabs.map(tab => (
            <Tab
              key={tab.id}
              active={activeTab === tab.id}
              onClick={() => handleTabChange(tab.id)}
            >
              <span style={{ marginRight: '8px' }}>{tab.icon}</span>
              {tab.label}
            </Tab>
          ))}
        </TabContainer>

        {/* Content Area */}
        <ContentArea>
          {tabs.map(tab => {
            const Component = tab.component;
            return (
              <TabContent key={tab.id} active={activeTab === tab.id}>
                <Component />
              </TabContent>
            );
          })}
        </ContentArea>

        {/* Status Bar */}
        <StatusBar 
          appInfo={appInfo} 
          aiEngineStatus={aiEngineStatus}
        />
      </AppContainer>
    </ThemeProvider>
  );
}

export default App;
