// APEX AI LIVE MONITORING - ALERT SOUNDS COMPONENT
// Audio notification system for security alerts with volume and type-specific sounds

import React, { memo, useCallback, useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { 
  Volume2, 
  VolumeX, 
  Volume1,
  VolumeOff,
  Settings
} from 'lucide-react';
import { AlertSoundsProps, SecurityAlert } from '../types';
import { ControlButton } from '../shared/StyledComponents';

// Styled Components for Alert Sounds
const SoundsContainer = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  gap: 0.25rem;
`;

const VolumeButton = styled(ControlButton)<{ $isEnabled: boolean }>`
  color: ${props => props.$isEnabled ? '#22C55E' : '#EF4444'};
  border-color: ${props => props.$isEnabled ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'};
  background: ${props => props.$isEnabled ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)'};
  
  &:hover {
    background: ${props => props.$isEnabled ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)'};
  }
`;

const VolumePanel = styled.div<{ $isOpen: boolean }>`
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  width: 200px;
  background: rgba(20, 20, 20, 0.95);
  border: 1px solid rgba(255, 215, 0, 0.3);
  border-radius: 8px;
  padding: 1rem;
  z-index: 1000;
  backdrop-filter: blur(10px);
  transform: ${props => props.$isOpen ? 'translateY(0) scale(1)' : 'translateY(-10px) scale(0.95)'};
  opacity: ${props => props.$isOpen ? 1 : 0};
  visibility: ${props => props.$isOpen ? 'visible' : 'hidden'};
  transition: all 0.2s ease;
`;

const VolumeControl = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const VolumeHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 0.8rem;
  color: #E0E0E0;
  font-weight: 500;
`;

const VolumeSlider = styled.input`
  -webkit-appearance: none;
  width: 100%;
  height: 4px;
  border-radius: 2px;
  background: rgba(255, 255, 255, 0.2);
  outline: none;
  
  &::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: #FFD700;
    cursor: pointer;
    border: 2px solid rgba(0, 0, 0, 0.2);
  }
  
  &::-moz-range-thumb {
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: #FFD700;
    cursor: pointer;
    border: 2px solid rgba(0, 0, 0, 0.2);
  }
`;

const SoundSettings = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding-top: 0.75rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
`;

const SoundOption = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 0.75rem;
  color: #B0B0B0;
`;

const TestButton = styled.button`
  padding: 0.25rem 0.5rem;
  background: rgba(255, 215, 0, 0.1);
  border: 1px solid rgba(255, 215, 0, 0.3);
  border-radius: 4px;
  color: #FFD700;
  font-size: 0.7rem;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: rgba(255, 215, 0, 0.2);
    border-color: rgba(255, 215, 0, 0.5);
  }
`;

// Alert Sounds Component
const AlertSounds: React.FC<AlertSoundsProps> = memo(({
  isEnabled,
  volume,
  onToggle,
  onVolumeChange,
  currentAlert
}) => {
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [lastAlertId, setLastAlertId] = useState<string | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Initialize Web Audio API
  useEffect(() => {
    if (isEnabled && !audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }, [isEnabled]);

  // Close panel when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setIsPanelOpen(false);
      }
    };

    if (isPanelOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isPanelOpen]);

  // Play alert sound when new alert arrives
  useEffect(() => {
    if (currentAlert && 
        isEnabled && 
        currentAlert.alert_id !== lastAlertId &&
        (currentAlert.severity === 'critical' || currentAlert.severity === 'high')) {
      
      playAlertSound(currentAlert);
      setLastAlertId(currentAlert.alert_id);
    }
  }, [currentAlert, isEnabled, lastAlertId]);

  // Generate alert sound based on alert type and severity
  const playAlertSound = useCallback((alert: SecurityAlert) => {
    if (!audioContextRef.current || !isEnabled) return;

    try {
      const audioContext = audioContextRef.current;
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      // Connect audio nodes
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      // Set volume (0 to 1)
      gainNode.gain.setValueAtTime(volume / 100, audioContext.currentTime);
      
      // Configure sound based on alert type and severity
      const soundConfig = getSoundConfig(alert);
      
      // Play the alert pattern
      playSoundPattern(oscillator, gainNode, soundConfig, audioContext.currentTime);
      
    } catch (error) {
      console.warn('Failed to play alert sound:', error);
    }
  }, [isEnabled, volume]);

  // Get sound configuration based on alert
  const getSoundConfig = useCallback((alert: SecurityAlert) => {
    const baseConfig = {
      frequency: 800,
      duration: 0.2,
      pattern: [1],  // Single beep
      interval: 0.5
    };

    // Adjust based on severity
    switch (alert.severity) {
      case 'critical':
        return {
          ...baseConfig,
          frequency: 1000,
          pattern: [1, 1, 1], // Triple beep
          interval: 0.3
        };
      case 'high':
        return {
          ...baseConfig,
          frequency: 900,
          pattern: [1, 1], // Double beep
          interval: 0.4
        };
      case 'medium':
        return {
          ...baseConfig,
          frequency: 800,
          pattern: [1], // Single beep
        };
      default:
        return baseConfig;
    }
  }, []);

  // Play sound pattern
  const playSoundPattern = useCallback((
    oscillator: OscillatorNode,
    gainNode: GainNode,
    config: any,
    startTime: number
  ) => {
    let currentTime = startTime;
    
    config.pattern.forEach((beep: number, index: number) => {
      if (beep === 1) {
        // Create envelope for each beep
        gainNode.gain.setValueAtTime(0, currentTime);
        gainNode.gain.linearRampToValueAtTime(volume / 100, currentTime + 0.01);
        gainNode.gain.setValueAtTime(volume / 100, currentTime + config.duration - 0.01);
        gainNode.gain.linearRampToValueAtTime(0, currentTime + config.duration);
      }
      
      currentTime += config.duration + config.interval;
    });
    
    oscillator.frequency.setValueAtTime(config.frequency, startTime);
    oscillator.start(startTime);
    oscillator.stop(currentTime);
  }, [volume]);

  // Test alert sound
  const handleTestSound = useCallback((severity: SecurityAlert['severity']) => {
    const testAlert: SecurityAlert = {
      alert_id: `test_${Date.now()}`,
      timestamp: new Date().toISOString(),
      alert_type: 'suspicious_activity',
      severity,
      camera_id: 'test_camera',
      camera_name: 'Test Camera',
      location: 'Test Location',
      property_name: 'Test Property',
      description: `Test ${severity} alert sound`,
      confidence: 0.95,
      status: 'active'
    };
    
    playAlertSound(testAlert);
  }, [playAlertSound]);

  // Event handlers
  const handleTogglePanel = useCallback(() => {
    setIsPanelOpen(prev => !prev);
  }, []);

  const handleVolumeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseInt(e.target.value);
    onVolumeChange(newVolume);
  }, [onVolumeChange]);

  // Get volume icon based on level
  const getVolumeIcon = useCallback(() => {
    if (!isEnabled) return <VolumeOff size={14} />;
    if (volume === 0) return <VolumeX size={14} />;
    if (volume < 50) return <Volume1 size={14} />;
    return <Volume2 size={14} />;
  }, [isEnabled, volume]);

  return (
    <SoundsContainer ref={panelRef}>
      <VolumeButton
        $active={isPanelOpen}
        $isEnabled={isEnabled}
        onClick={onToggle}
      >
        {getVolumeIcon()}
      </VolumeButton>
      
      <ControlButton
        $active={isPanelOpen}
        onClick={handleTogglePanel}
      >
        <Settings size={12} />
      </ControlButton>

      <VolumePanel $isOpen={isPanelOpen}>
        <VolumeControl>
          <VolumeHeader>
            Alert Sounds
            <span>{volume}%</span>
          </VolumeHeader>
          
          <VolumeSlider
            type="range"
            min="0"
            max="100"
            value={volume}
            onChange={handleVolumeChange}
            disabled={!isEnabled}
          />
          
          <SoundSettings>
            <SoundOption>
              Critical Alerts
              <TestButton onClick={() => handleTestSound('critical')}>
                Test
              </TestButton>
            </SoundOption>
            
            <SoundOption>
              High Priority  
              <TestButton onClick={() => handleTestSound('high')}>
                Test
              </TestButton>
            </SoundOption>
            
            <SoundOption>
              Medium Priority
              <TestButton onClick={() => handleTestSound('medium')}>
                Test
              </TestButton>
            </SoundOption>
          </SoundSettings>
        </VolumeControl>
      </VolumePanel>
    </SoundsContainer>
  );
});

AlertSounds.displayName = 'AlertSounds';

export { AlertSounds };
