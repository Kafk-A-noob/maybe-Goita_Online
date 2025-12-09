# Vercel Deploy Notification Script
# Usage: pwsh .\vercel-deploy-notify.ps1

param(
    [string]$RepoOwner = "Kafk-A-noob",
    [string]$RepoName = "maybe-Goita_Online",
    [int]$CheckIntervalSeconds = 15,
    [int]$TimeoutMinutes = 10
)

Write-Host "`n🚀 Vercelデプロイ監視を開始..." -ForegroundColor Cyan
Write-Host "📦 リポジトリ: $RepoOwner/$RepoName" -ForegroundColor Gray
Write-Host "⏱️  チェック間隔: $($CheckIntervalSeconds)秒" -ForegroundColor Gray
Write-Host "⏳ タイムアウト: $($TimeoutMinutes)分`n" -ForegroundColor Gray

$startTime = Get-Date
$lastDeploymentId = $null
$lastStatus = $null

while ((Get-Date) -lt $startTime.AddMinutes($TimeoutMinutes)) {
    try {
        # GitHub APIでデプロイ状態を取得
        $url = "https://api.github.com/repos/$RepoOwner/$RepoName/deployments"
        $deployments = Invoke-RestMethod -Uri $url -Headers @{
            "Accept"     = "application/vnd.github+json"
            "User-Agent" = "PowerShell-Vercel-Notifier"
        } -ErrorAction Stop

        if ($deployments.Count -eq 0) {
            Write-Host "⚠️ デプロイが見つかりません。しばらく待機..." -ForegroundColor Yellow
            Start-Sleep -Seconds $CheckIntervalSeconds
            continue
        }

        $latestDeployment = $deployments[0]
        
        # デプロイステータスを取得
        $statusUrl = $latestDeployment.statuses_url
        $statuses = Invoke-RestMethod -Uri $statusUrl -Headers @{
            "Accept"     = "application/vnd.github+json"
            "User-Agent" = "PowerShell-Vercel-Notifier"
        } -ErrorAction Stop
        
        if ($statuses.Count -eq 0) {
            Write-Host "⏳ デプロイ状態を確認中..." -ForegroundColor Yellow
            Start-Sleep -Seconds $CheckIntervalSeconds
            continue
        }

        $currentStatus = $statuses[0].state
        $environment = $statuses[0].environment
        
        # 状態が変わった場合のみ表示
        if ($currentStatus -ne $lastStatus) {
            $timestamp = Get-Date -Format "HH:mm:ss"
            Write-Host "[$timestamp] 📊 状態: $currentStatus ($environment)" -ForegroundColor Cyan
            $lastStatus = $currentStatus
        }
        
        if ($currentStatus -eq "success") {
            # デプロイ成功！
            Write-Host "`n✅ デプロイ完了！`n" -ForegroundColor Green
            
            # 実際のデプロイURLを取得
            $deployUrl = $statuses[0].target_url
            if (-not $deployUrl) {
                $deployUrl = "https://vercel.com/$RepoOwner"
            }
            
            # Windows通知を表示
            Add-Type -AssemblyName System.Windows.Forms
            $notification = New-Object System.Windows.Forms.NotifyIcon
            $notification.Icon = [System.Drawing.SystemIcons]::Information
            $notification.BalloonTipTitle = "✅ Vercel Deploy Complete"
            $notification.BalloonTipText = "デプロイが完了しました！`n$RepoName"
            $notification.Visible = $true
            $notification.ShowBalloonTip(5000)
            
            # ブラウザで開く
            Write-Host "🌐 ブラウザで開きます: $deployUrl" -ForegroundColor Green
            Start-Process $deployUrl
            
            # 通知を表示したまま少し待機
            Start-Sleep -Seconds 2
            $notification.Dispose()
            
            break
        }
        elseif ($currentStatus -eq "failure" -or $currentStatus -eq "error") {
            # デプロイ失敗
            Write-Host "`n❌ デプロイ失敗`n" -ForegroundColor Red
            
            # エラー通知
            Add-Type -AssemblyName System.Windows.Forms
            $notification = New-Object System.Windows.Forms.NotifyIcon
            $notification.Icon = [System.Drawing.SystemIcons]::Error
            $notification.BalloonTipTitle = "❌ Vercel Deploy Failed"
            $notification.BalloonTipText = "デプロイに失敗しました`n$RepoName"
            $notification.Visible = $true
            $notification.ShowBalloonTip(5000)
            
            # Vercelダッシュボードを開く
            $vercelUrl = "https://vercel.com/$RepoOwner/$RepoName"
            Write-Host "🔗 Vercelダッシュボード: $vercelUrl" -ForegroundColor Yellow
            Start-Process $vercelUrl
            
            Start-Sleep -Seconds 2
            $notification.Dispose()
            
            break
        }
        elseif ($currentStatus -eq "pending" -or $currentStatus -eq "in_progress") {
            # デプロイ進行中
            Write-Host "." -NoNewline -ForegroundColor Gray
        }
        
        $lastDeploymentId = $latestDeployment.id
    }
    catch {
        Write-Host "`n⚠️ エラー: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host "5秒後に再試行します..." -ForegroundColor Yellow
        Start-Sleep -Seconds 5
    }
    
    Start-Sleep -Seconds $CheckIntervalSeconds
}

$elapsed = (Get-Date) - $startTime
Write-Host "`n⏱️  監視終了（経過時間: $($elapsed.Minutes)分$($elapsed.Seconds)秒）" -ForegroundColor Cyan
