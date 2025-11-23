import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Save, Eye, Tag as TagIcon } from 'lucide-react';
import Navbar from '~/components/Navbar';
import { supabase } from '~/lib/supabase';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function WriteArticle() {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('前端开发');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [preview, setPreview] = useState(false);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate('/login');
    } else {
      setUser(user);
    }
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim()) && tags.length < 5) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleSubmit = async () => {
    if (!title.trim() || !content.trim()) {
      alert('标题和内容不能为空');
      return;
    }

    if (tags.length === 0) {
      alert('请至少添加一个标签');
      return;
    }

    setLoading(true);

    try {
      // 生成摘要（取前200个字符）
      const summary = content
        .replace(/[#*`\[\]()]/g, '') // 移除 Markdown 标记
        .replace(/\n/g, ' ') // 替换换行符
        .substring(0, 200)
        .trim();
      
      const articleData = {
        title: title.trim(),
        content: content.trim(),
        summary,
        author_id: user.id,
        author_name: user.user_metadata?.username || user.email?.split('@')[0] || '匿名用户',
        author_avatar: user.user_metadata?.avatar_url || '',
        category,
        tags,
        view_count: 0,
        like_count: 0,
        comment_count: 0,
      };

      console.log('准备发布文章:', articleData);

      const { data, error } = await supabase
        .from('articles')
        .insert([articleData])
        .select()
        .single();

      if (error) {
        console.error('发布文章错误:', error);
        alert('发布失败：' + error.message);
      } else {
        console.log('发布成功:', data);
        alert('发布成功！');
        navigate(`/article/${data.id}`);
      }
    } catch (err: any) {
      console.error('发布异常:', err);
      alert('发布失败：' + (err.message || '请稍后重试'));
    } finally {
      setLoading(false);
    }
  };

  const categories = ['前端开发', '后端开发', '移动开发', '数据库', '运维', '人工智能', '其他'];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          {/* 标题 */}
          <div className="mb-6">
            <input
              type="text"
              placeholder="请输入文章标题..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full text-3xl font-bold border-0 focus:outline-none focus:ring-0 placeholder-gray-300"
            />
          </div>

          {/* 分类和标签 */}
          <div className="mb-6 flex flex-wrap gap-4">
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">分类:</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="px-3 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center space-x-2 flex-1">
              <label className="text-sm font-medium text-gray-700">标签:</label>
              <div className="flex items-center space-x-2 flex-1">
                <input
                  type="text"
                  placeholder="添加标签 (最多5个)"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                  className="flex-1 px-3 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  disabled={tags.length >= 5}
                />
                <button
                  onClick={handleAddTag}
                  disabled={tags.length >= 5}
                  className="px-3 py-1.5 bg-red-500 text-white rounded-md hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  <TagIcon size={16} />
                </button>
              </div>
            </div>
          </div>

          {/* 已添加的标签 */}
          {tags.length > 0 && (
            <div className="mb-6 flex flex-wrap gap-2">
              {tags.map(tag => (
                <span
                  key={tag}
                  className="px-3 py-1 bg-red-50 text-red-600 rounded-full text-sm flex items-center space-x-1"
                >
                  <span>#{tag}</span>
                  <button
                    onClick={() => handleRemoveTag(tag)}
                    className="ml-1 hover:text-red-800"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* 编辑器工具栏 */}
          <div className="mb-4 flex items-center justify-between border-b border-gray-200 pb-4">
            <div className="flex space-x-2">
              <button
                onClick={() => setPreview(false)}
                className={`px-4 py-2 rounded-md transition ${
                  !preview ? 'bg-red-500 text-white' : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                编辑
              </button>
              <button
                onClick={() => setPreview(true)}
                className={`px-4 py-2 rounded-md transition flex items-center space-x-1 ${
                  preview ? 'bg-red-500 text-white' : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Eye size={16} />
                <span>预览</span>
              </button>
            </div>

            <div className="flex space-x-2">
              <button
                onClick={() => navigate('/')}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md transition"
              >
                取消
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center space-x-1"
              >
                <Save size={16} />
                <span>{loading ? '发布中...' : '发布文章'}</span>
              </button>
            </div>
          </div>

          {/* 编辑器/预览区 */}
          <div className="min-h-[500px]">
            {preview ? (
              <div className="prose prose-lg max-w-none p-4 border border-gray-300 rounded-md">
                <h1 className="text-2xl font-bold mb-4">{title || '无标题'}</h1>
                <article className="markdown-body">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {content || '在这里写下你的想法...'}
                  </ReactMarkdown>
                </article>
              </div>
            ) : (
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="在这里使用 Markdown 格式编写文章内容...

示例:
# 一级标题
## 二级标题

**粗体文本**
*斜体文本*

``javascript
const hello = 'world';
```

- 列表项 1
- 列表项 2
"
                className="w-full min-h-[500px] p-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent resize-y font-mono text-sm"
              />
            )}
          </div>

          {/* 提示信息 */}
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-sm text-blue-800">
              💡 提示：支持 Markdown 语法，可以使用标题、列表、代码块、链接、图片等格式。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
