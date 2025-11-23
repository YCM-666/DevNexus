import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router';
import { Eye, ThumbsUp, MessageSquare, Clock, User as UserIcon, Search as SearchIcon } from 'lucide-react';
import Navbar from '~/components/Navbar';
import Sidebar from '~/components/Sidebar';
import { searchArticles, mockSearchArticles, type Article } from '~/lib/supabase';

export default function SearchPage() {
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get('q') || '';
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSearchResults = async () => {
      if (!searchQuery.trim()) {
        setArticles([]);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        // 尝试从真实API获取数据
        let results = await searchArticles(searchQuery);
        
        // 如果真实API没有返回数据或出错，使用模拟数据（开发环境下）
        if (results.length === 0 && import.meta.env.DEV) {
          console.log('使用模拟搜索数据');
          results = mockSearchArticles(searchQuery);
        }
        
        setArticles(results);
      } catch (err) {
        console.error('搜索失败:', err);
        setError('搜索过程中发生错误，请稍后重试');
        // 出错时也使用模拟数据
        setArticles(mockSearchArticles(searchQuery));
      } finally {
        setLoading(false);
      }
    };

    fetchSearchResults();
  }, [searchQuery]);

  // 格式化日期
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
  };

  // 高亮搜索关键词
  const highlightText = (text: string, highlight: string) => {
    if (!highlight) return text;
    
    const regex = new RegExp(`(${highlight})`, 'gi');
    const parts = text.split(regex);
    
    return (
      <>
        {parts.map((part, index) => 
          regex.test(part) ? 
            <mark key={index} className="bg-red-100 text-red-600 font-medium px-0.5 rounded">{part}</mark> : 
            part
        )}
      </>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 主内容区 */}
          <div className="lg:col-span-2 space-y-4">
            {/* 搜索标题 */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center space-x-3 mb-2">
                <SearchIcon className="text-red-500" size={24} />
                <h1 className="text-2xl font-bold text-gray-900">搜索结果</h1>
              </div>
              <div className="flex items-center space-x-2 text-gray-600">
                <span>关键词：</span>
                <span className="font-medium text-red-500">"{searchQuery}"</span>
                {!loading && (
                  <span className="ml-2">共找到 {articles.length} 篇相关文章</span>
                )}
              </div>
              {error && (
                <div className="mt-4 p-3 bg-red-50 text-red-600 rounded-md">
                  {error}
                </div>
              )}
            </div>

            {/* 搜索结果列表 */}
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
              </div>
            ) : articles.length > 0 ? (
              <div className="space-y-0">
                {articles.map((article) => (
                  <article
                    key={article.id}
                    className="bg-white border-b border-gray-200 p-6 hover:bg-gray-50 transition cursor-pointer last:border-b-0"
                  >
                    <div className="flex items-start space-x-3 mb-3">
                      <span className="px-2 py-0.5 bg-red-100 text-red-600 text-xs rounded font-medium">
                        原创
                      </span>
                      <Link to={`/article/${article.id}`} className="flex-1">
                        <h2 className="text-lg font-semibold text-gray-900 hover:text-red-500 transition line-clamp-1">
                          {highlightText(article.title, searchQuery)}
                        </h2>
                      </Link>
                    </div>
                    
                    <p className="text-gray-600 mb-3 line-clamp-2 text-sm leading-relaxed">
                      {highlightText(article.summary, searchQuery)}
                    </p>

                    <div className="flex flex-wrap gap-2 mb-3">
                      {article.tags.map((tag) => (
                        <Link
                          key={tag}
                          to={`/tags/${tag}`}
                          className="text-blue-600 hover:text-blue-800 text-xs transition"
                        >
                          #{tag}
                        </Link>
                      ))}
                    </div>

                    <div className="flex items-center justify-between mt-4">
                      <div className="flex items-center space-x-1">
                        {article.author_avatar ? (
                          <img
                            src={article.author_avatar}
                            alt={article.author_name}
                            className="w-6 h-6 rounded-full"
                          />
                        ) : (
                          <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center">
                            <UserIcon size={12} className="text-gray-600" />
                          </div>
                        )}
                        <span className="text-gray-600 text-sm">{article.author_name}</span>
                      </div>
                      
                      <div className="flex items-center space-x-4 text-gray-500 text-sm">
                        <span className="flex items-center space-x-1">
                          <Clock size={14} />
                          <span>{formatDate(article.created_at)}</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <Eye size={14} />
                          <span>{article.view_count}</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <ThumbsUp size={14} />
                          <span>{article.like_count}</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <MessageSquare size={14} />
                          <span>{article.comment_count}</span>
                        </span>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
                <SearchIcon size={48} className="text-gray-300 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-gray-900 mb-2">未找到相关文章</h2>
                <p className="text-gray-600 mb-6">
                  没有找到与 "{searchQuery}" 相关的文章，请尝试使用其他关键词。
                </p>
                <Link
                  to="/"
                  className="px-6 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition"
                >
                  返回首页
                </Link>
              </div>
            )}
          </div>

          {/* 侧边栏 */}
          <div className="lg:col-span-1">
            <Sidebar />
          </div>
        </div>
      </div>
    </div>
  );
}