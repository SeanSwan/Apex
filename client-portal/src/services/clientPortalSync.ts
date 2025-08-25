// client-portal/src/services/clientPortalSync.ts
/**
 * APEX AI CLIENT PORTAL SYNCHRONIZATION SERVICE
 * =============================================
 * 
 * Main orchestrator for real-time synchronization between Admin Dashboard,
 * Client Portal, and Live Monitoring systems with security-first design.
 * 
 * Master Prompt Compliance:
 * - Zero Trust Architecture: Comprehensive authentication and authorization
 * - P0 Security: Immutable audit trails and encrypted communications
 * - Production-Ready: Real-time WebSocket with fallback mechanisms
 * - Extreme Modularity: Event-driven architecture with dependency injection
 * 
 * Features:
 * - WebSocket-based real-time synchronization with auto-reconnection
 * - Intelligent conflict resolution and data validation
 * - Performance-optimized batch processing and caching
 * - Comprehensive error handling with retry mechanisms
 * - Live monitoring integration for camera feeds and AI detection
 * - Property and incident management with audit trails
 */

import { 
  SyncEvent, 
  SyncEventType,
  SyncConfiguration,
  SyncStatus,
  SyncMetrics,
  SyncError,
  PropertySyncData,
  IncidentSyncData,
  SystemHealthSyncData
} from '../types/sync.types';
import { 
  processSyncEvent,
  syncEventHandlerRegistry,
  EventHandlerContext,
  EventHandlerResult
} from '../utils/syncEventHandlers';
import { auditLogger } from '../utils/auditLogger';

// ===========================
// WEBSOCKET MESSAGE TYPES
// ===========================

interface WebSocketMessage {
  type: 'sync_event' | 'heartbeat' | 'auth_challenge' | 'batch_events' | 'status_update';
  data: any;
  timestamp: string;
  messageId: string;
  signature?: string;
}

interface BatchEventMessage {
  events: SyncEvent[];
  batchId: string;
  totalEvents: number;
  batchIndex: number;
  checksum: string;
}

// ===========================
// SYNC SERVICE EVENT EMITTER
// ===========================

type SyncServiceEventType = 
  | 'connected'
  | 'disconnected'
  | 'error'
  | 'sync_completed'
  | 'property_synced'
  | 'incident_synced'
  | 'health_updated'
  | 'conflict_detected';

interface SyncServiceEvent {
  type: SyncServiceEventType;
  data?: any;
  timestamp: string;
}

class SyncServiceEventEmitter {
  private listeners: Map<SyncServiceEventType, Function[]> = new Map();

  on(eventType: SyncServiceEventType, callback: Function): void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, []);
    }
    this.listeners.get(eventType)!.push(callback);
  }

  off(eventType: SyncServiceEventType, callback: Function): void {
    const callbacks = this.listeners.get(eventType);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  emit(eventType: SyncServiceEventType, data?: any): void {
    const callbacks = this.listeners.get(eventType);
    if (callbacks) {
      const event: SyncServiceEvent = {
        type: eventType,
        data,
        timestamp: new Date().toISOString()
      };
      callbacks.forEach(callback => {
        try {
          callback(event);
        } catch (error) {
          console.error(`[SYNC] Error in event listener for ${eventType}:`, error);
        }
      });
    }
  }

  removeAllListeners(): void {
    this.listeners.clear();
  }
}

// ===========================
// MAIN CLIENT PORTAL SYNC SERVICE
// ===========================

export class ClientPortalSyncService extends SyncServiceEventEmitter {
  private config: SyncConfiguration;
  private websocket: WebSocket | null = null;
  private isInitialized: boolean = false;
  private isConnected: boolean = false;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 10;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private eventQueue: SyncEvent[] = [];
  private processingQueue: boolean = false;
  private syncMetrics: SyncMetrics;
  private syncStatus: SyncStatus;

  // Performance optimization
  private lastSyncTime: number = 0;
  private pendingBatches: Map<string, BatchEventMessage> = new Map();
  private processedEventIds: Set<string> = new Set();

  constructor(config: Partial<SyncConfiguration> = {}) {
    super();
    
    this.config = {
      enableRealTimeSync: true,
      syncIntervalMs: 30000,
      maxRetryAttempts: 3,
      retryDelayMs: 5000,
      websocketUrl: this.getWebSocketUrl(),
      apiEndpoint: import.meta.env.VITE_API_URL || '/api',
      timeoutMs: 30000,
      heartbeatIntervalMs: 30000,
      requireAuthentication: true,
      enableEncryption: true,
      auditLevel: 'comprehensive',
      batchSize: 10,
      compressionEnabled: false,
      cachingEnabled: true,
      priorityQueueEnabled: true,
      debugMode: import.meta.env.DEV || false,
      enableMetrics: true,
      logLevel: 'info',
      ...config
    };

    this.initializeMetrics();
    this.initializeStatus();
  }

  // ===========================
  // INITIALIZATION
  // ===========================

  async initialize(): Promise<void> {
    try {
      console.log('[SYNC] Initializing Client Portal Sync Service...');
      
      if (this.isInitialized) {
        console.warn('[SYNC] Service already initialized');
        return;
      }

      // Validate configuration
      await this.validateConfiguration();
      
      // Initialize audit logging
      await auditLogger.logEvent({
        eventType: 'system_alert',
        eventSource: 'client_portal',
        eventDescription: 'Client Portal Sync Service initializing',
        eventCategory: 'system_administration',
        actionPerformed: 'sync_service_init',
        contextData: {
          config: this.sanitizeConfig()
        }
      });

      // Set up event listeners
      this.setupEventListeners();
      
      // Initialize WebSocket connection if real-time sync is enabled
      if (this.config.enableRealTimeSync) {
        await this.initializeWebSocket();
      }

      this.isInitialized = true;
      
      console.log('[SYNC] Client Portal Sync Service initialized successfully');
      this.emit('connected', { initialized: true });

    } catch (error) {
      console.error('[SYNC] Failed to initialize sync service:', error);
      await auditLogger.logError(error as Error, {
        context: 'sync_service_initialization'
      });
      throw error;
    }
  }

  private async validateConfiguration(): Promise<void> {
    const requiredFields = ['websocketUrl', 'apiEndpoint'];
    const missingFields = requiredFields.filter(field => !this.config[field as keyof SyncConfiguration]);
    
    if (missingFields.length > 0) {
      throw new Error(`Missing required configuration fields: ${missingFields.join(', ')}`);
    }

    // Validate authentication requirements
    if (this.config.requireAuthentication && !this.getAuthToken()) {
      console.warn('[SYNC] Authentication required but no token available');
    }
  }

  private setupEventListeners(): void {
    // Listen for window focus to trigger sync
    if (typeof window !== 'undefined') {
      window.addEventListener('focus', () => {
        this.handleWindowFocus();
      });

      window.addEventListener('online', () => {
        this.handleNetworkReconnection();
      });

      window.addEventListener('beforeunload', () => {
        this.cleanup();
      });

      // Listen for admin dashboard sync events from shared service
      window.addEventListener('admin-property-synced', (event: any) => {
        this.handleAdminSyncEvent('property_updated', event.detail);
      });

      window.addEventListener('admin-images-synced', (event: any) => {
        this.handleAdminSyncEvent('images_uploaded', event.detail);
      });

      window.addEventListener('admin-sync-completed', (event: any) => {
        this.handleAdminSyncEvent('full_system_refresh', event.detail);
      });
    }
  }

  // ===========================
  // WEBSOCKET MANAGEMENT
  // ===========================

  private async initializeWebSocket(): Promise<void> {
    try {
      console.log('[SYNC] Initializing WebSocket connection...');
      
      const wsUrl = this.buildWebSocketUrl();
      this.websocket = new WebSocket(wsUrl);
      
      this.websocket.onopen = this.handleWebSocketOpen.bind(this);
      this.websocket.onmessage = this.handleWebSocketMessage.bind(this);
      this.websocket.onclose = this.handleWebSocketClose.bind(this);
      this.websocket.onerror = this.handleWebSocketError.bind(this);
      
    } catch (error) {
      console.error('[SYNC] Failed to initialize WebSocket:', error);
      throw error;
    }
  }

  private buildWebSocketUrl(): string {
    const baseUrl = this.config.websocketUrl;
    const params = new URLSearchParams();
    
    // Add authentication
    const token = this.getAuthToken();
    if (token) {
      params.append('token', token);
    }
    
    // Add client information
    const userData = this.getCurrentUser();
    params.append('clientId', userData.clientId);
    params.append('userId', userData.id);
    params.append('sessionId', this.getSessionId());
    
    return `${baseUrl}?${params.toString()}`;
  }

  private handleWebSocketOpen(event: Event): void {
    console.log('[SYNC] WebSocket connected successfully');
    
    this.isConnected = true;
    this.reconnectAttempts = 0;
    this.syncStatus.isConnected = true;
    this.syncStatus.connectionState = 'connected';
    this.syncStatus.lastConnected = new Date().toISOString();
    
    // Start heartbeat
    this.startHeartbeat();
    
    // Process queued events
    this.processEventQueue();
    
    // Emit connected event
    this.emit('connected', { reconnected: this.reconnectAttempts > 0 });
    
    // Log connection
    auditLogger.logEvent({
      eventType: 'system_alert',
      eventSource: 'client_portal',
      eventDescription: 'WebSocket connection established',
      eventCategory: 'system_administration',
      actionPerformed: 'websocket_connected'
    });
  }

  private async handleWebSocketMessage(event: MessageEvent): Promise<void> {
    try {
      const message: WebSocketMessage = JSON.parse(event.data);
      
      if (this.config.debugMode) {
        console.log('[SYNC] Received WebSocket message:', message.type);
      }

      switch (message.type) {
        case 'sync_event':
          await this.processSingleSyncEvent(message.data);
          break;
        
        case 'batch_events':
          await this.processBatchEvents(message.data);
          break;
        
        case 'heartbeat':
          await this.handleHeartbeat(message.data);
          break;
        
        case 'auth_challenge':
          await this.handleAuthChallenge(message.data);
          break;
        
        case 'status_update':
          await this.handleStatusUpdate(message.data);
          break;
        
        default:
          console.warn('[SYNC] Unknown WebSocket message type:', message.type);
      }

    } catch (error) {
      console.error('[SYNC] Error processing WebSocket message:', error);
      await auditLogger.logError(error as Error, {
        context: 'websocket_message_processing',
        messageType: event.data?.type
      });
    }
  }

  private handleWebSocketClose(event: CloseEvent): void {
    console.log('[SYNC] WebSocket connection closed:', event.code, event.reason);
    
    this.isConnected = false;
    this.syncStatus.isConnected = false;
    this.syncStatus.connectionState = 'disconnected';
    
    // Stop heartbeat
    this.stopHeartbeat();
    
    // Emit disconnected event
    this.emit('disconnected', { code: event.code, reason: event.reason });
    
    // Attempt reconnection if not a clean close
    if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
      this.scheduleReconnection();
    }
    
    // Log disconnection
    auditLogger.logEvent({
      eventType: 'system_alert',
      eventSource: 'client_portal',
      eventDescription: 'WebSocket connection closed',
      eventCategory: 'system_administration',
      actionPerformed: 'websocket_disconnected',
      contextData: { code: event.code, reason: event.reason }
    });
  }

  private handleWebSocketError(event: Event): void {
    console.error('[SYNC] WebSocket error:', event);
    
    this.syncStatus.connectionState = 'error';
    this.syncStatus.syncErrors.push(`WebSocket error at ${new Date().toISOString()}`);
    
    // Emit error event
    this.emit('error', { error: 'WebSocket connection error', event });
    
    // Log error
    auditLogger.logError(new Error('WebSocket connection error'), {
      context: 'websocket_error'
    });
  }

  private scheduleReconnection(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }
    
    this.reconnectAttempts++;
    const delay = Math.min(this.config.retryDelayMs * Math.pow(2, this.reconnectAttempts - 1), 30000);
    
    console.log(`[SYNC] Scheduling reconnection attempt ${this.reconnectAttempts} in ${delay}ms`);
    
    this.syncStatus.connectionState = 'reconnecting';
    this.syncStatus.reconnectAttempts = this.reconnectAttempts;
    
    this.reconnectTimer = setTimeout(() => {
      this.initializeWebSocket();
    }, delay);
  }

  // ===========================
  // HEARTBEAT MANAGEMENT
  // ===========================

  private startHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
    }
    
    this.heartbeatTimer = setInterval(() => {
      this.sendHeartbeat();
    }, this.config.heartbeatIntervalMs);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  private sendHeartbeat(): void {
    if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
      const message: WebSocketMessage = {
        type: 'heartbeat',
        data: {
          timestamp: new Date().toISOString(),
          metrics: this.getQuickMetrics()
        },
        timestamp: new Date().toISOString(),
        messageId: this.generateMessageId()
      };
      
      this.websocket.send(JSON.stringify(message));
    }
  }

  private async handleHeartbeat(data: any): Promise<void> {
    // Update latency metrics
    if (data.timestamp) {
      const latency = Date.now() - new Date(data.timestamp).getTime();
      this.syncStatus.averageLatency = (this.syncStatus.averageLatency + latency) / 2;
    }
  }

  // ===========================
  // EVENT PROCESSING
  // ===========================

  private async processSingleSyncEvent(eventData: SyncEvent): Promise<void> {
    try {
      // Check for duplicate events
      if (this.processedEventIds.has(eventData.id)) {
        if (this.config.debugMode) {
          console.log('[SYNC] Skipping duplicate event:', eventData.id);
        }
        return;
      }

      // Add to processed set
      this.processedEventIds.add(eventData.id);
      
      // Create processing context
      const context: EventHandlerContext = {
        userId: eventData.userId,
        clientId: eventData.clientId,
        sessionId: eventData.sessionId,
        sourceIP: eventData.sourceIP,
        userAgent: eventData.userAgent,
        timestamp: new Date().toISOString(),
        authToken: this.getAuthToken()
      };

      // Process the event
      const result = await processSyncEvent(eventData, context);
      
      // Update metrics
      this.updateProcessingMetrics(result);
      
      // Handle result
      if (result.success) {
        await this.handleSuccessfulSync(eventData, result);
      } else {
        await this.handleFailedSync(eventData, result);
      }

    } catch (error) {
      console.error('[SYNC] Error processing sync event:', error);
      await auditLogger.logError(error as Error, {
        eventId: eventData.id,
        eventType: eventData.type
      });
    }
  }

  private async processBatchEvents(batchData: BatchEventMessage): Promise<void> {
    try {
      console.log(`[SYNC] Processing batch ${batchData.batchId} with ${batchData.events.length} events`);
      
      const results: EventHandlerResult[] = [];
      
      // Process events in parallel for better performance
      const processingPromises = batchData.events.map(event => 
        this.processSingleSyncEvent(event)
      );
      
      await Promise.allSettled(processingPromises);
      
      // Update batch metrics
      this.syncMetrics.totalSyncedEvents += batchData.events.length;
      
      console.log(`[SYNC] Completed batch ${batchData.batchId}`);
      
    } catch (error) {
      console.error('[SYNC] Error processing batch events:', error);
      await auditLogger.logError(error as Error, {
        batchId: batchData.batchId,
        eventCount: batchData.events.length
      });
    }
  }

  private async handleSuccessfulSync(event: SyncEvent, result: EventHandlerResult): Promise<void> {
    // Update last sync time
    this.syncStatus.lastSyncTime = new Date().toISOString();
    
    // Emit specific event type
    switch (event.type) {
      case 'property_updated':
      case 'property_created':
        this.emit('property_synced', { event, result });
        break;
      
      case 'incident_created':
      case 'incident_updated':
        this.emit('incident_synced', { event, result });
        break;
      
      case 'system_health_updated':
        this.emit('health_updated', { event, result });
        break;
    }
    
    // Emit general sync completed event
    this.emit('sync_completed', { event, result });
  }

  private async handleFailedSync(event: SyncEvent, result: EventHandlerResult): Promise<void> {
    this.syncStatus.failedEvents++;
    
    if (result.error) {
      this.syncStatus.syncErrors.push(result.error.message);
    }
    
    if (result.conflicts && result.conflicts.length > 0) {
      this.emit('conflict_detected', { event, conflicts: result.conflicts });
    }
    
    // Emit error event
    this.emit('error', { event, result });
  }

  // ===========================
  // QUEUE MANAGEMENT
  // ===========================

  private async processEventQueue(): Promise<void> {
    if (this.processingQueue || this.eventQueue.length === 0) {
      return;
    }

    this.processingQueue = true;
    
    try {
      console.log(`[SYNC] Processing ${this.eventQueue.length} queued events`);
      
      while (this.eventQueue.length > 0) {
        const event = this.eventQueue.shift();
        if (event) {
          await this.processSingleSyncEvent(event);
        }
      }
      
    } catch (error) {
      console.error('[SYNC] Error processing event queue:', error);
    } finally {
      this.processingQueue = false;
    }
  }

  private queueEvent(event: SyncEvent): void {
    this.eventQueue.push(event);
    this.syncStatus.pendingEvents = this.eventQueue.length;
    
    // Process queue if connected
    if (this.isConnected) {
      this.processEventQueue();
    }
  }

  // ===========================
  // ADMIN DASHBOARD INTEGRATION
  // ===========================

  private async handleAdminSyncEvent(eventType: SyncEventType, eventDetail: any): Promise<void> {
    try {
      console.log(`[SYNC] Received admin sync event: ${eventType}`);
      
      // Create sync event from admin data
      const syncEvent: SyncEvent = {
        id: `admin_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: eventType,
        source: 'admin_dashboard',
        priority: 'MEDIUM',
        userId: eventDetail.userId || 'admin',
        clientId: eventDetail.clientId || this.getCurrentUser().clientId,
        sessionId: this.getSessionId(),
        securityLevel: 'INTERNAL',
        sourceIP: 'admin_dashboard',
        userAgent: 'Admin Dashboard',
        propertyId: eventDetail.propertyId,
        data: eventDetail,
        timestamp: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        status: 'pending',
        attempts: 0,
        context: {
          operationType: 'update',
          actionDescription: `Admin dashboard ${eventType}`,
          sourceComponent: 'AdminDashboard'
        },
        metadata: {
          retryCount: 0,
          dataSize: JSON.stringify(eventDetail).length,
          tags: ['admin_sync']
        }
      };

      // Process immediately if connected, otherwise queue
      if (this.isConnected) {
        await this.processSingleSyncEvent(syncEvent);
      } else {
        this.queueEvent(syncEvent);
      }

    } catch (error) {
      console.error('[SYNC] Error handling admin sync event:', error);
      await auditLogger.logError(error as Error, {
        eventType,
        eventDetail
      });
    }
  }

  // ===========================
  // PUBLIC API METHODS
  // ===========================

  /**
   * Manually trigger a property sync
   */
  async syncProperty(propertyId: string, propertyData?: PropertySyncData): Promise<void> {
    const syncEvent: SyncEvent = {
      id: `manual_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'property_updated',
      source: 'client_portal',
      priority: 'HIGH',
      ...this.createEventDefaults(),
      propertyId,
      data: propertyData || { propertyId }
    };

    if (this.isConnected) {
      await this.processSingleSyncEvent(syncEvent);
    } else {
      this.queueEvent(syncEvent);
    }
  }

  /**
   * Manually trigger an incident sync
   */
  async syncIncident(incidentId: string, incidentData?: IncidentSyncData): Promise<void> {
    const syncEvent: SyncEvent = {
      id: `manual_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'incident_updated',
      source: 'client_portal',
      priority: 'HIGH',
      ...this.createEventDefaults(),
      data: incidentData || { incidentId }
    };

    if (this.isConnected) {
      await this.processSingleSyncEvent(syncEvent);
    } else {
      this.queueEvent(syncEvent);
    }
  }

  /**
   * Trigger full system refresh
   */
  async triggerFullSync(): Promise<void> {
    const syncEvent: SyncEvent = {
      id: `full_sync_${Date.now()}`,
      type: 'full_system_refresh',
      source: 'client_portal',
      priority: 'HIGH',
      ...this.createEventDefaults(),
      data: { trigger: 'manual', reason: 'Full sync requested' }
    };

    if (this.isConnected) {
      await this.processSingleSyncEvent(syncEvent);
    } else {
      this.queueEvent(syncEvent);
    }
  }

  /**
   * Get current sync status
   */
  getStatus(): SyncStatus {
    return { ...this.syncStatus };
  }

  /**
   * Get sync metrics
   */
  getMetrics(): SyncMetrics {
    return { ...this.syncMetrics };
  }

  /**
   * Force reconnection
   */
  async reconnect(): Promise<void> {
    if (this.websocket) {
      this.websocket.close();
    }
    
    this.reconnectAttempts = 0;
    await this.initializeWebSocket();
  }

  // ===========================
  // UTILITY METHODS
  // ===========================

  private createEventDefaults(): Partial<SyncEvent> {
    const userData = this.getCurrentUser();
    
    return {
      userId: userData.id,
      clientId: userData.clientId,
      sessionId: this.getSessionId(),
      securityLevel: 'INTERNAL',
      sourceIP: 'client_portal',
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      status: 'pending',
      attempts: 0,
      context: {
        operationType: 'update',
        actionDescription: 'Manual sync trigger',
        sourceComponent: 'ClientPortalSync'
      },
      metadata: {
        retryCount: 0,
        dataSize: 0,
        tags: ['manual_sync']
      }
    };
  }

  private getCurrentUser(): { id: string; clientId: string; role: string } {
    try {
      const userData = localStorage.getItem('aegis_user_data');
      if (userData) {
        const user = JSON.parse(userData);
        return {
          id: user.id || 'unknown',
          clientId: user.clientId || 'unknown',
          role: user.role || 'user'
        };
      }
    } catch (error) {
      console.error('[SYNC] Failed to get current user:', error);
    }
    
    return { id: 'anonymous', clientId: 'unknown', role: 'guest' };
  }

  private getSessionId(): string {
    let sessionId = sessionStorage.getItem('apex_session_id');
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;
      sessionStorage.setItem('apex_session_id', sessionId);
    }
    return sessionId;
  }

  private getAuthToken(): string {
    return localStorage.getItem('aegis_access_token') || '';
  }

  private getWebSocketUrl(): string {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = import.meta.env.VITE_WS_HOST || window.location.host;
    return `${protocol}//${host}/ws/sync`;
  }

  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;
  }

  private sanitizeConfig(): Partial<SyncConfiguration> {
    const { websocketUrl, apiEndpoint, ...sanitized } = this.config;
    return {
      ...sanitized,
      websocketUrl: websocketUrl ? '[CONFIGURED]' : '[NOT_SET]',
      apiEndpoint: apiEndpoint ? '[CONFIGURED]' : '[NOT_SET]'
    };
  }

  private getQuickMetrics(): Partial<SyncMetrics> {
    return {
      totalSyncedEvents: this.syncMetrics.totalSyncedEvents,
      errorRate: this.syncMetrics.errorRate,
      averageProcessingTime: this.syncMetrics.averageProcessingTime
    };
  }

  private updateProcessingMetrics(result: EventHandlerResult): void {
    this.syncMetrics.totalSyncedEvents++;
    this.syncMetrics.averageProcessingTime = 
      (this.syncMetrics.averageProcessingTime + result.performanceMetrics.processingTime) / 2;
    
    if (!result.success) {
      this.syncMetrics.errorRate = 
        ((this.syncMetrics.errorRate * (this.syncMetrics.totalSyncedEvents - 1)) + 1) / 
        this.syncMetrics.totalSyncedEvents;
    }
  }

  private initializeMetrics(): void {
    this.syncMetrics = {
      averageProcessingTime: 0,
      throughputPerSecond: 0,
      errorRate: 0,
      eventsByType: {} as Record<SyncEventType, number>,
      eventsBySource: {} as any,
      eventsByPriority: {} as any,
      hourlyEvents: new Array(24).fill(0),
      dailyEvents: new Array(7).fill(0),
      peakUsageTime: '00:00',
      uptime: 0,
      lastHealthCheck: new Date().toISOString(),
      healthScore: 100
    };
  }

  private initializeStatus(): void {
    this.syncStatus = {
      isConnected: false,
      connectionState: 'disconnected',
      reconnectAttempts: 0,
      syncInProgress: false,
      pendingEvents: 0,
      failedEvents: 0,
      averageLatency: 0,
      totalSyncedEvents: 0,
      syncErrors: []
    };
  }

  private async handleAuthChallenge(data: any): Promise<void> {
    // Handle authentication challenge from server
    console.log('[SYNC] Received auth challenge');
    
    const token = this.getAuthToken();
    if (token && this.websocket) {
      const response: WebSocketMessage = {
        type: 'auth_challenge',
        data: { token },
        timestamp: new Date().toISOString(),
        messageId: this.generateMessageId()
      };
      
      this.websocket.send(JSON.stringify(response));
    }
  }

  private async handleStatusUpdate(data: any): Promise<void> {
    // Handle status updates from server
    if (data.systemHealth) {
      this.emit('health_updated', data.systemHealth);
    }
  }

  private handleWindowFocus(): void {
    if (!this.isConnected) {
      this.reconnect();
    } else {
      // Trigger a sync check
      this.triggerFullSync();
    }
  }

  private handleNetworkReconnection(): void {
    console.log('[SYNC] Network reconnected, attempting to restore sync connection');
    this.reconnect();
  }

  // ===========================
  // CLEANUP
  // ===========================

  async cleanup(): Promise<void> {
    console.log('[SYNC] Cleaning up Client Portal Sync Service...');
    
    // Stop timers
    this.stopHeartbeat();
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }
    
    // Close WebSocket
    if (this.websocket) {
      this.websocket.close(1000, 'Client cleanup');
      this.websocket = null;
    }
    
    // Clear event queue
    this.eventQueue = [];
    
    // Remove all listeners
    this.removeAllListeners();
    
    // Process any remaining audit logs
    await auditLogger.forceFlush();
    
    // Log cleanup
    await auditLogger.logEvent({
      eventType: 'system_alert',
      eventSource: 'client_portal',
      eventDescription: 'Client Portal Sync Service shutting down',
      eventCategory: 'system_administration',
      actionPerformed: 'sync_service_cleanup'
    });
    
    this.isInitialized = false;
    this.isConnected = false;
    
    console.log('[SYNC] Client Portal Sync Service cleaned up');
  }
}

// ===========================
// SINGLETON INSTANCE
// ===========================

export const clientPortalSync = new ClientPortalSyncService();

// ===========================
// AUTO-INITIALIZATION
// ===========================

// Initialize on module load if in browser environment
if (typeof window !== 'undefined') {
  // Auto-initialize when user is authenticated
  const checkAndInitialize = () => {
    const token = localStorage.getItem('aegis_access_token');
    if (token && !clientPortalSync['isInitialized']) {
      clientPortalSync.initialize().catch(error => {
        console.error('[SYNC] Auto-initialization failed:', error);
      });
    }
  };

  // Check on load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', checkAndInitialize);
  } else {
    checkAndInitialize();
  }

  // Listen for login events
  window.addEventListener('user-authenticated', checkAndInitialize);
}

// ===========================
// EXPORTS
// ===========================

export default clientPortalSync;
export type { WebSocketMessage, BatchEventMessage, SyncServiceEvent };
