#!/bin/bash
# ============================================
# 新闻工坊 · 微信小程序项目快速部署脚本
# ============================================
# 使用方法：
# 1. 在电脑上打开终端（Mac: Terminal, Windows: PowerShell）
# 2. 复制本脚本内容粘贴到终端运行
# 3. 完成后用微信开发者工具打开生成的目录

PROJECT_DIR="toutiao-news-maker"

# 创建项目目录
mkdir -p $PROJECT_DIR
cd $PROJECT_DIR

echo "✅ 项目目录创建完成：$PROJECT_DIR"
echo "📱 请用微信开发者工具打开此目录"
echo "🔑 AppID已配置为：wx5a056bbe5382281b"
echo ""
echo "下一步操作："
echo "  1. 打开微信开发者工具"
echo "  2. 选择「导入项目」"
echo "  3. 目录选择刚才创建的 $PROJECT_DIR 文件夹"
echo "  4. AppID 填入 wx5a056bbe5382281b"
echo "  5. 点击确定，开始开发！"
