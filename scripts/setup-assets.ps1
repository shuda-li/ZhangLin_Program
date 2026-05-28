# 从 Zhanglin_Material 生成小程序本地 assets（图片在 .gitignore 中，克隆后需运行本脚本）
$root = Split-Path $PSScriptRoot -Parent
$mat = Join-Path $root "Zhanglin_Material\picture"
$img = Join-Path $root "assets\images"
$tab = Join-Path $root "assets\tabbar"
$ico = Join-Path $root "assets\icons"

if (-not (Test-Path $mat)) {
  Write-Error "找不到素材目录: $mat"
  exit 1
}

New-Item -ItemType Directory -Force -Path $img, $tab, $ico | Out-Null

$copyMap = @{
  "1.红头船.jpg" = "2.红头船.jpg"
  "2.古港遗址.jpg" = "8.樟林古港南粤古驿道纪念地.jpg"
  "3.古码头.jpg" = "6.新兴街古码头.jpg"
  "4.南盛里.jpg" = "14.南盛里.jpg"
  "red-ship.jpg" = "2.红头船.jpg"
  "tea.jpg" = "1.文化长廊.jpg"
  "food.jpg" = "4.天后宫广场.jpg"
  "model.jpg" = "2.红头船1.jpg"
  "bookmark.jpg" = "3.天后宫.jpg"
  "pottery.jpg" = "16.锡庆堂大门.jpg"
  "mosaic.jpg" = "19.山海雄镇庙.jpg"
}

foreach ($dst in $copyMap.Keys) {
  Copy-Item -LiteralPath (Join-Path $mat $copyMap[$dst]) -Destination (Join-Path $img $dst) -Force
}

Add-Type -AssemblyName System.Drawing

function Save-Icon($path, $size, $fillColor, $drawAction) {
  $bmp = New-Object System.Drawing.Bitmap $size, $size
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $g.Clear([System.Drawing.Color]::Transparent)
  & $drawAction $g $size $fillColor
  $g.Dispose()
  $bmp.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
  $bmp.Dispose()
}

function Compress-Image($path, $maxWidth = 1200, $quality = 75) {
  if ((Get-Item $path).Length -le 500000) { return }
  $img = [System.Drawing.Image]::FromFile($path)
  $w = $img.Width; $h = $img.Height
  if ($w -gt $maxWidth) { $nw = $maxWidth; $nh = [int]($h * $maxWidth / $w) } else { $nw = $w; $nh = $h }
  $bmp = New-Object System.Drawing.Bitmap $nw, $nh
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $g.DrawImage($img, 0, 0, $nw, $nh)
  $g.Dispose(); $img.Dispose()
  $codec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq 'image/jpeg' }
  $ep = New-Object System.Drawing.Imaging.EncoderParameters 1
  $ep.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter ([System.Drawing.Imaging.Encoder]::Quality), $quality
  $tmp = "$path.tmp"
  $bmp.Save($tmp, $codec, $ep)
  $bmp.Dispose()
  Move-Item -Force $tmp $path
}

$gray = [System.Drawing.Color]::FromArgb(255, 153, 153, 153)
$brown = [System.Drawing.Color]::FromArgb(255, 139, 58, 26)

# tabbar 与地图标记（简化图标，可后续替换为设计稿）
& {
  param($draw)
  Save-Icon (Join-Path $tab "home.png") 81 $gray $draw
  Save-Icon (Join-Path $tab "home-active.png") 81 $brown $draw
} { param($g,$s,$c)
  $brush = New-Object System.Drawing.SolidBrush $c
  $pts = @(
    (New-Object System.Drawing.PointF ($s*0.5), ($s*0.18)),
    (New-Object System.Drawing.PointF ($s*0.82), ($s*0.45)),
    (New-Object System.Drawing.PointF ($s*0.72), ($s*0.45)),
    (New-Object System.Drawing.PointF ($s*0.72), ($s*0.78)),
    (New-Object System.Drawing.PointF ($s*0.28), ($s*0.78)),
    (New-Object System.Drawing.PointF ($s*0.28), ($s*0.45)),
    (New-Object System.Drawing.PointF ($s*0.18), ($s*0.45))
  )
  $g.FillPolygon($brush, $pts); $brush.Dispose()
}

foreach ($name in @("guide","culture","specialty","profile")) {
  foreach ($suffix in @("", "-active")) {
    $color = if ($suffix) { $brown } else { $gray }
    $bmp = New-Object System.Drawing.Bitmap 81, 81
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.Clear([System.Drawing.Color]::Transparent)
    $brush = New-Object System.Drawing.SolidBrush $color
    $g.FillEllipse($brush, 20, 20, 41, 41)
    $brush.Dispose(); $g.Dispose()
    $bmp.Save((Join-Path $tab "$name$suffix.png"), [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()
  }
}

foreach ($name in @("ship","ruins","arcade","memory")) {
  $bmp = New-Object System.Drawing.Bitmap 48, 48
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.Clear([System.Drawing.Color]::Transparent)
  $brush = New-Object System.Drawing.SolidBrush $brown
  $g.FillEllipse($brush, 8, 4, 32, 32)
  $brush.Dispose(); $g.Dispose()
  $bmp.Save((Join-Path $ico "$name.png"), [System.Drawing.Imaging.ImageFormat]::Png)
  $bmp.Dispose()
}

Get-ChildItem $img -Filter *.jpg | ForEach-Object { Compress-Image $_.FullName }

Write-Host "assets 已生成: $root\assets"
