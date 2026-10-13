param(
  [Parameter(Mandatory = $true)]
  [ValidateSet("current", "one-worker")]
  [string]$Mode,
  [ValidateRange(1, 3600)]
  [int]$MaximumSeconds = 480
)

$ErrorActionPreference = "Stop"
$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..\..\..")).Path
$profileDirectory = Join-Path $PSScriptRoot "profiling\$Mode"
$coverageDirectory = Join-Path $profileDirectory "coverage"
$stdoutPath = Join-Path $PSScriptRoot "app-coverage-$Mode.stdout.txt"
$stderrPath = Join-Path $PSScriptRoot "app-coverage-$Mode.stderr.txt"
$resultPath = Join-Path $PSScriptRoot "app-coverage-$Mode-profile.json"
New-Item -ItemType Directory -Force -Path $coverageDirectory | Out-Null
$coverageRelativePath = $coverageDirectory.Substring($repoRoot.Length + 1).Replace("\", "/")

$workerArgs = ""
if ($Mode -eq "one-worker") {
  $workerArgs = " --maxWorkers=1 --minWorkers=1"
}
$vitestCommand = "npm exec -- vitest run src/ui/app.test.ts --coverage --coverage.include=src/ui/app.ts --coverage.reporter=text --coverage.reporter=json-summary --coverage.reportsDirectory=$coverageRelativePath$workerArgs"
$startedAt = [DateTimeOffset]::UtcNow
$timer = [System.Diagnostics.Stopwatch]::StartNew()
$process = Start-Process -FilePath "cmd.exe" -ArgumentList "/d /c $vitestCommand" -WorkingDirectory $repoRoot -PassThru -RedirectStandardOutput $stdoutPath -RedirectStandardError $stderrPath
$peakPrivateBytes = 0L
$peakWorkingSetBytes = 0L
$peakProcessCount = 0
$timedOut = $false
$lastProgressSeconds = 30

while ($true) {
  $process.Refresh()
  $allProcesses = Get-CimInstance Win32_Process | Select-Object ProcessId, ParentProcessId
  $treeIds = [System.Collections.Generic.HashSet[int]]::new()
  [void]$treeIds.Add([int]$process.Id)
  $expanded = $true
  while ($expanded) {
    $expanded = $false
    foreach ($candidate in $allProcesses) {
      $parentId = [int]$candidate.ParentProcessId
      $childId = [int]$candidate.ProcessId
      if ($treeIds.Contains($parentId) -and -not $treeIds.Contains($childId)) {
        [void]$treeIds.Add($childId)
        $expanded = $true
      }
    }
  }
  $treeProcesses = foreach ($processId in $treeIds) {
    Get-Process -Id $processId -ErrorAction SilentlyContinue
  }
  $privateBytes = [long](($treeProcesses | Measure-Object -Property PrivateMemorySize64 -Sum).Sum)
  $workingSetBytes = [long](($treeProcesses | Measure-Object -Property WorkingSet64 -Sum).Sum)
  if ($privateBytes -gt $peakPrivateBytes) { $peakPrivateBytes = $privateBytes }
  if ($workingSetBytes -gt $peakWorkingSetBytes) { $peakWorkingSetBytes = $workingSetBytes }
  if ($treeIds.Count -gt $peakProcessCount) { $peakProcessCount = $treeIds.Count }
  if ($timer.Elapsed.TotalSeconds -ge $lastProgressSeconds) {
    Write-Output ("progress mode={0} elapsedSeconds={1:F0} treePrivateMiB={2:F0} processCount={3}" -f $Mode, $timer.Elapsed.TotalSeconds, ($privateBytes / 1MB), $treeIds.Count)
    $lastProgressSeconds += 30
  }
  if ($process.HasExited) { break }
  if ($timer.Elapsed.TotalSeconds -ge $MaximumSeconds) {
    $timedOut = $true
    Write-Output ("stopping process tree at the diagnostic cap of {0} seconds" -f $MaximumSeconds)
    & taskkill.exe /PID $process.Id /T /F | Out-Null
    $process.WaitForExit()
    break
  }
  Start-Sleep -Milliseconds 750
}

$timer.Stop()
$exitCode = $process.ExitCode
$finalExitCode = $exitCode
if ($timedOut) { $finalExitCode = 124 }
$result = [ordered]@{
  mode = $Mode
  command = $vitestCommand
  startedAt = $startedAt.ToString("o")
  endedAt = [DateTimeOffset]::UtcNow.ToString("o")
  elapsedSeconds = [Math]::Round($timer.Elapsed.TotalSeconds, 2)
  exitCode = $finalExitCode
  timedOut = $timedOut
  peakTreePrivateMiB = [Math]::Round($peakPrivateBytes / 1MB, 1)
  peakTreeWorkingSetMiB = [Math]::Round($peakWorkingSetBytes / 1MB, 1)
  peakTreeProcessCount = $peakProcessCount
  stdoutPath = $stdoutPath.Substring($repoRoot.Length + 1).Replace("\", "/")
  stderrPath = $stderrPath.Substring($repoRoot.Length + 1).Replace("\", "/")
}
$result | ConvertTo-Json -Depth 4 | Set-Content -LiteralPath $resultPath -Encoding utf8
Get-Content -LiteralPath $resultPath
if ($timedOut) { exit 124 }
exit $exitCode
