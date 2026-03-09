#!/bin/bash

# Memory Search 验证脚本
# 用于检查 Memory Search 是否正常工作

echo "🔍 Memory Search 验证工具"
echo "========================="
echo ""

# 检查 workspace 目录
echo "📁 检查 workspace 目录..."
if [ -d "workspace" ]; then
    echo "✅ workspace/ 存在"
else
    echo "❌ workspace/ 不存在"
    exit 1
fi

# 检查 memory 目录
if [ -d "workspace/memory" ]; then
    echo "✅ workspace/memory/ 存在"

    # 统计 memory 文件数量
    md_count=$(find workspace/memory -name "*.md" | wc -l | tr -d ' ')
    txt_count=$(find workspace/memory -name "*.txt" | wc -l | tr -d ' ')
    echo "   - Memory 文件: ${md_count} .md, ${txt_count} .txt"
else
    echo "⚠️  workspace/memory/ 不存在"
fi

# 检查 SQLite 数据库
echo ""
echo "🗄️  检查数据库文件..."
sqlite_files=$(find workspace -name "*.sqlite" 2>/dev/null)
if [ -z "$sqlite_files" ]; then
    echo "❌ 没有找到 .sqlite 文件"
    echo ""
    echo "💡 数据库文件尚未生成，可能的原因："
    echo "   1. 应用还没有运行"
    echo "   2. 还没有发送过消息"
    echo "   3. Memory Search 初始化失败"
    echo ""
    echo "📋 下一步："
    echo "   1. 运行: pnpm dev"
    echo "   2. 在应用中发送一条消息"
    echo "   3. 再次运行此脚本验证"
else
    echo "✅ 找到数据库文件:"
    for file in $sqlite_files; do
        size=$(ls -lh "$file" | awk '{print $5}')
        echo "   - $file ($size)"

        # 检查是否安装了 sqlite3
        if command -v sqlite3 &> /dev/null; then
            # 查看表
            tables=$(sqlite3 "$file" ".tables" 2>/dev/null)
            echo "     表: $tables"

            # 查看 chunks 数量
            chunk_count=$(sqlite3 "$file" "SELECT COUNT(*) FROM chunks;" 2>/dev/null)
            echo "     已索引: $chunk_count 个 chunks"

            # 查看数据源
            sources=$(sqlite3 "$file" "SELECT DISTINCT source_type FROM chunks;" 2>/dev/null | tr '\n' ', ' | sed 's/,$//')
            if [ -n "$sources" ]; then
                echo "     数据源: $sources"
            fi
        else
            echo "     (安装 sqlite3 可查看更多详情: brew install sqlite3)"
        fi
    done
fi

# 检查 sessions 目录
echo ""
echo "💬 检查会话历史..."
if [ -d "workspace/sessions" ]; then
    echo "✅ workspace/sessions/ 存在"
    session_count=$(find workspace/sessions -name "*.jsonl" | wc -l | tr -d ' ')
    echo "   - 会话数量: $session_count"

    if [ $session_count -gt 0 ]; then
        for session in workspace/sessions/*.jsonl; do
            msg_count=$(wc -l < "$session" | tr -d ' ')
            basename=$(basename "$session")
            echo "   - $basename: $msg_count 条消息"
        done
    fi
else
    echo "⚠️  workspace/sessions/ 不存在"
    echo "   (首次发送消息后会自动创建)"
fi

# 检查配置文件
echo ""
echo "⚙️  检查配置..."
if [ -f "workspace/catbot.json" ]; then
    echo "✅ workspace/catbot.json 存在"

    # 检查 API Key（隐藏实际值）
    if grep -q '"apiKey"' workspace/catbot.json; then
        api_key=$(grep '"apiKey"' workspace/catbot.json | sed 's/.*"apiKey": "\(.*\)".*/\1/')
        if [ -n "$api_key" ] && [ "$api_key" != "" ]; then
            masked_key="${api_key:0:7}...${api_key: -4}"
            echo "   - API Key: $masked_key"
        else
            echo "   - API Key: (未配置)"
        fi
    fi
else
    echo "⚠️  workspace/catbot.json 不存在"
    echo "   (首次运行应用后会自动创建)"
fi

# 检查编译输出
echo ""
echo "🔧 检查编译状态..."
if [ -f "out/main/index.js" ]; then
    echo "✅ 项目已编译"
    build_time=$(stat -f "%Sm" -t "%Y-%m-%d %H:%M:%S" out/main/index.js 2>/dev/null || stat -c "%y" out/main/index.js 2>/dev/null | cut -d'.' -f1)
    echo "   - 编译时间: $build_time"
else
    echo "❌ 项目未编译"
    echo "   运行: pnpm build"
fi

# 总结
echo ""
echo "========================="
echo "📊 验证总结"
echo "========================="

# 判断状态
if [ -n "$sqlite_files" ] && [ -d "workspace/sessions" ]; then
    echo "✅ Memory Search 正常工作！"
    echo ""
    echo "💡 提示："
    echo "   - 数据库已创建并有数据"
    echo "   - 会话历史正常记录"
    echo "   - 可以进行记忆搜索"
elif [ ! -d "workspace/sessions" ]; then
    echo "⚠️  应用可能还没有运行过"
    echo ""
    echo "📋 请执行以下步骤："
    echo "   1. 运行: pnpm dev"
    echo "   2. 在应用中发送一条消息（如：你好）"
    echo "   3. 再次运行此脚本: ./verify-memory.sh"
else
    echo "⚠️  Memory Search 尚未初始化"
    echo ""
    echo "📋 可能的原因："
    echo "   - 还没有发送过消息"
    echo "   - Memory Search 初始化失败（查看日志）"
    echo "   - API Key 未配置"
fi

echo ""
