rem <projectdir> <targetdir> <targetfilename> <cdePlatform - X64_V3 NETSTD_V20 etc.>
rem SPDX-FileCopyrightText: Copyright (c) 2009-2020 TRUMPF Laser GmbH, authors: C-Labs
rem SPDX-License-Identifier: CC0-1.0
if "%~3" == "" goto packnow
echo Signing %~3 now...
call "%~dp0\signMeSha.bat" "%~2%~3" "%~dp0"
:packnow
echo Packaging "%~2%~5" "%~2." "%~2." "%~4" now ...
"%~dp0\cdePackager\cdePackager.exe" "%~2%~5" "%~2." "%~2." "%~4"
exit %errorlevel%
