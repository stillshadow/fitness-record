# DeepSeek AI 系统部署

当前 AI 架构：

- 前端：`ai-system.js`
- 后端：Supabase Edge Function `fitness-ai`
- 模型：DeepSeek `deepseek-flash`
- API Key：可直接在 App 内填写
- 安全存储：Supabase Vault

## 首次部署

仓库已经包含：

```
supabase/
  config.toml
  migrations/
    20260919_ai_vault.sql
  functions/
    fitness-ai/
      index.ts
```

在项目目录执行：

```bash
npx supabase@latest login
npx supabase@latest link --project-ref YOUR_PROJECT_REF
npx supabase@latest db push
npx supabase@latest functions deploy fitness-ai --use-api
```

其中：

- `db push` 创建 AI Key 的 Vault 安全存储和只允许后端访问的 RPC。
- `functions deploy` 部署 AI 调用后端。
- 不需要把 DeepSeek Key 写进 Supabase Secret。
- 旧的 `DEEPSEEK_API_KEY` Secret 仍然可以作为兼容兜底，但不是必须。

## 在 App 内配置 DeepSeek

首次部署完成后：

1. 打开网页 App。
2. 确认已经登录 Supabase。
3. 进入「目标与数据」。
4. 找到「AI 服务」。
5. 在「DeepSeek API Key」中粘贴 Key。
6. 点击「保存并验证」。

保存流程：

```
App
  ↓ HTTPS
Supabase Edge Function
  ↓ 先请求 DeepSeek /models 验证
Supabase Vault
  ↓ 加密保存
后续 AI 请求按当前 Supabase 用户读取
```

Key 不会：

- 写进 GitHub
- 写进 `cloud-config.js`
- 写进 `localStorage`
- 回显到网页
- 存进普通健身数据 JSON

App 中也可以：

- 测试连接
- 更新 Key
- 移除 Key

## 已实现 AI 功能

### AI 食物估算

「记录食物 → AI 估算这顿饭」

输入：

- 照片 / 相册图片
- 已知总重量
- 文字备注，例如「鸡皮没吃、汤汁没有拌饭」

返回：

- 食物名称
- C / P / F
- kcal
- 估算重量
- 置信度
- 主要假设

结果先进入确认页，可以手动改，再填入饮食记录。

### AI 今日简报

程序先整理：

- 今日饮食
- C / P / F 目标与实际
- 今日训练
- 晨重
- 最近体重上下文

DeepSeek 只负责解释。

### AI 最近 7 天报告

比较：

- 最近 7 天 vs 前 7 天均重
- C / P / F 平均值
- 饮食记录完整度
- 训练日数量
- 每日训练和饮食数据

### 单动作 AI 分析

「我的进度 → 力量进度 → AI 分析」

最近最多 10 次：

- 重量
- 次数
- RIR
- 估算 1RM

## 计算边界

以下数据由网页自己计算，不交给模型瞎算：

- C / P / F 总量
- 热量
- 7 日均重
- 训练日数量
- e1RM

AI 负责解释趋势、指出值得关注的问题和给出保守建议。

AI 不会自动修改你的饮食目标、训练计划或历史记录。
