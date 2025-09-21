// 模拟测试脚本 - 测试Banana Frontend功能

const axios = require('axios');

// 配置
const FRONTEND_URL = 'http://localhost:3004';
const BANANA_API = 'http://localhost:3000/api';
const POINTS_API = 'http://localhost:3001/api';

// 测试钱包地址
const TEST_WALLET = '0x742d35Cc6634C0532925a3b844Bc9e7595f0fA4B';

// 颜色输出
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

async function log(message, type = 'info') {
  const color = type === 'success' ? colors.green : 
                type === 'error' ? colors.red : 
                type === 'warning' ? colors.yellow : 
                colors.blue;
  console.log(`${color}${message}${colors.reset}`);
}

// 测试场景1：新用户登录
async function testNewUserLogin() {
  log('\n📱 测试场景1：新用户登录', 'info');
  log('================================', 'info');
  
  try {
    // 模拟签名消息
    const nonce = Date.now().toString();
    const message = `Sign this message to authenticate with ROZO\n\nNonce: ${nonce}\nTimestamp: ${new Date().toISOString()}`;
    
    log(`钱包地址: ${TEST_WALLET}`, 'info');
    log(`签名消息: ${message.substring(0, 50)}...`, 'info');
    
    // 模拟调用Points Service认证
    log('\n调用Points Service认证API...', 'warning');
    log(`POST ${POINTS_API}/auth/wallet/verify`, 'info');
    log('Payload:', 'info');
    console.log({
      address: TEST_WALLET,
      message: message,
      signature: '0x' + 'a'.repeat(130), // 模拟签名
      app_id: 'banana',
      referral_code: null
    });
    
    log('\n✅ 预期返回:', 'success');
    console.log({
      success: true,
      token: 'eyJhbGciOiJIUzI1NiIs...',
      expires_in: 2592000, // 30天
      is_new_user: true,
      user: {
        address: TEST_WALLET,
        rozo_balance: 0
      }
    });
    
  } catch (error) {
    log('❌ 测试失败: ' + error.message, 'error');
  }
}

// 测试场景2：充值支付
async function testPayment() {
  log('\n💳 测试场景2：充值支付（$20月度计划）', 'info');
  log('================================', 'info');
  
  log('ROZO SDK配置:', 'info');
  console.log({
    recipient: '0x5772FBe7a7817ef7F586215CA8b23b8dD22C8897',
    network: 'Base',
    token: 'USDC',
    amount: 20,
    plan: 'monthly'
  });
  
  log('\n支付流程:', 'warning');
  log('1. 用户选择月度计划 ($20)', 'info');
  log('2. 点击 "Pay with ROZO Intent Pay"', 'info');
  log('3. ROZO SDK显示支付选项', 'info');
  log('4. 用户选择钱包和USDC', 'info');
  log('5. 确认支付到指定地址', 'info');
  
  log('\n✅ 预期结果:', 'success');
  console.log({
    credits_added: 500,
    rozo_rewarded: 1000,
    expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
  });
}

// 测试场景3：图片生成
async function testImageGeneration() {
  log('\n🎨 测试场景3：图片生成', 'info');
  log('================================', 'info');
  
  const imageParams = {
    prompt: 'A cute banana character floating in space with stars',
    negative_prompt: 'blurry, low quality',
    style: 'digital-art',
    aspect_ratio: '1:1',
    images: [] // 可以添加base64图片
  };
  
  log('生成参数:', 'info');
  console.log(imageParams);
  
  log('\n调用Banana Backend API...', 'warning');
  log(`POST ${BANANA_API}/image/generate`, 'info');
  
  log('\n✅ 预期返回:', 'success');
  console.log({
    success: true,
    image: {
      id: 'img_' + Math.random().toString(36).substr(2, 9),
      url: 'https://storage.rozo.ai/images/generated.png',
      prompt: imageParams.prompt,
      credits_used: 5,
      credits_remaining: 495,
      created_at: new Date().toISOString()
    }
  });
}

// 测试场景4：推荐系统
async function testReferralSystem() {
  log('\n🎁 测试场景4：推荐系统', 'info');
  log('================================', 'info');
  
  const userA = '0x1234567890123456789012345678901234567890';
  const userB = '0x0987654321098765432109876543210987654321';
  
  log('用户A获取推荐码...', 'info');
  log(`GET ${POINTS_API}/referral/code`, 'info');
  
  const referralCode = 'BANANA_' + Math.random().toString(36).substr(2, 6).toUpperCase();
  log(`推荐码: ${referralCode}`, 'success');
  log(`推荐链接: ${FRONTEND_URL}?ref=${referralCode}`, 'success');
  
  log('\n用户B通过推荐链接注册...', 'info');
  log(`POST ${POINTS_API}/auth/wallet/verify`, 'info');
  console.log({
    address: userB,
    referral_code: referralCode
  });
  
  log('\n✅ 预期奖励:', 'success');
  log('- 用户B: +100 ROZO (注册奖励)', 'info');
  log('- 用户B充值$20后:', 'info');
  log('  - 用户A: +100 ROZO (10%返现)', 'success');
  log('  - 用户B: +1000 ROZO (充值奖励)', 'success');
}

// 运行所有测试
async function runAllTests() {
  log('🚀 开始Banana Frontend功能测试', 'success');
  log('=====================================', 'success');
  
  await testNewUserLogin();
  await testPayment();
  await testImageGeneration();
  await testReferralSystem();
  
  log('\n📊 测试总结', 'success');
  log('=====================================', 'success');
  log('✅ 新用户登录流程 - Points Service认证', 'success');
  log('✅ 充值支付流程 - ROZO SDK集成', 'success');
  log('✅ 图片生成流程 - Banana Backend API', 'success');
  log('✅ 推荐系统流程 - 10%返现奖励', 'success');
  
  log('\n💡 需要提供的测试数据:', 'warning');
  log('1. 一个有Credits的钱包地址', 'info');
  log('2. 为该地址添加测试Credits', 'info');
  log('3. 使用该地址测试图片生成', 'info');
  log('4. 验证历史记录和推荐奖励', 'info');
  
  log('\n🔗 测试地址:', 'info');
  log(`Frontend: ${FRONTEND_URL}`, 'info');
  log(`当前显示的测试钱包: ${TEST_WALLET}`, 'info');
}

// 执行测试
runAllTests().catch(console.error);