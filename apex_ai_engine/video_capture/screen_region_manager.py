"""
APEX AI ENGINE - SCREEN REGION MANAGER
======================================
Interactive screen region selection and management for DVR camera focus

This module provides tools for selecting and managing regions of interest (ROI)
on screen captures. Essential for focusing AI analysis on actual camera feeds
rather than DVR interface elements, menus, or other screen content.

Key Features:
- Interactive screen region selection with visual feedback
- Multi-region support for multiple camera feeds per monitor
- Region configuration persistence (save/load)
- Coordinate validation and normalization
- Integration with DVR screen capture system
- Real-time region preview and adjustment
"""

import cv2
import numpy as np
import json
import os
import threading
import time
import logging
from typing import Dict, List, Optional, Tuple, Callable
from dataclasses import dataclass, asdict
from PIL import ImageGrab, ImageTk
import tkinter as tk
from tkinter import messagebox, filedialog, ttk

# Configure logging
logger = logging.getLogger(__name__)

@dataclass
class RegionConfig:
    """Configuration for a screen region"""
    name: str
    x: int
    y: int  
    width: int
    height: int
    monitor_id: int = 0
    enabled: bool = True
    ai_model_filter: str = "all"  # Which AI models to apply to this region
    confidence_threshold: float = 0.5
    created_timestamp: float = 0.0
    last_modified: float = 0.0
    
    def __post_init__(self):
        if self.created_timestamp == 0.0:
            self.created_timestamp = time.time()
        self.last_modified = time.time()
    
    def to_screen_region(self):
        """Convert to ScreenRegion object for screen capture"""
        from .dvr_screen_capture import ScreenRegion
        return ScreenRegion(
            x=self.x,
            y=self.y, 
            width=self.width,
            height=self.height,
            monitor_id=self.monitor_id,
            name=self.name
        )

class RegionSelector:
    """Interactive region selection tool using OpenCV"""
    
    def __init__(self, screenshot: np.ndarray, monitor_info: Dict):
        self.screenshot = screenshot
        self.monitor_info = monitor_info
        self.regions = []
        self.current_region = None
        self.drawing = False
        self.start_point = None
        self.window_name = f"Select Regions - Monitor {monitor_info.get('monitor_id', 0)}"
        
        # Display scaling for large monitors
        self.display_scale = 1.0
        if screenshot.shape[1] > 1920 or screenshot.shape[0] > 1080:
            self.display_scale = min(1920 / screenshot.shape[1], 1080 / screenshot.shape[0])
        
        self.display_screenshot = cv2.resize(
            screenshot, 
            (int(screenshot.shape[1] * self.display_scale), 
             int(screenshot.shape[0] * self.display_scale))
        )
        
        # Colors for visual feedback
        self.region_color = (0, 255, 0)  # Green for confirmed regions
        self.drawing_color = (0, 0, 255)  # Red for region being drawn
        self.text_color = (255, 255, 255)  # White text
    
    def mouse_callback(self, event, x, y, flags, param):
        """Handle mouse events for region selection"""
        if event == cv2.EVENT_LBUTTONDOWN:
            self.drawing = True
            self.start_point = (x, y)
            self.current_region = None
            
        elif event == cv2.EVENT_MOUSEMOVE and self.drawing:
            # Update current region being drawn
            if self.start_point:
                self.current_region = (self.start_point[0], self.start_point[1], x, y)
                
        elif event == cv2.EVENT_LBUTTONUP:
            if self.drawing and self.start_point:
                # Complete region selection
                end_point = (x, y)
                
                # Calculate region coordinates (scale back to original resolution)
                x1 = min(self.start_point[0], end_point[0]) / self.display_scale
                y1 = min(self.start_point[1], end_point[1]) / self.display_scale  
                x2 = max(self.start_point[0], end_point[0]) / self.display_scale
                y2 = max(self.start_point[1], end_point[1]) / self.display_scale
                
                width = int(x2 - x1)
                height = int(y2 - y1)
                
                # Validate region size (minimum 50x50 pixels)
                if width >= 50 and height >= 50:
                    region = {
                        'x': int(x1),
                        'y': int(y1),
                        'width': width,
                        'height': height,
                        'name': f"Region_{len(self.regions) + 1}"
                    }
                    self.regions.append(region)
                    logger.info(f"Added region: {region}")
                else:
                    logger.warning("Region too small - minimum size is 50x50 pixels")
                
                self.drawing = False
                self.current_region = None
                self.start_point = None
    
    def draw_regions(self, img: np.ndarray) -> np.ndarray:
        """Draw all regions on the image"""
        overlay = img.copy()
        
        # Draw confirmed regions
        for i, region in enumerate(self.regions):
            # Scale coordinates for display
            x1 = int(region['x'] * self.display_scale)
            y1 = int(region['y'] * self.display_scale)
            x2 = int((region['x'] + region['width']) * self.display_scale)
            y2 = int((region['y'] + region['height']) * self.display_scale)
            
            # Draw rectangle
            cv2.rectangle(overlay, (x1, y1), (x2, y2), self.region_color, 2)
            
            # Draw region label
            label = f"{region['name']}"
            label_size = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.6, 2)[0]
            cv2.rectangle(overlay, (x1, y1 - label_size[1] - 10), 
                         (x1 + label_size[0] + 10, y1), self.region_color, -1)
            cv2.putText(overlay, label, (x1 + 5, y1 - 5), 
                       cv2.FONT_HERSHEY_SIMPLEX, 0.6, self.text_color, 2)
        
        # Draw current region being selected
        if self.current_region:
            x1, y1, x2, y2 = self.current_region
            cv2.rectangle(overlay, (x1, y1), (x2, y2), self.drawing_color, 2)
        
        return overlay
    
    def select_regions(self) -> List[Dict]:
        """Start interactive region selection"""
        cv2.namedWindow(self.window_name, cv2.WINDOW_AUTOSIZE)
        cv2.setMouseCallback(self.window_name, self.mouse_callback)
        
        # Instructions
        instructions = [
            "REGION SELECTION INSTRUCTIONS:",
            "- Click and drag to select camera feed areas",
            "- Press 'r' to remove last region",
            "- Press 'c' to clear all regions", 
            "- Press SPACE to finish and save",
            "- Press ESC to cancel"
        ]
        
        print("\n" + "\n".join(instructions))
        
        while True:
            # Create display image with regions
            display_img = self.draw_regions(self.display_screenshot.copy())
            
            # Add instructions overlay
            for i, instruction in enumerate(instructions[:3]):  # Show first 3 lines
                cv2.putText(display_img, instruction, (10, 30 + i * 25),
                           cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 0), 2)
            
            cv2.imshow(self.window_name, display_img)
            
            key = cv2.waitKey(1) & 0xFF
            
            if key == ord(' '):  # Space to finish
                break
            elif key == 27:  # ESC to cancel
                self.regions = []
                break
            elif key == ord('r') and self.regions:  # Remove last region
                removed = self.regions.pop()
                logger.info(f"Removed region: {removed['name']}")
            elif key == ord('c'):  # Clear all regions
                self.regions = []
                logger.info("Cleared all regions")
        
        cv2.destroyAllWindows()
        return self.regions

class ScreenRegionManager:
    """
    Comprehensive screen region management system
    
    Handles creation, modification, persistence, and validation of screen regions
    for AI-focused video analysis.
    """
    
    def __init__(self, config_file: str = "screen_regions.json"):
        self.config_file = config_file
        self.regions: Dict[str, RegionConfig] = {}
        self.monitor_regions: Dict[int, List[str]] = {}  # monitor_id -> region_names
        
        # Load existing configuration
        self.load_configuration()
        
        logger.info(f"Screen Region Manager initialized with {len(self.regions)} regions")
    
    def add_region(self, 
                   name: str,
                   x: int, y: int, width: int, height: int,
                   monitor_id: int = 0,
                   ai_model_filter: str = "all",
                   confidence_threshold: float = 0.5) -> bool:
        """Add a new screen region"""
        
        # Validate inputs
        if name in self.regions:
            logger.warning(f"Region '{name}' already exists")
            return False
        
        if width <= 0 or height <= 0:
            logger.error("Region dimensions must be positive")
            return False
        
        if x < 0 or y < 0:
            logger.error("Region coordinates must be non-negative")
            return False
        
        # Create region configuration
        region = RegionConfig(
            name=name,
            x=x, y=y, width=width, height=height,
            monitor_id=monitor_id,
            ai_model_filter=ai_model_filter,
            confidence_threshold=confidence_threshold
        )
        
        # Add to collections
        self.regions[name] = region
        
        if monitor_id not in self.monitor_regions:
            self.monitor_regions[monitor_id] = []
        self.monitor_regions[monitor_id].append(name)
        
        logger.info(f"Added region '{name}': {width}x{height} at ({x}, {y}) on monitor {monitor_id}")
        return True
    
    def remove_region(self, name: str) -> bool:
        """Remove a screen region"""
        if name not in self.regions:
            logger.warning(f"Region '{name}' not found")
            return False
        
        region = self.regions[name]
        monitor_id = region.monitor_id
        
        # Remove from collections
        del self.regions[name]
        if monitor_id in self.monitor_regions and name in self.monitor_regions[monitor_id]:
            self.monitor_regions[monitor_id].remove(name)
        
        logger.info(f"Removed region '{name}'")
        return True
    
    def update_region(self, name: str, **kwargs) -> bool:
        """Update an existing region's properties"""
        if name not in self.regions:
            logger.warning(f"Region '{name}' not found")
            return False
        
        region = self.regions[name]
        
        # Update allowed properties
        for key, value in kwargs.items():
            if hasattr(region, key):
                setattr(region, key, value)
                region.last_modified = time.time()
        
        logger.info(f"Updated region '{name}'")
        return True
    
    def get_regions_for_monitor(self, monitor_id: int) -> List[RegionConfig]:
        """Get all regions for a specific monitor"""
        if monitor_id not in self.monitor_regions:
            return []
        
        return [self.regions[name] for name in self.monitor_regions[monitor_id] 
                if name in self.regions and self.regions[name].enabled]
    
    def get_active_regions(self) -> List[RegionConfig]:
        """Get all enabled regions"""
        return [region for region in self.regions.values() if region.enabled]
    
    def interactive_region_selection(self, monitor_id: int = 0) -> List[RegionConfig]:
        """Launch interactive region selection for a monitor"""
        try:
            # Import screen capture to get monitor info
            from .dvr_screen_capture import DVRScreenCapture
            
            # Create temporary capture instance to get monitor info
            capture = DVRScreenCapture()
            
            if monitor_id >= len(capture.monitors):
                logger.error(f"Monitor {monitor_id} not found")
                return []
            
            monitor = capture.monitors[monitor_id]
            
            # Capture current screen
            screenshot = capture._capture_full_screen()
            if screenshot is None:
                logger.error("Failed to capture screen for region selection")
                return []
            
            # Launch interactive selector
            selector = RegionSelector(screenshot, {
                'monitor_id': monitor_id,
                'width': monitor.width,
                'height': monitor.height
            })
            
            selected_regions = selector.select_regions()
            
            # Convert to RegionConfig objects and add to manager
            region_configs = []
            for i, region_data in enumerate(selected_regions):
                region_name = f"Monitor_{monitor_id}_Region_{i+1}"
                
                success = self.add_region(
                    name=region_name,
                    x=region_data['x'],
                    y=region_data['y'], 
                    width=region_data['width'],
                    height=region_data['height'],
                    monitor_id=monitor_id
                )
                
                if success:
                    region_configs.append(self.regions[region_name])
            
            # Save configuration
            self.save_configuration()
            
            logger.info(f"Selected {len(region_configs)} regions for monitor {monitor_id}")
            return region_configs
            
        except Exception as e:
            logger.error(f"Error in interactive region selection: {e}")
            return []
    
    def validate_regions(self, monitor_width: int, monitor_height: int, monitor_id: int = 0) -> List[str]:
        """Validate regions against monitor dimensions"""
        invalid_regions = []
        
        for region in self.get_regions_for_monitor(monitor_id):
            # Check if region is within monitor bounds
            if (region.x + region.width > monitor_width or 
                region.y + region.height > monitor_height or
                region.x < 0 or region.y < 0):
                
                invalid_regions.append(region.name)
                logger.warning(f"Region '{region.name}' is outside monitor bounds")
        
        return invalid_regions
    
    def save_configuration(self) -> bool:
        """Save region configuration to file"""
        try:
            config_data = {
                'regions': {name: asdict(region) for name, region in self.regions.items()},
                'monitor_regions': self.monitor_regions,
                'saved_timestamp': time.time()
            }
            
            with open(self.config_file, 'w') as f:
                json.dump(config_data, f, indent=2)
            
            logger.info(f"Saved configuration to {self.config_file}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to save configuration: {e}")
            return False
    
    def load_configuration(self) -> bool:
        """Load region configuration from file"""
        try:
            if not os.path.exists(self.config_file):
                logger.info("No existing configuration file found")
                return True
            
            with open(self.config_file, 'r') as f:
                config_data = json.load(f)
            
            # Load regions
            self.regions = {}
            for name, region_data in config_data.get('regions', {}).items():
                self.regions[name] = RegionConfig(**region_data)
            
            # Load monitor mapping
            self.monitor_regions = config_data.get('monitor_regions', {})
            # Convert string keys back to integers
            self.monitor_regions = {int(k): v for k, v in self.monitor_regions.items()}
            
            logger.info(f"Loaded {len(self.regions)} regions from configuration")
            return True
            
        except Exception as e:
            logger.error(f"Failed to load configuration: {e}")
            return False
    
    def export_regions_for_capture(self) -> List:
        """Export regions in format compatible with DVRScreenCapture"""
        screen_regions = []
        
        for region in self.get_active_regions():
            screen_regions.append(region.to_screen_region())
        
        return screen_regions
    
    def get_statistics(self) -> Dict:
        """Get region management statistics"""
        active_regions = self.get_active_regions()
        
        return {
            'total_regions': len(self.regions),
            'active_regions': len(active_regions),
            'monitors_with_regions': len(self.monitor_regions),
            'regions_by_monitor': {
                monitor_id: len(region_names) 
                for monitor_id, region_names in self.monitor_regions.items()
            },
            'configuration_file': self.config_file,
            'last_modified': max([r.last_modified for r in self.regions.values()]) if self.regions else 0
        }


# Utility functions
def create_demo_regions_for_dvr() -> List[RegionConfig]:
    """Create demo regions simulating a typical 4-camera DVR layout"""
    regions = []
    
    # Simulate 4-camera DVR layout (2x2 grid)
    camera_configs = [
        {"name": "Front_Entrance", "x": 0, "y": 0, "width": 640, "height": 480},
        {"name": "Parking_Lot", "x": 640, "y": 0, "width": 640, "height": 480},  
        {"name": "Lobby_Area", "x": 0, "y": 480, "width": 640, "height": 480},
        {"name": "Rear_Exit", "x": 640, "y": 480, "width": 640, "height": 480}
    ]
    
    for config in camera_configs:
        region = RegionConfig(
            name=config["name"],
            x=config["x"], 
            y=config["y"],
            width=config["width"],
            height=config["height"],
            monitor_id=0,
            ai_model_filter="all",
            confidence_threshold=0.6
        )
        regions.append(region)
    
    return regions


if __name__ == "__main__":
    """Demo and testing code"""
    
    # Create region manager
    manager = ScreenRegionManager("demo_regions.json")
    
    # Add demo regions
    demo_regions = create_demo_regions_for_dvr()
    for region in demo_regions:
        manager.add_region(
            region.name, region.x, region.y, 
            region.width, region.height, region.monitor_id
        )
    
    # Display statistics
    stats = manager.get_statistics()
    print("Region Manager Demo:")
    print(f"Total regions: {stats['total_regions']}")
    print(f"Active regions: {stats['active_regions']}")
    print(f"Monitors with regions: {stats['monitors_with_regions']}")
    
    # Save configuration
    manager.save_configuration()
    print(f"Configuration saved to {manager.config_file}")
    
    # Test export for screen capture
    screen_regions = manager.export_regions_for_capture()
    print(f"Exported {len(screen_regions)} regions for screen capture")
