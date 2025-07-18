#!/usr/bin/env python3
"""
APEX AI MCP SERVER STARTUP SCRIPT
=================================
Simple startup script for the Model Context Protocol server

Usage:
    python start_mcp_server.py [--mode full|mcp-only|existing-only] [--config config.yaml]
"""

import os
import sys
import asyncio
import argparse
from pathlib import Path

# Add current directory to path
sys.path.insert(0, str(Path(__file__).parent))

def check_dependencies():
    """Check if required dependencies are installed"""
    missing_deps = []
    
    try:
        import fastapi
        import uvicorn
        import websockets
        import numpy
        import yaml
    except ImportError as e:
        missing_deps.append(str(e))
    
    if missing_deps:
        print("❌ Missing required dependencies:")
        for dep in missing_deps:
            print(f"   • {dep}")
        print("\n💡 Install dependencies with:")
        print("   pip install -r requirements.txt")
        return False
    
    return True

def setup_environment():
    """Setup environment variables and paths"""
    # Set default environment variables if not present
    env_vars = {
        'PYTHONPATH': str(Path(__file__).parent.parent),
        'APEX_AI_ENV': 'development',
        'MCP_SERVER_PORT': '8766',
        'MCP_SERVER_HOST': '0.0.0.0'
    }
    
    for var, value in env_vars.items():
        if var not in os.environ:
            os.environ[var] = value
    
    # Create necessary directories
    directories = [
        Path(__file__).parent / "logs",
        Path(__file__).parent / "temp",
        Path(__file__).parent / "cache"
    ]
    
    for directory in directories:
        directory.mkdir(exist_ok=True)
    
    print("✅ Environment setup complete")

def display_help():
    """Display help information"""
    help_text = """
🚀 APEX AI MCP SERVER STARTUP SCRIPT
===================================

USAGE:
    python start_mcp_server.py [OPTIONS]

OPTIONS:
    --mode MODE         Integration mode (full, mcp-only, existing-only)
                        Default: full
    
    --config PATH       Configuration file path
                        Default: ../config.yaml
    
    --port PORT         Server port
                        Default: 8766
    
    --host HOST         Server host
                        Default: 0.0.0.0
    
    --help             Show this help message

MODES:
    full               Start full integration with MCP server and existing AI
    mcp-only           Start only the MCP server
    existing-only      Start only the existing AI engine

EXAMPLES:
    python start_mcp_server.py
    python start_mcp_server.py --mode mcp-only
    python start_mcp_server.py --mode full --config custom_config.yaml
    python start_mcp_server.py --port 8080 --host localhost

ENVIRONMENT VARIABLES:
    OPENAI_API_KEY     OpenAI API key for conversation tool
    AZURE_TTS_KEY      Azure TTS API key for voice synthesis
    AZURE_TTS_REGION   Azure TTS region
    PG_HOST            PostgreSQL host
    PG_DB              PostgreSQL database name
    PG_USER            PostgreSQL username
    PG_PASSWORD        PostgreSQL password
    PG_PORT            PostgreSQL port
"""
    print(help_text)

def main():
    """Main startup function"""
    parser = argparse.ArgumentParser(
        description="APEX AI MCP Server Startup Script",
        add_help=False
    )
    
    parser.add_argument("--mode", choices=["full", "mcp-only", "existing-only"], 
                       default="full", help="Integration mode")
    parser.add_argument("--config", type=str, help="Configuration file path")
    parser.add_argument("--port", type=int, default=8766, help="Server port")
    parser.add_argument("--host", type=str, default="0.0.0.0", help="Server host")
    parser.add_argument("--help", action="store_true", help="Show help")
    
    args = parser.parse_args()
    
    # Show help if requested
    if args.help:
        display_help()
        return
    
    # Display startup banner
    print("\n" + "="*80)
    print("       🚀 APEX AI MCP SERVER - STARTUP SCRIPT")
    print("="*80)
    print(f"Mode: {args.mode}")
    print(f"Host: {args.host}")
    print(f"Port: {args.port}")
    if args.config:
        print(f"Config: {args.config}")
    print("="*80 + "\n")
    
    # Check dependencies
    if not check_dependencies():
        sys.exit(1)
    
    # Setup environment
    setup_environment()
    
    # Update environment with CLI args
    os.environ['MCP_SERVER_PORT'] = str(args.port)
    os.environ['MCP_SERVER_HOST'] = args.host
    
    # Import and start the appropriate integration
    try:
        if args.mode == "full":
            print("🚀 Starting Full Integration...")
            from integration import ApexAIIntegration
            integration = ApexAIIntegration(args.config)
            asyncio.run(integration.start_integration())
            
        elif args.mode == "mcp-only":
            print("🚀 Starting MCP Server Only...")
            from integration import start_mcp_server_only
            start_mcp_server_only()
            
        elif args.mode == "existing-only":
            print("🚀 Starting Existing AI Only...")
            from integration import start_existing_ai_only
            start_existing_ai_only()
            
    except KeyboardInterrupt:
        print("\n🛑 Shutdown requested by user")
    except ImportError as e:
        print(f"❌ Import error: {e}")
        print("💡 Make sure all dependencies are installed:")
        print("   pip install -r requirements.txt")
        sys.exit(1)
    except Exception as e:
        print(f"❌ Fatal error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    main()
