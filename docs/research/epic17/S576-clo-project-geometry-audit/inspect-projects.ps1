Add-Type -AssemblyName System.IO.Compression

$ErrorActionPreference = 'Stop'
$projects = @(
  @{
    name = 'clo-after-line-chain-import.zprj'
    expectedSha256 = '43AB4CD6DE6A823CF671BF7FE748ABC4052744A396E3DBCB0FE9539055D39E25'
  },
  @{
    name = 'clo-after-line-chain-export-reimport.zprj'
    expectedSha256 = '0DCCD455D1FB2F45DB66129F8355E015F80BFDDBC174B3AA2C454DED78F9FD04'
  }
)
$inputDirectory = 'C:\G04-CLO-DXF-Exchange\S574-polo-line-chain-representation\Evidence'
$outputPath = 'C:\G04-CLO-DXF-Exchange\S576-clo-project-geometry-audit\Evidence\project-container-inspection.json'

function Get-Signatures([byte[]]$bytes) {
  $first = ($bytes | Select-Object -First 16 | ForEach-Object { $_.ToString('X2') }) -join ' '
  $startsZip = $bytes.Length -ge 4 -and $bytes[0] -eq 0x50 -and $bytes[1] -eq 0x4B -and $bytes[2] -eq 0x03 -and $bytes[3] -eq 0x04
  $startsPng = $bytes.Length -ge 4 -and $bytes[0] -eq 0x89 -and $bytes[1] -eq 0x50 -and $bytes[2] -eq 0x4E -and $bytes[3] -eq 0x47
  $startsXml = $bytes.Length -gt 0 -and ($bytes[0] -eq 0x3C -or ($bytes.Length -gt 3 -and $bytes[0] -eq 0xEF -and $bytes[1] -eq 0xBB -and $bytes[2] -eq 0xBF -and $bytes[3] -eq 0x3C))
  $startsJson = $bytes.Length -gt 0 -and ($bytes[0] -eq 0x7B -or $bytes[0] -eq 0x5B)
  return [pscustomobject]@{ first16Hex = $first; zipLocalFile = $startsZip; png = $startsPng; xml = $startsXml; json = $startsJson }
}

$results = foreach ($project in $projects) {
  $path = Join-Path $inputDirectory $project.name
  $fileHash = (Get-FileHash -LiteralPath $path -Algorithm SHA256).Hash
  if ($fileHash -ne $project.expectedSha256) { throw "Project hash mismatch for $($project.name)" }
  $bytes = [IO.File]::ReadAllBytes($path)
  $outerMagic = [Text.Encoding]::ASCII.GetString($bytes, 0, [Math]::Min(16, $bytes.Length))
  $zipOffset = -1
  for ($i = 0; $i -lt $bytes.Length - 3; $i++) {
    if ($bytes[$i] -eq 0x50 -and $bytes[$i + 1] -eq 0x4B -and $bytes[$i + 2] -eq 0x03 -and $bytes[$i + 3] -eq 0x04) { $zipOffset = $i; break }
  }
  if ($zipOffset -lt 0) { throw "No standard ZIP local-header signature in $($project.name)" }
  $zipBytes = New-Object byte[] ($bytes.Length - $zipOffset)
  [Array]::Copy($bytes, $zipOffset, $zipBytes, 0, $zipBytes.Length)
  $container = [IO.MemoryStream]::new($zipBytes)
  $archive = [IO.Compression.ZipArchive]::new($container, [IO.Compression.ZipArchiveMode]::Read, $false)
  $entries = foreach ($entry in $archive.Entries) {
    $stream = $entry.Open()
    $member = [IO.MemoryStream]::new()
    $stream.CopyTo($member)
    $memberBytes = $member.ToArray()
    $signature = Get-Signatures $memberBytes
    $sha = [Security.Cryptography.SHA256]::Create()
    $memberSha256 = [Convert]::ToHexString($sha.ComputeHash($memberBytes))
    $sha.Dispose()
    $entrySummary = [ordered]@{
      name = $entry.FullName
      uncompressedBytes = $entry.Length
      compressedBytes = $entry.CompressedLength
      sha256 = $memberSha256
      signature = $signature
    }
    if ($entry.FullName -like '*.xml') {
      $xmlText = [Text.Encoding]::UTF8.GetString($memberBytes)
      [xml]$xml = $xmlText
      $names = @($xml.SelectNodes('//*') | ForEach-Object { $_.LocalName } | Sort-Object -Unique)
      $entrySummary.xmlRoot = $xml.DocumentElement.LocalName
      $entrySummary.xmlElementNames = $names
    }
    if ($entry.FullName -eq 'clofiles.json') {
      $manifest = [Text.Encoding]::UTF8.GetString($memberBytes) | ConvertFrom-Json
      $entrySummary.manifestMemberNames = @($manifest.PSObject.Properties.Name | Sort-Object)
      $entrySummary.localPathValuesWithheld = $true
    }
    [pscustomobject]$entrySummary
    $stream.Dispose()
    $member.Dispose()
  }
  $archive.Dispose()
  $container.Dispose()
  [pscustomobject]@{
    name = $project.name
    bytes = $bytes.Length
    sha256 = $fileHash
    outerMagic = $outerMagic
    firstStandardZipLocalHeaderOffset = $zipOffset
    standardZipEntryCount = $entries.Count
    entries = @($entries)
  }
}

$normalizeName = { param($name) $name -replace '^clo-after-line-chain-(import|export-reimport)', 'clo-after-line-chain' }
$firstEntries = @{}; foreach ($entry in $results[0].entries) { $firstEntries[(& $normalizeName $entry.name)] = $entry }
$secondEntries = @{}; foreach ($entry in $results[1].entries) { $secondEntries[(& $normalizeName $entry.name)] = $entry }
$memberComparison = foreach ($name in ($firstEntries.Keys | Sort-Object)) {
  $first = $firstEntries[$name]
  $second = $secondEntries[$name]
  [pscustomobject]@{
    normalizedName = $name
    importName = $first.name
    reimportName = $second.name
    sameBytes = $first.sha256 -eq $second.sha256
    importBytes = $first.uncompressedBytes
    reimportBytes = $second.uncompressedBytes
    importSha256 = $first.sha256
    reimportSha256 = $second.sha256
  }
}

$report = [pscustomobject]@{
  inspection = 'Read-only inspection of standard ZIP payload and transparent XML/JSON members; no CLO proprietary geometry payload decoded.'
  projects = @($results)
  memberComparison = @($memberComparison)
}
$json = $report | ConvertTo-Json -Depth 8
Set-Content -LiteralPath $outputPath -Value $json -Encoding utf8
Write-Output "Wrote $outputPath"
Write-Output "Project containers matched recorded hashes; standard ZIP manifests and transparent XML/JSON members inventoried."
