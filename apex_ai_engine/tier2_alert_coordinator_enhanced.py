"""
APEX AI TIER 2 ALERT INTEGRATION MODULE - ENHANCED WITH MULTI-MONITOR COORDINATION
===================================================================================
Integration layer for visual and audio alert systems with advanced multi-monitor threat tracking
Connects threat detection to professional frontend alert components with cross-monitor correlation

Enhanced Features:
- Unified alert triggering for visual and audio systems
- Multi-monitor threat correlation and handoff
- Cross-monitor threat following with <500ms latency
- Threat level escalation and coordination
- Real-time frontend communication
- Performance monitoring and statistics
- Professional security alert protocols
"""

import asyncio
import logging
from typing import Dict, List, Optional, Any, Tuple
from datetime import datetime
import time

# Import our enhanced alert engines
from visual_alerts.enhanced_visual_alert_engine import EnhancedVisualAlertEngine, ThreatLevel
from audio_alerts.spatial_audio_engine import SpatialAudioEngine, ThreatAudioProfile

# Import multi-monitor threat correlation engine
from threat_correlation_engine import ThreatCorrelationEngine, ThreatCorrelationStatus

logger = logging.getLogger(__name__)

class Tier2AlertCoordinator:
    """
    Enhanced Coordinates visual and audio alerts for TIER 2 frontend integration with multi-monitor support
    
    This class serves as the main interface between AI threat detection and the professional 
    frontend alert components with advanced cross-monitor threat correlation capabilities.
    """
    
    def __init__(self, websocket_client=None, config: Dict[str, Any] = None):
        """
        Initialize the enhanced TIER 2 alert coordinator with multi-monitor support
        
        Args:
            websocket_client: Socket.io client for frontend communication
            config: Configuration dictionary
        """
        self.websocket_client = websocket_client
        self.config = config or {}
        
        # Initialize alert engines
        self.visual_engine = EnhancedVisualAlertEngine(
            websocket_client=websocket_client,
            config=self.config.get('visual', {})
        )
        
        self.audio_engine = SpatialAudioEngine(
            websocket_client=websocket_client,
            config=self.config.get('audio', {})
        )
        
        # Initialize multi-monitor threat correlation engine
        self.correlation_engine = ThreatCorrelationEngine(
            config=self.config.get('correlation', {
                'min_correlation_confidence': 0.65,
                'max_threat_age_seconds': 300,
                'handoff_timeout_seconds': 8,
                'weight_spatial': 0.3,
                'weight_temporal': 0.25,
                'weight_threat_type': 0.2,
                'weight_features': 0.15,
                'weight_movement': 0.1
            })
        )
        
        # Alert coordination settings
        self.enable_visual_alerts = self.config.get('enable_visual', True)
        self.enable_audio_alerts = self.config.get('enable_audio', True)
        self.enable_voice_responses = self.config.get('enable_voice', True)
        self.enable_multi_monitor_correlation = self.config.get('enable_multi_monitor', True)
        self.cross_monitor_handoff_latency_target = self.config.get('handoff_latency_target', 0.5)  # 500ms target
        
        # Threat escalation configuration
        self.escalation_rules = {
            'weapon_detection': {
                'auto_escalate': True,
                'escalation_delay': 0,  # Immediate
                'notify_authorities': True,
                'trigger_voice_response': True
            },
            'violence_detection': {
                'auto_escalate': True,
                'escalation_delay': 2000,  # 2 seconds
                'notify_authorities': True,
                'trigger_voice_response': True
            },
            'trespassing': {
                'auto_escalate': False,
                'escalation_delay': 5000,  # 5 seconds
                'notify_authorities': False,
                'trigger_voice_response': True
            },
            'package_theft': {
                'auto_escalate': False,
                'escalation_delay': 3000,  # 3 seconds
                'notify_authorities': False,
                'trigger_voice_response': True
            }
        }
        
        # Enhanced statistics and monitoring including multi-monitor metrics
        self.stats = {
            'total_alerts_coordinated': 0,
            'visual_alerts_triggered': 0,
            'audio_alerts_triggered': 0,
            'voice_responses_initiated': 0,
            'escalations_performed': 0,
            'cross_monitor_correlations': 0,
            'successful_handoffs': 0,
            'failed_handoffs': 0,
            'average_response_latency': 0.0,
            'average_handoff_latency': 0.0,
            'last_alert_time': None
        }
        
        logger.info('🚨 Enhanced TIER 2 Alert Coordinator with Multi-Monitor Support initialized')
    
    async def initialize_correlation_engine(self):
        """Initialize the threat correlation engine background tasks"""
        await self.correlation_engine.start_correlation_engine()
        logger.info('🔗 Multi-monitor threat correlation engine started')
    
    async def register_monitor_relationship(self, monitor_a: str, monitor_b: str,
                                          spatial_relationship: str = 'adjacent',
                                          transition_zones: List[Dict[str, Any]] = None,
                                          confidence_multiplier: float = 1.2):
        """
        Register spatial relationship between monitors for correlation
        
        Args:
            monitor_a: First monitor ID
            monitor_b: Second monitor ID
            spatial_relationship: Relationship type ('adjacent', 'overlapping', 'sequential')
            transition_zones: Zones where handoffs typically occur
            confidence_multiplier: Boost factor for correlations between these monitors
        """
        self.correlation_engine.register_monitor_relationship(
            monitor_a, monitor_b, spatial_relationship, transition_zones, confidence_multiplier
        )
        
        logger.info(f'📍 Registered monitor relationship: {monitor_a} ↔ {monitor_b} ({spatial_relationship})')
    
    async def trigger_coordinated_alert_with_correlation(self, threat_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Enhanced alert coordination with multi-monitor threat correlation
        
        Args:
            threat_data: Comprehensive threat detection data
            
        Returns:
            Dictionary containing alert IDs and correlation information
        """
        start_time = time.time()
        
        # First, trigger standard coordinated alert
        alert_ids = await self.trigger_coordinated_alert(threat_data)
        
        # Add correlation analysis if enabled
        correlation_result = None
        if self.enable_multi_monitor_correlation:
            try:
                # Analyze threat for potential correlations
                correlation_result = await self.correlation_engine.analyze_threat_for_correlation(threat_data)
                
                if correlation_result:
                    alert_ids['correlation'] = correlation_result.correlation_id
                    self.stats['cross_monitor_correlations'] += 1
                    
                    # Send correlation notification to frontend
                    if self.websocket_client:
                        correlation_data = {
                            'correlation_id': correlation_result.correlation_id,
                            'primary_threat': threat_data,
                            'confidence_score': correlation_result.confidence_score,
                            'expected_monitors': list(correlation_result.expected_monitors),
                            'status': correlation_result.correlation_status.value,
                            'created_at': correlation_result.created_at.isoformat()
                        }
                        
                        await self.websocket_client.send_message('threat_correlation_detected', correlation_data)
                    
                    logger.info(f'🔗 Threat correlation detected: {correlation_result.correlation_id} '
                              f'(confidence: {correlation_result.confidence_score:.2f})')
                
            except Exception as e:
                logger.error(f'❌ Threat correlation analysis failed: {e}')
                alert_ids['correlation_error'] = str(e)
        
        # Calculate total coordination time including correlation
        total_time = time.time() - start_time
        alert_ids['total_coordination_time'] = total_time
        
        return alert_ids
    
    async def trigger_coordinated_alert(self, threat_data: Dict[str, Any]) -> Dict[str, str]:
        """
        Trigger coordinated visual and audio alerts for a detected threat
        
        Args:
            threat_data: Comprehensive threat detection data
        
        Returns:
            Dictionary containing alert IDs for tracking
        """
        start_time = time.time()
        
        # Extract threat information
        zone_id = threat_data.get('zone_id', 'UNKNOWN')
        threat_type = threat_data.get('threat_type', 'unknown')
        threat_level = threat_data.get('threat_level', 'MEDIUM')
        confidence = threat_data.get('confidence', 75)
        description = threat_data.get('description', f'{threat_type} detected')
        bbox = threat_data.get('bbox', (0, 0, 100, 100))
        engines_triggered = threat_data.get('engines_triggered', [])
        
        # Convert zone bounding box to position for spatial audio
        zone_position = self._bbox_to_position(bbox, zone_id)
        
        # Enhanced threat data for engines
        enhanced_threat_data = {
            **threat_data,
            'zone_position': zone_position,
            'coordination_timestamp': datetime.now().isoformat(),
            'coordinator_id': f'tier2_coord_{int(time.time() * 1000)}'
        }
        
        alert_ids = {}
        
        try:
            # Trigger visual alert
            if self.enable_visual_alerts:
                visual_alert_id = await self.visual_engine.trigger_visual_alert(
                    zone_id=zone_id,
                    threat_data=enhanced_threat_data
                )
                alert_ids['visual'] = visual_alert_id
                self.stats['visual_alerts_triggered'] += 1
                logger.info(f'✨ Visual alert triggered: {visual_alert_id}')
            
            # Trigger spatial audio alert
            if self.enable_audio_alerts:
                audio_alert_id = await self.audio_engine.trigger_spatial_alert(
                    alert_data=enhanced_threat_data
                )
                alert_ids['audio'] = audio_alert_id
                self.stats['audio_alerts_triggered'] += 1
                logger.info(f'🔊 Audio alert triggered: {audio_alert_id}')
            
            # Check for voice response triggers
            if self.enable_voice_responses and self._should_trigger_voice_response(threat_data):
                voice_response_id = await self._trigger_voice_response(enhanced_threat_data)
                if voice_response_id:
                    alert_ids['voice'] = voice_response_id
                    self.stats['voice_responses_initiated'] += 1
                    logger.info(f'🗣️ Voice response triggered: {voice_response_id}')
            
            # Check for automatic escalation
            if self._should_auto_escalate(threat_data):
                escalation_id = await self._handle_threat_escalation(enhanced_threat_data)
                if escalation_id:
                    alert_ids['escalation'] = escalation_id
                    self.stats['escalations_performed'] += 1
                    logger.warning(f'🔥 Threat escalated: {escalation_id}')
            
            # Update coordination statistics
            response_time = time.time() - start_time
            self._update_coordination_stats(response_time)
            
            logger.info(f'🚨 Coordinated alert complete: {zone_id} - {threat_level} ({response_time:.3f}s)')
            
        except Exception as e:
            logger.error(f'❌ Coordinated alert failed: {e}')
            alert_ids['error'] = str(e)
        
        return alert_ids
    
    async def initiate_cross_monitor_handoff(self, correlation_id: str, from_monitor: str, 
                                           to_monitor: str) -> Dict[str, Any]:
        """
        Initiate threat handoff between monitors
        
        Args:
            correlation_id: ID of the correlation being handed off
            from_monitor: Source monitor ID
            to_monitor: Target monitor ID
            
        Returns:
            Handoff result dictionary
        """
        try:
            # Initiate handoff through correlation engine
            handoff_result = await self.correlation_engine.initiate_threat_handoff(
                correlation_id, from_monitor, to_monitor
            )
            
            if handoff_result['success']:
                # Update coordination statistics
                self.stats['successful_handoffs'] += 1
                
                # Update rolling average handoff latency
                current_avg = self.stats.get('average_handoff_latency', 0.0)
                total_handoffs = self.stats['successful_handoffs']
                new_latency = handoff_result['handoff_latency']
                
                new_avg = ((current_avg * (total_handoffs - 1)) + new_latency) / total_handoffs
                self.stats['average_handoff_latency'] = new_avg
                
                # Send handoff notification to frontend
                if self.websocket_client:
                    await self.websocket_client.send_message('threat_handoff_initiated', {
                        **handoff_result,
                        'timestamp': datetime.now().isoformat()
                    })
                
                logger.info(f'🔄 Cross-monitor handoff initiated: {correlation_id} '
                          f'({from_monitor} → {to_monitor}, latency: {new_latency:.3f}s)')
            else:
                self.stats['failed_handoffs'] += 1
                logger.error(f'❌ Cross-monitor handoff failed: {handoff_result.get("error", "Unknown error")}')
            
            return handoff_result
            
        except Exception as e:
            self.stats['failed_handoffs'] += 1
            logger.error(f'❌ Cross-monitor handoff exception: {e}')
            
            return {
                'success': False,
                'error': str(e),
                'handoff_latency': 0.0
            }
    
    def get_active_cross_monitor_threats(self) -> Dict[str, Any]:
        """Get all active cross-monitor threat correlations"""
        return self.correlation_engine.get_active_correlations()
    
    def _bbox_to_position(self, bbox: tuple, zone_id: str) -> Dict[str, float]:
        """
        Convert bounding box to normalized zone position
        
        Args:
            bbox: Bounding box (x, y, width, height)
            zone_id: Zone identifier for fallback positioning
        
        Returns:
            Normalized position {x: 0.0-1.0, y: 0.0-1.0}
        """
        try:
            x, y, width, height = bbox
            
            # Calculate center point of bounding box
            center_x = x + width / 2
            center_y = y + height / 2
            
            # Normalize to 0.0-1.0 range (assuming screen coordinates)
            # This would typically use actual screen resolution
            screen_width = 1920  # Default assumption
            screen_height = 1080
            
            norm_x = max(0.0, min(1.0, center_x / screen_width))
            norm_y = max(0.0, min(1.0, center_y / screen_height))
            
            return {'x': norm_x, 'y': norm_y}
            
        except Exception:
            # Fallback to zone-based positioning
            zone_positions = {
                'CAM-01': {'x': 0.2, 'y': 0.2},  # Front entrance
                'CAM-02': {'x': 0.8, 'y': 0.2},  # Parking lot
                'CAM-03': {'x': 0.2, 'y': 0.8},  # Lobby
                'CAM-04': {'x': 0.8, 'y': 0.8},  # Rear exit
                'DEFAULT': {'x': 0.5, 'y': 0.5}  # Center
            }
            
            return zone_positions.get(zone_id, zone_positions['DEFAULT'])
    
    def _should_trigger_voice_response(self, threat_data: Dict[str, Any]) -> bool:
        """
        Determine if a voice response should be triggered
        
        Args:
            threat_data: Threat detection data
        
        Returns:
            True if voice response should be triggered
        """
        threat_type = threat_data.get('threat_type', '').lower()
        threat_level = threat_data.get('threat_level', 'MEDIUM')
        confidence = threat_data.get('confidence', 0)
        
        # High confidence and threat level triggers
        if confidence >= 80 and threat_level in ['HIGH', 'CRITICAL', 'WEAPON']:
            return True
        
        # Specific threat types that warrant voice response
        voice_trigger_threats = [
            'trespassing', 'weapon_detection', 'violence_detection',
            'package_theft', 'vandalism', 'loitering'
        ]
        
        return any(trigger in threat_type for trigger in voice_trigger_threats)
    
    def _should_auto_escalate(self, threat_data: Dict[str, Any]) -> bool:
        """
        Determine if threat should be automatically escalated
        
        Args:
            threat_data: Threat detection data
        
        Returns:
            True if threat should be escalated
        """
        threat_type = threat_data.get('threat_type', '').lower()
        threat_level = threat_data.get('threat_level', 'MEDIUM')
        
        # Check escalation rules
        for threat_pattern, rules in self.escalation_rules.items():
            if threat_pattern in threat_type and rules.get('auto_escalate', False):
                return True
        
        # Always escalate weapon and critical threats
        return threat_level in ['WEAPON', 'CRITICAL']
    
    async def _trigger_voice_response(self, threat_data: Dict[str, Any]) -> Optional[str]:
        """
        Trigger AI voice response for threat de-escalation
        
        Args:
            threat_data: Enhanced threat data
        
        Returns:
            Voice response ID if triggered
        """
        if not self.websocket_client:
            logger.warning('⚠️ No websocket client for voice response')
            return None
        
        try:
            # Select appropriate script based on threat type
            threat_type = threat_data.get('threat_type', '').lower()
            script_mapping = {
                'trespassing': 'TRESPASSING',
                'package_theft': 'PACKAGE_THEFT',
                'weapon_detection': 'WEAPON_DETECTED',
                'violence_detection': 'DE_ESCALATION',
                'vandalism': 'FINAL_WARNING',
                'loitering': 'GREETING'
            }
            
            script_id = None
            for threat_key, script_name in script_mapping.items():
                if threat_key in threat_type:
                    script_id = script_name
                    break
            
            # Voice response data
            voice_data = {
                'conversation_id': f'voice_{threat_data.get("zone_id")}_{int(time.time() * 1000)}',
                'zone_id': threat_data.get('zone_id'),
                'threat_type': threat_data.get('threat_type'),
                'threat_level': threat_data.get('threat_level'),
                'script_id': script_id,
                'auto_triggered': True,
                'timestamp': datetime.now().isoformat()
            }
            
            # Send voice response trigger to frontend
            await self.websocket_client.send_message('ai_conversation_started', voice_data)
            
            logger.info(f'🗣️ Voice response initiated for {threat_data.get("zone_id")} with script {script_id}')
            
            return voice_data['conversation_id']
            
        except Exception as e:
            logger.error(f'❌ Voice response trigger failed: {e}')
            return None
    
    async def _handle_threat_escalation(self, threat_data: Dict[str, Any]) -> Optional[str]:
        """
        Handle automatic threat escalation procedures
        
        Args:
            threat_data: Enhanced threat data
        
        Returns:
            Escalation ID if performed
        """
        escalation_id = f'escalation_{int(time.time() * 1000)}'
        
        try:
            threat_type = threat_data.get('threat_type', '').lower()
            escalation_rules = None
            
            # Find matching escalation rules
            for threat_pattern, rules in self.escalation_rules.items():
                if threat_pattern in threat_type:
                    escalation_rules = rules
                    break
            
            if not escalation_rules:
                return None
            
            # Apply escalation delay if specified
            delay = escalation_rules.get('escalation_delay', 0)
            if delay > 0:
                await asyncio.sleep(delay / 1000)  # Convert to seconds
            
            escalation_data = {
                'escalation_id': escalation_id,
                'original_threat': threat_data,
                'escalation_rules': escalation_rules,
                'escalated_at': datetime.now().isoformat(),
                'notify_authorities': escalation_rules.get('notify_authorities', False),
                'priority': 'HIGH'
            }
            
            # Send escalation notification to frontend
            if self.websocket_client:
                await self.websocket_client.send_message('threat_escalation', escalation_data)
            
            logger.warning(f'🔥 Threat escalated: {escalation_id} for {threat_data.get("zone_id")}')
            
            return escalation_id
            
        except Exception as e:
            logger.error(f'❌ Threat escalation failed: {e}')
            return None
    
    def _update_coordination_stats(self, response_time: float):
        """
        Update coordination performance statistics
        
        Args:
            response_time: Time taken for coordination
        """
        self.stats['total_alerts_coordinated'] += 1
        self.stats['last_alert_time'] = datetime.now().isoformat()
        
        # Update rolling average response time
        total_alerts = self.stats['total_alerts_coordinated']
        current_avg = self.stats['average_response_latency']
        
        new_avg = ((current_avg * (total_alerts - 1)) + response_time) / total_alerts
        self.stats['average_response_latency'] = new_avg
    
    async def register_zone(self, zone_id: str, monitor_id: str, 
                           position: Dict[str, int], zone_config: Dict[str, Any] = None):
        """
        Register a monitoring zone with both alert engines
        
        Args:
            zone_id: Unique zone identifier
            monitor_id: Monitor identifier
            position: Zone position {x, y, width, height}
            zone_config: Additional zone configuration
        """
        # Register with visual engine
        self.visual_engine.register_zone(zone_id, monitor_id, position, zone_config)
        
        logger.info(f'📍 Zone {zone_id} registered with TIER 2 coordinator')
    
    async def clear_zone_alerts(self, zone_id: str) -> Dict[str, bool]:
        """
        Clear all alerts for a specific zone
        
        Args:
            zone_id: Zone to clear
        
        Returns:
            Dictionary showing which engines cleared alerts
        """
        results = {}
        
        # Clear visual alerts
        results['visual'] = await self.visual_engine.clear_visual_alert(zone_id)
        
        # Audio alerts are automatically managed by expiration
        results['audio'] = True
        
        logger.info(f'🧹 Cleared alerts for zone {zone_id}')
        
        return results
    
    async def clear_all_alerts(self):
        """
        Clear all active alerts from both engines
        """
        await self.visual_engine.clear_all_visual_alerts()
        await self.audio_engine.stop_all_audio_alerts()
        
        logger.info('🧹 All TIER 2 alerts cleared')
    
    def get_enhanced_coordination_stats(self) -> Dict[str, Any]:
        """
        Get comprehensive coordination statistics including multi-monitor metrics
        
        Returns:
            Enhanced statistics with correlation data
        """
        visual_stats = self.visual_engine.get_visual_alert_stats()
        audio_stats = self.audio_engine.get_audio_stats()
        correlation_stats = self.correlation_engine.get_correlation_statistics()
        
        combined_stats = {
            'coordinator': self.stats.copy(),
            'visual_engine': visual_stats,
            'audio_engine': audio_stats,
            'multi_monitor_coordination': {
                'engine_stats': correlation_stats,
                'active_correlations': len(self.correlation_engine.get_active_correlations()),
                'coordination_enabled': self.enable_multi_monitor_correlation,
                'handoff_latency_target': self.cross_monitor_handoff_latency_target,
                'monitor_relationships': len(self.correlation_engine.monitor_relationships)
            },
            'system_status': {
                'visual_alerts_enabled': self.enable_visual_alerts,
                'audio_alerts_enabled': self.enable_audio_alerts,
                'voice_responses_enabled': self.enable_voice_responses,
                'multi_monitor_enabled': self.enable_multi_monitor_correlation,
                'websocket_connected': self.websocket_client is not None
            },
            'timestamp': datetime.now().isoformat()
        }
        
        return combined_stats
    
    # Legacy method for backward compatibility
    def get_coordination_stats(self) -> Dict[str, Any]:
        """Get comprehensive coordination statistics (legacy compatibility)"""
        return self.get_enhanced_coordination_stats()
    
    async def send_enhanced_stats_to_frontend(self):
        """
        Send comprehensive statistics including multi-monitor data to frontend
        """
        if not self.websocket_client:
            return
        
        try:
            # Send enhanced multi-monitor stats
            enhanced_stats = self.get_enhanced_coordination_stats()
            
            await self.websocket_client.send_message('enhanced_tier2_coordination_stats', enhanced_stats)
            
            # Send active correlations separately for real-time monitoring
            active_correlations = self.get_active_cross_monitor_threats()
            if active_correlations:
                await self.websocket_client.send_message('active_cross_monitor_threats', {
                    'correlations': active_correlations,
                    'count': len(active_correlations),
                    'timestamp': datetime.now().isoformat()
                })
            
            logger.debug('📊 Enhanced TIER 2 coordination stats sent to frontend')
            
        except Exception as e:
            logger.error(f'❌ Failed to send enhanced coordination stats: {e}')
    
    # Legacy method for backward compatibility
    async def send_stats_to_frontend(self):
        """Send comprehensive statistics to frontend (legacy compatibility)"""
        await self.send_enhanced_stats_to_frontend()
    
    def set_websocket_client(self, websocket_client):
        """
        Update websocket client for all engines
        
        Args:
            websocket_client: Socket.io client instance
        """
        self.websocket_client = websocket_client
        self.visual_engine.set_websocket_client(websocket_client)
        self.audio_engine.set_websocket_client(websocket_client)
        
        logger.info('🔌 Enhanced WebSocket client updated for multi-monitor coordination')
    
    def update_configuration(self, new_config: Dict[str, Any]):
        """
        Update coordinator configuration
        
        Args:
            new_config: New configuration parameters
        """
        self.config.update(new_config)
        
        # Update feature flags
        self.enable_visual_alerts = new_config.get('enable_visual', self.enable_visual_alerts)
        self.enable_audio_alerts = new_config.get('enable_audio', self.enable_audio_alerts)
        self.enable_voice_responses = new_config.get('enable_voice', self.enable_voice_responses)
        self.enable_multi_monitor_correlation = new_config.get('enable_multi_monitor', self.enable_multi_monitor_correlation)
        
        # Update escalation rules
        if 'escalation_rules' in new_config:
            self.escalation_rules.update(new_config['escalation_rules'])
        
        logger.info('✅ Enhanced TIER 2 coordinator configuration updated')
    
    def update_threat_location_in_correlation(self, threat_id: str, new_monitor: str, 
                                            new_zone: str, new_bbox: Tuple[int, int, int, int]):
        """
        Update threat location for continued tracking across monitors
        
        Args:
            threat_id: Threat identifier
            new_monitor: New monitor ID
            new_zone: New zone ID
            new_bbox: New bounding box coordinates
        """
        self.correlation_engine.update_threat_location(threat_id, new_monitor, new_zone, new_bbox)
        logger.debug(f'📍 Updated threat {threat_id} location: {new_monitor}/{new_zone}')
    
    async def setup_demo_multi_monitor_relationships(self):
        """
        Setup demo monitor relationships for testing multi-monitor coordination
        """
        demo_relationships = [
            {
                'monitor_a': '0',
                'monitor_b': '1', 
                'relationship': 'adjacent',
                'confidence_multiplier': 1.3
            },
            {
                'monitor_a': '1',
                'monitor_b': '2',
                'relationship': 'sequential', 
                'confidence_multiplier': 1.2
            },
            {
                'monitor_a': '0',
                'monitor_b': '2',
                'relationship': 'overlapping',
                'confidence_multiplier': 1.4
            }
        ]
        
        for relationship in demo_relationships:
            await self.register_monitor_relationship(
                monitor_a=relationship['monitor_a'],
                monitor_b=relationship['monitor_b'],
                spatial_relationship=relationship['relationship'],
                confidence_multiplier=relationship['confidence_multiplier']
            )
        
        logger.info(f'📍 Setup {len(demo_relationships)} demo monitor relationships')
    
    def cleanup_expired_alerts(self):
        """
        Clean up expired alerts from all engines
        """
        self.visual_engine.cleanup_expired_alerts()
        self.audio_engine.cleanup_expired_alerts()
    
    async def cleanup_correlation_engine(self):
        """
        Clean up correlation engine resources
        """
        await self.correlation_engine.stop_correlation_engine()
        logger.info('🧹 Correlation engine cleaned up')
    
    def __del__(self):
        """Cleanup when coordinator is destroyed"""
        try:
            asyncio.create_task(self.clear_all_alerts())
            asyncio.create_task(self.cleanup_correlation_engine())
        except:
            pass
