// Clerk 中文本地化配置
export const zhCN = {
  locale: 'zh-CN',
  
  // 社交登录按钮
  socialButtonsBlockButton: '使用 {{provider|titleize}} 继续',
  socialButtonsBlockButtonManyInView: '使用 {{provider|titleize}} 继续',
  
  // 分隔符
  dividerText: '或',
  
  // 表单字段标签
  formFieldLabel__emailAddress: '邮箱地址',
  formFieldLabel__emailAddresses: '邮箱地址',
  formFieldLabel__phoneNumber: '手机号码',
  formFieldLabel__username: '用户名',
  formFieldLabel__emailAddress_phoneNumber: '邮箱地址或手机号码',
  formFieldLabel__emailAddress_username: '邮箱地址或用户名',
  formFieldLabel__phoneNumber_username: '手机号码或用户名',
  formFieldLabel__emailAddress_phoneNumber_username: '邮箱地址、手机号码或用户名',
  formFieldLabel__password: '密码',
  formFieldLabel__currentPassword: '当前密码',
  formFieldLabel__newPassword: '新密码',
  formFieldLabel__confirmPassword: '确认密码',
  formFieldLabel__signOutOfOtherSessions: '退出所有其他设备',
  formFieldLabel__firstName: '名字',
  formFieldLabel__lastName: '姓氏',
  formFieldLabel__backupCode: '备份码',
  formFieldLabel__organizationName: '组织名称',
  formFieldLabel__organizationSlug: '组织标识',
  formFieldLabel__confirmDeletion: '确认',
  formFieldLabel__role: '角色',
  
  // 表单字段占位符
  formFieldInputPlaceholder__emailAddress: '请输入邮箱地址',
  formFieldInputPlaceholder__emailAddresses: '输入或粘贴一个或多个邮箱地址，用空格或逗号分隔',
  formFieldInputPlaceholder__phoneNumber: '请输入手机号码',
  formFieldInputPlaceholder__username: '请输入用户名',
  formFieldInputPlaceholder__emailAddress_phoneNumber: '请输入邮箱地址或手机号码',
  formFieldInputPlaceholder__emailAddress_username: '请输入邮箱地址或用户名',
  formFieldInputPlaceholder__phoneNumber_username: '请输入手机号码或用户名',
  formFieldInputPlaceholder__emailAddress_phoneNumber_username: '请输入邮箱地址、手机号码或用户名',
  formFieldInputPlaceholder__password: '请输入密码',
  formFieldInputPlaceholder__firstName: '请输入名字',
  formFieldInputPlaceholder__lastName: '请输入姓氏',
  formFieldInputPlaceholder__backupCode: '请输入备份码',
  formFieldInputPlaceholder__organizationName: '请输入组织名称',
  formFieldInputPlaceholder__organizationSlug: '请输入组织标识',
  formFieldInputPlaceholder__confirmDeletionUserAccount: '删除账户',
  
  // 表单操作
  formFieldAction__forgotPassword: '忘记密码？',
  formFieldHintText__optional: '可选',
  formFieldHintText__slug: 'URL 友好的标识符',
  
  // 按钮
  formButtonPrimary: '继续',
  formButtonPrimary__verify: '验证',
  
  // 登录页面
  signIn: {
    start: {
      title: '登录',
      subtitle: '欢迎回来！请登录以继续',
      actionText: '还没有账户？',
      actionLink: '注册',
    },
    password: {
      title: '输入密码',
      subtitle: '输入与您账户关联的密码',
      actionLink: '使用其他方式',
    },
    alternativeMethods: {
      title: '使用其他方式',
      actionLink: '获取帮助',
      blockButton__emailLink: '通过邮件链接登录',
      blockButton__emailCode: '通过邮件验证码登录',
      blockButton__phoneCode: '通过短信验证码登录',
      blockButton__password: '使用密码登录',
      blockButton__totp: '使用验证器应用',
      blockButton__backupCode: '使用备份码',
    },
  },
  signUp: {
    start: {
      title: '创建账户',
      subtitle: '欢迎！请填写详细信息开始使用',
      actionText: '已有账户？',
      actionLink: '登录',
    },
    emailLink: {
      title: '验证您的邮箱',
      subtitle: '继续访问 {{applicationName}}',
      formTitle: '验证链接',
      formSubtitle: '使用发送到您邮箱的验证链接',
      resendButton: '没有收到链接？重新发送',
      verified: {
        title: '注册成功',
      },
      loading: {
        title: '正在注册...',
      },
      verifiedSwitchTab: {
        title: '邮箱验证成功',
        subtitle: '返回新打开的标签页继续',
        subtitleNewTab: '返回之前的标签页继续',
      },
    },
    emailCode: {
      title: '验证您的邮箱',
      subtitle: '继续访问 {{applicationName}}',
      formTitle: '验证码',
      formSubtitle: '输入发送到您邮箱的验证码',
      resendButton: '没有收到验证码？重新发送',
    },
    phoneCode: {
      title: '验证您的手机号',
      subtitle: '继续访问 {{applicationName}}',
      formTitle: '验证码',
      formSubtitle: '输入发送到您手机的验证码',
      resendButton: '没有收到验证码？重新发送',
    },
    continue: {
      title: '填写缺失字段',
      subtitle: '继续访问 {{applicationName}}',
      actionText: '已有账户？',
      actionLink: '登录',
    },
  },
  userProfile: {
    navbar: {
      title: '个人资料',
      description: '管理您的账户信息',
      account: '账户',
      security: '安全',
    },
    start: {
      headerTitle__account: '账户',
      headerTitle__security: '安全',
      profileSection: {
        title: '个人资料',
      },
      usernameSection: {
        title: '用户名',
        primaryButton__changeUsername: '更改用户名',
        primaryButton__setUsername: '设置用户名',
      },
      emailAddressesSection: {
        title: '邮箱地址',
        primaryButton: '添加邮箱地址',
        detailsTitle__primary: '主邮箱',
        detailsSubtitle__primary: '此邮箱地址是主邮箱',
        detailsAction__primary: '完成验证',
        detailsTitle__nonPrimary: '设为主邮箱',
        detailsSubtitle__nonPrimary: '将此邮箱设为主邮箱以接收账户相关通知',
        detailsAction__nonPrimary: '设为主邮箱',
        detailsTitle__unverified: '未验证的邮箱',
        detailsSubtitle__unverified: '此邮箱地址未验证',
        detailsAction__unverified: '验证邮箱',
        destructiveActionTitle: '删除',
        destructiveActionSubtitle: '删除此邮箱地址并从您的账户中移除',
        destructiveAction: '删除邮箱地址',
      },
      connectedAccountsSection: {
        title: '关联账户',
        primaryButton: '关联账户',
        title__conectionFailed: '重试失败的关联',
        title__connectionFailed: '重试失败的关联',
        actionLabel__connectionFailed: '重试',
        destructiveActionTitle: '删除',
        destructiveActionSubtitle: '从您的账户中删除此关联账户',
        destructiveActionAccentTitle: '删除',
      },
      passwordSection: {
        title: '密码',
        primaryButton__changePassword: '更改密码',
        primaryButton__setPassword: '设置密码',
      },
    },
  },
  userButton: {
    action__manageAccount: '管理账户',
    action__signOut: '退出登录',
    action__signOutAll: '退出所有账户',
    action__addAccount: '添加账户',
  },
  organizationSwitcher: {
    personalWorkspace: '个人工作区',
    notSelected: '未选择组织',
    action__createOrganization: '创建组织',
    action__manageOrganization: '管理组织',
  },
  impersonationFab: {
    title: '以 {{identifier}} 身份登录',
    action__signOut: '退出',
  },
  organizationProfile: {
    navbar: {
      title: '组织',
      description: '管理您的组织',
    },
    start: {
      headerTitle__members: '成员',
      headerTitle__settings: '设置',
    },
  },
  badge__primary: '主要',
  badge__thisDevice: '此设备',
  badge__userDevice: '用户设备',
  badge__otherImpersonatorDevice: '其他模拟设备',
  badge__default: '默认',
  badge__unverified: '未验证',
  badge__requiresAction: '需要操作',
  badge__you: '您',
  footerActionLink__useAnotherMethod: '使用其他方式',
  footerPageLink__help: '帮助',
  footerPageLink__privacy: '隐私',
  footerPageLink__terms: '条款',
  formFieldError__notMatchingPasswords: '密码不匹配',
  formFieldError__matchingPasswords: '密码匹配',
  formFieldAction__forgotPassword: '忘记密码？',
  signInEnterPasswordTitle: '输入密码',
  backButton: '返回',
  footerActionLink__useAnotherMethod: '使用其他方式',
  
  // 其他常用翻译
  signOutConfirmation: {
    title: '退出登录',
    message: '确定要退出登录吗？',
    messageLine1: '您确定要退出登录吗？',
    messageLine2: '',
    primaryAction: '退出',
  },
  
  // 错误提示
  formFieldError__notMatchingPasswords: '两次输入的密码不一致',
  formFieldError__invalidEmailAddress: '邮箱地址格式不正确',
  formFieldError__passwordPwned: '此密码已被泄露，请使用其他密码',
  
  // 验证相关
  verificationLinkTab: {
    title: '验证链接',
    resendButton: '重新发送验证链接',
  },
  verificationCodeTab: {
    title: '验证码',
    resendButton: '重新发送验证码',
  },
  
  // 成功提示
  __experimental_formButtonPrimary__continue: '继续',
  __experimental_formButtonPrimary__finish: '完成',
  
  // Clerk 品牌
  "Secured by Clerk": "由 Clerk 提供安全保护",
  "Development mode": "开发模式",
  
  // 加载状态
  "Loading...": "加载中...",
  "Submitting...": "提交中...",
  "Verifying...": "验证中...",
};

