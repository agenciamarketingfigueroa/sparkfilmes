Add-Type -AssemblyName System.Drawing

$ErrorActionPreference = 'Stop'
$scriptRoot = $PSScriptRoot
if ([string]::IsNullOrWhiteSpace($scriptRoot)) {
  $scriptRoot = Join-Path (Get-Location) 'campanha-black-friday'
}
$repoRoot = Split-Path -Parent $scriptRoot
$sourceDir = Join-Path $scriptRoot 'fontes'
$feedDir = Join-Path $scriptRoot 'feed'
$storyDir = Join-Path $scriptRoot 'stories'
$feedCleanDir = Join-Path $scriptRoot 'feed-clean'
$storyCleanDir = Join-Path $scriptRoot 'stories-clean'
$officialLogoPath = Join-Path $scriptRoot 'logo-oficial-horizontal.png'

[System.IO.Directory]::CreateDirectory($feedDir) | Out-Null
[System.IO.Directory]::CreateDirectory($storyDir) | Out-Null
[System.IO.Directory]::CreateDirectory($feedCleanDir) | Out-Null
[System.IO.Directory]::CreateDirectory($storyCleanDir) | Out-Null

$pink = [System.Drawing.Color]::FromArgb(255, 44, 88)
$paper = [System.Drawing.Color]::FromArgb(241, 240, 240)
$black = [System.Drawing.Color]::FromArgb(8, 8, 10)
$muted = [System.Drawing.Color]::FromArgb(205, 205, 212)

$ads = @(
  @{ File='01-planeje-agora.png'; Slug='01-planeje-agora'; Kicker='PRODUÇÃO DE CONTEÚDO | BLACK FRIDAY'; Lines=@('AINDA DÁ TEMPO','DE PRODUZIR SUA','BLACK FRIDAY.'); Pink=@(2); Sub='Conteúdo profissional para colocar sua campanha no ar.'; Cta='AGENDE SUA GRAVAÇÃO'; Focus=.58 },
  @{ File='02-improviso.png'; Slug='02-improviso'; Kicker='PRODUÇÃO DE CONTEÚDO | BLACK FRIDAY'; Lines=@('SUA CONCORRÊNCIA','JÁ ESTÁ','GRAVANDO.'); Pink=@(1,2); Sub='Não deixe sua produção de conteúdo para a última hora.'; Cta='GRAVE COM A SPARK'; Focus=.58 },
  @{ File='03-uma-diaria.png'; Slug='03-uma-diaria'; Kicker='PRODUÇÃO DE CONTEÚDO | BLACK FRIDAY'; Lines=@('UMA DIÁRIA.','SUA CAMPANHA','INTEIRA.'); Pink=@(1,2); Sub='Anúncios, reels e variações em uma só captação.'; Cta='MONTE SEU PACOTE'; Focus=.60 },
  @{ File='04-autoridade.png'; Slug='04-autoridade'; Kicker='PRODUÇÃO DE CONTEÚDO | BLACK FRIDAY'; Lines=@('A OPORTUNIDADE','É AGORA.','APAREÇA.'); Pink=@(1,2); Sub='Conteúdo profissional para transformar atenção em oportunidade.'; Cta='POSICIONE SUA MARCA'; Focus=.65 },
  @{ File='05-comercio.png'; Slug='05-comercio'; Kicker='PRODUÇÃO DE CONTEÚDO | BLACK FRIDAY'; Lines=@('SEM CONTEÚDO,','SUA OFERTA','NÃO CHEGA LONGE.'); Pink=@(2); Sub='Produção audiovisual para comércios, produtos e marcas locais.'; Cta='PRODUZA SUA CAMPANHA'; Focus=.64 },
  @{ File='06-beleza.png'; Slug='06-beleza'; Kicker='PRODUÇÃO DE CONTEÚDO | BLACK FRIDAY'; Lines=@('SEU CLIENTE','ESTÁ PRONTO.','SEU CONTEÚDO TAMBÉM?'); Pink=@(2); Sub='Grave agora o conteúdo que vai apresentar sua oferta.'; Cta='AGENDE SUA PRODUÇÃO'; Focus=.66 },
  @{ File='07-urgencia.png'; Slug='07-urgencia'; Kicker='PRODUÇÃO DE CONTEÚDO | BLACK FRIDAY'; Lines=@('NÃO DEIXE PARA','GRAVAR','NA ÚLTIMA HORA.'); Pink=@(2); Sub='Planejamento, captação e edição precisam de tempo.'; Cta='RESERVE SUA DATA'; Focus=.68 },
  @{ File='08-bastidores.png'; Slug='08-bastidores'; Kicker='PRODUÇÃO DE CONTEÚDO | BLACK FRIDAY'; Lines=@('QUEM GRAVA','ANTES, ANUNCIA','MELHOR.'); Pink=@(1,2); Sub='Produza sua campanha com tempo para testar seus criativos.'; Cta='COMECE AGORA'; Focus=.56 },
  @{ File='09-gastronomia.png'; Slug='09-gastronomia'; Kicker='PRODUÇÃO DE CONTEÚDO | BLACK FRIDAY'; Lines=@('BLACK FRIDAY É','OPORTUNIDADE','DE APARECER.'); Pink=@(1,2); Sub='Conteúdo audiovisual para colocar sua oferta diante do cliente.'; Cta='COLOQUE SUA MARCA EM CENA'; Focus=.61 },
  @{ File='10-marca-em-cena.png'; Slug='10-marca-em-cena'; Kicker='PRODUÇÃO DE CONTEÚDO | BLACK FRIDAY'; Lines=@('A OPORTUNIDADE','PASSA.','O CONTEÚDO FICA.'); Pink=@(1,2); Sub='Produza agora e use seus vídeos durante toda a campanha.'; Cta='PEÇA UM ORÇAMENTO'; Focus=.65 },
  @{ File='11-clean-consultora.png'; Slug='11-sua-oferta-vai-aparecer'; Theme='light'; Kicker='PRODUÇÃO DE CONTEÚDO | BLACK FRIDAY'; Lines=@('SUA OFERTA VAI','APARECER OU','PASSAR BATIDA?'); Pink=@(2); Sub='Produção de conteúdo para disputar atenção no momento certo.'; Cta='COLOQUE SUA MARCA EM CENA'; Focus=.56 },
  @{ File='12-clean-profissional.png'; Slug='12-prepare-antes'; Theme='light'; Kicker='PRODUÇÃO DE CONTEÚDO | BLACK FRIDAY'; Lines=@('QUEM SE PREPARA','ANTES, VENDE','COM MAIS CALMA.'); Pink=@(1,2); Sub='Grave seus conteúdos antes da correria da Black Friday.'; Cta='AGENDE SUA GRAVAÇÃO'; Focus=.56 },
  @{ File='13-clean-beleza.png'; Slug='13-nao-espere'; Theme='light'; Kicker='PRODUÇÃO DE CONTEÚDO | BLACK FRIDAY'; Lines=@('NÃO ESPERE A','BLACK FRIDAY','PARA COMEÇAR.'); Pink=@(1); Sub='Antecipe sua produção de conteúdo e chegue pronta para anunciar.'; Cta='COMECE SUA PRODUÇÃO'; Focus=.56 },
  @{ File='14-clean-comercio.png'; Slug='14-produto-precisa-ser-visto'; Theme='light'; Kicker='PRODUÇÃO DE CONTEÚDO | BLACK FRIDAY'; Lines=@('SEU PRODUTO','PRECISA SER','VISTO.'); Pink=@(2); Sub='Conteúdo profissional para valorizar sua oferta no feed.'; Cta='PRODUZA SUA CAMPANHA'; Focus=.56 },
  @{ File='15-clean-arquiteto.png'; Slug='15-autoridade-em-imagem'; Theme='light'; Kicker='PRODUÇÃO DE CONTEÚDO | BLACK FRIDAY'; Lines=@('SUA AUTORIDADE','TAMBÉM PRECISA','DE IMAGEM.'); Pink=@(2); Sub='Produção de conteúdo para profissionais que querem ser lembrados.'; Cta='GRAVE COM A SPARK'; Focus=.56 },
  @{ File='16-clean-fitness.png'; Slug='16-servico-merece-atencao'; Theme='light'; Kicker='PRODUÇÃO DE CONTEÚDO | BLACK FRIDAY'; Lines=@('SEU SERVIÇO','MERECE MAIS','ATENÇÃO.'); Pink=@(2); Sub='Vídeos profissionais para mostrar valor antes de falar em preço.'; Cta='APRESENTE SEU VALOR'; Focus=.56 },
  @{ File='17-clean-gastronomia.png'; Slug='17-antes-do-clique'; Theme='light'; Kicker='PRODUÇÃO DE CONTEÚDO | BLACK FRIDAY'; Lines=@('ANTES DO CLIQUE,','VEM A','VONTADE.'); Pink=@(2); Sub='Produção de conteúdo para transformar seu produto em desejo.'; Cta='GRAVE SUA OFERTA'; Focus=.56 },
  @{ File='18-clean-saude.png'; Slug='18-confianca-em-video'; Theme='light'; Kicker='PRODUÇÃO DE CONTEÚDO | BLACK FRIDAY'; Lines=@('CONFIANÇA TAMBÉM','SE CONSTRÓI','EM VÍDEO.'); Pink=@(2); Sub='Conteúdo profissional para explicar, orientar e gerar presença.'; Cta='FORTALEÇA SUA MARCA'; Focus=.56 },
  @{ File='19-clean-artesa.png'; Slug='19-grandes-campanhas'; Theme='light'; Kicker='PRODUÇÃO DE CONTEÚDO | BLACK FRIDAY'; Lines=@('PEQUENAS MARCAS','TAMBÉM FAZEM','GRANDES CAMPANHAS.'); Pink=@(2); Sub='Produção de conteúdo para valorizar o que torna seu negócio único.'; Cta='CONTE SUA HISTÓRIA'; Focus=.56 },
  @{ File='20-clean-prazo.png'; Slug='20-conteudo-pronto'; Theme='light'; Kicker='PRODUÇÃO DE CONTEÚDO | BLACK FRIDAY'; Lines=@('A DATA CHEGA.','SEU CONTEÚDO','ESTÁ PRONTO?'); Pink=@(1,2); Sub='Planeje, grave e edite antes da correria da Black Friday.'; Cta='RESERVE SUA DATA'; Focus=.50 }
)

function New-RoundedPath {
  param([float]$X,[float]$Y,[float]$Width,[float]$Height,[float]$Radius)
  $path = New-Object System.Drawing.Drawing2D.GraphicsPath
  $diameter = $Radius * 2
  $path.AddArc($X, $Y, $diameter, $diameter, 180, 90)
  $path.AddArc($X + $Width - $diameter, $Y, $diameter, $diameter, 270, 90)
  $path.AddArc($X + $Width - $diameter, $Y + $Height - $diameter, $diameter, $diameter, 0, 90)
  $path.AddArc($X, $Y + $Height - $diameter, $diameter, $diameter, 90, 90)
  $path.CloseFigure()
  return $path
}

function Draw-CoverImage {
  param($Graphics, $Image, [int]$Width, [int]$Height, [double]$Focus)
  $scale = [Math]::Max($Width / $Image.Width, $Height / $Image.Height)
  $drawWidth = [int][Math]::Ceiling($Image.Width * $scale)
  $drawHeight = [int][Math]::Ceiling($Image.Height * $scale)
  $drawX = [int](($Width - $drawWidth) * $Focus)
  $drawY = [int](($Height - $drawHeight) * .5)
  $Graphics.DrawImage($Image, $drawX, $drawY, $drawWidth, $drawHeight)
}

function Fit-Font {
  param($Graphics, [string]$Text, [string]$Family, [float]$StartSize, [float]$MinSize, [float]$MaxWidth, $Style)
  $size = $StartSize
  while ($size -gt $MinSize) {
    $font = New-Object System.Drawing.Font($Family, $size, $Style, [System.Drawing.GraphicsUnit]::Pixel)
    $measured = $Graphics.MeasureString($Text, $font, 2000, [System.Drawing.StringFormat]::GenericTypographic)
    if ($measured.Width -le $MaxWidth) { return $font }
    $font.Dispose()
    $size -= 2
  }
  return New-Object System.Drawing.Font($Family, $MinSize, $Style, [System.Drawing.GraphicsUnit]::Pixel)
}

function Draw-Creative {
  param($Ad, [ValidateSet('feed','story')]$Format)

  $width = 1080
  $height = if ($Format -eq 'feed') { 1080 } else { 1920 }
  $margin = if ($Format -eq 'feed') { 62 } else { 76 }
  $top = if ($Format -eq 'feed') { 58 } else { 92 }
  $contentTop = if ($Format -eq 'feed') { 250 } else { 405 }
  $headlineStart = if ($Format -eq 'feed') { 72 } else { 88 }
  $headlineMin = if ($Format -eq 'feed') { 50 } else { 62 }
  $lineHeightFactor = .94
  $textWidth = if ($Format -eq 'feed') { 760 } else { 860 }
  $footerBottom = if ($Format -eq 'feed') { 58 } else { 112 }
  $safeBottom = $height - $footerBottom
  $isClean = $Ad.Theme -eq 'light'

  $bitmap = New-Object System.Drawing.Bitmap($width, $height, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
  $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
  $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  $graphics.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit
  $graphics.Clear($black)

  $pinkBrushSolid = New-Object System.Drawing.SolidBrush($pink)
  $paperBrushSolid = New-Object System.Drawing.SolidBrush($paper)
  $blackBrushSolid = New-Object System.Drawing.SolidBrush($black)
  $whiteBrushSolid = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)
  $mutedBrushSolid = New-Object System.Drawing.SolidBrush($muted)
  $darkMutedBrushSolid = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(66, 66, 72))

  $source = [System.Drawing.Image]::FromFile((Join-Path $sourceDir $Ad.File))
  Draw-CoverImage $graphics $source $width $height $Ad.Focus

  $leftGradient = if ($isClean) {
    New-Object System.Drawing.Drawing2D.LinearGradientBrush(
      (New-Object System.Drawing.Point(0, 0)),
      (New-Object System.Drawing.Point([int]($width * .82), 0)),
      [System.Drawing.Color]::FromArgb(248, 250, 248, 245),
      [System.Drawing.Color]::FromArgb(115, 250, 248, 245)
    )
  } else {
    New-Object System.Drawing.Drawing2D.LinearGradientBrush(
      (New-Object System.Drawing.Point(0, 0)),
      (New-Object System.Drawing.Point([int]($width * .86), 0)),
      [System.Drawing.Color]::FromArgb(246, 5, 5, 7),
      [System.Drawing.Color]::FromArgb(20, 5, 5, 7)
    )
  }
  $graphics.FillRectangle($leftGradient, 0, 0, $width, $height)

  $bottomGradient = if ($isClean) {
    New-Object System.Drawing.Drawing2D.LinearGradientBrush(
      (New-Object System.Drawing.Point(0, [int]($height * .48))),
      (New-Object System.Drawing.Point(0, $height)),
      [System.Drawing.Color]::FromArgb(0, 250, 248, 245),
      [System.Drawing.Color]::FromArgb(220, 250, 248, 245)
    )
  } else {
    New-Object System.Drawing.Drawing2D.LinearGradientBrush(
      (New-Object System.Drawing.Point(0, [int]($height * .48))),
      (New-Object System.Drawing.Point(0, $height)),
      [System.Drawing.Color]::FromArgb(0, 5, 5, 7),
      [System.Drawing.Color]::FromArgb(242, 5, 5, 7)
    )
  }
  $graphics.FillRectangle($bottomGradient, 0, [int]($height * .48), $width, [int]($height * .52))

  for ($i=0; $i -lt 5; $i++) {
    $alpha = if ($isClean) { 7 - $i } else { 16 - ($i * 2) }
    $glowBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb($alpha, 255, 44, 88))
    $growth = $i * 55
    $graphics.FillEllipse($glowBrush, -260-$growth, $height-360-$growth, 760+($growth*2), 480+($growth*2))
    $glowBrush.Dispose()
  }

  $framePath = New-RoundedPath 34 34 ($width-68) ($height-68) 26
  $frameColor = if ($isClean) { [System.Drawing.Color]::FromArgb(46, 8, 8, 10) } else { [System.Drawing.Color]::FromArgb(55, 241, 240, 240) }
  $framePen = New-Object System.Drawing.Pen($frameColor, 2)
  $graphics.DrawPath($framePen, $framePath)
  $accentPen = New-Object System.Drawing.Pen($pink, 7)
  $accentPen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
  $accentPen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
  $graphics.DrawLine($accentPen, 35, 35, 143, 35)
  $graphics.DrawLine($accentPen, $width-143, $height-35, $width-35, $height-35)

  $logoW = if ($Format -eq 'feed') { 300 } else { 326 }
  $logoH = if ($Format -eq 'feed') { 84 } else { 92 }
  $logoPathShape = New-RoundedPath $margin $top $logoW $logoH 22
  $logoBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(248, 241, 240, 240))
  $graphics.FillPath($logoBrush, $logoPathShape)
  $officialLogo = [System.Drawing.Image]::FromFile($officialLogoPath)
  $graphics.DrawImage($officialLogo, $margin + 16, $top + 8, $logoW - 32, $logoH - 16)

  $badgeW = if ($Format -eq 'feed') { 250 } else { 280 }
  $badgeH = if ($Format -eq 'feed') { 54 } else { 60 }
  $badgeX = $width - $margin - $badgeW
  $badgeY = $top + [int](($logoH - $badgeH)/2)
  $badgePath = New-RoundedPath $badgeX $badgeY $badgeW $badgeH 27
  $badgeBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(180, 8, 8, 10))
  $badgePen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(80, 241, 240, 240), 2)
  $graphics.FillPath($badgeBrush, $badgePath)
  $graphics.DrawPath($badgePen, $badgePath)
  $badgeFont = New-Object System.Drawing.Font('Segoe UI', $(if($Format -eq 'feed'){18}else{20}), [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
  $badgeFormat = New-Object System.Drawing.StringFormat
  $badgeFormat.Alignment = [System.Drawing.StringAlignment]::Center
  $badgeFormat.LineAlignment = [System.Drawing.StringAlignment]::Center
  $graphics.DrawString('BLACK  FRIDAY', $badgeFont, $paperBrushSolid, (New-Object System.Drawing.RectangleF($badgeX,$badgeY,$badgeW,$badgeH)), $badgeFormat)
  $graphics.FillEllipse($pinkBrushSolid, $badgeX + $badgeW - 31, $badgeY + 22, 9, 9)

  $kickerY = $contentTop
  $graphics.FillRectangle($pinkBrushSolid, $margin, $kickerY + 9, 52, 5)
  $kickerFont = New-Object System.Drawing.Font('Segoe UI', $(if($Format -eq 'feed'){18}else{21}), [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
  $graphics.DrawString($Ad.Kicker, $kickerFont, $pinkBrushSolid, $margin + 70, $kickerY)

  $headlineY = $kickerY + $(if($Format -eq 'feed'){48}else{59})
  $lineFonts = New-Object System.Collections.Generic.List[System.Drawing.Font]
  foreach ($line in $Ad.Lines) {
    $font = Fit-Font $graphics $line 'Arial' $headlineStart $headlineMin $textWidth ([System.Drawing.FontStyle]::Bold)
    $lineFonts.Add($font)
  }
  foreach ($lineIndex in 0..($Ad.Lines.Count-1)) {
    $font = $lineFonts[$lineIndex]
    $brushColor = if ($Ad.Pink -contains $lineIndex) { $pink } elseif ($isClean) { $black } else { $paper }
    $lineBrush = New-Object System.Drawing.SolidBrush($brushColor)
    $graphics.DrawString($Ad.Lines[$lineIndex], $font, $lineBrush, $margin, $headlineY, [System.Drawing.StringFormat]::GenericTypographic)
    $headlineY += [int]($font.Size * $lineHeightFactor)
    $lineBrush.Dispose()
  }

  $subY = $headlineY + $(if($Format -eq 'feed'){27}else{38})
  $subFont = New-Object System.Drawing.Font('Segoe UI', $(if($Format -eq 'feed'){28}else{34}), [System.Drawing.FontStyle]::Regular, [System.Drawing.GraphicsUnit]::Pixel)
  $subFormat = New-Object System.Drawing.StringFormat
  $subFormat.Trimming = [System.Drawing.StringTrimming]::Word
  $subRect = New-Object System.Drawing.RectangleF($margin, $subY, $(if($Format -eq 'feed'){680}else{760}), 155)
  $subBrush = if ($isClean) { $blackBrushSolid } else { $paperBrushSolid }
  $graphics.DrawString($Ad.Sub, $subFont, $subBrush, $subRect, $subFormat)

  $ctaFont = New-Object System.Drawing.Font('Segoe UI', $(if($Format -eq 'feed'){18}else{21}), [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
  $ctaMeasure = $graphics.MeasureString($Ad.Cta + '  →', $ctaFont)
  $ctaW = [int]$ctaMeasure.Width + 42
  $ctaH = if ($Format -eq 'feed') { 62 } else { 72 }
  $ctaY = $safeBottom - $ctaH
  $ctaPath = New-RoundedPath $margin $ctaY $ctaW $ctaH 14
  $graphics.FillPath($pinkBrushSolid, $ctaPath)
  $ctaTextFormat = New-Object System.Drawing.StringFormat
  $ctaTextFormat.Alignment = [System.Drawing.StringAlignment]::Center
  $ctaTextFormat.LineAlignment = [System.Drawing.StringAlignment]::Center
  $graphics.DrawString($Ad.Cta + '  →', $ctaFont, $whiteBrushSolid, (New-Object System.Drawing.RectangleF($margin,$ctaY,$ctaW,$ctaH)), $ctaTextFormat)

  $siteFont = New-Object System.Drawing.Font('Segoe UI', $(if($Format -eq 'feed'){18}else{21}), [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
  $siteText = 'sparkfilmes.com.br'
  $siteMeasure = $graphics.MeasureString($siteText, $siteFont)
  $siteBrush = if ($isClean) { $darkMutedBrushSolid } else { $mutedBrushSolid }
  $graphics.DrawString($siteText, $siteFont, $siteBrush, $width - $margin - $siteMeasure.Width, $ctaY + (($ctaH - $siteMeasure.Height)/2))

  $outDir = if ($isClean) {
    if ($Format -eq 'feed') { $feedCleanDir } else { $storyCleanDir }
  } else {
    if ($Format -eq 'feed') { $feedDir } else { $storyDir }
  }
  $suffix = if ($Format -eq 'feed') { 'feed-1080x1080' } else { 'stories-1080x1920' }
  $output = Join-Path $outDir ($Ad.Slug + '-' + $suffix + '.png')
  $bitmap.Save($output, [System.Drawing.Imaging.ImageFormat]::Png)

  foreach ($font in $lineFonts) { $font.Dispose() }
  $source.Dispose(); $officialLogo.Dispose(); $graphics.Dispose(); $bitmap.Dispose()
  $pinkBrushSolid.Dispose(); $paperBrushSolid.Dispose(); $blackBrushSolid.Dispose(); $whiteBrushSolid.Dispose(); $mutedBrushSolid.Dispose(); $darkMutedBrushSolid.Dispose()
  $leftGradient.Dispose(); $bottomGradient.Dispose(); $framePath.Dispose(); $framePen.Dispose(); $accentPen.Dispose()
  $logoPathShape.Dispose(); $logoBrush.Dispose(); $badgePath.Dispose(); $badgeBrush.Dispose(); $badgePen.Dispose(); $badgeFont.Dispose()
  $kickerFont.Dispose(); $subFont.Dispose(); $ctaFont.Dispose(); $ctaPath.Dispose(); $siteFont.Dispose()
  return $output
}

$outputs = @()
foreach ($ad in $ads) {
  $outputs += Draw-Creative $ad 'feed'
  $outputs += Draw-Creative $ad 'story'
  [GC]::Collect()
  [GC]::WaitForPendingFinalizers()
}

$outputs | ForEach-Object { Write-Output $_ }
