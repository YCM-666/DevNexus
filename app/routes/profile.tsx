import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router';
import { User as UserIcon, Settings, Edit, BookOpen, Eye, ThumbsUp, MessageSquare, Bookmark, Award, TrendingUp, Calendar, Mail, MapPin, Code, Star, Zap } from 'lucide-react';
import Navbar from '~/components/Navbar';
import { supabase, type Article } from '~/lib/supabase';

export default function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [myArticles, setMyArticles] = useState<Article[]>([]);
  const [bookmarkedArticles, setBookmarkedArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'popular' | 'recent' | 'bookmarks'>('all');

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate('/login');
    } else {
      setUser(user);
      await Promise.all([
        fetchMyArticles(user.id),
        fetchBookmarkedArticles(user.id)
      ]);
    }
  };

  const fetchMyArticles = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('articles')
        .select('*')
        .eq('author_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching articles:', error);
        setMyArticles([]);
      } else {
        setMyArticles(data || []);
      }
    } catch (err) {
      console.error('Error:', err);
      setMyArticles([]);
    }
  };

  const fetchBookmarkedArticles = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('bookmarks')
        .select('articles(*)')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching bookmarked articles:', error);
        setBookmarkedArticles([]);
      } else {
        // 从嵌套结构中提取文章数据
        const articles = data?.map(bookmark => bookmark.articles).filter(Boolean) || [];
        setBookmarkedArticles(articles.flat());
      }
    } catch (err) {
      console.error('Error:', err);
      setBookmarkedArticles([]);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return '刚刚';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}分钟前`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}小时前`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}天前`;
    return formatDate(dateString);
  };

  if (!user) {
    return null;
  }

  const totalViews = myArticles.reduce((sum, article) => sum + article.view_count, 0);
  const totalLikes = myArticles.reduce((sum, article) => sum + article.like_count, 0);
  const totalComments = myArticles.reduce((sum, article) => sum + article.comment_count, 0);

  const displayArticles = activeTab === 'bookmarks' 
    ? bookmarkedArticles 
    : myArticles.filter(article => {
        if (activeTab === 'popular') return article.view_count > 100;
        if (activeTab === 'recent') return new Date(article.created_at).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000;
        return true;
      });

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-orange-50 to-red-50">
      <Navbar />
      
      <div className="pt-20 pb-12">
        {/* 头部个人信息卡片 - 全新设计 */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
          <div className="relative bg-white rounded-2xl shadow-xl overflow-hidden">
            {/* 渐变背景 */}
            <div className="absolute inset-0 bg-gradient-to-r from-red-500 via-orange-500 to-yellow-400 opacity-10"></div>
            
            {/* 装饰性图案 */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-red-400/20 to-transparent rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-orange-400/20 to-transparent rounded-full blur-3xl"></div>
            
            <div className="relative p-8">
              <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                {/* 头像 */}
                <div className="relative group">
                  {user.user_metadata?.avatar_url ? (
                    <img
                      src={user.user_metadata.avatar_url}
                      alt="avatar"
                      className="w-28 h-28 rounded-2xl shadow-lg ring-4 ring-white group-hover:scale-105 transition-transform"
                    />
                  ) : (
                    <div className="w-28 h-28 rounded-2xl shadow-lg ring-4 ring-white bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center group-hover:scale-105 transition-transform">
                      <UserIcon size={48} className="text-white" />
                    </div>
                  )}
                  <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-green-500 rounded-full border-4 border-white flex items-center justify-center">
                    <Zap size={20} className="text-white" />
                  </div>
                </div>

                {/* 用户信息 */}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">
                      {user.user_metadata?.username || user.email?.split('@')[0] || '开发者'}
                    </h1>
                    <span className="px-3 py-1 bg-gradient-to-r from-red-500 to-orange-500 text-white text-sm font-medium rounded-full shadow-md">
                      Lv.5
                    </span>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <Star key={i} size={16} className="text-yellow-400 fill-yellow-400" />
                      ))}
                    </div>
                  </div>
                  
                  <p className="text-gray-600 mb-4 max-w-2xl">
                    {user.user_metadata?.bio || '🚀 热爱技术，专注分享 | 💡 用代码改变世界'}
                  </p>
                  
                  <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <Mail size={16} className="text-red-500" />
                      <span>{user.email}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar size={16} className="text-orange-500" />
                      <span>加入于 {formatDate(user.created_at)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin size={16} className="text-yellow-500" />
                      <span>中国</span>
                    </div>
                  </div>
                </div>

                {/* 操作按钮 */}
                <div className="flex flex-col gap-2">
                  <button 
                    onClick={() => navigate('/edit-profile')}
                    className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-xl hover:shadow-lg transition-all hover:scale-105"
                  >
                    <Edit size={18} />
                    <span>编辑资料</span>
                  </button>
                  <button 
                  className="flex items-center gap-2 px-6 py-2 border-2 border-gray-200 text-gray-700 rounded-xl hover:border-red-500 hover:text-red-500 transition-all"
                  onClick={() => navigate('/settings')}
                >
                  <Settings size={18} />
                  <span>设置</span>
                </button>
                </div>
              </div>

              {/* 统计数据 - 卡片式 */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
                <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-4 border-2 border-red-200 hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-red-500 rounded-xl flex items-center justify-center shadow-lg">
                      <Eye className="text-white" size={24} />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-gray-900">{totalViews.toLocaleString()}</div>
                      <div className="text-sm text-gray-600">总浏览</div>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-4 border-2 border-orange-200 hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center shadow-lg">
                      <ThumbsUp className="text-white" size={24} />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-gray-900">{totalLikes}</div>
                      <div className="text-sm text-gray-600">获赞数</div>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border-2 border-blue-200 hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center shadow-lg">
                      <MessageSquare className="text-white" size={24} />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-gray-900">{totalComments}</div>
                      <div className="text-sm text-gray-600">评论数</div>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border-2 border-green-200 hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center shadow-lg">
                      <BookOpen className="text-white" size={24} />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-gray-900">{myArticles.length}</div>
                      <div className="text-sm text-gray-600">文章数</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 主要内容区 */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 左侧 - 成就徽章 */}
            <div className="lg:col-span-1 space-y-6">
              {/* 成就徽章 */}
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Award size={20} className="text-yellow-500" />
                  <h3 className="font-bold text-lg">成就徽章</h3>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="flex flex-col items-center p-3 bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl border border-yellow-200">
                    <div className="w-12 h-12 bg-yellow-500 rounded-full flex items-center justify-center mb-2">
                      <TrendingUp className="text-white" size={20} />
                    </div>
                    <span className="text-xs text-gray-600 text-center">热门作者</span>
                  </div>
                  <div className="flex flex-col items-center p-3 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200">
                    <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mb-2">
                      <Code className="text-white" size={20} />
                    </div>
                    <span className="text-xs text-gray-600 text-center">代码达人</span>
                  </div>
                  <div className="flex flex-col items-center p-3 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl border border-purple-200">
                    <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center mb-2">
                      <Star className="text-white" size={20} />
                    </div>
                    <span className="text-xs text-gray-600 text-center">新星作者</span>
                  </div>
                </div>
              </div>

              {/* 技术栈 */}
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h3 className="font-bold text-lg mb-4">擅长技术</h3>
                <div className="flex flex-wrap gap-2">
                  {['React', 'TypeScript', 'Node.js', 'Supabase', 'TailwindCSS', 'Vite'].map((tech) => (
                    <span key={tech} className="px-3 py-1 bg-gradient-to-r from-red-100 to-orange-100 text-red-700 rounded-full text-sm font-medium">
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* 右侧 - 文章列表 */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                {/* 标签页 */}
                <div className="border-b border-gray-200 bg-gray-50">
                  <div className="flex items-center px-6">
                    <button
                      onClick={() => setActiveTab('all')}
                      className={`px-6 py-4 font-medium text-sm transition-all relative ${
                        activeTab === 'all'
                          ? 'text-red-500'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      全部文章
                      {activeTab === 'all' && (
                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 to-orange-500 rounded-t"></div>
                      )}
                    </button>
                    <button
                      onClick={() => setActiveTab('popular')}
                      className={`px-6 py-4 font-medium text-sm transition-all relative ${
                        activeTab === 'popular'
                          ? 'text-red-500'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      热门
                      {activeTab === 'popular' && (
                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 to-orange-500 rounded-t"></div>
                      )}
                    </button>
                    <button
                      onClick={() => setActiveTab('recent')}
                      className={`px-6 py-4 font-medium text-sm transition-all relative ${activeTab === 'recent' ? 'text-red-500' : 'text-gray-600 hover:text-gray-900'}`}
                    >
                      最近
                      {activeTab === 'recent' && (
                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 to-orange-500 rounded-t"></div>
                      )}
                    </button>
                    <button
                      onClick={() => setActiveTab('bookmarks')}
                      className={`px-6 py-4 font-medium text-sm transition-all relative ${activeTab === 'bookmarks' ? 'text-red-500' : 'text-gray-600 hover:text-gray-900'}`}
                    >
                      <div className="flex items-center gap-1">
                        <Bookmark size={16} />
                        <span>我的收藏</span>
                      </div>
                      {activeTab === 'bookmarks' && (
                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 to-orange-500 rounded-t"></div>
                      )}
                    </button>
                  </div>
                </div>

                {/* 文章列表 */}
                <div className="p-6">
                  {loading ? (
                    <div className="flex justify-center items-center py-12">
                      <div className="animate-spin rounded-full h-12 w-12 border-4 border-red-500 border-t-transparent"></div>
                    </div>
                  ) : displayArticles.length === 0 ? (
                    <div className="text-center py-12">
                      {activeTab === 'bookmarks' ? (
                        <>
                          <Bookmark size={48} className="text-gray-300 mx-auto mb-4" />
                          <p className="text-gray-500">暂无收藏的文章</p>
                          <Link to="/" className="mt-4 inline-block px-6 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition">
                            去浏览文章
                          </Link>
                        </>
                      ) : (
                        <>
                          <BookOpen size={48} className="text-gray-300 mx-auto mb-4" />
                          <p className="text-gray-500">暂无文章</p>
                          <Link to="/write" className="mt-4 inline-block px-6 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition">
                            写文章
                          </Link>
                        </>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {displayArticles.map((article) => (
                        <Link
                          key={article.id}
                          to={`/article/${article.id}`}
                          className="block group"
                        >
                          <div className="p-5 rounded-xl border-2 border-gray-100 hover:border-red-200 hover:bg-red-50/50 transition-all">
                            <div className="flex items-start justify-between gap-4 mb-3">
                              <h3 className="flex-1 text-lg font-semibold text-gray-900 group-hover:text-red-500 line-clamp-2 transition-colors">
                                {article.title}
                              </h3>
                              {activeTab !== 'bookmarks' && (
                                <span className="px-3 py-1 bg-red-100 text-red-600 text-xs font-medium rounded-full whitespace-nowrap">
                                  原创
                                </span>
                              )}
                            </div>
                            
                            <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                              {article.summary}
                            </p>

                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4 text-xs text-gray-500">
                                <div className="flex items-center gap-1">
                                  <Eye size={14} />
                                  <span>{article.view_count}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <ThumbsUp size={14} />
                                  <span>{article.like_count}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <MessageSquare size={14} />
                                  <span>{article.comment_count}</span>
                                </div>
                                {activeTab === 'bookmarks' && (
                                  <div className="flex items-center gap-1 text-orange-500">
                                    <Bookmark size={14} className="fill-orange-500" />
                                    <span>收藏</span>
                                  </div>
                                )}
                              </div>
                              <span className="text-xs text-gray-400">
                                {formatTimeAgo(article.created_at)}
                              </span>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
