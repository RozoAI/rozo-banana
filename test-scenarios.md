# 🧪 Banana Frontend 测试场景

## 测试环境
- **Frontend URL**: http://localhost:3004
- **Banana Backend**: http://localhost:3000/api
- **Points Service**: http://localhost:3001/api

## 📋 测试场景

### 1. 新用户注册登录测试
**步骤：**
1. 打开 http://localhost:3004
2. 点击 "Connect" 按钮连接钱包
3. 选择 MetaMask 或其他钱包
4. 签名消息进行认证
5. 检查是否成功登录并显示Dashboard

**预期结果：**
- ✅ 钱包连接成功
- ✅ 签名请求发送到Points Service (`/auth/wallet/verify`)
- ✅ 收到JWT token（30天有效期）
- ✅ 显示用户Dashboard
- ✅ 显示ROZO余额和Credits余额

**测试钱包地址：**
```
0x742d35Cc6634C0532925a3b844Bc9e7595f0fA4B
```

---

### 2. 充值支付测试（$20月度计划）
**步骤：**
1. 登录后点击充值按钮或访问 `/recharge`
2. 选择月度计划（$20）
3. 点击 "Pay with ROZO Intent Pay"
4. ROZO SDK弹窗显示：
   - 选择钱包（MetaMask等）
   - 选择支付Token（USDC on Base）
   - 确认支付地址：`0x5772FBe7a7817ef7F586215CA8b23b8dD22C8897`

**预期结果：**
- ✅ 显示支付计划选项
- ✅ ROZO SDK正确加载
- ✅ 显示正确的收款地址
- ✅ 支付完成后webhook自动添加Credits
- ✅ 获得500 Credits + 1000 ROZO奖励

---

### 3. 图片生成测试
**步骤：**
1. 确保账户有Credits
2. 访问 `/generate` 或点击生成按钮
3. 输入提示词（如："A cute banana character in space"）
4. 可选：上传1-9张参考图片
5. 选择风格和宽高比
6. 点击生成按钮

**预期结果：**
- ✅ 调用Banana Backend `/image/generate` API
- ✅ 扣除5个Credits
- ✅ 显示生成的图片
- ✅ 可以下载、复制prompt、分享图片

---

### 4. 历史记录查看测试
**步骤：**
1. 生成图片后访问 `/history`
2. 查看历史记录列表
3. 切换网格/列表视图
4. 测试分页功能

**预期结果：**
- ✅ 显示所有生成过的图片
- ✅ 显示生成时间、Credits消耗
- ✅ 可以下载历史图片
- ✅ 可以复制历史prompt
- ✅ 分页功能正常

---

### 5. 推荐系统测试
**步骤：**
1. 用户A登录后获取推荐链接
2. 分享链接格式：`http://localhost:3004?ref=USER_A_CODE`
3. 用户B通过推荐链接注册
4. 用户B充值付费

**预期结果：**
- ✅ 用户A获得自定义推荐码
- ✅ 用户B注册时自动应用推荐码
- ✅ 用户B获得100 ROZO注册奖励
- ✅ 用户B充值后，用户A获得10%返现ROZO奖励

---

## 🔍 API调用流程验证

### 认证流程
```
Frontend → Points Service (/auth/wallet/verify)
         → 包含 app_id: "banana"
         → 返回 JWT token
```

### 余额查询（并行）
```
Frontend → Points Service (/points/balance) → ROZO余额
         → Banana Backend (/credits/balance) → Credits余额
```

### 图片生成
```
Frontend → Banana Backend (/image/generate)
         → 包含 JWT token
         → 返回图片URL
```

### 推荐奖励
```
Frontend → Points Service (/referral/apply)
         → 新用户获得100 ROZO
         → 推荐人获得10%返现
```

---

## 📊 测试数据

### 测试账户信息
- **地址**: 需要提供一个有Credits的测试地址
- **Credits**: 建议添加100+ Credits用于测试
- **ROZO**: 用于查看奖励是否正确发放

### 支付测试
- **网络**: Base Chain
- **Token**: USDC
- **金额**: $20（月度）或 $200（年度）
- **收款地址**: `0x5772FBe7a7817ef7F586215CA8b23b8dD22C8897`

---

## ✅ 检查清单

- [ ] 新用户可以成功注册登录
- [ ] JWT token 30天有效期
- [ ] ROZO余额正确显示
- [ ] Credits余额正确显示
- [ ] 充值页面ROZO SDK正常加载
- [ ] 支付流程可以走通（不需要真实支付）
- [ ] 图片生成功能正常
- [ ] Credits正确扣除
- [ ] 历史记录正确显示
- [ ] 推荐链接可以生成
- [ ] 推荐奖励正确计算（10%）
- [ ] 多图上传功能正常（2-9张）
- [ ] 图片分享功能正常