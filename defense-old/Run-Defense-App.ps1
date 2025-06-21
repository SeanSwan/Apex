<#
.SYNOPSIS
    Defense Security App - Report Builder Launcher (Uses powershell.exe)
.DESCRIPTION
    Launches the Defense application servers in a separate PowerShell window
    using 'powershell.exe' for wider compatibility.
    Opens the browser, captures logs, and provides pauses. Runs as standard user.
#>

#region Configuration
$timestamp = Get-Date -Format 'yyyyMMdd_HHmmss'
$logPath   = Join-Path -Path $HOME\Desktop -ChildPath "Defense_Launcher_Log_$timestamp.log"
#endregion

# --- Start Logging ---
try {
    # Start logging - captures console output to the log file
    # Use -Append if you want to keep logs from multiple runs in one file for debugging
    Start-Transcript -Path $logPath -Force
    Write-Host "==================================================" -ForegroundColor Cyan
    Write-Host " Defense App Launcher Started: $(Get-Date)"        -ForegroundColor Cyan
    Write-Host " Logging to: $logPath"                            -ForegroundColor Cyan
    Write-Host " Using: powershell.exe"                           -ForegroundColor Yellow # Indicate which exe
    Write-Host "==================================================" -ForegroundColor Cyan
    Write-Host ""

    # --- Step 1: Set Working Directory ---
    Write-Host "[*] Step 1: Setting working directory to script location..." -ForegroundColor White
    try {
        # Set location to the directory containing the script
        Set-Location -Path $PSScriptRoot -ErrorAction Stop
        Write-Host "[+] Working directory set to: $(Get-Location)" -ForegroundColor Green
    } catch {
        Write-Host "[!] CRITICAL ERROR: Failed to change directory to script location '$PSScriptRoot'." -ForegroundColor Red
        throw # Re-throw the error to be caught by the main try/catch
    }
    Write-Host ""

    # --- Step 2: Verify 'defense' folder ---
    Write-Host "[*] Step 2: Verifying 'defense' folder exists in current directory..." -ForegroundColor White
    # Look for 'defense' folder in the *same directory* as the script
    $defensePath = Join-Path -Path $PSScriptRoot -ChildPath "defense"
    if (-not (Test-Path -Path $defensePath -PathType Container)) {
        throw "CRITICAL ERROR: Folder 'defense' not found in '$PSScriptRoot'. Ensure script is next to the 'defense' folder."
    }
    Write-Host "[+] 'defense' folder found at '$defensePath'." -ForegroundColor Green
    Write-Host ""

    # --- Step 3: Check for npm ---
    Write-Host "[*] Step 3: Checking for Node.js (npm)..." -ForegroundColor White
    if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
        throw "CRITICAL ERROR: 'npm' command not found in PATH. Please install Node.js LTS from https://nodejs.org/ and ensure it's added to your PATH."
    }
    Write-Host "[+] Node.js (npm) detected in PATH." -ForegroundColor Green
    Write-Host ""

    # --- Step 4: Basic Dependency Check (Optional - currently commented out) ---
    # Write-Host "[*] Step 4: Basic check for node_modules..." -ForegroundColor White
    # ... (node_modules check logic) ...
    # Write-Host ""

    # --- Step 5: Launch Servers ---
    Write-Host "[*] Step 5: Launching Defense App servers in a NEW PowerShell window..." -ForegroundColor Cyan
    Write-Host "    IMPORTANT: A new PowerShell window titled 'Defense App Servers' will open." -ForegroundColor Yellow
    Write-Host "               KEEP THIS NEW WINDOW OPEN while using the app." -ForegroundColor Yellow
    Write-Host "               Server errors will appear in THAT window." -ForegroundColor Yellow
    $serverWorkingDir = $defensePath # Use the verified path
    # Command to run in the new window: change location, run npm start, then keep window open
    # Use single quotes carefully for the inner command string, especially around the path
    $serverCmd = 'Set-Location -Path ''' + $serverWorkingDir + '''; Write-Host ''Running npm start...''; npm start; Write-Host ''`n`n>>> npm start process finished or was stopped. <<<`n>>> Press Enter to close this server window. <<<'' -ForegroundColor Yellow ; Read-Host'

    try {
        # *** Uses 'powershell.exe' for broader compatibility ***
        Start-Process -FilePath powershell.exe -ArgumentList @('-NoExit', '-Command', $serverCmd) -WindowStyle Normal -ErrorAction Stop
        Write-Host "[+] 'npm start' command issued via powershell.exe in new window." -ForegroundColor Green
    } catch {
        Write-Host "[!] ERROR: Failed to launch the server window process using powershell.exe." -ForegroundColor Red
        Write-Host "    Error Details: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host "    Verify 'powershell.exe' can be run from a standard Command Prompt." -ForegroundColor Yellow
        throw # Re-throw to stop script if server window fails to launch
    }
    Write-Host ""

    # --- Step 6: Pause for User Verification ---
    Write-Host "[*] Step 6: Pausing launcher script..." -ForegroundColor White
    Write-Host "    Please check if the 'Defense App Servers' window appeared and shows servers starting." -ForegroundColor Yellow
    Write-Host "    >>> Press any key IN THIS WINDOW to continue launching the browser <<<" -ForegroundColor Yellow
    $null = $Host.UI.RawUI.ReadKey('NoEcho,IncludeKeyDown')
    Write-Host "[+] Resuming launcher script..." -ForegroundColor Green
    Write-Host ""

    # --- Step 7: Wait Before Browser Launch ---
    $waitTime = 10 # Wait time in seconds
    Write-Host "[*] Step 7: Waiting $waitTime seconds before launching browser..." -ForegroundColor White
    Start-Sleep -Seconds $waitTime
    Write-Host "[+] Wait complete." -ForegroundColor Green
    Write-Host ""

    # --- Step 8: Launch Browser ---
    $appUrl = 'http://localhost:5173' # Ensure this port matches your frontend dev server
    Write-Host "[*] Step 8: Attempting to open browser at $appUrl ..." -ForegroundColor Cyan
    try {
        # Uses default browser
        Start-Process $appUrl -ErrorAction Stop
        Write-Host "[+] Browser launch command issued for default browser." -ForegroundColor Green
    } catch {
        Write-Host "[!] WARNING: Failed to automatically open default browser." -ForegroundColor Yellow
        Write-Host "    Please manually open your web browser and go to: $appUrl" -ForegroundColor Yellow
        Write-Host "    Error Details: $($_.Exception.Message)" -ForegroundColor Red
    }
    Write-Host ""

    # --- Step 9: Completion Message ---
    Write-Host "[*] Step 9: Launcher script tasks completed." -ForegroundColor Green

} catch {
    # Catch ANY error from the main try block
    Write-Host "==================== ERROR ====================" -ForegroundColor Red
    Write-Host "[!] An error occurred during script execution:" -ForegroundColor Red
    # Display the specific error message
    Write-Host "$($_.Exception.Message)" -ForegroundColor Red -Wrap
    # Display stack trace if available for more debugging info
    if ($_.ScriptStackTrace) {
        Write-Host "    Error details (location): $($_.ScriptStackTrace)" -ForegroundColor Gray
    }
    Write-Host "=============================================" -ForegroundColor Red
    Write-Host "Please review the error message above." -ForegroundColor Yellow
    Write-Host "Detailed execution log saved to: $logPath" -ForegroundColor Yellow

} finally {
    # This block always executes, ensuring logging stops cleanly
    Write-Host ""
    Write-Host "==================================================" -ForegroundColor Cyan
    Write-Host " Defense App Launcher Finished: $(Get-Date)"       -ForegroundColor Cyan
    Write-Host "==================================================" -ForegroundColor Cyan
    # Stop logging transcript
    Stop-Transcript | Out-Null # Use Out-Null to suppress Stop-Transcript's default output
}

# --- Final Pause ---
# This ensures the launcher window stays open until user interacts
Write-Host ""
Write-Host "REMINDER: The application runs in the 'Defense App Servers' window." -ForegroundColor Yellow
Write-Host "          You must close THAT window to stop the application." -ForegroundColor Yellow
Write-Host ""
Write-Host "This launcher window will stay open. Press any key to exit THIS window." -ForegroundColor Magenta
$null = $Host.UI.RawUI.ReadKey('NoEcho,IncludeKeyDown')