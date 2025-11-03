@echo off
setlocal EnableDelayedExpansion

rem Resolve key project paths based on this script's location.
set "TOOLS_DIR=%~dp0"
for %%i in ("%TOOLS_DIR%..") do set "PLUGIN_DIR=%%~fi"
for %%i in ("%PLUGIN_DIR%\..") do set "PROJECT_ROOT=%%~fi"

set "THIRD_PARTY_DIR=%PLUGIN_DIR%\Source\Puerts\ThirdParty"
set "TS_TEMPLATE_DIR=%PLUGIN_DIR%\Scripts\Project"
set "TYPE_SCRIPT_DIR=%PROJECT_ROOT%\TypeScript"

rem Allow callers to override the desired V8 package via environment variables.
if not defined REACTORUMG_V8_VERSION (
    set "REACTORUMG_V8_VERSION=v8_9.4.146.24"
)
if not defined REACTORUMG_V8_URL (
    set "REACTORUMG_V8_URL=https://unrealengine.blob.core.windows.net/puerts/npm/%REACTORUMG_V8_VERSION%.zip"
)

set "V8_ARCHIVE=%TEMP%\%REACTORUMG_V8_VERSION%.zip"
set "V8_TARGET_DIR=%THIRD_PARTY_DIR%\%REACTORUMG_V8_VERSION%"

echo.
echo === ReactorUMG Windows Setup ===

if not exist "%THIRD_PARTY_DIR%" (
    echo Creating third-party directory at "%THIRD_PARTY_DIR%"
    mkdir "%THIRD_PARTY_DIR%" || (
        echo Failed to create third-party directory.
        exit /b 1
    )
)

if not exist "%V8_TARGET_DIR%" (
    echo Downloading V8 engine package from:
    echo   %REACTORUMG_V8_URL%
    powershell -NoProfile -ExecutionPolicy Bypass -Command ^
        "try { Invoke-WebRequest -Uri '%REACTORUMG_V8_URL%' -OutFile '%V8_ARCHIVE%' -UseBasicParsing } catch { exit 1 }"
    if errorlevel 1 (
        echo Failed to download V8 archive. You can override the URL via REACTORUMG_V8_URL.
        exit /b 1
    )

    echo Extracting V8 archive to "%THIRD_PARTY_DIR%"
    powershell -NoProfile -ExecutionPolicy Bypass -Command ^
        "try { Expand-Archive -Path '%V8_ARCHIVE%' -DestinationPath '%THIRD_PARTY_DIR%' -Force } catch { exit 1 }"
    if errorlevel 1 (
        echo Failed to extract V8 archive.
        exit /b 1
    )
    del "%V8_ARCHIVE%" >nul 2>&1
else (
    echo V8 directory already present at "%V8_TARGET_DIR%"; skipping download.
)

if not exist "%TYPE_SCRIPT_DIR%" (
    if not exist "%TS_TEMPLATE_DIR%" (
        echo TypeScript template missing at "%TS_TEMPLATE_DIR%".
        exit /b 1
    )
    echo Creating TypeScript workspace in "%TYPE_SCRIPT_DIR%"
    robocopy "%TS_TEMPLATE_DIR%" "%TYPE_SCRIPT_DIR%" /E /NFL /NDL /NJH /NJS >nul
    set "ROBOEXIT=%ERRORLEVEL%"
    if %ROBOEXIT% GEQ 8 (
        echo Failed to copy TypeScript template (robocopy exit code %ROBOEXIT%).
        exit /b %ROBOEXIT%
    )
) else (
    echo TypeScript workspace already exists at "%TYPE_SCRIPT_DIR%".
)

where yarn >nul 2>&1
if errorlevel 1 (
    echo Yarn executable not found. Please install Yarn and re-run this script.
    exit /b 1
)

pushd "%TYPE_SCRIPT_DIR%" >nul 2>&1 || (
    echo Failed to enter TypeScript directory.
    exit /b 1
)

echo.
echo Installing TypeScript dependencies (this may take a while)...
call yarn build
set "YARN_EXIT=%ERRORLEVEL%"
popd >nul

if %YARN_EXIT% NEQ 0 (
    echo Yarn build failed with exit code %YARN_EXIT%.
    exit /b %YARN_EXIT%
)

echo.
echo Setup completed successfully.
exit /b 0
