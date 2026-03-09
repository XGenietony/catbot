# 隐私说明

## 数据存储
所有记忆数据存储在本地 SQLite 数据库中。

## Embeddings
- 如果使用 OpenAI: 文本会发送到 OpenAI 生成向量，但向量存储在本地
- 如果使用 Ollama: 完全本地处理，不联网

## 会话历史
所有对话都保存在 workspace/sessions/ 目录。
