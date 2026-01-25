+++
date = '2026-01-25T15:37:56+08:00'
draft = False
title = '这是一份Vercel 部署配置攻略。'
tags = ["deploy", "vercel"]
+++
Vercel 是目前体验最好的静态网站托管平台，**免费、速度快、自动配置 HTTPS、支持全球 CDN**。最重要的是，它和 GitHub 配合得天衣无缝。

---

# 🚀 Vercel 部署全攻略 (从 0 到上线)

## 0. 准备工作
在开始之前，请确保完成以下两点：
1.  你的博客代码（Hugo 或 VitePress）已经上传到了 **GitHub 仓库**。
2.  你的 GitHub 仓库里不仅有 `.md` 文件，还有配置文件（如 `hugo.toml` 或 `package.json`）。

---

## 1. 注册与连接
1.  打开官网：[https://vercel.com/](https://vercel.com/)
2.  点击右上角 **Sign Up**。
3.  **关键一步：** 选择 **"Continue with GitHub"**。这样 Vercel 就能直接读取你的代码仓库，免去后续鉴权的麻烦。

---

## 2. 导入项目 (Import Project)
登录成功后，你会进入 Dashboard（控制台）。

1.  点击页面右侧的 **"Add New..."** 按钮，选择 **"Project"**。
2.  左侧会显示 "Import Git Repository"。
3.  在列表中找到你的博客仓库（例如 `my-blog`），点击右侧的 **Import** 按钮。

---

## 3. 核心配置 (最重要的一步)

点击 Import 后，会进入 **Configure Project** 页面。这里决定了你的博客能不能跑起来。

Vercel 非常智能，通常会自动识别框架。但为了保险，请核对以下设置：

### 🅰️ 如果你是 Hugo 博客
*   **Framework Preset（框架预设）**: 确保选了 `Hugo`。
*   **Root Directory**: 保持默认 `./` (除非你的博客在子文件夹里)。
*   **Build and Output Settings（构建与输出设置）**:
    *   **Build Command**: 默认是 `hugo`。建议改为：`hugo --gc --minify` (这会优化代码，让网站加载更快)。
    *   **Output Directory**: 默认为 `public` (不要动)。
*   **Environment Variables（环境变量）⚠️ 高级技巧**:
    *   有些 Hugo 主题比较新，需要新版 Hugo。建议展开这一栏，添加一个变量：
    *   Name: `HUGO_VERSION`
    *   Value: `0.119.0` (或者更新的版本号，防止版本过低报错)。

### 🅱️ 如果你是 VitePress 博客
*   **Framework Preset**: Vercel 可能识别为 `Vite` 或 `Other`。
*   **Build and Output Settings**:
    *   **Build Command**: 填写 `npm run docs:build` (或者是 `yarn docs:build`)。确保你 `package.json` 里有这个 script。
    *   **Output Directory**: 这是一个坑点！VitePress 默认输出在 `.vitepress/dist`。
        *   请手动修改为：`docs/.vitepress/dist` (取决于你的 docs 文件夹在哪)。
*   **Install Command**: `npm install` (默认即可)。

---

## 4. 点击部署 (Deploy)

配置确认无误后，点击大大的蓝色按钮 **Deploy**。

*   屏幕会变成构建日志界面。
*   等待约 30秒 - 1分钟。
*   如果看到满屏的彩带 confetti 🎉，恭喜你，**你的博客上线了！**
*   点击预览图，即可访问 Vercel 赠送给你的域名（通常是 `项目名.vercel.app`）。

---

## 5. 绑定自定义域名 (可选，但强烈推荐)

Vercel 送的域名有点丑，如果你买了域名（比如 `zhangsan.com`），绑定非常简单：

1.  在 Vercel 项目主页，点击顶部的 **Settings** -> **Domains**。
2.  在输入框填入你的域名（例如 `blog.zhangsan.com`），点击 **Add**。
3.  Vercel 会弹出一个提示，告诉你去你的域名服务商（阿里云/腾讯云/GoDaddy）添加记录。
    *   通常是添加一条 **CNAME** 记录。
    *   **主机记录**: `blog`
    *   **记录值**: `cname.vercel-dns.com`
4.  添加完后，回到 Vercel 页面等待几分钟，只要两个勾变成绿色，HTTPS 就自动配置好了。

---

## 6. 日常维护 (GitOps)

配置完上面这一堆之后，**你再也不用登录 Vercel 了**。

以后你的日常流程就是：
1.  在本地电脑写 Markdown。
2.  `git push` 到 GitHub。
3.  Vercel 监听到 GitHub 变动 -> 自动拉取 -> 自动构建 -> 自动发布。

---

## 🛑 常见报错与避坑

**Q1: Build Failed: command not found: hugo**
*   **原因**: 没选对 Framework Preset。
*   **解决**: 去 Settings -> Build & Development，把 Framework Preset 改回 Hugo。

**Q2: 页面 404 或者样式全乱了**
*   **原因**: 这里通常是 `baseURL` 的问题。
*   **解决**: 检查你的 `hugo.toml` 或 `config.js`，里面的 `baseURL` 要改成你现在的实际域名（比如 `https://你的博客.vercel.app/`），结尾记得带斜杠。

**Q3: Hugo 报错 "function not found"**
*   **原因**: Vercel 默认的 Hugo 版本太老。
*   **解决**: 按第 3 步的方法，添加环境变量 `HUGO_VERSION`，值设为 `extended_0.120.0` (加上 extended 更好，支持 SCSS)。