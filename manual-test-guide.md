# 🧪 Manual Testing Guide - Supabase Integration

## 前端已成功迁移到 Supabase！

### ✅ 已完成的更改：

1. **环境变量配置** - 指向新的 Supabase Edge Functions
2. **API 端点更新** - 所有端点已更新为新格式
3. **认证流程** - 使用新的 `/auth-wallet-verify` 端点
4. **响应格式处理** - 适配 `{success, data}` 结构

### 🔧 开发服务器

服务器正在运行：http://localhost:3000

### 📱 手动测试步骤：

#### 1. 测试登录流程
1. 打开浏览器访问 http://localhost:3000
2. 点击 "Connect Wallet" 或 "Sign In" 按钮
3. 使用 MetaMask 或其他钱包连接
4. 签名消息格式应该是：
   ```
   Welcome to ROZO Points!
   
   Please sign this message to verify your wallet.
   
   Nonce: [timestamp]
   ```
5. 签名后应该成功登录

#### 2. 验证数据显示
登录成功后，检查：
- **Points 显示** - 应该显示用户的 ROZO 积分
- **Credits 显示** - 应该显示用户的 Credits 余额
- **用户地址** - 显示正确的钱包地址

#### 3. 测试 API 调用
打开浏览器控制台 (F12)，查看网络请求：
- 应该看到对 `https://eslabobvkchgpokxszwv.supabase.co/functions/v1/` 的请求
- 主要端点：
  - `auth-wallet-verify` - 登录验证
  - `points-balance` - 获取积分余额
  - `banana-credits-balance` - 获取 Credits 余额
  - `user-profile` - 获取用户资料

#### 4. 测试页面导航
- 访问 `/history` 页面 - 查看历史记录
- 访问 `/generate` 页面 - 图片生成
- 访问 `/recharge` 页面 - 充值页面

### 🐛 调试提示：

1. **查看控制台日志**
   - 打开浏览器控制台 (F12)
   - 查看 Console 标签页
   - 寻找以下日志：
     - `[authAPI]` - 认证相关
     - `[BananaAPI]` - Banana 后端调用
     - `[PointsAPI]` - Points 服务调用
     - `[useAuth]` - 认证钩子
     - `[MobileDashboard]` - 仪表板组件

2. **查看网络请求**
   - 在开发者工具中查看 Network 标签
   - 筛选 XHR/Fetch 请求
   - 检查请求和响应的详细信息

3. **检查 LocalStorage**
   - 在 Application 标签页查看 LocalStorage
   - 应该包含：
     - `rozo_token` - JWT token
     - `rozo_user` - 用户信息

### 📊 API 测试脚本

运行独立的 API 测试：
```bash
node test-api.js
```

运行 Playwright 自动化测试：
```bash
node playwright-test.js        # UI 截图测试
node playwright-api-test.js    # API 集成测试
```

### ⚠️ 已知问题：

1. **测试 token 已过期** - 需要通过实际登录获取新 token
2. **某些端点可能返回 500** - 后端数据库表可能需要配置

### 🎉 测试成功标准：

- ✅ 能够使用钱包登录
- ✅ 登录后显示正确的积分和 Credits
- ✅ API 调用返回正确的数据格式
- ✅ 页面导航正常工作
- ✅ 移动端响应式布局正常

### 📞 需要帮助？

如果遇到问题，检查：
1. 环境变量是否正确设置 (`.env.local`)
2. 开发服务器是否运行 (`npm run dev`)
3. 浏览器控制台错误信息
4. 网络请求的响应状态

---

更新时间：2025-01-22