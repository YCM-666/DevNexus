import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router';
import { Eye, ThumbsUp, MessageSquare, Clock, User as UserIcon } from 'lucide-react';
import Navbar from '~/components/Navbar';
import Sidebar from '~/components/Sidebar';
import { supabase, type Article } from '~/lib/supabase';

export default function Home() {
  const navigate = useNavigate();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'latest' | 'hot'>('latest');

  useEffect(() => {
    fetchArticles();
  }, [activeTab]);

  const fetchArticles = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('articles')
        .select('*')
        .order(activeTab === 'latest' ? 'created_at' : 'view_count', { ascending: false })
        .limit(20);

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching articles:', error);
        // 使用模拟数据
        setArticles(getMockArticles());
      } else if (data && data.length > 0) {
        // 直接使用数据库的值
        // 评论数会在文章详情页自动同步
        setArticles(data);
      } else {
        setArticles(getMockArticles());
      }
    } catch (err) {
      console.error('Error:', err);
      setArticles(getMockArticles());
    } finally {
      setLoading(false);
    }
  };

  const getMockArticles = (): Article[] => {
    return [
      {
        id: '1',
        title: 'React 19 新特性详解：全面拥抱并发渲染',
        content: '本文详细介绍React 19的新特性...',
        summary: 'React 19 带来了许多激动人心的新特性，包括改进的并发渲染、自动批处理优化等。本文将带你深入了解这些变化。',
        author_id: '1',
        author_name: '张三',
        author_avatar: '',
        category: '前端开发',
        tags: ['React', 'JavaScript', '前端'],
        view_count: 1234,
        like_count: 89,
        comment_count: 23,
        created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: '2',
        title: 'TypeScript 5.0 实战指南：类型系统最佳实践',
        content: '深入探讨TypeScript类型系统...',
        summary: 'TypeScript 5.0 引入了许多强大的类型系统功能。本文通过实际案例展示如何充分利用这些特性。',
        author_id: '2',
        author_name: '李四',
        category: '编程语言',
        tags: ['TypeScript', 'JavaScript'],
        view_count: 2456,
        like_count: 156,
        comment_count: 45,
        created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: '3',
        title: '构建高性能 Node.js 应用：性能优化技巧分享',
        content: 'Node.js性能优化实践...',
        summary: '本文分享了多种 Node.js 应用性能优化技巧，包括内存管理、异步处理、缓存策略等。',
        author_id: '3',
        author_name: '王五',
        category: '后端开发',
        tags: ['Node.js', 'JavaScript', '性能优化'],
        view_count: 1890,
        like_count: 123,
        comment_count: 34,
        created_at: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: '4',
        title: 'Supabase 完整指南：从零开始构建全栈应用',
        content: 'Supabase教程...',
        summary: 'Supabase 是一个开源的 Firebase 替代方案。本文将手把手教你如何使用 Supabase 构建一个完整的全栈应用。',
        author_id: '1',
        author_name: '张三',
        category: '全栈开发',
        tags: ['Supabase', 'PostgreSQL', '全栈'],
        view_count: 3210,
        like_count: 234,
        comment_count: 67,
        created_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return '刚刚';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} 分钟前`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} 小时前`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} 天前`;
    return date.toLocaleDateString('zh-CN');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 主内容区 */}
          <div className="lg:col-span-2 space-y-4">
            {/* 分类标签 - DevNexus风格 */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="flex items-center border-b border-gray-200">
                <button
                  onClick={() => setActiveTab('latest')}
                  className={`px-6 py-3 font-medium transition relative ${
                    activeTab === 'latest'
                      ? 'text-red-500 bg-red-50'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  推荐
                  {activeTab === 'latest' && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-500"></div>
                  )}
                </button>
                <button
                  onClick={() => setActiveTab('hot')}
                  className={`px-6 py-3 font-medium transition relative ${
                    activeTab === 'hot'
                      ? 'text-red-500 bg-red-50'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  热门
                  {activeTab === 'hot' && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-500"></div>
                  )}
                </button>
              </div>
            </div>

            {/* 文章列表 */}
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
              </div>
            ) : (
              <div className="space-y-0">
                {articles.map((article) => (
                  <article
                    key={article.id}
                    className="bg-white border-b border-gray-200 p-6 hover:bg-gray-50 transition cursor-pointer last:border-b-0"
                    onClick={() => navigate(`/article/${article.id}`)}
                  >
                    <div className="flex items-start space-x-3 mb-3">
                      <span className="px-2 py-0.5 bg-red-100 text-red-600 text-xs rounded font-medium">
                        原创
                      </span>
                      <Link to={`/article/${article.id}`} className="flex-1">
                        <h2 className="text-lg font-semibold text-gray-900 hover:text-red-500 transition line-clamp-1">
                          {article.title}
                        </h2>
                      </Link>
                    </div>
                    
                    <p className="text-gray-600 mb-3 line-clamp-2 text-sm leading-relaxed">
                      {article.summary}
                    </p>

                    <div className="flex flex-wrap gap-2 mb-3">
                      {article.tags.map((tag) => (
                        <Link
                          key={tag}
                          to={`/tags/${tag}`}
                          onClick={(e) => e.stopPropagation()}
                          className="text-blue-600 hover:text-blue-800 text-xs transition"
                        >
                          #{tag}
                        </Link>
                      ))}
                    </div>

                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-1">
                          {article.author_avatar ? (
                            <img
                              src={article.author_avatar}
                              alt={article.author_name}
                              className="w-4 h-4 rounded-full"
                            />
                          ) : (
                            <UserIcon size={14} />
                          )}
                          <span>{article.author_name}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Clock size={14} />
                          <span>{formatTimeAgo(article.created_at)}</span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-1 hover:text-red-500 transition">
                          <Eye size={14} />
                          <span>{article.view_count}</span>
                        </div>
                        <div className="flex items-center space-x-1 hover:text-red-500 transition">
                          <ThumbsUp size={14} />
                          <span>{article.like_count}</span>
                        </div>
                        <div className="flex items-center space-x-1 hover:text-red-500 transition">
                          <MessageSquare size={14} />
                          <span>{article.comment_count}</span>
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>

          {/* 侧边栏 */}
          <div className="lg:col-span-1">
            <Sidebar
              hotArticles={articles.slice(0, 5).map(a => ({
                id: a.id,
                title: a.title,
                views: a.view_count
              }))}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
