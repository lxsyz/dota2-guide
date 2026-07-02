// 后台认证模块
// 安全策略：
// 1. 密码 SHA-256 哈希存储，不存明文
// 2. Session 使用 sessionStorage，关闭标签页自动登出
// 3. 登录失败次数限制，5 次失败锁定 5 分钟
// 4. 所有后台页面顶部检查登录状态

const AdminAuth = {
  // 默认管理员账号（首次访问时初始化）
  // 默认用户名: admin  默认密码: admin123  ← 部署后请立即修改
  DEFAULT_CREDENTIALS: {
    username: 'admin',
    // SHA-256 of "admin123"
    passwordHash: '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9',
  },

  KEYS: {
    CREDENTIALS: 'd2g_admin_credentials',
    SESSION: 'd2g_admin_session',
    LOGIN_ATTEMPTS: 'd2g_admin_login_attempts',
    LOCK_UNTIL: 'd2g_admin_lock_until',
  },

  SESSION_TIMEOUT: 2 * 60 * 60 * 1000, // 2 小时

  // SHA-256 哈希
  async sha256(text) {
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hashBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  },

  // 获取凭证（首次访问初始化默认值）
  getCredentials() {
    let creds = this.getData(this.KEYS.CREDENTIALS);
    if (!creds) {
      creds = { ...this.DEFAULT_CREDENTIALS };
      this.setData(this.KEYS.CREDENTIALS, creds);
    }
    return creds;
  },

  getData(key) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      return null;
    }
  },

  setData(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
  },

  // 检查是否被锁定
  isLocked() {
    const lockUntil = localStorage.getItem(this.KEYS.LOCK_UNTIL);
    if (!lockUntil) return false;
    const lockTime = parseInt(lockUntil, 10);
    if (Date.now() < lockTime) return true;
    // 锁定过期，清除
    localStorage.removeItem(this.KEYS.LOCK_UNTIL);
    localStorage.removeItem(this.KEYS.LOGIN_ATTEMPTS);
    return false;
  },

  getLockRemaining() {
    const lockUntil = localStorage.getItem(this.KEYS.LOCK_UNTIL);
    if (!lockUntil) return 0;
    return Math.max(0, parseInt(lockUntil, 10) - Date.now());
  },

  // 登录
  async login(username, password) {
    if (this.isLocked()) {
      const remain = Math.ceil(this.getLockRemaining() / 1000);
      return { success: false, message: `账户已锁定，请 ${remain} 秒后重试` };
    }

    const creds = this.getCredentials();
    const passwordHash = await this.sha256(password);

    if (username === creds.username && passwordHash === creds.passwordHash) {
      // 登录成功，清除失败记录
      localStorage.removeItem(this.KEYS.LOGIN_ATTEMPTS);
      localStorage.removeItem(this.KEYS.LOCK_UNTIL);
      // 创建 session
      const session = {
        username: username,
        loginAt: Date.now(),
        expiresAt: Date.now() + this.SESSION_TIMEOUT,
        token: Math.random().toString(36).slice(2) + Date.now().toString(36),
      };
      sessionStorage.setItem(this.KEYS.SESSION, JSON.stringify(session));
      return { success: true };
    }

    // 登录失败
    const attempts = parseInt(localStorage.getItem(this.KEYS.LOGIN_ATTEMPTS) || '0', 10) + 1;
    localStorage.setItem(this.KEYS.LOGIN_ATTEMPTS, attempts.toString());
    if (attempts >= 5) {
      const lockUntil = Date.now() + 5 * 60 * 1000; // 锁定 5 分钟
      localStorage.setItem(this.KEYS.LOCK_UNTIL, lockUntil.toString());
      return { success: false, message: '登录失败 5 次，账户已锁定 5 分钟' };
    }
    return { success: false, message: `用户名或密码错误（剩余 ${5 - attempts} 次尝试）` };
  },

  // 登出
  logout() {
    sessionStorage.removeItem(this.KEYS.SESSION);
    window.location.href = 'admin-login.html';
  },

  // 检查登录状态
  isLoggedIn() {
    const sessionStr = sessionStorage.getItem(this.KEYS.SESSION);
    if (!sessionStr) return false;
    try {
      const session = JSON.parse(sessionStr);
      if (Date.now() > session.expiresAt) {
        sessionStorage.removeItem(this.KEYS.SESSION);
        return false;
      }
      return true;
    } catch (e) {
      return false;
    }
  },

  // 守卫：未登录跳转
  requireAuth() {
    if (!this.isLoggedIn()) {
      window.location.href = 'admin-login.html';
      return false;
    }
    return true;
  },

  // 修改密码
  async changePassword(oldPassword, newPassword) {
    const creds = this.getCredentials();
    const oldHash = await this.sha256(oldPassword);
    if (oldHash !== creds.passwordHash) {
      return { success: false, message: '原密码错误' };
    }
    if (newPassword.length < 8) {
      return { success: false, message: '新密码至少 8 位' };
    }
    const newHash = await this.sha256(newPassword);
    creds.passwordHash = newHash;
    this.setData(this.KEYS.CREDENTIALS, creds);
    return { success: true, message: '密码修改成功' };
  },

  // 获取当前用户名
  getCurrentUser() {
    const sessionStr = sessionStorage.getItem(this.KEYS.SESSION);
    if (!sessionStr) return null;
    try {
      return JSON.parse(sessionStr).username;
    } catch (e) {
      return null;
    }
  },
};

// 暴露到全局
window.AdminAuth = AdminAuth;
