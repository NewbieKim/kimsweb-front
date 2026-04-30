# SFX 音效资源说明

`useAzureTTS` 会优先播放以下本地音效文件：

- `bubble.mp3`：泡泡/咕噜类音效
- `wind.mp3`：风声类音效
- `rain.mp3`：雨声类音效
- `white-noise.mp3`：白噪音
- `magic-chime.mp3`：默认兜底音效

如果文件不存在，播放器会自动回退到 WebAudio 合成音效，不影响故事继续播放。

