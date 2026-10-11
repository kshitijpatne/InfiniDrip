$ErrorActionPreference = 'Stop'

$researchCheckout = 'C:\Users\kshit\.codex\worktrees\epic17-s443-claude-woven-research'
$packetDir = 'C:\Users\kshit\.codex\worktrees\epic-17-g04\designApp\docs\research\epic17\S443-claude-woven-blocker-research'
$promptPath = Join-Path $packetDir 'CLAUDE-HANDOFF-S443.md'
$outputPath = Join-Path $packetDir 'S443-claude-output.txt'
$statusPath = Join-Path $packetDir 'S443-claude-attempt-status.json'
$deadline = [DateTimeOffset]::Parse('2026-10-07T18:10:00-04:00')

while ([DateTimeOffset]::Now -lt $deadline) {
    Start-Sleep -Seconds 30
}

$startedAt = [DateTimeOffset]::Now.ToString('o')
$exitCode = -1
$errorText = $null
$finishedSignal = $false
try {
    $prompt = Get-Content -LiteralPath $promptPath -Raw
    Push-Location -LiteralPath $researchCheckout
    try {
        $claudeArgs = @(
            '-p',
            '--model', 'claude-opus-5-5',
            '--effort', 'xhigh',
            '--permission-mode', 'plan',
            '--tools', 'Read', 'Grep', 'Glob', 'WebSearch', 'WebFetch'
        )
        $prompt | & claude @claudeArgs *> $outputPath
        $exitCode = $LASTEXITCODE
        if (Test-Path -LiteralPath $outputPath) {
            $finishedSignal = (Get-Content -LiteralPath $outputPath -Raw).TrimEnd().EndsWith('WORK FINISHED')
        }
    } finally {
        Pop-Location
    }
} catch {
    $errorText = $_.Exception.Message
}

$result = [ordered]@{
    model = 'claude-opus-5-5'
    effort = 'xhigh'
    permissionMode = 'plan'
    startedAt = $startedAt
    completedAt = [DateTimeOffset]::Now.ToString('o')
    exitCode = $exitCode
    workFinishedSignal = $finishedSignal
    error = $errorText
    output = 'S443-claude-output.txt'
}
[System.IO.File]::WriteAllText($statusPath, ($result | ConvertTo-Json -Depth 4))
