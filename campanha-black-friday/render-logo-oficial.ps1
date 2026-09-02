Add-Type -AssemblyName System.Drawing

$ErrorActionPreference = 'Stop'
$scriptRoot = $PSScriptRoot
if ([string]::IsNullOrWhiteSpace($scriptRoot)) {
  $scriptRoot = Join-Path (Get-Location) 'campanha-black-friday'
}
$repoRoot = Split-Path -Parent $scriptRoot
$svgPath = Join-Path $repoRoot 'assets\img\logo-home.svg'
$outputPath = Join-Path $scriptRoot 'logo-oficial-horizontal.png'

[xml]$svg = Get-Content -Raw -Encoding UTF8 -LiteralPath $svgPath
$width = 1200
$height = 300
$scale = $width / 900.0

$bitmap = New-Object System.Drawing.Bitmap($width, $height, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$graphics = [System.Drawing.Graphics]::FromImage($bitmap)
$graphics.Clear([System.Drawing.Color]::Transparent)
$graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality

function Get-InheritedAttribute {
  param($Node, [string]$Name)
  $current = $Node
  while ($null -ne $current) {
    if ($null -ne $current.Attributes -and $null -ne $current.Attributes[$Name]) {
      return $current.Attributes[$Name].Value
    }
    $current = $current.ParentNode
  }
  return $null
}

function Get-AccumulatedTranslation {
  param($Node)
  $tx = 0.0
  $ty = 0.0
  $current = $Node
  while ($null -ne $current) {
    if ($null -ne $current.Attributes -and $null -ne $current.Attributes['transform']) {
      $value = $current.Attributes['transform'].Value
      $match = [regex]::Match($value, 'translate\(\s*(-?[0-9.]+)[ ,]+(-?[0-9.]+)\s*\)')
      if ($match.Success) {
        $tx += [double]::Parse($match.Groups[1].Value, [Globalization.CultureInfo]::InvariantCulture)
        $ty += [double]::Parse($match.Groups[2].Value, [Globalization.CultureInfo]::InvariantCulture)
      }
    }
    $current = $current.ParentNode
  }
  return @($tx, $ty)
}

function Convert-SvgPath {
  param([string]$Data, [double]$TranslateX, [double]$TranslateY, [double]$Scale)
  $matches = [regex]::Matches($Data, '[MLCZ]|-?(?:[0-9]+\.?[0-9]*|\.[0-9]+)(?:[eE][-+]?[0-9]+)?')
  $tokens = @($matches | ForEach-Object { $_.Value })
  $path = New-Object System.Drawing.Drawing2D.GraphicsPath
  $i = 0
  $command = ''
  $currentX = 0.0
  $currentY = 0.0

  function NumberAt([int]$Index) {
    return [double]::Parse($tokens[$Index], [Globalization.CultureInfo]::InvariantCulture)
  }

  while ($i -lt $tokens.Count) {
    if ($tokens[$i] -match '^[MLCZ]$') {
      $command = $tokens[$i]
      $i++
      if ($command -eq 'Z') {
        $path.CloseFigure()
        continue
      }
    }

    switch ($command) {
      'M' {
        $x = ((NumberAt $i) + $TranslateX) * $Scale
        $y = ((NumberAt ($i+1)) + $TranslateY) * $Scale
        $path.StartFigure()
        $currentX = $x; $currentY = $y
        $i += 2
        $command = 'L'
      }
      'L' {
        $x = ((NumberAt $i) + $TranslateX) * $Scale
        $y = ((NumberAt ($i+1)) + $TranslateY) * $Scale
        $path.AddLine([float]$currentX, [float]$currentY, [float]$x, [float]$y)
        $currentX = $x; $currentY = $y
        $i += 2
      }
      'C' {
        $x1 = ((NumberAt $i) + $TranslateX) * $Scale
        $y1 = ((NumberAt ($i+1)) + $TranslateY) * $Scale
        $x2 = ((NumberAt ($i+2)) + $TranslateX) * $Scale
        $y2 = ((NumberAt ($i+3)) + $TranslateY) * $Scale
        $x3 = ((NumberAt ($i+4)) + $TranslateX) * $Scale
        $y3 = ((NumberAt ($i+5)) + $TranslateY) * $Scale
        $path.AddBezier([float]$currentX, [float]$currentY, [float]$x1, [float]$y1, [float]$x2, [float]$y2, [float]$x3, [float]$y3)
        $currentX = $x3; $currentY = $y3
        $i += 6
      }
      default { throw "Comando SVG nao suportado: $command" }
    }
  }
  return $path
}

$nodes = $svg.SelectNodes('//*[local-name()="path" and @d]')
foreach ($node in $nodes) {
  $fill = Get-InheritedAttribute $node 'fill'
  if ([string]::IsNullOrWhiteSpace($fill) -or $fill -eq 'none') { continue }
  $translation = Get-AccumulatedTranslation $node
  $path = Convert-SvgPath $node.Attributes['d'].Value $translation[0] $translation[1] $scale
  $color = [System.Drawing.ColorTranslator]::FromHtml($fill)
  $brush = New-Object System.Drawing.SolidBrush($color)
  $graphics.FillPath($brush, $path)
  $brush.Dispose()
  $path.Dispose()
}

$bitmap.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)
$graphics.Dispose()
$bitmap.Dispose()

Write-Output $outputPath
