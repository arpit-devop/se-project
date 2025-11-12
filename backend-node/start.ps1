# PowerShell script to start the Node.js backend

Write-Host "Starting Pharmaventory Backend..." -ForegroundColor Cyan
Write-Host ""

# Check if MongoDB is running
try {
    $mongoCheck = Test-NetConnection -ComputerName localhost -Port 27017 -WarningAction SilentlyContinue
    if ($mongoCheck.TcpTestSucceeded) {
        Write-Host "✓ MongoDB is running" -ForegroundColor Green
    } else {
        Write-Host "⚠ MongoDB might not be running on port 27017" -ForegroundColor Yellow
        Write-Host "  Make sure MongoDB is started before continuing" -ForegroundColor Yellow
    }
} catch {
    Write-Host "⚠ Could not check MongoDB connection" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Starting server..." -ForegroundColor Cyan
npm start

