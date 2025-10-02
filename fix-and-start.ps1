# PowerShell script to fix dependencies and start the backend server

Write-Host "Installing backend dependencies..." -ForegroundColor Green
Set-Location server
npm install supertest jest @types/jest jest-environment-node

Write-Host "Installing frontend dependencies..." -ForegroundColor Green
Set-Location ../client
npm install jest-environment-jsdom @babel/core @babel/preset-env @babel/preset-react babel-jest

Write-Host "Starting backend server..." -ForegroundColor Green
Set-Location ../server
Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm run dev"

Write-Host "Backend server started in new window. You can now run frontend tests or start the frontend." -ForegroundColor Yellow


