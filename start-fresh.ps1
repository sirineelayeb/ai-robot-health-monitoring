Write-Host "=== STARTING FRESH ===" -ForegroundColor Cyan

# 1. Stop and remove everything
Write-Host "`n1. Cleaning up..." -ForegroundColor Yellow
docker-compose down
docker volume prune -f
Remove-Item -Path "*.json" -ErrorAction SilentlyContinue

# 2. Start services
Write-Host "`n2. Starting services..." -ForegroundColor Yellow
docker-compose up -d

# 3. Wait
Write-Host "`n3. Waiting for startup..." -ForegroundColor Yellow
Start-Sleep -Seconds 15

# 4. Check status
Write-Host "`n4. Checking service status..." -ForegroundColor Yellow
docker-compose ps

# 5. Test MongoDB
Write-Host "`n5. Testing MongoDB..." -ForegroundColor Yellow
try {
    docker exec ai-robot-health-monitoring-mongo-1 mongosh --eval "db.adminCommand('ping')" | Out-Null
    Write-Host "✅ MongoDB is running" -ForegroundColor Green
} catch {
    Write-Host "❌ MongoDB not responding" -ForegroundColor Red
}

# 6. Test backend
Write-Host "`n6. Testing backend..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "http://localhost:3000/health" -Method Get -ErrorAction Stop
    Write-Host "✅ Backend is running: $($health.status)" -ForegroundColor Green
} catch {
    Write-Host "❌ Backend not responding" -ForegroundColor Red
}

# 7. Send test message
Write-Host "`n7. Sending test message..." -ForegroundColor Yellow
@"
{"robot_id":"fresh_start","temperature":25.5}
"@ | Out-File -FilePath "test-msg.json" -Encoding UTF8 -NoNewline

Get-Content "test-msg.json" -Raw | docker run --rm --network=ai-robot-health-monitoring_default -i eclipse-mosquitto:2 mosquitto_pub -h mqtt -t "robot/telemetry" -l 2>&1 | Write-Host

Remove-Item "test-msg.json" -ErrorAction SilentlyContinue

# 8. Check database
Write-Host "`n8. Checking database..." -ForegroundColor Yellow
Start-Sleep -Seconds 3
docker exec ai-robot-health-monitoring-mongo-1 mongosh robot_db --eval "
print('Collections in robot_db:');
const cols = db.getCollectionNames();
cols.forEach(col => {
    const count = db[col].countDocuments();
    print('  ' + col + ': ' + count + ' records');
    if (count > 0) {
        print('    Latest:');
        db[col].find().sort({_id: -1}).limit(1).forEach(doc => {
            print('      ' + JSON.stringify(doc));
        });
    }
});
"

Write-Host "`n=== DONE ===" -ForegroundColor Cyan
