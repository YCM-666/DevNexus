import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { User as UserIcon, Save, X, ChevronLeft, Mail, MapPin, Upload, Camera, Globe } from 'lucide-react';
import Navbar from '~/components/Navbar';
import { supabase, updateUserProfile, getUserProfile } from '~/lib/supabase';

export default function EditProfile() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    bio: '',
  });
  const [originalData, setOriginalData] = useState({
    username: '',
    bio: '',
    avatar_url: ''
  });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/login');
        return;
      }
      
      setUser(user);
      
      // 使用新的API函数获取用户资料
      const result = await getUserProfile();
      
      if (result.success && result.data) {
        const userData = result.data;
        setFormData({
          username: userData.username || '',
          bio: userData.bio || ''
        });
        setOriginalData({
          username: userData.username || '',
          bio: userData.bio || '',
          avatar_url: userData.avatar_url || ''
        });
      } else {
        // 初始化表单数据
        const initialData = {
          username: user.user_metadata?.username || user.email?.split('@')[0] || '',
          bio: user.user_metadata?.bio || '',
        };
        setFormData(initialData);
        setOriginalData({
          ...initialData,
          avatar_url: user.user_metadata?.avatar_url || ''
        });
      }
    } catch (err) {
      console.error('获取用户信息失败:', err);
      navigate('/login');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // 取消编辑
  const handleCancel = () => {
    // 重置表单数据
    setFormData({
      username: originalData.username,
      bio: originalData.bio
    });
    // 重置头像
    setAvatarFile(null);
    // 跳转回个人资料页
    navigate('/profile');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setAvatarFile(e.target.files[0]);
    }
  };

  const uploadAvatar = async (): Promise<string | null> => {
    if (!avatarFile || !user) {
      console.warn('无法上传头像: 用户未登录或未选择文件');
      return null;
    }

    try {
      console.log('开始上传头像文件:', avatarFile.name);
      
      // 验证文件类型
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!validTypes.includes(avatarFile.type)) {
        throw new Error('不支持的文件类型，请上传JPG、PNG或WebP格式的图片');
      }
      
      // 验证文件大小 (5MB限制)
      if (avatarFile.size > 5 * 1024 * 1024) {
        throw new Error('文件大小超过5MB限制');
      }
      
      // 生成更简洁的文件路径
      const fileExt = avatarFile.name.split('.').pop() || 'jpg';
      const filePath = `${user.id}/${Date.now()}.${fileExt}`;

      console.log('上传路径:', filePath);
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, avatarFile, { 
          upsert: true,
          cacheControl: '3600'
        });

      if (uploadError) {
        console.error('上传头像错误:', uploadError);
        // 提供更具体的错误信息
        if ((uploadError as any).code === '403') {
          throw new Error('没有权限上传文件，请检查您的登录状态');
        }
        throw new Error(`上传失败: ${(uploadError as any).message || '未知错误'}`);
      }

      console.log('头像上传成功，获取URL');
      const { data: publicUrlData } = await supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      if (!publicUrlData?.publicUrl) {
        throw new Error('获取头像URL失败');
      }
      
      console.log('头像URL获取成功:', publicUrlData.publicUrl);
      return publicUrlData.publicUrl;
    } catch (err) {
      console.error('上传头像失败:', err);
      // 重新抛出错误以便上层捕获
      throw err;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsSubmitting(true);

    try {
      // 准备要更新的数据
      const updateData: any = {
        ...formData
      };

      console.log('提交的资料数据:', updateData);
      
      // 如果选择了新头像，上传并获取新URL
      if (avatarFile) {
        updateData.avatar_url = await uploadAvatar();
      }

      // 使用新的API函数更新用户资料
      const result = await updateUserProfile(updateData);
      
      console.log('更新结果:', result);
      
      if (!result.success) {
        throw new Error((result.error as string) || '更新失败');
      }

      setSuccess('个人资料更新成功！');
      // 短暂显示成功消息后返回个人资料页
      setTimeout(() => {
        navigate('/profile');
      }, 1500);
    } catch (err) {
      console.error('提交表单时发生错误:', err);
      setError((err as Error).message || '更新资料失败，请重试');
    } finally {
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
              编辑个人资料
            </h1>
            <p className="text-gray-600 mt-2">更新你的个人信息，让其他用户更好地了解你</p>
          </div>

          {/* 表单卡片 */}
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
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

              <form onSubmit={handleSubmit}>
                {/* 头像上传 */}
                <div className="flex flex-col items-center mb-8">
                  <div className="relative group mb-2">
                    {user.user_metadata?.avatar_url && !avatarFile ? (
                      <img
                        src={user.user_metadata.avatar_url}
                        alt="avatar"
                        className="w-24 h-24 rounded-2xl shadow-lg ring-4 ring-white object-cover"
                      />
                    ) : (
                      <div className="w-24 h-24 rounded-2xl shadow-lg ring-4 ring-white bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center">
                        <UserIcon size={40} className="text-white" />
                      </div>
                    )}
                    
                    <label className="absolute inset-0 bg-black bg-opacity-40 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                      <div className="bg-white rounded-full w-10 h-10 flex items-center justify-center">
                        <Camera size={18} className="text-red-500" />
                      </div>
                    </label>
                    
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </div>
                  <p className="text-sm text-gray-500">点击头像上传新照片</p>
                </div>

                {/* 用户名 */}
                <div className="mb-6">
                  <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                    用户名
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <UserIcon className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="username"
                      name="username"
                      type="text"
                      required
                      value={formData.username}
                      onChange={handleInputChange}
                      className="appearance-none block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-red-500 focus:border-red-500 text-gray-900"
                      placeholder="请输入用户名"
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-500">用户名会在你的文章和评论中显示</p>
                </div>

                {/* 个人简介 */}
                <div className="mb-6">
                  <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-2">
                    个人简介
                  </label>
                  <textarea
                    id="bio"
                    name="bio"
                    rows={4}
                    value={formData.bio}
                    onChange={handleInputChange}
                    className="appearance-none block w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-red-500 focus:border-red-500 text-gray-900 resize-none"
                    placeholder="介绍一下你自己..."
                  />
                  <p className="mt-1 text-xs text-gray-500">简短描述你的技术栈、兴趣爱好等</p>
                </div>



                {/* 邮箱（只读） */}
                <div className="mb-8">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    邮箱
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="email"
                      value={user.email}
                      readOnly
                      className="appearance-none block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-500 cursor-not-allowed"
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-500">邮箱用于账户验证和登录，不可修改</p>
                </div>

                {/* 操作按钮 */}
                <div className="flex justify-end gap-4 pt-4 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="px-6 py-3 border-2 border-gray-200 text-gray-700 rounded-xl hover:border-gray-300 transition-all flex items-center gap-2"
                  >
                    <X size={18} />
                    <span>取消</span>
                  </button>
                  <button
                    type="submit"
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
                        <span>保存更改</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}