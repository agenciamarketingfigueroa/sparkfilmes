Add-Type -AssemblyName System.Drawing

$assetDirectory = Split-Path -Parent $MyInvocation.MyCommand.Path
$backgroundColor = [System.Drawing.ColorTranslator]::FromHtml('#f1f0f0')
$pinkColor = [System.Drawing.ColorTranslator]::FromHtml('#ff2c58')
$blackColor = [System.Drawing.Color]::Black

function New-SparkPoint {
  param(
    [double]$X,
    [double]$Y
  )

  return [System.Drawing.PointF]::new(
    [single](112.5 + (0.85 * $X)),
    [single](112.5 + (0.85 * $Y))
  )
}

function New-SparkSymbolPaths {
  $pinkPath = [System.Drawing.Drawing2D.GraphicsPath]::new()
  [System.Drawing.PointF[]]$pinkPoints = @(
    (New-SparkPoint 840.121094 1365.847656),
    (New-SparkPoint 535.953125 1114.25),
    (New-SparkPoint 479.625 851.386719),
    (New-SparkPoint 678.648438 573.503906),
    (New-SparkPoint 704.9375 592.28125),
    (New-SparkPoint 723.710938 614.8125),
    (New-SparkPoint 738.734375 644.851562),
    (New-SparkPoint 783.796875 543.460938),
    (New-SparkPoint 783.796875 430.808594),
    (New-SparkPoint 746.242188 329.417969),
    (New-SparkPoint 704.9375 228.027344),
    (New-SparkPoint 626.078125 145.414062),
    (New-SparkPoint 524.6875 104.105469),
    (New-SparkPoint 648.609375 273.089844),
    (New-SparkPoint 577.261719 423.296875),
    (New-SparkPoint 483.378906 562.238281),
    (New-SparkPoint 393.257812 693.671875),
    (New-SparkPoint 303.132812 783.792969),
    (New-SparkPoint 336.929688 960.289062),
    (New-SparkPoint 374.480469 1170.578125),
    (New-SparkPoint 596.035156 1339.5625),
    (New-SparkPoint 840.121094 1365.847656)
  )
  $pinkPath.AddBeziers($pinkPoints)
  $pinkPath.CloseFigure()

  $blackPath = [System.Drawing.Drawing2D.GraphicsPath]::new()
  $blackStart = New-SparkPoint 918.980469 239.292969
  $blackCurveEnd = New-SparkPoint 765.019531 888.9375
  $blackLineEnd = New-SparkPoint 712.445312 813.835938

  $blackPath.AddBezier(
    $blackStart,
    (New-SparkPoint 997.839844 464.605469),
    (New-SparkPoint 937.757812 719.957031),
    $blackCurveEnd
  )
  $blackPath.AddLine($blackCurveEnd, $blackLineEnd)

  [System.Drawing.PointF[]]$blackRemainingPoints = @(
    $blackLineEnd,
    (New-SparkPoint 629.832031 1035.390625),
    (New-SparkPoint 723.710938 1286.988281),
    (New-SparkPoint 937.757812 1395.886719),
    (New-SparkPoint 667.382812 1031.636719),
    (New-SparkPoint 1080.453125 907.714844),
    (New-SparkPoint 1159.3125 648.609375),
    (New-SparkPoint 1200.621094 487.136719),
    (New-SparkPoint 1118.007812 348.195312),
    (New-SparkPoint 918.980469 239.292969)
  )
  $blackPath.AddBeziers($blackRemainingPoints)
  $blackPath.CloseFigure()

  return @($pinkPath, $blackPath)
}

function Export-SparkIcon {
  param(
    [int]$Size,
    [string]$FileName
  )

  $bitmap = [System.Drawing.Bitmap]::new($Size, $Size, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
  $paths = New-SparkSymbolPaths
  $pinkBrush = [System.Drawing.SolidBrush]::new($pinkColor)
  $blackBrush = [System.Drawing.SolidBrush]::new($blackColor)

  try {
    $graphics.Clear($backgroundColor)
    $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $scale = [single]($Size / 1500)
    $graphics.ScaleTransform($scale, $scale)
    $graphics.FillPath($pinkBrush, $paths[0])
    $graphics.FillPath($blackBrush, $paths[1])
    $outputPath = Join-Path $assetDirectory $FileName
    $bitmap.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)
  }
  finally {
    $paths | ForEach-Object { $_.Dispose() }
    $pinkBrush.Dispose()
    $blackBrush.Dispose()
    $graphics.Dispose()
    $bitmap.Dispose()
  }
}

Export-SparkIcon -Size 180 -FileName 'apple-touch-icon-v2.png'
Export-SparkIcon -Size 192 -FileName 'app-icon-192-v2.png'
Export-SparkIcon -Size 512 -FileName 'app-icon-512-v2.png'
