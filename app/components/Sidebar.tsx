import { Link } from 'react-router';
import { TrendingUp, Tag, Clock } from 'lucide-react';

interface SidebarProps {
  popularTags?: string[];
  hotArticles?: Array<{ id: string; title: string; views: number }>;
}

export default function Sidebar({ popularTags = [], hotArticles = [] }: SidebarProps) {
  // 默认热门标签
  const defaultTags = ['JavaScript', 'React', 'TypeScript', 'Node.js', 'Python', 'Vue', 'CSS', 'HTML'];
  const tags = popularTags.length > 0 ? popularTags : defaultTags;

  return (
    <aside className="space-y-6">
      {/* 热门标签 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center space-x-2 mb-4">
          <Tag className="text-red-500" size={20} />
          <h3 className="font-semibold text-gray-900">热门标签</h3>
        </div>
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <Link
              key={tag}
              to={`/tags/${tag}`}
              className="px-3 py-1 bg-gray-100 hover:bg-red-50 text-gray-700 hover:text-red-500 rounded-full text-sm transition"
            >
              {tag}
            </Link>
          ))}
        </div>
      </div>

      {/* 热门文章 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center space-x-2 mb-4">
          <TrendingUp className="text-red-500" size={20} />
          <h3 className="font-semibold text-gray-900">热门文章</h3>
        </div>
        <div className="space-y-3">
          {hotArticles.length > 0 ? (
            hotArticles.map((article, index) => (
              <Link
                key={article.id}
                to={`/article/${article.id}`}
                className="block group"
              >
                <div className="flex items-start space-x-2">
                  <span className={`
                    flex-shrink-0 w-6 h-6 rounded flex items-center justify-center text-sm font-semibold
                    ${index < 3 ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-600'}
                  `}>
                    {index + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-700 group-hover:text-red-500 line-clamp-2 transition">
                      {article.title}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {article.views} 次浏览
                    </p>
                  </div>
                </div>
              </Link>
            ))
          ) : (
            <p className="text-gray-500 text-sm">暂无热门文章</p>
          )}
        </div>
      </div>

      {/* 最新动态 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center space-x-2 mb-4">
          <Clock className="text-red-500" size={20} />
          <h3 className="font-semibold text-gray-900">最新动态</h3>
        </div>
        <div className="space-y-2 text-sm text-gray-600">
          <p>📢 欢迎来到码农社区</p>
          <p>🎉 开始你的技术写作之旅</p>
          <p>💡 分享你的知识和经验</p>
        </div>
      </div>
    </aside>
  );
}
