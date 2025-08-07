"""
DEEPGRAM SERVICE - MASTER PROMPT v52.0
=======================================
Deepgram integration service for real-time speech-to-text
Handles streaming transcription for Voice AI Dispatcher

Features:
- Real-time streaming transcription
- Multiple audio format support
- High accuracy speech recognition
- Language and accent detection
- Conversation intelligence features
- WebSocket streaming integration
- Production-grade error handling
- Comprehensive logging and monitoring
"""

import os
import asyncio
import logging
import json
import websockets
from typing import Optional, Dict, Any, List, Callable, AsyncGenerator
from datetime import datetime, timezone
import base64
import aiohttp
from dataclasses import dataclass

# Set up logging
logger = logging.getLogger(__name__)

@dataclass
class TranscriptionResult:
    """Data class for transcription results"""
    text: str
    confidence: float
    is_final: bool
    timestamp: datetime
    speaker_id: Optional[str] = None
    language: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None

class DeepgramService:
    """
    Comprehensive Deepgram integration service for Voice AI Dispatcher
    """
    
    def __init__(self):
        """Initialize Deepgram service with API credentials"""
        self.api_key = os.getenv('DEEPGRAM_API_KEY')
        self.base_url = "https://api.deepgram.com/v1"
        
        if not self.api_key:
            raise ValueError("Missing DEEPGRAM_API_KEY environment variable")
        
        self.active_streams: Dict[str, Dict[str, Any]] = {}
        self.transcription_handlers: Dict[str, Callable] = {}
        
        # Default configuration for live transcription
        self.default_config = {
            'model': 'nova-2',  # Latest Deepgram model
            'language': 'en-US',
            'smart_format': True,
            'interim_results': True,
            'punctuate': True,
            'diarize': True,  # Speaker identification
            'multichannel': True,  # For caller/AI separation
            'numerals': True,
            'profanity_filter': False,  # Keep original for analysis
            'redact': [],  # Don't redact anything for security analysis
            'search': [],  # Can add keywords to search for
            'keywords': [],  # Boost recognition of security terms
            'utterances': True,  # Get utterance timing
            'utt_split': 0.8,  # Utterance splitting threshold
            'encoding': 'linear16',
            'sample_rate': 16000,
            'channels': 2
        }
        
        logger.info("DeepgramService initialized successfully")
    
    async def create_live_transcription_stream(
        self,
        stream_id: str,
        config: Optional[Dict[str, Any]] = None,
        transcription_handler: Optional[Callable] = None
    ) -> str:
        """
        Create a live transcription WebSocket stream
        
        Args:
            stream_id: Unique identifier for this stream
            config: Custom configuration (overrides defaults)
            transcription_handler: Callback function for transcription results
            
        Returns:
            WebSocket URL for streaming audio
        """
        try:
            # Merge custom config with defaults
            stream_config = {**self.default_config, **(config or {})}
            
            # Build WebSocket URL with parameters
            params = []
            for key, value in stream_config.items():
                if isinstance(value, bool):
                    if value:
                        params.append(key)
                elif isinstance(value, list):
                    for item in value:
                        params.append(f"{key}={item}")
                else:
                    params.append(f"{key}={value}")
            
            ws_url = f"wss://api.deepgram.com/v1/listen?{'&'.join(params)}"
            
            # Store stream information
            stream_info = {
                'stream_id': stream_id,
                'ws_url': ws_url,
                'config': stream_config,
                'status': 'created',
                'created_at': datetime.now(timezone.utc).isoformat(),
                'transcription_handler': transcription_handler
            }
            
            self.active_streams[stream_id] = stream_info
            
            if transcription_handler:
                self.transcription_handlers[stream_id] = transcription_handler
            
            logger.info(f"Created live transcription stream: {stream_id}")
            return ws_url
            
        except Exception as e:
            logger.error(f"Failed to create transcription stream {stream_id}: {e}")
            raise
    
    async def start_live_transcription(
        self,
        stream_id: str,
        audio_generator: AsyncGenerator[bytes, None]
    ) -> None:
        """
        Start live transcription for an audio stream
        
        Args:
            stream_id: Stream identifier
            audio_generator: Async generator yielding audio bytes
        """
        if stream_id not in self.active_streams:
            raise ValueError(f"Stream {stream_id} not found")
        
        stream_info = self.active_streams[stream_id]
        ws_url = stream_info['ws_url']
        
        try:
            headers = {
                'Authorization': f'Token {self.api_key}'
            }
            
            async with websockets.connect(ws_url, extra_headers=headers) as websocket:
                logger.info(f"Connected to Deepgram WebSocket for stream: {stream_id}")
                stream_info['status'] = 'connected'
                stream_info['websocket'] = websocket
                
                # Start tasks for sending audio and receiving transcriptions
                send_task = asyncio.create_task(
                    self._send_audio_stream(websocket, audio_generator, stream_id)
                )
                receive_task = asyncio.create_task(
                    self._receive_transcriptions(websocket, stream_id)
                )
                
                # Wait for either task to complete (or fail)
                done, pending = await asyncio.wait(
                    [send_task, receive_task],
                    return_when=asyncio.FIRST_COMPLETED
                )
                
                # Cancel pending tasks
                for task in pending:
                    task.cancel()
                    try:
                        await task
                    except asyncio.CancelledError:
                        pass
                
                # Check if any tasks raised exceptions
                for task in done:
                    if task.exception():
                        raise task.exception()
                        
        except Exception as e:
            logger.error(f"Error in live transcription for stream {stream_id}: {e}")
            stream_info['status'] = 'error'
            stream_info['error'] = str(e)
            raise
        finally:
            stream_info['status'] = 'disconnected'
            if 'websocket' in stream_info:
                del stream_info['websocket']
            logger.info(f"Disconnected from live transcription stream: {stream_id}")
    
    async def _send_audio_stream(
        self,
        websocket,
        audio_generator: AsyncGenerator[bytes, None],
        stream_id: str
    ) -> None:
        """
        Send audio data to Deepgram WebSocket
        
        Args:
            websocket: WebSocket connection
            audio_generator: Audio data generator
            stream_id: Stream identifier
        """
        try:
            async for audio_chunk in audio_generator:
                if audio_chunk:
                    await websocket.send(audio_chunk)
                    logger.debug(f"Sent {len(audio_chunk)} bytes to stream {stream_id}")
                
        except websockets.exceptions.ConnectionClosed:
            logger.info(f"WebSocket connection closed for stream {stream_id}")
        except Exception as e:
            logger.error(f"Error sending audio for stream {stream_id}: {e}")
            raise
        finally:
            # Send close message to indicate end of audio stream
            try:
                await websocket.send(json.dumps({"type": "CloseStream"}))
                logger.debug(f"Sent close stream message for {stream_id}")
            except Exception as e:
                logger.debug(f"Failed to send close stream message: {e}")
    
    async def _receive_transcriptions(self, websocket, stream_id: str) -> None:
        """
        Receive transcription results from Deepgram WebSocket
        
        Args:
            websocket: WebSocket connection
            stream_id: Stream identifier
        """
        try:
            async for message in websocket:
                try:
                    data = json.loads(message)
                    await self._process_transcription_result(data, stream_id)
                    
                except json.JSONDecodeError as e:
                    logger.error(f"Failed to parse transcription JSON for stream {stream_id}: {e}")
                except Exception as e:
                    logger.error(f"Error processing transcription for stream {stream_id}: {e}")
                    
        except websockets.exceptions.ConnectionClosed:
            logger.info(f"Transcription WebSocket closed for stream {stream_id}")
        except Exception as e:
            logger.error(f"Error receiving transcriptions for stream {stream_id}: {e}")
            raise
    
    async def _process_transcription_result(
        self,
        data: Dict[str, Any],
        stream_id: str
    ) -> None:
        """
        Process and handle transcription results
        
        Args:
            data: Transcription result from Deepgram
            stream_id: Stream identifier
        """
        try:
            # Handle different message types
            message_type = data.get('type', 'Results')
            
            if message_type == 'Results':
                # Extract transcription data
                channel = data.get('channel', {})
                alternatives = channel.get('alternatives', [])
                
                if alternatives:
                    alternative = alternatives[0]  # Use best alternative
                    transcript = alternative.get('transcript', '')
                    confidence = alternative.get('confidence', 0.0)
                    
                    # Check if this is a final result
                    is_final = data.get('is_final', False)
                    
                    # Extract timing information
                    words = alternative.get('words', [])
                    start_time = words[0].get('start', 0) if words else 0
                    
                    # Extract speaker information if available
                    speaker_id = None
                    if 'speaker' in alternative:
                        speaker_id = str(alternative['speaker'])
                    
                    # Create transcription result
                    result = TranscriptionResult(
                        text=transcript,
                        confidence=confidence,
                        is_final=is_final,
                        timestamp=datetime.now(timezone.utc),
                        speaker_id=speaker_id,
                        language=data.get('channel', {}).get('language', 'en-US'),
                        metadata={
                            'start_time': start_time,
                            'words': words,
                            'raw_data': data
                        }
                    )
                    
                    # Call the transcription handler if available
                    if stream_id in self.transcription_handlers:
                        handler = self.transcription_handlers[stream_id]
                        try:
                            await handler(result)
                        except Exception as e:
                            logger.error(f"Error in transcription handler for stream {stream_id}: {e}")
                    
                    # Log the transcription (final results only to avoid spam)
                    if is_final and transcript.strip():
                        logger.info(f"Transcription [{stream_id}]: {transcript} (confidence: {confidence:.2f})")
            
            elif message_type == 'Metadata':
                # Handle metadata messages
                logger.debug(f"Received metadata for stream {stream_id}: {data}")
                
            elif message_type == 'UtteranceEnd':
                # Handle utterance end events
                logger.debug(f"Utterance ended for stream {stream_id}")
                
            else:
                logger.debug(f"Unknown message type for stream {stream_id}: {message_type}")
                
        except Exception as e:
            logger.error(f"Error processing transcription result for stream {stream_id}: {e}")
    
    async def transcribe_audio_file(
        self,
        audio_file_path: str,
        config: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Transcribe a pre-recorded audio file
        
        Args:
            audio_file_path: Path to audio file
            config: Custom transcription configuration
            
        Returns:
            Complete transcription result
        """
        try:
            # Merge config with defaults (remove streaming-specific options)
            file_config = {
                'model': 'nova-2',
                'language': 'en-US',
                'smart_format': True,
                'punctuate': True,
                'diarize': True,
                'numerals': True,
                'profanity_filter': False,
                'utterances': True
            }
            
            if config:
                file_config.update(config)
            
            headers = {
                'Authorization': f'Token {self.api_key}',
                'Content-Type': 'audio/wav'  # Adjust based on file type
            }
            
            # Build query parameters
            params = []
            for key, value in file_config.items():
                if isinstance(value, bool):
                    if value:
                        params.append(key)
                else:
                    params.append(f"{key}={value}")
            
            url = f"{self.base_url}/listen?{'&'.join(params)}"
            
            # Read and send audio file
            with open(audio_file_path, 'rb') as audio_file:
                async with aiohttp.ClientSession() as session:
                    async with session.post(url, headers=headers, data=audio_file) as response:
                        response.raise_for_status()
                        result = await response.json()
            
            logger.info(f"Successfully transcribed audio file: {audio_file_path}")
            return result
            
        except Exception as e:
            logger.error(f"Failed to transcribe audio file {audio_file_path}: {e}")
            raise
    
    async def stop_transcription_stream(self, stream_id: str) -> None:
        """
        Stop and cleanup a transcription stream
        
        Args:
            stream_id: Stream identifier
        """
        try:
            if stream_id in self.active_streams:
                stream_info = self.active_streams[stream_id]
                
                # Close WebSocket if still connected
                if 'websocket' in stream_info:
                    try:
                        await stream_info['websocket'].close()
                    except Exception as e:
                        logger.debug(f"Error closing WebSocket for stream {stream_id}: {e}")
                
                # Cleanup
                del self.active_streams[stream_id]
                if stream_id in self.transcription_handlers:
                    del self.transcription_handlers[stream_id]
                
                logger.info(f"Stopped transcription stream: {stream_id}")
            else:
                logger.warning(f"Attempted to stop unknown stream: {stream_id}")
                
        except Exception as e:
            logger.error(f"Error stopping transcription stream {stream_id}: {e}")
    
    def get_active_streams(self) -> Dict[str, Dict[str, Any]]:
        """
        Get information about all active transcription streams
        
        Returns:
            Dictionary of active streams (without WebSocket objects)
        """
        result = {}
        for stream_id, stream_info in self.active_streams.items():
            # Copy stream info but exclude WebSocket object
            clean_info = {k: v for k, v in stream_info.items() if k != 'websocket'}
            result[stream_id] = clean_info
        return result
    
    def get_stream_info(self, stream_id: str) -> Optional[Dict[str, Any]]:
        """
        Get information about a specific stream
        
        Args:
            stream_id: Stream identifier
            
        Returns:
            Stream information or None if not found
        """
        if stream_id in self.active_streams:
            stream_info = self.active_streams[stream_id]
            # Return copy without WebSocket object
            return {k: v for k, v in stream_info.items() if k != 'websocket'}
        return None
    
    async def cleanup_all_streams(self) -> None:
        """
        Stop and cleanup all active transcription streams
        """
        stream_ids = list(self.active_streams.keys())
        for stream_id in stream_ids:
            try:
                await self.stop_transcription_stream(stream_id)
            except Exception as e:
                logger.error(f"Error cleaning up stream {stream_id}: {e}")
        
        logger.info("Cleaned up all transcription streams")

# Global instance for use across the application
deepgram_service = DeepgramService()
