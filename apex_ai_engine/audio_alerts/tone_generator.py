"""
APEX AI TONE GENERATOR
=====================
Advanced audio tone generation system for threat-specific audio signatures
Creates distinctive audio patterns for different types of security threats

Features:
- Threat-specific tone generation
- Harmonic and complex waveform synthesis
- Real-time parameter modulation
- Psychoacoustic optimization for attention
- Multiple synthesis methods
- Performance optimized for real-time generation

Priority: P1 HIGH - Core audio synthesis engine
"""

import numpy as np
import math
from typing import Dict, List, Tuple, Optional, Any, Union
from enum import Enum
from dataclasses import dataclass
import logging

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

class WaveformType(Enum):
    """Available waveform types for tone generation"""
    SINE = "sine"
    SQUARE = "square"
    SAWTOOTH = "sawtooth"
    TRIANGLE = "triangle"
    NOISE = "noise"
    PULSE = "pulse"
    CUSTOM = "custom"

class ModulationType(Enum):
    """Types of modulation for dynamic tone effects"""
    AMPLITUDE = "amplitude"
    FREQUENCY = "frequency"
    PHASE = "phase"
    FILTER = "filter"
    TREMOLO = "tremolo"
    VIBRATO = "vibrato"

@dataclass
class ToneParameters:
    """Parameters for tone generation"""
    frequency: float = 440.0           # Base frequency in Hz
    amplitude: float = 0.7              # Amplitude (0.0 - 1.0)
    duration: float = 1.0               # Duration in seconds
    waveform: WaveformType = WaveformType.SINE
    phase: float = 0.0                  # Phase offset in radians
    
    # Harmonic content
    harmonics: List[Tuple[float, float]] = None  # [(frequency_ratio, amplitude), ...]
    
    # Modulation parameters
    amplitude_modulation: Optional[Dict] = None  # {'frequency': Hz, 'depth': 0-1}
    frequency_modulation: Optional[Dict] = None  # {'frequency': Hz, 'depth': Hz}
    
    # Envelope parameters (ADSR)
    attack_time: float = 0.01           # Attack time in seconds
    decay_time: float = 0.1             # Decay time in seconds
    sustain_level: float = 0.7          # Sustain level (0.0 - 1.0)
    release_time: float = 0.2           # Release time in seconds
    
    # Filter parameters
    filter_cutoff: Optional[float] = None    # Low-pass filter cutoff frequency
    filter_resonance: float = 1.0            # Filter resonance

class ToneGenerator:
    """
    Advanced tone generator for security alert audio
    
    Generates distinctive, attention-grabbing audio tones optimized
    for security applications and dispatcher recognition.
    """
    
    def __init__(self, sample_rate: int = 44100):
        """
        Initialize the tone generator
        
        Args:
            sample_rate: Audio sample rate in Hz
        """
        self.sample_rate = sample_rate
        
        # Threat-specific tone configurations
        self.threat_tone_configs = self._init_threat_tone_configs()
        
        # Psychoacoustic parameters
        self.psychoacoustic_settings = {
            'equal_loudness_compensation': True,
            'critical_band_enhancement': True,
            'attention_frequency_boost': True,
            'masking_avoidance': True
        }
        
        # Performance tracking
        self.generation_stats = {
            'tones_generated': 0,
            'total_generation_time': 0.0,
            'average_generation_time': 0.0
        }
        
        logger.info(f"🎵 Tone Generator initialized (sample rate: {sample_rate} Hz)")
    
    def _init_threat_tone_configs(self) -> Dict[str, Dict[str, ToneParameters]]:
        """Initialize threat-specific tone configurations"""
        return {
            # WEAPONS - Immediate, sharp, attention-grabbing
            'weapon': {
                ThreatLevel.CRITICAL: ToneParameters(
                    frequency=800.0,
                    amplitude=0.9,
                    duration=0.5,
                    waveform=WaveformType.SQUARE,
                    harmonics=[(2.0, 0.3), (3.0, 0.2), (4.0, 0.1)],
                    amplitude_modulation={'frequency': 10.0, 'depth': 0.5},
                    attack_time=0.001,
                    decay_time=0.05,
                    sustain_level=0.8,
                    release_time=0.1
                ),
                ThreatLevel.HIGH: ToneParameters(
                    frequency=700.0,
                    amplitude=0.8,
                    duration=0.4,
                    waveform=WaveformType.SAWTOOTH,
                    harmonics=[(2.0, 0.25), (3.0, 0.15)],
                    amplitude_modulation={'frequency': 8.0, 'depth': 0.4},
                    attack_time=0.002,
                    decay_time=0.08,
                    sustain_level=0.7,
                    release_time=0.15
                )
            },
            
            # VIOLENCE - Urgent, pulsing, rhythmic
            'violence': {
                ThreatLevel.CRITICAL: ToneParameters(
                    frequency=600.0,
                    amplitude=0.85,
                    duration=1.2,
                    waveform=WaveformType.PULSE,
                    amplitude_modulation={'frequency': 8.0, 'depth': 0.7},
                    attack_time=0.01,
                    decay_time=0.1,
                    sustain_level=0.6,
                    release_time=0.2
                ),
                ThreatLevel.HIGH: ToneParameters(
                    frequency=550.0,
                    amplitude=0.75,
                    duration=1.0,
                    waveform=WaveformType.TRIANGLE,
                    amplitude_modulation={'frequency': 6.0, 'depth': 0.6},
                    attack_time=0.02,
                    decay_time=0.12,
                    sustain_level=0.5,
                    release_time=0.25
                )
            },
            
            # PACKAGE THEFT - Distinctive, medium urgency
            'package_theft': {
                ThreatLevel.HIGH: ToneParameters(
                    frequency=500.0,
                    amplitude=0.7,
                    duration=0.8,
                    waveform=WaveformType.SINE,
                    harmonics=[(1.5, 0.3), (2.5, 0.2)],
                    frequency_modulation={'frequency': 3.0, 'depth': 20.0},
                    attack_time=0.03,
                    decay_time=0.15,
                    sustain_level=0.6,
                    release_time=0.3
                ),
                ThreatLevel.MEDIUM: ToneParameters(
                    frequency=450.0,
                    amplitude=0.6,
                    duration=0.6,
                    waveform=WaveformType.SINE,
                    harmonics=[(1.5, 0.25)],
                    attack_time=0.05,
                    decay_time=0.2,
                    sustain_level=0.5,
                    release_time=0.4
                )
            },
            
            # TRESPASSING - Authoritative, clear warning
            'trespassing': {
                ThreatLevel.CRITICAL: ToneParameters(
                    frequency=750.0,
                    amplitude=0.8,
                    duration=1.0,
                    waveform=WaveformType.SQUARE,
                    harmonics=[(0.5, 0.2), (2.0, 0.3)],
                    amplitude_modulation={'frequency': 4.0, 'depth': 0.3},
                    attack_time=0.01,
                    decay_time=0.1,
                    sustain_level=0.7,
                    release_time=0.2
                ),
                ThreatLevel.HIGH: ToneParameters(
                    frequency=650.0,
                    amplitude=0.7,
                    duration=0.8,
                    waveform=WaveformType.TRIANGLE,
                    harmonics=[(2.0, 0.25)],
                    attack_time=0.02,
                    decay_time=0.12,
                    sustain_level=0.6,
                    release_time=0.25
                )
            },
            
            # TRANSIENT ACTIVITY - Gentle but noticeable
            'transient_activity': {
                ThreatLevel.MEDIUM: ToneParameters(
                    frequency=350.0,
                    amplitude=0.5,
                    duration=1.5,
                    waveform=WaveformType.SINE,
                    amplitude_modulation={'frequency': 2.0, 'depth': 0.3},
                    attack_time=0.1,
                    decay_time=0.3,
                    sustain_level=0.4,
                    release_time=0.5
                ),
                ThreatLevel.LOW: ToneParameters(
                    frequency=300.0,
                    amplitude=0.4,
                    duration=1.0,
                    waveform=WaveformType.SINE,
                    attack_time=0.15,
                    decay_time=0.4,
                    sustain_level=0.3,
                    release_time=0.6
                )
            },
            
            # VANDALISM - Sharp, disapproving
            'vandalism': {
                ThreatLevel.HIGH: ToneParameters(
                    frequency=580.0,
                    amplitude=0.75,
                    duration=0.7,
                    waveform=WaveformType.SAWTOOTH,
                    harmonics=[(1.5, 0.2), (2.5, 0.15)],
                    amplitude_modulation={'frequency': 5.0, 'depth': 0.4},
                    attack_time=0.02,
                    decay_time=0.1,
                    sustain_level=0.6,
                    release_time=0.2
                ),
                ThreatLevel.MEDIUM: ToneParameters(
                    frequency=520.0,
                    amplitude=0.65,
                    duration=0.5,
                    waveform=WaveformType.TRIANGLE,
                    attack_time=0.03,
                    decay_time=0.15,
                    sustain_level=0.5,
                    release_time=0.3
                )
            }
        }
    
    def generate_threat_tone(self, threat_type: str, threat_level: ThreatLevel,
                           confidence: float = 1.0, custom_params: ToneParameters = None) -> np.ndarray:
        """
        Generate a tone for a specific threat
        
        Args:
            threat_type: Type of threat
            threat_level: Severity level of threat
            confidence: Detection confidence (0.0 - 1.0)
            custom_params: Custom tone parameters (optional)
        
        Returns:
            Generated audio as numpy array
        """
        start_time = time.perf_counter()
        
        # Get tone parameters
        if custom_params:
            params = custom_params
        else:
            threat_configs = self.threat_tone_configs.get(threat_type, {})
            params = threat_configs.get(threat_level)
            
            if params is None:
                # Fallback to generic tone
                params = self._get_generic_tone_params(threat_level)
        
        # Apply confidence scaling
        adjusted_params = self._apply_confidence_scaling(params, confidence)
        
        # Generate base tone
        tone = self._generate_base_tone(adjusted_params)
        
        # Apply psychoacoustic enhancements
        if self.psychoacoustic_settings['equal_loudness_compensation']:
            tone = self._apply_equal_loudness_compensation(tone, adjusted_params.frequency)
        
        if self.psychoacoustic_settings['attention_frequency_boost']:
            tone = self._apply_attention_frequency_boost(tone, threat_level)
        
        # Update performance stats
        generation_time = time.perf_counter() - start_time
        self._update_generation_stats(generation_time)
        
        logger.debug(f"🎵 Generated {threat_type} tone ({threat_level.name}) in {generation_time:.4f}s")
        
        return tone.astype(np.float32)
    
    def _get_generic_tone_params(self, threat_level: ThreatLevel) -> ToneParameters:
        """Get generic tone parameters for unknown threat types"""
        base_frequencies = {
            ThreatLevel.CRITICAL: 800.0,
            ThreatLevel.HIGH: 600.0,
            ThreatLevel.MEDIUM: 450.0,
            ThreatLevel.LOW: 350.0
        }
        
        base_amplitudes = {
            ThreatLevel.CRITICAL: 0.9,
            ThreatLevel.HIGH: 0.7,
            ThreatLevel.MEDIUM: 0.5,
            ThreatLevel.LOW: 0.4
        }
        
        return ToneParameters(
            frequency=base_frequencies.get(threat_level, 450.0),
            amplitude=base_amplitudes.get(threat_level, 0.5),
            duration=1.0,
            waveform=WaveformType.SINE
        )
    
    def _apply_confidence_scaling(self, params: ToneParameters, confidence: float) -> ToneParameters:
        """Apply confidence-based scaling to tone parameters"""
        # Create a copy of parameters
        scaled_params = ToneParameters(
            frequency=params.frequency,
            amplitude=params.amplitude * confidence,
            duration=params.duration,
            waveform=params.waveform,
            phase=params.phase,
            harmonics=params.harmonics,
            amplitude_modulation=params.amplitude_modulation,
            frequency_modulation=params.frequency_modulation,
            attack_time=params.attack_time,
            decay_time=params.decay_time,
            sustain_level=params.sustain_level * confidence,
            release_time=params.release_time,
            filter_cutoff=params.filter_cutoff,
            filter_resonance=params.filter_resonance
        )
        
        return scaled_params
    
    def _generate_base_tone(self, params: ToneParameters) -> np.ndarray:
        """Generate the base tone using specified parameters"""
        # Calculate number of samples
        samples = int(params.duration * self.sample_rate)
        t = np.linspace(0, params.duration, samples, False)
        
        # Generate base waveform
        if params.waveform == WaveformType.SINE:
            tone = np.sin(2 * np.pi * params.frequency * t + params.phase)
        elif params.waveform == WaveformType.SQUARE:
            tone = np.sign(np.sin(2 * np.pi * params.frequency * t + params.phase))
        elif params.waveform == WaveformType.SAWTOOTH:
            tone = 2 * (t * params.frequency - np.floor(t * params.frequency + 0.5))
        elif params.waveform == WaveformType.TRIANGLE:
            tone = 2 * np.abs(2 * (t * params.frequency - np.floor(t * params.frequency + 0.5))) - 1
        elif params.waveform == WaveformType.PULSE:
            duty_cycle = 0.5  # 50% duty cycle
            tone = (np.sin(2 * np.pi * params.frequency * t + params.phase) > (2 * duty_cycle - 1)).astype(float) * 2 - 1
        elif params.waveform == WaveformType.NOISE:
            tone = np.random.uniform(-1, 1, samples)
        else:
            # Default to sine wave
            tone = np.sin(2 * np.pi * params.frequency * t + params.phase)
        
        # Add harmonics
        if params.harmonics:
            for freq_ratio, harmonic_amplitude in params.harmonics:
                harmonic_freq = params.frequency * freq_ratio
                harmonic = np.sin(2 * np.pi * harmonic_freq * t) * harmonic_amplitude
                tone += harmonic
        
        # Apply modulation
        if params.amplitude_modulation:
            mod_freq = params.amplitude_modulation['frequency']
            mod_depth = params.amplitude_modulation['depth']
            mod_signal = 1 + mod_depth * np.sin(2 * np.pi * mod_freq * t)
            tone *= mod_signal
        
        if params.frequency_modulation:
            mod_freq = params.frequency_modulation['frequency']
            mod_depth = params.frequency_modulation['depth']
            freq_mod = params.frequency + mod_depth * np.sin(2 * np.pi * mod_freq * t)
            
            # Recalculate phase for frequency modulation
            phase_mod = 2 * np.pi * np.cumsum(freq_mod) / self.sample_rate
            tone = np.sin(phase_mod + params.phase)
        
        # Apply ADSR envelope
        envelope = self._generate_adsr_envelope(samples, params)
        tone *= envelope
        
        # Apply amplitude scaling
        tone *= params.amplitude
        
        # Apply filter if specified
        if params.filter_cutoff:
            tone = self._apply_low_pass_filter(tone, params.filter_cutoff, params.filter_resonance)
        
        # Normalize to prevent clipping
        max_amplitude = np.max(np.abs(tone))
        if max_amplitude > 1.0:
            tone = tone / max_amplitude
        
        return tone
    
    def _generate_adsr_envelope(self, samples: int, params: ToneParameters) -> np.ndarray:
        """Generate ADSR envelope for tone shaping"""
        envelope = np.ones(samples)
        
        # Calculate sample counts for each phase
        attack_samples = int(params.attack_time * self.sample_rate)
        decay_samples = int(params.decay_time * self.sample_rate)
        release_samples = int(params.release_time * self.sample_rate)
        sustain_samples = samples - attack_samples - decay_samples - release_samples
        
        # Ensure sustain is not negative
        if sustain_samples < 0:
            # Scale down other phases proportionally
            total_other = attack_samples + decay_samples + release_samples
            if total_other > 0:
                scale_factor = samples / total_other
                attack_samples = int(attack_samples * scale_factor)
                decay_samples = int(decay_samples * scale_factor)
                release_samples = samples - attack_samples - decay_samples
                sustain_samples = 0
        
        current_sample = 0
        
        # Attack phase
        if attack_samples > 0:
            envelope[current_sample:current_sample + attack_samples] = np.linspace(0, 1, attack_samples)
            current_sample += attack_samples
        
        # Decay phase
        if decay_samples > 0:
            envelope[current_sample:current_sample + decay_samples] = np.linspace(1, params.sustain_level, decay_samples)
            current_sample += decay_samples
        
        # Sustain phase
        if sustain_samples > 0:
            envelope[current_sample:current_sample + sustain_samples] = params.sustain_level
            current_sample += sustain_samples
        
        # Release phase
        if release_samples > 0 and current_sample < samples:
            actual_release_samples = min(release_samples, samples - current_sample)
            envelope[current_sample:current_sample + actual_release_samples] = np.linspace(
                params.sustain_level, 0, actual_release_samples
            )
        
        return envelope
    
    def _apply_low_pass_filter(self, audio: np.ndarray, cutoff_freq: float, resonance: float) -> np.ndarray:
        """Apply simple low-pass filter to audio"""
        # Simple IIR low-pass filter implementation
        # This is a basic implementation - could be enhanced with more sophisticated filtering
        
        # Calculate filter coefficient
        dt = 1.0 / self.sample_rate
        rc = 1.0 / (2 * np.pi * cutoff_freq)
        alpha = dt / (rc + dt)
        
        # Apply filter
        filtered = np.zeros_like(audio)
        filtered[0] = alpha * audio[0]
        
        for i in range(1, len(audio)):
            filtered[i] = alpha * audio[i] + (1 - alpha) * filtered[i - 1]
        
        # Apply resonance (simplified)
        if resonance > 1.0:
            # Add some feedback for resonance effect
            resonance_factor = min(resonance - 1.0, 0.5)
            for i in range(2, len(filtered)):
                filtered[i] += resonance_factor * (filtered[i] - filtered[i - 2])
        
        return filtered
    
    def _apply_equal_loudness_compensation(self, tone: np.ndarray, frequency: float) -> np.ndarray:
        """Apply equal loudness compensation based on frequency"""
        # Simplified equal loudness compensation
        # Based on ISO 226 standard approximation
        
        if frequency < 1000:
            # Boost low frequencies
            boost = 1.0 + (1000 - frequency) / 2000 * 0.3
        elif frequency > 4000:
            # Slight boost for high frequencies
            boost = 1.0 + (frequency - 4000) / 10000 * 0.2
        else:
            # Minimal adjustment for mid frequencies
            boost = 1.0
        
        return tone * boost
    
    def _apply_attention_frequency_boost(self, tone: np.ndarray, threat_level: ThreatLevel) -> np.ndarray:
        """Apply frequency-specific boost for attention grabbing"""
        # Boost based on threat level
        boost_factors = {
            ThreatLevel.CRITICAL: 1.2,
            ThreatLevel.HIGH: 1.1,
            ThreatLevel.MEDIUM: 1.05,
            ThreatLevel.LOW: 1.0
        }
        
        boost = boost_factors.get(threat_level, 1.0)
        return tone * boost
    
    def generate_sequence(self, tone_sequence: List[Tuple[str, ThreatLevel, float]],
                         gap_duration: float = 0.1) -> np.ndarray:
        """
        Generate a sequence of tones with gaps between them
        
        Args:
            tone_sequence: List of (threat_type, threat_level, duration) tuples
            gap_duration: Duration of gaps between tones in seconds
        
        Returns:
            Combined audio sequence
        """
        audio_segments = []
        
        for i, (threat_type, threat_level, duration) in enumerate(tone_sequence):
            # Generate tone with custom duration
            custom_params = self._get_tone_params_with_duration(threat_type, threat_level, duration)
            tone = self.generate_threat_tone(threat_type, threat_level, custom_params=custom_params)
            audio_segments.append(tone)
            
            # Add gap between tones (except after the last one)
            if i < len(tone_sequence) - 1:
                gap_samples = int(gap_duration * self.sample_rate)
                gap = np.zeros(gap_samples, dtype=np.float32)
                audio_segments.append(gap)
        
        # Concatenate all segments
        return np.concatenate(audio_segments)
    
    def _get_tone_params_with_duration(self, threat_type: str, threat_level: ThreatLevel, 
                                     duration: float) -> ToneParameters:
        """Get tone parameters with custom duration"""
        threat_configs = self.threat_tone_configs.get(threat_type, {})
        base_params = threat_configs.get(threat_level)
        
        if base_params is None:
            base_params = self._get_generic_tone_params(threat_level)
        
        # Create copy with custom duration
        custom_params = ToneParameters(
            frequency=base_params.frequency,
            amplitude=base_params.amplitude,
            duration=duration,  # Override duration
            waveform=base_params.waveform,
            phase=base_params.phase,
            harmonics=base_params.harmonics,
            amplitude_modulation=base_params.amplitude_modulation,
            frequency_modulation=base_params.frequency_modulation,
            attack_time=base_params.attack_time,
            decay_time=base_params.decay_time,
            sustain_level=base_params.sustain_level,
            release_time=base_params.release_time,
            filter_cutoff=base_params.filter_cutoff,
            filter_resonance=base_params.filter_resonance
        )
        
        return custom_params
    
    def create_custom_tone(self, frequency: float, amplitude: float = 0.7, 
                          duration: float = 1.0, waveform: WaveformType = WaveformType.SINE,
                          **kwargs) -> np.ndarray:
        """
        Create a custom tone with specified parameters
        
        Args:
            frequency: Tone frequency in Hz
            amplitude: Tone amplitude (0.0 - 1.0)
            duration: Tone duration in seconds
            waveform: Waveform type
            **kwargs: Additional tone parameters
        
        Returns:
            Generated audio as numpy array
        """
        params = ToneParameters(
            frequency=frequency,
            amplitude=amplitude,
            duration=duration,
            waveform=waveform,
            **kwargs
        )
        
        return self._generate_base_tone(params)
    
    def _update_generation_stats(self, generation_time: float):
        """Update tone generation statistics"""
        self.generation_stats['tones_generated'] += 1
        self.generation_stats['total_generation_time'] += generation_time
        
        count = self.generation_stats['tones_generated']
        total_time = self.generation_stats['total_generation_time']
        self.generation_stats['average_generation_time'] = total_time / count
    
    def get_generation_statistics(self) -> Dict[str, Any]:
        """Get tone generation statistics"""
        return {
            'sample_rate': self.sample_rate,
            'available_threat_types': list(self.threat_tone_configs.keys()),
            'psychoacoustic_enabled': any(self.psychoacoustic_settings.values()),
            **self.generation_stats
        }
    
    def update_threat_tone_config(self, threat_type: str, threat_level: ThreatLevel,
                                 params: ToneParameters):
        """
        Update tone configuration for a specific threat
        
        Args:
            threat_type: Type of threat
            threat_level: Threat level
            params: New tone parameters
        """
        if threat_type not in self.threat_tone_configs:
            self.threat_tone_configs[threat_type] = {}
        
        self.threat_tone_configs[threat_type][threat_level] = params
        
        logger.info(f"✅ Updated tone config for {threat_type} ({threat_level.name})")
    
    def export_tone_to_wav(self, tone: np.ndarray, filename: str):
        """
        Export generated tone to WAV file
        
        Args:
            tone: Generated audio data
            filename: Output filename
        """
        try:
            import wave
            
            # Convert to 16-bit integer
            tone_int16 = (tone * 32767).astype(np.int16)
            
            with wave.open(filename, 'w') as wav_file:
                wav_file.setnchannels(1)  # Mono
                wav_file.setsampwidth(2)  # 2 bytes per sample (16-bit)
                wav_file.setframerate(self.sample_rate)
                wav_file.writeframes(tone_int16.tobytes())
            
            logger.info(f"💾 Exported tone to {filename}")
            
        except ImportError:
            logger.error("❌ Wave module not available for export")
        except Exception as e:
            logger.error(f"❌ Failed to export tone: {e}")
