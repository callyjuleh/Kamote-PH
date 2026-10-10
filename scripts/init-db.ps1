param(
  [string]$RootUser = 'root',
  [string]$AppUser = 'roadwise',
  [string]$AppPassword = 'roadwise_dev',
  [string]$DbName = 'roadwise'
)

$ErrorActionPreference = 'Stop'

$mysql = 'C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe'
if (-not (Test-Path -LiteralPath $mysql)) {
  throw "mysql.exe not found at $mysql - edit the path in this script."
}

$secure = Read-Host -AsSecureString "Enter MySQL root password (input hidden)"
$bstr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
$rootPw = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($bstr)
[Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr)

$repoRoot = Split-Path -Parent $PSScriptRoot
$schema = (Join-Path $repoRoot 'database\schema.sql') -replace '\\', '/'
$seed = (Join-Path $repoRoot 'database\seed.sql') -replace '\\', '/'

$ini = Join-Path $env:TEMP 'roadwise-root.cnf'
Set-Content -LiteralPath $ini -Value "[client]`nuser=$RootUser`npassword=$rootPw"

function Invoke-MySql {
  param([string[]]$SqlArgs)
  & $mysql "--defaults-extra-file=$ini" @SqlArgs
  if ($LASTEXITCODE -ne 0) { throw "mysql exited with code $LASTEXITCODE" }
}

try {
  $bootstrap = "CREATE DATABASE IF NOT EXISTS ``$DbName`` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;" +
               "CREATE USER IF NOT EXISTS '$AppUser'@'localhost' IDENTIFIED BY '$AppPassword';" +
               "GRANT ALL PRIVILEGES ON ``$DbName``.* TO '$AppUser'@'localhost';" +
               "FLUSH PRIVILEGES;"
  Invoke-MySql @('-e', $bootstrap)

  Invoke-MySql @($DbName, '-e', "SOURCE $schema")
  Invoke-MySql @($DbName, '-e', "SOURCE $seed")
}
finally {
  Remove-Item -LiteralPath $ini -Force -ErrorAction SilentlyContinue
}

Write-Host "Done. Database '$DbName' loaded. App user: '$AppUser' / '$AppPassword'." -ForegroundColor Green
