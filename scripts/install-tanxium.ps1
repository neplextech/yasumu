$ErrorActionPreference = "Stop"

$Repo = "neplextech/yasumu"
$InstallDir = if ($env:TANXIUM_INSTALL_DIR) {
    $env:TANXIUM_INSTALL_DIR
} else {
    Join-Path $env:LOCALAPPDATA "Tanxium\bin"
}

switch ([System.Runtime.InteropServices.RuntimeInformation]::OSArchitecture) {
    "Arm64" {
        $Arch = "aarch64"
    }
    "X64" {
        $Arch = "x86_64"
    }
    default {
        throw "Unsupported architecture: $([System.Runtime.InteropServices.RuntimeInformation]::OSArchitecture)"
    }
}

$Target = "$Arch-pc-windows-msvc"
$Asset = "tanxium-$Target.exe"

Write-Host "Finding the latest Tanxium release..."

$Headers = @{
    "User-Agent" = "tanxium-installer"
}

$Releases = Invoke-RestMethod `
    -Uri "https://api.github.com/repos/$Repo/releases?per_page=100" `
    -Headers $Headers

$Release = $Releases |
    Where-Object { $_.tag_name -like "tanxium-v*" -and -not $_.draft } |
    Select-Object -First 1

if (-not $Release) {
    throw "Could not find a Tanxium release."
}

$Tag = $Release.tag_name
$Url = "https://github.com/$Repo/releases/download/$Tag/$Asset"

New-Item -ItemType Directory -Path $InstallDir -Force | Out-Null

$Destination = Join-Path $InstallDir "tanxium.exe"
$TemporaryFile = Join-Path ([System.IO.Path]::GetTempPath()) "tanxium-$([guid]::NewGuid()).exe"

try {
    Write-Host "Installing Tanxium $Tag for $Target..."

    Invoke-WebRequest `
        -Uri $Url `
        -OutFile $TemporaryFile `
        -UseBasicParsing

    Move-Item `
        -Path $TemporaryFile `
        -Destination $Destination `
        -Force
}
finally {
    if (Test-Path $TemporaryFile) {
        Remove-Item $TemporaryFile -Force
    }
}

$UserPath = [Environment]::GetEnvironmentVariable(
    "Path",
    [EnvironmentVariableTarget]::User
)

$PathEntries = @(
    $UserPath -split ";" |
        Where-Object { -not [string]::IsNullOrWhiteSpace($_) }
)

$AlreadyInPath = $PathEntries |
    Where-Object {
        $_.TrimEnd("\") -ieq $InstallDir.TrimEnd("\")
    }

if (-not $AlreadyInPath) {
    $NewUserPath = if ([string]::IsNullOrWhiteSpace($UserPath)) {
        $InstallDir
    } else {
        "$UserPath;$InstallDir"
    }

    [Environment]::SetEnvironmentVariable(
        "Path",
        $NewUserPath,
        [EnvironmentVariableTarget]::User
    )

    Write-Host "Added $InstallDir to your user PATH."
}

if (
    -not (($env:Path -split ";") |
        Where-Object {
            $_.TrimEnd("\") -ieq $InstallDir.TrimEnd("\")
        })
) {
    $env:Path = "$env:Path;$InstallDir"
}

Write-Host "Installed Tanxium to $Destination"
Write-Host "Run: tanxium --version"
