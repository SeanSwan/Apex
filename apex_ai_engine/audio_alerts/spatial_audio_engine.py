"""
APEX AI SPATIAL AUDIO ENGINE
============================
3D positioned audio alert system for multi-monitor security setups
Provides spatial audio feedback for threat location awareness

Features:
- 3D spatial audio positioning
- Multi-channel audio output support
- Zone-to-speaker mapping
- Threat-specific audio signatures
- Real-time audio mixing and processing
- Performance optimized for real-time alerts

Priority: P1 HIGH - Critical for dispatcher spatial awareness
"""

import numpy as np
import threading
import time
import math
from typing import Dict, List, Tuple, Optional, Any
from enum import Enum
from datetime import datetime
import logging

# Audio processing imports
try:
    import pyaudio
    import wave
    PYAUDIO_AVAILABLE = True
except ImportError:
    PYAUDIO_AVAILABLE = False
    print("⚠️ PyAudio not available. Install with: pip install PyAudio")

try:
    import scipy.signal
    import scipy.spatial.distance
    SCIPY_AVAILABLE = True
except ImportError:
    SCIPY_AVAILABLE = False
    print("⚠️ SciPy not available. Install with: pip install scipy")

# Import threat models for threat level definitions
try:
    from models import ThreatLevel, ThreatType
    THREAT_MODELS_AVAILABLE = True
except ImportError:
    THREAT_MODELS_AVAILABLE = False
    # Fallback threat levels
    class ThreatLevel(Enum):
        LOW = 1
        MEDIUM = 2
        HIGH = 3
        CRITICAL = 4

logger = logging.getLogger(__name__)

class AudioChannel(Enum):
    """Audio channel types for spatial positioning"""
    FRONT_LEFT = "front_left"
    FRONT_RIGHT = "front_right"
    FRONT_CENTER = "front_center"
    REAR_LEFT = "rear_left"
    REAR_RIGHT = "rear_right"
    REAR_CENTER = "rear_center"
    SIDE_LEFT = "side_left"
    SIDE_RIGHT = "side_right"

class SpatialPosition:
    """3D spatial position representation"""
    def __init__(self, x: float = 0.0, y: float = 0.0, z: float = 0.0):
        self.x = x  # Left (-1) to Right (+1)
        self.y = y  # Back (-1) to Front (+1)
        self.z = z  # Down (-1) to Up (+1)
    
    def distance_to(self, other: 'SpatialPosition') -> float:
        """Calculate distance to another position"""
        return math.sqrt((self.x - other.x)**2 + (self.y - other.y)**2 + (self.z - other.z)**2)
    
    def angle_to(self, other: 'SpatialPosition') -> float:
        """Calculate angle to another position (in radians)"""
        return math.atan2(other.y - self.y, other.x - self.x)

class SpatialAudioEngine:
    """
    Advanced 3D spatial audio engine for security alerts
    
    Provides immersive audio positioning to help dispatchers quickly
    identify threat locations across multiple monitoring zones.
    """
    
    def __init__(self, sample_rate: int = 44100, buffer_size: int = 1024, 
                 channels: int = 8):
        """
        Initialize the spatial audio engine
        
        Args:
            sample_rate: Audio sample rate in Hz
            buffer_size: Audio buffer size in samples
            channels: Number of audio output channels
        """
        self.sample_rate = sample_rate
        self.buffer_size = buffer_size
        self.channels = channels
        
        # Audio system state
        self.is_initialized = False
        self.is_enabled = True
        self.master_volume = 0.7
        self.threat_volume_multipliers = {
            ThreatLevel.CRITICAL: 1.0,
            ThreatLevel.HIGH: 0.8,
            ThreatLevel.MEDIUM: 0.6,
            ThreatLevel.LOW: 0.4
        }
        
        # PyAudio stream
        self.audio_stream = None
        self.pyaudio_instance = None
        
        # Speaker configuration (default 7.1 surround setup)
        self.speaker_positions = {
            AudioChannel.FRONT_LEFT: SpatialPosition(-0.7, 1.0, 0.0),
            AudioChannel.FRONT_RIGHT: SpatialPosition(0.7, 1.0, 0.0),
            AudioChannel.FRONT_CENTER: SpatialPosition(0.0, 1.0, 0.0),
            AudioChannel.SIDE_LEFT: SpatialPosition(-1.0, 0.0, 0.0),
            AudioChannel.SIDE_RIGHT: SpatialPosition(1.0, 0.0, 0.0),
            AudioChannel.REAR_LEFT: SpatialPosition(-0.7, -1.0, 0.0),
            AudioChannel.REAR_RIGHT: SpatialPosition(0.7, -1.0, 0.0),
            AudioChannel.REAR_CENTER: SpatialPosition(0.0, -1.0, 0.0)
        }
        
        # Zone to spatial position mapping
        self.zone_positions = {}
        
        # Active audio alerts
        self.active_alerts = {}  # alert_id -> alert_data
        self.audio_buffers = {}  # alert_id -> audio_buffer
        
        # Thread safety
        self._lock = threading.Lock()
        
        # Performance tracking
        self.audio_stats = {
            'alerts_played': 0,
            'buffer_underruns': 0,
            'processing_time_avg': 0.0,
            'active_streams': 0
        }
        
        # Initialize audio system
        self._initialize_audio_system()
        
        logger.info(f"🔊 Spatial Audio Engine initialized ({channels} channels @ {sample_rate}Hz)")
    
    def _initialize_audio_system(self):
        """Initialize the PyAudio system"""
        if not PYAUDIO_AVAILABLE:
            logger.error("❌ PyAudio not available - audio alerts disabled")
            return False
        
        try:
            self.pyaudio_instance = pyaudio.PyAudio()
            
            # Find suitable audio device
            device_info = self._find_best_audio_device()
            if not device_info:
                logger.error("❌ No suitable audio device found")
                return False
            
            # Create audio stream
            self.audio_stream = self.pyaudio_instance.open(
                format=pyaudio.paFloat32,
                channels=min(self.channels, device_info['maxOutputChannels']),
                rate=self.sample_rate,
                output=True,
                frames_per_buffer=self.buffer_size,
                output_device_index=device_info['index'],
                stream_callback=self._audio_callback
            )
            
            self.is_initialized = True
            logger.info(f"✅ Audio system initialized with device: {device_info['name']}")
            return True
            
        except Exception as e:
            logger.error(f"❌ Failed to initialize audio system: {e}")
            return False
    
    def _find_best_audio_device(self) -> Optional[Dict]:
        """Find the best available audio output device"""
        if not self.pyaudio_instance:
            return None
        
        device_count = self.pyaudio_instance.get_device_count()
        best_device = None
        max_channels = 0
        
        for i in range(device_count):
            try:
                device_info = self.pyaudio_instance.get_device_info_by_index(i)
                
                # Look for output devices
                if device_info['maxOutputChannels'] > 0:
                    # Prefer devices with more channels
                    if device_info['maxOutputChannels'] > max_channels:
                        max_channels = device_info['maxOutputChannels']
                        best_device = device_info
                        
            except Exception as e:
                logger.debug(f"Error checking device {i}: {e}")
                continue
        
        return best_device
    
    def _audio_callback(self, in_data, frame_count, time_info, status):
        """PyAudio stream callback for real-time audio processing"""
        if not self.is_enabled or not self.active_alerts:
            # Return silence
            return (np.zeros((frame_count, self.channels), dtype=np.float32).tobytes(), pyaudio.paContinue)
        
        try:
            start_time = time.time()
            
            # Mix all active alerts
            mixed_audio = self._mix_active_alerts(frame_count)
            
            # Update performance stats
            processing_time = time.time() - start_time
            self._update_audio_stats(processing_time)
            
            return (mixed_audio.tobytes(), pyaudio.paContinue)
            
        except Exception as e:
            logger.error(f"❌ Audio callback error: {e}")
            # Return silence on error
            return (np.zeros((frame_count, self.channels), dtype=np.float32).tobytes(), pyaudio.paContinue)
    
    def _mix_active_alerts(self, frame_count: int) -> np.ndarray:
        """Mix all active alert audio streams"""
        mixed_audio = np.zeros((frame_count, self.channels), dtype=np.float32)
        
        with self._lock:
            alerts_to_remove = []
            
            for alert_id, alert_data in self.active_alerts.items():
                try:
                    # Get audio buffer for this alert
                    audio_buffer = self.audio_buffers.get(alert_id)
                    if audio_buffer is None or len(audio_buffer) == 0:
                        alerts_to_remove.append(alert_id)
                        continue
                    
                    # Get spatial audio for this alert
                    spatial_audio = self._generate_spatial_audio(alert_data, frame_count)
                    
                    # Mix into main output
                    mixed_audio += spatial_audio
                    
                    # Update alert progress
                    alert_data['frames_played'] += frame_count
                    
                    # Check if alert is finished
                    if alert_data['frames_played'] >= len(audio_buffer):
                        alerts_to_remove.append(alert_id)
                    
                except Exception as e:
                    logger.error(f"❌ Error processing alert {alert_id}: {e}")
                    alerts_to_remove.append(alert_id)
            
            # Remove finished alerts
            for alert_id in alerts_to_remove:
                self._remove_alert(alert_id)
        
        # Apply master volume and clipping
        mixed_audio *= self.master_volume
        mixed_audio = np.clip(mixed_audio, -1.0, 1.0)
        
        return mixed_audio
    
    def _generate_spatial_audio(self, alert_data: Dict, frame_count: int) -> np.ndarray:
        """Generate spatialized audio for an alert"""
        alert_id = alert_data['alert_id']
        spatial_position = alert_data['spatial_position']
        threat_level = alert_data['threat_level']
        
        # Get source audio
        audio_buffer = self.audio_buffers[alert_id]
        start_frame = alert_data['frames_played']
        end_frame = min(start_frame + frame_count, len(audio_buffer))
        
        if start_frame >= len(audio_buffer):
            return np.zeros((frame_count, self.channels), dtype=np.float32)
        
        # Extract audio segment
        audio_segment = audio_buffer[start_frame:end_frame]
        
        # Pad if necessary
        if len(audio_segment) < frame_count:
            padding = np.zeros(frame_count - len(audio_segment), dtype=np.float32)
            audio_segment = np.concatenate([audio_segment, padding])
        
        # Calculate spatial gains for each speaker
        speaker_gains = self._calculate_speaker_gains(spatial_position)
        
        # Apply threat level volume multiplier
        volume_multiplier = self.threat_volume_multipliers.get(threat_level, 0.6)
        speaker_gains *= volume_multiplier
        
        # Create multichannel output
        output_audio = np.zeros((frame_count, self.channels), dtype=np.float32)
        
        # Apply gains to each channel
        for i, channel in enumerate(list(AudioChannel)[:self.channels]):
            if i < len(speaker_gains):
                output_audio[:, i] = audio_segment * speaker_gains[i]
        
        return output_audio
    
    def _calculate_speaker_gains(self, position: SpatialPosition) -> np.ndarray:
        """Calculate gain values for each speaker based on spatial position"""
        gains = np.zeros(self.channels, dtype=np.float32)
        
        # Calculate distance-based gains for each speaker
        for i, (channel, speaker_pos) in enumerate(list(self.speaker_positions.items())[:self.channels]):
            # Calculate distance from sound source to speaker
            distance = position.distance_to(speaker_pos)
            
            # Apply inverse square law with minimum distance
            min_distance = 0.1
            effective_distance = max(distance, min_distance)
            distance_gain = 1.0 / (effective_distance * effective_distance)
            
            # Apply angle-based gain (higher gain for speakers closer to direction)
            angle_diff = abs(position.angle_to(speaker_pos))
            angle_gain = 1.0 - (angle_diff / math.pi)  # Normalize to 0-1
            
            # Combine gains
            final_gain = distance_gain * angle_gain
            gains[i] = final_gain
        
        # Normalize gains so maximum is 1.0
        if np.max(gains) > 0:
            gains = gains / np.max(gains)
        
        return gains
    
    def register_zone_position(self, zone_id: str, position: SpatialPosition):
        """
        Register spatial position for a monitoring zone
        
        Args:
            zone_id: Unique zone identifier
            position: 3D spatial position for the zone
        """
        with self._lock:
            self.zone_positions[zone_id] = position
        
        logger.info(f"📍 Registered zone '{zone_id}' at position ({position.x:.2f}, {position.y:.2f}, {position.z:.2f})")
    
    def play_threat_alert(self, alert_data: Dict[str, Any]) -> str:
        """
        Play a spatial audio alert for a detected threat
        
        Args:
            alert_data: Threat alert data
        
        Returns:
            str: Alert ID for tracking
        """
        if not self.is_initialized or not self.is_enabled:
            return None
        
        alert_id = f"audio_alert_{int(time.time() * 1000)}"
        
        # Extract alert information
        threat_type = alert_data.get('type', 'unknown')
        threat_level = alert_data.get('threat_level', ThreatLevel.MEDIUM)
        zone_id = alert_data.get('zone_id', 'unknown')
        confidence = alert_data.get('confidence', 0.5)
        
        # Get spatial position for zone
        spatial_position = self.zone_positions.get(zone_id, SpatialPosition(0.0, 0.0, 0.0))
        
        # Generate threat-specific audio
        audio_buffer = self._generate_threat_audio(threat_type, threat_level, confidence)
        
        # Create alert tracking data
        alert_tracking = {
            'alert_id': alert_id,
            'threat_type': threat_type,
            'threat_level': threat_level,
            'zone_id': zone_id,
            'spatial_position': spatial_position,
            'confidence': confidence,
            'start_time': time.time(),
            'frames_played': 0,
            'total_frames': len(audio_buffer)
        }
        
        with self._lock:
            self.active_alerts[alert_id] = alert_tracking
            self.audio_buffers[alert_id] = audio_buffer
        
        # Update stats
        self.audio_stats['alerts_played'] += 1
        self.audio_stats['active_streams'] = len(self.active_alerts)
        
        logger.info(f"🔊 Playing {threat_level.name} audio alert for {threat_type} in zone {zone_id}")
        
        return alert_id
    
    def _generate_threat_audio(self, threat_type: str, threat_level: ThreatLevel, 
                              confidence: float) -> np.ndarray:
        """Generate threat-specific audio signature"""
        
        # Base parameters
        duration = self._get_alert_duration(threat_level)
        
        # Generate audio based on threat type and level
        if threat_level == ThreatLevel.CRITICAL:
            audio = self._generate_critical_alert_audio(threat_type, duration)
        elif threat_level == ThreatLevel.HIGH:
            audio = self._generate_high_alert_audio(threat_type, duration)
        elif threat_level == ThreatLevel.MEDIUM:
            audio = self._generate_medium_alert_audio(threat_type, duration)
        else:  # LOW
            audio = self._generate_low_alert_audio(threat_type, duration)
        
        # Apply confidence scaling
        audio *= confidence
        
        return audio
    
    def _get_alert_duration(self, threat_level: ThreatLevel) -> float:
        """Get alert duration based on threat level"""
        durations = {
            ThreatLevel.CRITICAL: 3.0,  # 3 seconds
            ThreatLevel.HIGH: 2.0,      # 2 seconds
            ThreatLevel.MEDIUM: 1.5,    # 1.5 seconds
            ThreatLevel.LOW: 1.0        # 1 second
        }
        
        return durations.get(threat_level, 1.5)
    
    def _generate_critical_alert_audio(self, threat_type: str, duration: float) -> np.ndarray:
        """Generate audio for critical threats (weapons, violence)"""
        samples = int(duration * self.sample_rate)
        t = np.linspace(0, duration, samples, False)
        
        if threat_type == 'weapon':
            # Sharp, attention-grabbing siren
            freq1 = 800  # High frequency
            freq2 = 1200 # Very high frequency
            audio = np.sin(2 * np.pi * freq1 * t) * np.sin(2 * np.pi * 0.5 * t)  # Amplitude modulation
            audio += 0.3 * np.sin(2 * np.pi * freq2 * t) * np.sin(2 * np.pi * 1.0 * t)
        elif threat_type == 'violence':
            # Urgent pulse pattern
            freq = 600
            pulse_freq = 8  # 8 Hz pulse
            audio = np.sin(2 * np.pi * freq * t) * (np.sin(2 * np.pi * pulse_freq * t) > 0).astype(float)
        else:
            # Generic critical alert
            freq = 900
            audio = np.sin(2 * np.pi * freq * t) * np.sin(2 * np.pi * 2 * t)
        
        # Apply envelope
        envelope = self._generate_envelope(samples, attack=0.01, decay=0.1, sustain=0.8, release=0.2)
        audio *= envelope
        
        return audio.astype(np.float32)
    
    def _generate_high_alert_audio(self, threat_type: str, duration: float) -> np.ndarray:
        """Generate audio for high priority threats"""
        samples = int(duration * self.sample_rate)
        t = np.linspace(0, duration, samples, False)
        
        if threat_type == 'trespassing':
            # Rising tone
            freq_start = 400
            freq_end = 800
            freq = freq_start + (freq_end - freq_start) * t / duration
            audio = np.sin(2 * np.pi * freq * t)
        elif threat_type == 'package_theft':
            # Double beep pattern
            beep_freq = 500
            beep_duration = 0.2
            pause_duration = 0.3
            
            audio = np.zeros(samples)
            for beep in range(2):
                start_time = beep * (beep_duration + pause_duration)
                if start_time < duration:
                    start_sample = int(start_time * self.sample_rate)
                    end_sample = min(int((start_time + beep_duration) * self.sample_rate), samples)
                    beep_samples = end_sample - start_sample
                    if beep_samples > 0:
                        beep_t = np.linspace(0, beep_duration, beep_samples, False)
                        audio[start_sample:end_sample] = np.sin(2 * np.pi * beep_freq * beep_t)
        else:
            # Generic high alert
            freq = 650
            audio = np.sin(2 * np.pi * freq * t) * (1 + 0.3 * np.sin(2 * np.pi * 3 * t))
        
        # Apply envelope
        envelope = self._generate_envelope(samples, attack=0.02, decay=0.15, sustain=0.7, release=0.3)
        audio *= envelope
        
        return audio.astype(np.float32)
    
    def _generate_medium_alert_audio(self, threat_type: str, duration: float) -> np.ndarray:
        """Generate audio for medium priority threats"""
        samples = int(duration * self.sample_rate)
        t = np.linspace(0, duration, samples, False)
        
        if threat_type == 'vandalism':
            # Sawtooth wave pattern
            freq = 400
            audio = 2 * (t * freq - np.floor(t * freq + 0.5))
        else:
            # Generic medium alert - single tone
            freq = 450
            audio = np.sin(2 * np.pi * freq * t)
        
        # Apply envelope
        envelope = self._generate_envelope(samples, attack=0.05, decay=0.2, sustain=0.6, release=0.4)
        audio *= envelope
        
        return audio.astype(np.float32)
    
    def _generate_low_alert_audio(self, threat_type: str, duration: float) -> np.ndarray:
        """Generate audio for low priority threats"""
        samples = int(duration * self.sample_rate)
        t = np.linspace(0, duration, samples, False)
        
        if threat_type == 'transient_activity':
            # Soft pulse
            freq = 300
            pulse_freq = 2  # 2 Hz pulse
            audio = np.sin(2 * np.pi * freq * t) * (0.5 + 0.5 * np.sin(2 * np.pi * pulse_freq * t))
        else:
            # Generic low alert - soft tone
            freq = 350
            audio = np.sin(2 * np.pi * freq * t)
        
        # Apply envelope
        envelope = self._generate_envelope(samples, attack=0.1, decay=0.3, sustain=0.4, release=0.5)
        audio *= envelope
        
        return audio.astype(np.float32) * 0.7  # Reduce volume for low priority
    
    def _generate_envelope(self, samples: int, attack: float, decay: float, 
                          sustain: float, release: float) -> np.ndarray:
        """Generate ADSR envelope for audio shaping"""
        envelope = np.ones(samples, dtype=np.float32)
        
        attack_samples = int(attack * samples)
        decay_samples = int(decay * samples)
        release_samples = int(release * samples)
        sustain_samples = samples - attack_samples - decay_samples - release_samples
        
        if sustain_samples < 0:
            # Adjust if envelope parameters are too large
            sustain_samples = 0
            release_samples = samples - attack_samples - decay_samples
        
        current_sample = 0
        
        # Attack
        if attack_samples > 0:
            envelope[current_sample:current_sample + attack_samples] = np.linspace(0, 1, attack_samples)
            current_sample += attack_samples
        
        # Decay
        if decay_samples > 0:
            envelope[current_sample:current_sample + decay_samples] = np.linspace(1, sustain, decay_samples)
            current_sample += decay_samples
        
        # Sustain
        if sustain_samples > 0:
            envelope[current_sample:current_sample + sustain_samples] = sustain
            current_sample += sustain_samples
        
        # Release
        if release_samples > 0 and current_sample < samples:
            envelope[current_sample:current_sample + release_samples] = np.linspace(sustain, 0, release_samples)
        
        return envelope
    
    def _remove_alert(self, alert_id: str):
        """Remove an alert from active tracking"""
        if alert_id in self.active_alerts:
            del self.active_alerts[alert_id]
        
        if alert_id in self.audio_buffers:
            del self.audio_buffers[alert_id]
        
        self.audio_stats['active_streams'] = len(self.active_alerts)
    
    def stop_alert(self, alert_id: str) -> bool:
        """
        Stop a specific alert
        
        Args:
            alert_id: ID of alert to stop
        
        Returns:
            bool: True if alert was stopped
        """
        with self._lock:
            if alert_id in self.active_alerts:
                self._remove_alert(alert_id)
                logger.info(f"🔇 Stopped audio alert: {alert_id}")
                return True
        
        return False
    
    def stop_all_alerts(self):
        """Stop all active audio alerts"""
        with self._lock:
            alert_count = len(self.active_alerts)
            self.active_alerts.clear()
            self.audio_buffers.clear()
            
            self.audio_stats['active_streams'] = 0
            
        logger.info(f"🔇 Stopped all audio alerts ({alert_count} alerts)")
    
    def set_master_volume(self, volume: float):
        """
        Set master audio volume
        
        Args:
            volume: Volume level (0.0 to 1.0)
        """
        self.master_volume = max(0.0, min(1.0, volume))
        logger.info(f"🔊 Master volume set to {self.master_volume:.2f}")
    
    def set_enabled(self, enabled: bool):
        """
        Enable or disable audio alerts
        
        Args:
            enabled: Whether audio alerts are enabled
        """
        self.is_enabled = enabled
        
        if not enabled:
            self.stop_all_alerts()
        
        logger.info(f"🔊 Audio alerts {'enabled' if enabled else 'disabled'}")
    
    def _update_audio_stats(self, processing_time: float):
        """Update audio processing statistics"""
        # Update average processing time
        current_avg = self.audio_stats['processing_time_avg']
        new_avg = (current_avg * 0.95) + (processing_time * 0.05)  # Exponential moving average
        self.audio_stats['processing_time_avg'] = new_avg
    
    def get_audio_statistics(self) -> Dict[str, Any]:
        """
        Get audio engine statistics
        
        Returns:
            Dictionary with audio performance statistics
        """
        return {
            'is_initialized': self.is_initialized,
            'is_enabled': self.is_enabled,
            'master_volume': self.master_volume,
            'sample_rate': self.sample_rate,
            'channels': self.channels,
            'active_alerts': len(self.active_alerts),
            'registered_zones': len(self.zone_positions),
            **self.audio_stats
        }
    
    def configure_speaker_layout(self, layout: Dict[AudioChannel, SpatialPosition]):
        """
        Configure custom speaker layout
        
        Args:
            layout: Dictionary mapping audio channels to spatial positions
        """
        with self._lock:
            self.speaker_positions.update(layout)
        
        logger.info(f"🔊 Updated speaker layout with {len(layout)} positions")
    
    def shutdown(self):
        """Shutdown the audio engine and cleanup resources"""
        logger.info("🔇 Shutting down Spatial Audio Engine...")
        
        self.is_enabled = False
        self.stop_all_alerts()
        
        if self.audio_stream:
            self.audio_stream.stop_stream()
            self.audio_stream.close()
            self.audio_stream = None
        
        if self.pyaudio_instance:
            self.pyaudio_instance.terminate()
            self.pyaudio_instance = None
        
        self.is_initialized = False
        
        logger.info("✅ Spatial Audio Engine shutdown complete")
