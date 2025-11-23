import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { ChevronLeft, Lock, Bell, Shield, Trash2, Save, Check, AlertCircle, LogOut } from 'lucide-react';
import Navbar from '~/components/Navbar';
import { supabase, updateUserPassword, updateNotificationSettings, updatePrivacySettings, getUserProfile } from '~/lib/supabase';

export default function Settings() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'password' | 'notifications' | 'privacy' | 'account'>('password');
  
  // 密码修改状态
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  // 通知设置状态
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    commentNotifications: true,
    likeNotifications: true,
    newArticleNotifications: false
  });
  
  // 隐私设置状态
  const [privacySettings, setPrivacySettings] = useState({
    showEmail: true,
    showLocation: true,
    allowComments: true,
    allowLikes: true
  });
  
  // 通用状态
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    checkAuthAndLoadSettings();
  }, []);

  const checkAuthAndLoadSettings = async () => {
    try {
      // 获取用户信息
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/login');
        return;
      }

      setUser(user);
      
      // 使用新的API函数获取用户资料和设置
      const result = await getUserProfile();
      
      if (result.success && result.data && result.data.user_metadata) {
        const userMetadata = result.data.user_metadata;
        
        // 加载通知设置
        if (userMetadata.notificationSettings) {
          setNotificationSettings(prev => ({
            ...prev,
            ...userMetadata.notificationSettings
          }));
        }
        
        // 加载隐私设置
        if (userMetadata.privacySettings) {
          setPrivacySettings(prev => ({
            ...prev,
            ...userMetadata.privacySettings
          }));
        }
      }
    } catch (err) {
      console.error('获取用户信息失败:', err);
      navigate('/login');
    } finally {
      setLoading(false);
    }
  };

  // 处理密码表单变化
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // 处理复选框变化
  const handleCheckboxChange = (settingType: 'notification' | 'privacy', name: string, checked: boolean) => {
    if (settingType === 'notification') {
      setNotificationSettings(prev => ({
        ...prev,
        [name]: checked
      }));
    } else {
      setPrivacySettings(prev => ({
        ...prev,
        [name]: checked
      }));
    }
  };

  // 修改密码
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsSubmitting(true);

    // 验证密码
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError('新密码和确认密码不匹配');
      setIsSubmitting(false);
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setError('新密码长度至少为6位');
      setIsSubmitting(false);
      return;
    }

    try {
      // 使用新的API函数更新密码
      const result = await updateUserPassword(passwordForm.currentPassword, passwordForm.newPassword);
      
      if (!result.success) {
        throw new Error(result.error || '修改密码失败');
      }

      // 重置表单
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });

      setSuccess('密码修改成功！');
    } catch (err: any) {
      setError(err.message || '修改密码失败，请重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 保存设置
  const saveSettings = async (settingsType: 'notification' | 'privacy') => {
    setError(null);
    setSuccess(null);
    setIsSubmitting(true);

    try {
      let result;
      
      if (settingsType === 'notification') {
        // 使用新的API函数更新通知设置
        result = await updateNotificationSettings(notificationSettings);
      } else {
        // 使用新的API函数更新隐私设置
        result = await updatePrivacySettings(privacySettings);
      }
      
      if (!result.success) {
        throw new Error(result.error || '保存设置失败');
      }

      setSuccess('设置保存成功！');
    } catch (err: any) {
      setError(err.message || '保存设置失败，请重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 注销账户
  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigate('/login');
    } catch (err) {
      console.error('登出失败:', err);
    }
  };

  // 确认删除账户
  const confirmDeleteAccount = async () => {
    setIsSubmitting(true);

    try {
      // 这里应该有更复杂的删除逻辑，包括删除用户数据
      // 为了演示，我们只做简单的账户删除
      const { error } = await supabase.auth.admin.deleteUser(user.id);

      if (error) {
        throw error;
      }

      // 重定向到登录页
      navigate('/login');
    } catch (err: any) {
      setError(err.message || '删除账户失败，请重试');
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-orange-50 to-red-50">
        <Navbar />
        <div className="pt-20 flex justify-center items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-red-500 border-t-transparent"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-orange-50 to-red-50">
      <Navbar />
      
      <div className="pt-20 pb-12">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* 标题和返回按钮 */}
          <div className="mb-8">
            <button 
              onClick={() => navigate('/profile')}
              className="flex items-center gap-2 text-gray-600 hover:text-red-500 mb-4 transition-colors"
            >
              <ChevronLeft size={20} />
              <span>返回个人资料</span>
            </button>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">
              账户设置
            </h1>
            <p className="text-gray-600 mt-2">管理你的账户信息和偏好设置</p>
          </div>

          {/* 设置卡片 */}
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
            {/* 标签页导航 */}
            <div className="border-b border-gray-200">
              <div className="flex overflow-x-auto no-scrollbar">
                <button
                  onClick={() => setActiveTab('password')}
                  className={`flex items-center gap-2 px-6 py-4 font-medium text-sm whitespace-nowrap transition-all relative ${activeTab === 'password' ? 'text-red-500' : 'text-gray-600 hover:text-gray-900'}`}
                >
                  <Lock size={18} />
                  <span>密码修改</span>
                  {activeTab === 'password' && (
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 to-orange-500 rounded-t"></div>
                  )}
                </button>
                <button
                  onClick={() => setActiveTab('notifications')}
                  className={`flex items-center gap-2 px-6 py-4 font-medium text-sm whitespace-nowrap transition-all relative ${activeTab === 'notifications' ? 'text-red-500' : 'text-gray-600 hover:text-gray-900'}`}
                >
                  <Bell size={18} />
                  <span>通知设置</span>
                  {activeTab === 'notifications' && (
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 to-orange-500 rounded-t"></div>
                  )}
                </button>
                <button
                  onClick={() => setActiveTab('privacy')}
                  className={`flex items-center gap-2 px-6 py-4 font-medium text-sm whitespace-nowrap transition-all relative ${activeTab === 'privacy' ? 'text-red-500' : 'text-gray-600 hover:text-gray-900'}`}
                >
                  <Shield size={18} />
                  <span>隐私设置</span>
                  {activeTab === 'privacy' && (
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 to-orange-500 rounded-t"></div>
                  )}
                </button>
                <button
                  onClick={() => setActiveTab('account')}
                  className={`flex items-center gap-2 px-6 py-4 font-medium text-sm whitespace-nowrap transition-all relative ${activeTab === 'account' ? 'text-red-500' : 'text-gray-600 hover:text-gray-900'}`}
                >
                  <Trash2 size={18} />
                  <span>账户管理</span>
                  {activeTab === 'account' && (
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 to-orange-500 rounded-t"></div>
                  )}
                </button>
              </div>
            </div>

            {/* 设置内容 */}
            <div className="p-6">
              {error && (
                <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
                  {error}
                </div>
              )}
              
              {success && (
                <div className="mb-4 bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-md">
                  {success}
                </div>
              )}

              {/* 密码修改表单 */}
              {activeTab === 'password' && (
                <form onSubmit={handlePasswordSubmit}>
                  <div className="mb-6">
                    <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-2">
                      当前密码
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Lock className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        id="currentPassword"
                        name="currentPassword"
                        type="password"
                        required
                        value={passwordForm.currentPassword}
                        onChange={handlePasswordChange}
                        className="appearance-none block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-red-500 focus:border-red-500 text-gray-900"
                        placeholder="请输入当前密码"
                      />
                    </div>
                  </div>

                  <div className="mb-6">
                    <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">
                      新密码
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Lock className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        id="newPassword"
                        name="newPassword"
                        type="password"
                        required
                        value={passwordForm.newPassword}
                        onChange={handlePasswordChange}
                        className="appearance-none block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-red-500 focus:border-red-500 text-gray-900"
                        placeholder="请输入新密码（至少6位）"
                      />
                    </div>
                  </div>

                  <div className="mb-8">
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                      确认新密码
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Lock className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        id="confirmPassword"
                        name="confirmPassword"
                        type="password"
                        required
                        value={passwordForm.confirmPassword}
                        onChange={handlePasswordChange}
                        className="appearance-none block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-red-500 focus:border-red-500 text-gray-900"
                        placeholder="请再次输入新密码"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-6 py-3 bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-xl hover:shadow-lg transition-all flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                          <span>更新中...</span>
                        </>
                      ) : (
                        <>
                          <Save size={18} />
                          <span>更新密码</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}

              {/* 通知设置 */}
              {activeTab === 'notifications' && (
                <div>
                  <div className="space-y-4 mb-6">
                    <div className="flex items-center justify-between p-4 rounded-xl hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                          <Bell className="h-5 w-5 text-red-500" />
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900">邮件通知</h3>
                          <p className="text-sm text-gray-500">接收重要的账户和活动邮件</p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={notificationSettings.emailNotifications}
                          onChange={(e) => handleCheckboxChange('notification', 'emailNotifications', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-red-500 peer-checked:to-orange-500"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-xl hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <Bell className="h-5 w-5 text-blue-500" />
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900">评论通知</h3>
                          <p className="text-sm text-gray-500">当有人评论你的文章时收到通知</p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={notificationSettings.commentNotifications}
                          onChange={(e) => handleCheckboxChange('notification', 'commentNotifications', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-blue-500 peer-checked:to-blue-600"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-xl hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                          <Bell className="h-5 w-5 text-orange-500" />
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900">点赞通知</h3>
                          <p className="text-sm text-gray-500">当有人点赞你的文章时收到通知</p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={notificationSettings.likeNotifications}
                          onChange={(e) => handleCheckboxChange('notification', 'likeNotifications', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-orange-500 peer-checked:to-orange-600"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-xl hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                          <Bell className="h-5 w-5 text-green-500" />
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900">新文章通知</h3>
                          <p className="text-sm text-gray-500">接收你关注的作者发布的新文章</p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={notificationSettings.newArticleNotifications}
                          onChange={(e) => handleCheckboxChange('notification', 'newArticleNotifications', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-green-500 peer-checked:to-green-600"></div>
                      </label>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => saveSettings('notification')}
                      disabled={isSubmitting}
                      className="px-6 py-3 bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-xl hover:shadow-lg transition-all flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                          <span>保存中...</span>
                        </>
                      ) : (
                        <>
                          <Save size={18} />
                          <span>保存设置</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* 隐私设置 */}
              {activeTab === 'privacy' && (
                <div>
                  <div className="space-y-4 mb-6">
                    <div className="flex items-center justify-between p-4 rounded-xl hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                          <Shield className="h-5 w-5 text-purple-500" />
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900">显示邮箱</h3>
                          <p className="text-sm text-gray-500">在你的个人资料中显示邮箱地址</p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={privacySettings.showEmail}
                          onChange={(e) => handleCheckboxChange('privacy', 'showEmail', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-purple-500 peer-checked:to-purple-600"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-xl hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                          <Shield className="h-5 w-5 text-yellow-500" />
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900">显示位置</h3>
                          <p className="text-sm text-gray-500">在你的个人资料中显示所在地信息</p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={privacySettings.showLocation}
                          onChange={(e) => handleCheckboxChange('privacy', 'showLocation', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-yellow-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-yellow-500 peer-checked:to-yellow-600"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-xl hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                          <Shield className="h-5 w-5 text-indigo-500" />
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900">允许评论</h3>
                          <p className="text-sm text-gray-500">允许其他用户评论你的文章</p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={privacySettings.allowComments}
                          onChange={(e) => handleCheckboxChange('privacy', 'allowComments', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-indigo-500 peer-checked:to-indigo-600"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-xl hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-pink-100 rounded-full flex items-center justify-center">
                          <Shield className="h-5 w-5 text-pink-500" />
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900">允许点赞</h3>
                          <p className="text-sm text-gray-500">允许其他用户点赞你的文章</p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={privacySettings.allowLikes}
                          onChange={(e) => handleCheckboxChange('privacy', 'allowLikes', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-pink-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-pink-500 peer-checked:to-pink-600"></div>
                      </label>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => saveSettings('privacy')}
                      disabled={isSubmitting}
                      className="px-6 py-3 bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-xl hover:shadow-lg transition-all flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                          <span>保存中...</span>
                        </>
                      ) : (
                        <>
                          <Save size={18} />
                          <span>保存设置</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* 账户管理 */}
              {activeTab === 'account' && (
                <div>
                  <div className="mb-8">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-3 border-2 border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-all"
                    >
                      <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                        <LogOut className="h-5 w-5 text-gray-600" />
                      </div>
                      <div className="text-left">
                        <h3 className="font-medium">退出登录</h3>
                        <p className="text-sm text-gray-500">安全退出当前账户</p>
                      </div>
                    </button>
                  </div>

                  <div className="bg-red-50 border border-red-100 rounded-xl p-6">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <AlertCircle className="h-6 w-6 text-red-600" />
                      </div>
                      <div>
                        <h3 className="font-bold text-red-700 mb-2">注销账户</h3>
                        <p className="text-sm text-red-600 mb-4">
                          注销账户是不可逆的操作。注销后，你的所有文章、评论和个人资料将被永久删除，且无法恢复。
                        </p>
                        
                        {!showDeleteConfirm ? (
                          <button
                            onClick={() => setShowDeleteConfirm(true)}
                            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm"
                          >
                            开始注销流程
                          </button>
                        ) : (
                          <div className="space-y-4">
                            <p className="text-xs text-red-500 font-medium">
                              请确认：此操作不可撤销，所有数据将被永久删除。
                            </p>
                            <div className="flex gap-3">
                              <button
                                onClick={() => setShowDeleteConfirm(false)}
                                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors text-sm"
                              >
                                取消
                              </button>
                              <button
                                onClick={confirmDeleteAccount}
                                disabled={isSubmitting}
                                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm disabled:opacity-70 disabled:cursor-not-allowed"
                              >
                                {isSubmitting ? '处理中...' : '确认注销账户'}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}