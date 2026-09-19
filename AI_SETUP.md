# DeepSeek AI 系统部署

本项目的 AI 功能采用：

- 前端：`ai-system.js`
- 后端：Supabase Edge Function `fitness-ai`
- 模型：DeepSeek `deepseek-flash`
- Secret：`DEEPSEEK_API_KEY`

## 1. 创建 DeepSeek API Key

在 DeepSeek 开放平台创建 API Key，并确保账户有可用余额。

不要把 Key 写进：

- `cloud-config.js`
- `ai-system.js`
- GitHub 仓库
- 浏览器 LocalStorage

## 2. 把 Key 放进 Supabase Secret

在当前 Supabase 项目 Dashboard 中进入 Edge Functions 的 Secrets 管理，添加：

```
DEEPSEEK_API_KEY=你的 DeepSeek API Key
```

Secret 保存后不需要重新部署函数。

## 3. 部署 Edge Function

仓库已经包含：

```
supabase/
  config.toml
  functions/
    fitness-ai/
      index.ts
```

推荐使用 Supabase CLI：

```bash
npx supabase@latest login
npx supabase@latest link --project-ref YOUR_PROJECT_REF
npx supabase@latest functions deploy fitness-ai --use-api
```

也可以先设置 Secret：

```bash
npx supabase@latest secrets set DEEPSEEK_API_KEY=YOUR_KEY
```

不要把包含真实 Key 的 `.env` 提交到 GitHub。

## 4. 在 App 中测试

1. 打开网页 App。
2. 确认已经使用邮箱验证码登录 Supabase。
3. 进入「目标与数据」。
4. 找到「AI 服务」。
5. 点击「测试 AI 连接」。

显示：

```
DeepSeek deepseek-flash · 已连接
```

说明 AI 后端已经就绪。

## 已实现功能

### AI 食物估算

「记录食物」中选择「AI 估算这顿饭」：

- 拍照或从相册选择
- 可填写已知总重量
- 可填写备注，例如「鸡皮没吃、汤汁没有拌饭」
- DeepSeek 返回整顿 C / P / F / kcal
- 结果可手动修改
- 点击「填入饮食记录」
- 最终仍由用户确认后保存

照片会在浏览器端压缩后发送，API Key 不会发送到浏览器。

### AI 今日简报

首页「AI 分析 → 今日简报」。

程序先整理：

- 今日饮食
- C / P / F 目标与实际
- 今日训练
- 晨重
- 最近 7 天体重上下文

再交给 AI 解释。

### AI 最近 7 天报告

首页「AI 分析 → 最近7天」。

程序会比较：

- 最近 7 天 vs 前 7 天均重
- 宏量营养平均值
- 饮食记录完整度
- 训练日数量
- 每天训练和饮食数据

### 单动作 AI 分析

「我的进度 → 力量进度」中的每个动作会出现「AI 分析」。

传给 AI 的数据包括最近最多 10 次：

- 重量
- 次数
- RIR
- 估算 1RM

## 数据边界

AI 只负责解释与建议。

以下内容由网页代码自己计算：

- C / P / F 总量
- 热量
- 7 日均重
- 训练日数量
- e1RM

AI 不会自动修改饮食目标、训练计划或历史记录。
