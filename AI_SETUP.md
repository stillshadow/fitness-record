# DeepSeek AI 系统

当前 App 已经完全与 Supabase 解耦。

## 数据存储

- 训练、饮食、体重：只存在当前设备的 localStorage
- 不做云同步
- 不需要账号、邮箱、验证码
- 需要备份时使用 App 内「导出 JSON」
- 恢复时使用「导入 JSON」

## AI 调用

AI 由浏览器直接请求 DeepSeek 官方 API：

```
PWA
  ↓
https://api.deepseek.com/responses
  ↓
deepseek-flash
```

当前 AI 功能：

- AI 食物估算
- AI 今日简报
- AI 最近 7 天报告
- 单动作 AI 分析

DeepSeek Responses API 支持 `deepseek-flash`、图片输入和结构化 JSON 输出。

## 配置 API Key

有两种方式。

### 方式一：直接在 App 里填

进入：

```
设置 → 目标与数据 → AI 服务
```

粘贴 DeepSeek API Key，点击「保存并验证」。

Key 保存到当前设备：

```
localStorage: chibianyingDeepSeekApiKey
```

不会进入你的健身数据 JSON。

### 方式二：直接写进 GitHub

编辑：

```
deepseek-config.js
```

填入：

```js
window.DEEPSEEK_CONFIG = {
  apiKey: "你的 DeepSeek API Key"
};
```

App 内保存的 Key 优先级高于 GitHub 配置。

注意：如果仓库是公开的，把真实 Key 写进 GitHub 意味着任何看到仓库的人都可以使用这个 Key，并消耗你的 API 余额。仅在你明确接受这个风险时使用。

## AI 食物估算

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

结果可以手动修改，再填入饮食记录。

## AI 分析

### 今日简报

整理：

- 今日饮食
- C / P / F 目标与实际
- 今日训练
- 晨重
- 最近体重上下文

### 最近 7 天报告

比较：

- 最近 7 天 vs 前 7 天均重
- 宏量营养平均值
- 饮食记录完整度
- 训练日数量

### 单动作分析

最近最多 10 次：

- 重量
- 次数
- RIR
- 估算 1RM

## 计算边界

以下数据由网页自己计算：

- C / P / F 总量
- 热量
- 7 日均重
- 训练日数量
- e1RM

AI 只负责解释趋势和给出建议。

## 浏览器直连说明

DeepSeek API 当前对浏览器请求提供 CORS 支持，但如果未来官方调整跨域策略，直连可能受到影响。届时可以再加一个极薄的代理层，不需要恢复 Supabase 数据同步。
