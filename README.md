# KFCV50 下载中心

ChatGPT 与 FlClash 安装包下载页。静态前端托管在 Cloudflare Pages，安装包放在 R2，通过 `files.kfcv50.today` 分发。页面地址为 `download.kfcv50.today`。

## 本地结构

- `site/`：可直接部署的静态网站
- `scripts/generate_manifest.py`：读取本地安装包，校验 FlClash 官方 SHA-256，并生成页面数据
- `packages/flclash/`：FlClash 官方 Release 附件的本地暂存目录，不进入 Git
- ChatGPT 文件从 `~/Downloads/chatgpt-installers` 读取，不进入 Git

## 更新安装包

1. 从 [FlClash 官方 Releases](https://github.com/chen08209/FlClash/releases) 下载同一版本的全部附件和 `SHA256SUMS`，放入 `packages/flclash/`。
2. 将 ChatGPT 文件放在 `~/Downloads/chatgpt-installers/`，按需更新 `scripts/generate_manifest.py` 中的文件描述。
3. 运行 `python3 scripts/generate_manifest.py`。该脚本会验证 FlClash 官方发布页的校验值，并计算本站列出的每个镜像文件的 SHA-256。
4. 将文件上传到 R2 的 `chatgpt/` 和 `flclash/` 路径，保持与 `site/data/packages.json` 的 URL 一致，然后部署 `site/` 到 Pages。

> Android 的 ChatGPT 单 APK 经过本地转换与调试证书重签。它不能覆盖安装 Play 版，也不会由 Google Play 自动更新。页面明确展示这一点；原始签名版本以 APKM 格式另列。

## 本地预览

```sh
python3 -m http.server 8080 --directory site
```

访问 http://localhost:8080。

## 部署配置

Cloudflare Pages 项目名：`download-kfcv50`，部署目录：`site`。
R2 bucket：`kfcv50-downloads`，公开自定义域名：`files.kfcv50.today`。
Pages 自定义域名：`download.kfcv50.today`。

Cloudflare API 凭证仅从本机 Wrangler 登录或环境变量获取，不存放在本仓库。
