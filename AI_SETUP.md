# DeepSeek AI 系统部署

当前 App 采用：

- 健身数据：仅保存在当前设备本地
- Supabase：不再同步健身数据
- Supabase Auth：匿名登录，仅用于给 AI Edge Function 提供受保护身份
- AI 后端：Supabase Edge Function `fitness-ai`
- 模型：DeepSeek `deepseek-flash`
- API Key：直接在 App 内填写
- Key 存储：Supabase Vault

## 首次部署

仓库包含：

```
supabase/
  config.toml
  migrations/
    20260919_ai_vault.sql
  functions/
    fitness-ai/
      index.ts
```

先确保 Supabase 项目已开启 Anonymous Sign-ins。

然后执行：

```bash
npx supabase@latest login
npx supabase@latest link --project-ref YOUR_PROJECT_REF
npx supabase@latest db push
npx supabase@latest functions deploy fitness-ai --use-api
```

`db push` 创建 Vault 安全存储。
`functions deploy` 部署 AI 后端。

## App 的身份逻辑

App 启动时：

```
打开 PWA
  ↓
读取本机 localStorage 健身数据
  ↓
Supabase 自动 signInAnonymously()
  ↓
获得 authenticated JWT
  ↓
仅用于调用 fitness-ai
```

没有邮箱、验证码、账户登录或健身数据同步。

匿名身份保存在浏览器会话存储中。清除 Safari/PWA 网站数据、删除站点数据或更换设备后，匿名身份可能丢失，因此：

- 健身数据建议定期导出 JSON
- DeepSeek Key 丢失时重新在 App 内填写即可

## App 内配置 DeepSeek

进入：

```
设置 → 目标与数据 → AI 服务
```

粘贴 DeepSeek API Key，点击「保存并验证」。

流程：

```
App
  ↓ HTTPS
Supabase Edge Function
  ↓ DeepSeek /models 验证
Supabase Vault
  ↓ 加密保存到当前匿名用户
```

Key 不会写入：

- GitHub
- cloud-config.js
- 健身记录 JSON
- localStorage
- 普通业务表

## AI 功能

- AI 食物估算：照片 / 重量 / 备注 → C / P / F / kcal
- AI 今日简报
- AI 最近 7 天报告
- 单动作 AI 分析

确定性数据仍由网页计算：

- C / P / F 总量
- 热量
- 7 日均重
- 训练日数量
- e1RM

AI 只负责解释趋势和给出建议。
