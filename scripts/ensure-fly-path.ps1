# Add Fly CLI to PATH for this session (run if 'fly' is not recognized)
# Fly installs to $HOME\.fly\bin — run this after installing via: irm https://fly.io/install.ps1 | iex

$flyBin = "$env:USERPROFILE\.fly\bin"
if (Test-Path "$flyBin\flyctl.exe") {
  $env:Path += ";$flyBin"
  Write-Host "Fly CLI added to PATH for this session. Run: fly version"
  & "$flyBin\flyctl.exe" version
} else {
  Write-Host "Fly CLI not found at $flyBin"
  Write-Host "Install it with: irm https://fly.io/install.ps1 | iex"
  Write-Host "Then close and reopen the terminal, or run this script again."
}
