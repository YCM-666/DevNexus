import { createClient } from '@supabase/supabase-js';

// Supabase配置 - 请替换为你的实际Supabase项目URL和密钥
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// 检查是否配置了有效的 Supabase 凭证
const isSupabaseConfigured = 
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl !== 'https://your-project.supabase.co' &&
  supabaseAnonKey !== 'your-anon-key-here' &&
  !supabaseUrl.includes('YOUR_SUPABASE');

// 输出配置状态（开发环境）
if (import.meta.env.DEV) {
  console.log('🔧 Supabase 配置状态:');
  console.log('  URL:', supabaseUrl || '未配置');
  console.log('  Key:', supabaseAnonKey ? '已配置 ✓' : '未配置 ✗');
  console.log('  状态:', isSupabaseConfigured ? '✅ 已连接' : '❌ 未配置');
}

export const supabase = isSupabaseConfigured 
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
      global: {
        headers: {
          'x-client-info': 'blog-frontend',
        },
      },
    })
  : createClient('https://placeholder.supabase.co', 'placeholder-key');

// 数据库类型定义
export interface Article {
  id: string;
  title: string;
  content: string;
  summary: string;
  author_id: string;
  author_name: string;
  author_avatar?: string;
  category: string;
  tags: string[];
  view_count: number;
  like_count: number;
  comment_count: number;
  bookmark_count: number;
  created_at: string;
  updated_at: string;
}

// 用户资料接口
export interface User {
  id: string;
  username: string;
  email: string;
  avatar_url?: string;
  bio?: string;
  created_at: string;
  user_metadata?: any;
}

// 通知设置接口
export interface NotificationSettings {
  emailNotifications: boolean;
  commentNotifications: boolean;
  likeNotifications: boolean;
  newArticleNotifications: boolean;
}

// 隐私设置接口
export interface PrivacySettings {
  allowComments: boolean;
  allowLikes: boolean;
}

// 更新用户资料
export async function updateUserProfile(profileData: {
  username?: string;
  bio?: string;
  avatar_url?: string;
}) {
  try {
    // 首先检查用户是否已登录
    const { data: { user }, error: getUserError } = await supabase.auth.getUser();
    if (getUserError || !user) {
      console.error('用户未登录或认证失败:', getUserError);
      return { success: false, error: '用户未登录或认证失败' };
    }

    // 只保留数据库中存在的字段，过滤掉undefined值
    const dbProfileData: { [key: string]: any } = {
      id: user.id,
      updated_at: new Date().toISOString()
    };
    
    // 只添加有值的字段，避免覆盖现有值
    if (profileData.username !== undefined) {
      dbProfileData.username = profileData.username;
    }
    if (profileData.bio !== undefined) {
      dbProfileData.bio = profileData.bio;
    }
    if (profileData.avatar_url !== undefined) {
      dbProfileData.avatar_url = profileData.avatar_url;
    }

    // 尝试更新用户资料表
    console.log('尝试更新用户资料:', dbProfileData);
    const { error: profileError } = await supabase
      .from('user_profiles')
      .upsert(dbProfileData, { onConflict: 'id' });

    if (profileError) {
      console.error('数据库更新失败:', profileError);
      // 403错误通常是权限问题，提供更具体的错误信息
      if (profileError.code === '42501' || profileError.code === '403') {
        return { success: false, error: '没有权限更新用户资料，请检查您的登录状态' };
      }
      throw profileError;
    }

    // 尝试更新认证用户的元数据（可选）
    try {
      await supabase.auth.updateUser({
        data: { 
          username: profileData.username,
          bio: profileData.bio,
          avatar_url: profileData.avatar_url
        }
      });
    } catch (authUpdateError) {
      console.warn('认证用户元数据更新失败（非关键错误）:', authUpdateError);
      // 不阻止返回成功，因为主要的资料更新已经成功
    }

    return { success: true, data: { ...user, ...profileData } };
  } catch (error) {
    console.error('更新用户资料失败:', error);
    return { success: false, error: error instanceof Error ? error.message : '更新失败' };
  }
}

// 更新通知设置
export async function updateNotificationSettings(settings: NotificationSettings) {
  try {
    const { error } = await supabase.auth.updateUser({
      data: { notificationSettings: settings }
    });

    if (error) {
      throw error;
    }

    return { success: true, data: settings };
  } catch (error) {
    console.error('更新通知设置失败:', error);
    return { success: false, error: error instanceof Error ? error.message : '更新失败' };
  }
}

// 更新隐私设置
export async function updatePrivacySettings(settings: PrivacySettings) {
  try {
    const { error } = await supabase.auth.updateUser({
      data: { privacySettings: settings }
    });

    if (error) {
      throw error;
    }

    return { success: true, data: settings };
  } catch (error) {
    console.error('更新隐私设置失败:', error);
    return { success: false, error: error instanceof Error ? error.message : '更新失败' };
  }
}

// 更新用户密码
export async function updateUserPassword(currentPassword: string, newPassword: string) {
  try {
    // 首先使用当前密码重新认证用户
    const { error: loginError } = await supabase.auth.signInWithPassword({
      email: (await supabase.auth.getUser()).data.user?.email!,
      password: currentPassword
    });

    if (loginError) {
      throw new Error('当前密码错误');
    }

    // 然后更新密码
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword
    });

    if (updateError) {
      throw updateError;
    }

    return { success: true };
  } catch (error) {
    console.error('更新密码失败:', error);
    return { success: false, error: error instanceof Error ? error.message : '更新失败' };
  }
}

// 获取用户资料
export async function getUserProfile(userId?: string) {
  try {
    const targetId = userId || (await supabase.auth.getUser()).data.user?.id;
    if (!targetId) {
      throw new Error('用户ID不存在');
    }

    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', targetId)
      .single();

    if (error) {
      // 如果资料表中没有记录，尝试从认证用户获取基本信息
      const { data: { user } } = await supabase.auth.getUser();
      if (user && user.id === targetId) {
        return { 
          success: true, 
          data: {
            id: user.id,
            username: user.user_metadata?.username || user.email?.split('@')[0] || '用户',
            email: user.email,
            avatar_url: user.user_metadata?.avatar_url,
            bio: user.user_metadata?.bio,
            created_at: user.created_at,
            user_metadata: user.user_metadata
          }
        };
      }
      throw error;
    }

    return { success: true, data };
  } catch (error) {
    console.error('获取用户资料失败:', error);
    return { success: false, error: error instanceof Error ? error.message : '获取失败' };
  }
}

export interface Comment {
  id: string;
  article_id: string;
  user_id: string;
  username: string;
  user_avatar?: string;
  content: string;
  created_at: string;
}

// 删除评论的函数
export async function deleteComment(commentId: string): Promise<boolean> {
  try {
    // 检查用户是否登录
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error('用户未登录，无法删除评论');
      return false;
    }

    // 首先获取评论信息，查看评论属于哪篇文章
    const { data: commentData, error: getCommentError } = await supabase
      .from('comments')
      .select('article_id')
      .eq('id', commentId)
      .single();

    if (getCommentError) {
      console.error('获取评论信息失败:', getCommentError);
      return false;
    }

    // 然后获取文章信息，检查是否为文章作者
    const { data: articleData, error: getArticleError } = await supabase
      .from('articles')
      .select('author_id')
      .eq('id', commentData.article_id)
      .single();

    if (getArticleError) {
      console.error('获取文章信息失败:', getArticleError);
      return false;
    }

    // 删除评论（会触发数据库级别的权限检查，确保只能删除自己的评论或自己文章的评论）
    const { error } = await supabase
      .from('comments')
      .delete()
      .eq('id', commentId)
      .or(`user_id.eq.${user.id},article_id.in.(${commentData.article_id})`);

    if (error) {
      console.error('删除评论失败:', error);
      return false;
    }

    return true;
  } catch (err) {
    console.error('删除评论时发生错误:', err);
    return false;
  }
}

// 搜索文章的函数
export async function searchArticles(query: string): Promise<Article[]> {
  if (!query.trim()) {
    return [];
  }

  try {
    // 构建搜索查询
    // 使用ILIKE进行不区分大小写的模糊搜索，搜索标题、摘要和标签
    const { data, error } = await supabase
      .from('articles')
      .select(`
        id,
        title,
        summary,
        content,
        author_id,
        author_name,
        author_avatar,
        category,
        tags,
        view_count,
        like_count,
        comment_count,
        bookmark_count,
        created_at,
        updated_at
      `)
      .or(
        `title.ilike.%${query}%,summary.ilike.%${query}%,tags.cs.{${query}}`
      )
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      console.error('搜索文章失败:', error);
      return [];
    }

    // 确保返回的数据中包含bookmark_count字段
    const articlesWithBookmarkCount = (data || []).map(article => ({
      ...article,
      bookmark_count: article.bookmark_count || 0
    }));
    return articlesWithBookmarkCount;
  } catch (err) {
    console.error('搜索文章时发生错误:', err);
    return [];
  }
}

// 模拟搜索数据，用于开发和测试
export const mockSearchArticles = (query: string): Article[] => {
  // 模拟文章数据
  const mockArticles: Article[] = [
    {
      id: '1',
      title: `JavaScript 基础教程 - ${query} 相关内容`,
      content: '这是一篇关于JavaScript基础的教程...',
      summary: `本文介绍JavaScript的基础知识，包括${query}的使用方法和最佳实践。`,
      author_id: '101',
      author_name: '技术博主',
      author_avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=tech',
      category: '前端开发',
      tags: ['JavaScript', '前端', query],
      view_count: 1250,
      like_count: 89,
      comment_count: 23,
      bookmark_count: 42,
      created_at: '2024-01-15T10:00:00Z',
      updated_at: '2024-01-15T10:00:00Z'
    },
    {
      id: '2',
      title: `React 实战 - 如何在项目中集成 ${query}`,
      content: '这是一篇关于React实战的教程...',
      summary: `本文详细讲解了如何在React项目中集成和使用${query}，提升开发效率。`,
      author_id: '102',
      author_name: 'React专家',
      author_avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=react',
      category: '前端开发',
      tags: ['React', 'JavaScript', query],
      view_count: 2341,
      like_count: 156,
      comment_count: 42,
      bookmark_count: 78,
      created_at: '2024-01-10T14:30:00Z',
      updated_at: '2024-01-10T14:30:00Z'
    },
    {
      id: '3',
      title: `Node.js 性能优化与 ${query} 的应用`,
      content: '这是一篇关于Node.js性能优化的文章...',
      summary: `探讨Node.js应用的性能优化策略，以及${query}在其中的重要作用。`,
      author_id: '103',
      author_name: '后端工程师',
      author_avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=node',
      category: '后端开发',
      tags: ['Node.js', '性能优化', query],
      view_count: 1876,
      like_count: 124,
      comment_count: 35,
      bookmark_count: 56,
      created_at: '2024-01-08T09:15:00Z',
      updated_at: '2024-01-08T09:15:00Z'
    }
  ];

  // 根据查询过滤模拟数据
  return mockArticles.filter(article => 
    article.title.toLowerCase().includes(query.toLowerCase()) ||
    article.summary.toLowerCase().includes(query.toLowerCase()) ||
    article.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase()))
  );
}
