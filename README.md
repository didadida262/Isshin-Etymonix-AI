# 韦林英文词根轰炸

基于 **React + TypeScript + Vite + Tailwind CSS + Framer Motion** 的英语词根学习应用，右下角集成离线语音识别浮动卡片。

## ✨ 特性

- 🎨 精美 UI：现代化设计，暗色主题
- ⚡ 60fps 流畅动画体验
- 📦 完全 TypeScript 支持
- 🎙️ 离线语音识别（Whisper large-v3-turbo，MPS 加速）

## 启动方式

项目分两个服务，需分别在两个终端启动。

### 终端 1 — Python 语音识别后端

```bash
cd server
source venv/bin/activate
python3 main.py
```

看到以下输出即表示就绪：

```
[Whisper] 推理设备: mps
[Whisper] 模型加载完成 ✓
INFO: Uvicorn running on http://0.0.0.0:8000
```

> **首次使用须知**
> 1. 需先安装 ffmpeg：`brew install ffmpeg`
> 2. 需先创建虚拟环境并安装依赖：
>    ```bash
>    cd server
>    python3 -m venv venv
>    source venv/bin/activate
>    pip3 install -r requirements.txt
>    ```

### 终端 2 — 前端

```bash
yarn dev
```

浏览器打开 `http://localhost:5173`，页面右下角语音识别卡片会自动请求麦克风权限并开始持续监听，说话停顿后自动识别并显示文字。

## 目录结构

```
├── src/
│   ├── components/
│   │   └── VoiceCard.tsx     # 语音识别浮动卡片
│   ├── pages/                # 页面组件
│   ├── data/                 # 词根数据
│   └── lib/                  # 工具函数
├── server/
│   ├── main.py               # FastAPI + Whisper 后端
│   ├── requirements.txt      # Python 依赖
│   └── venv/                 # Python 虚拟环境（本地，不提交）
└── docker-compose.yml        # 可选：Docker 启动后端
```

## 语音识别模型

- 模型：`whisper-large-v3-turbo`（本地 HuggingFace 格式）
- 路径：`~/Desktop/work/whisper-large-v3-turbo`
- 推理设备：Apple M 系列芯片自动启用 MPS 加速

切换模型路径：

```bash
WHISPER_MODEL_PATH=/your/model/path python3 main.py
```

## 构建

```bash
yarn build        # 构建前端
yarn build:check  # TypeScript 类型检查
yarn preview      # 预览构建产物
```
