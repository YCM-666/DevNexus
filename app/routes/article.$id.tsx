import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router';
import { Eye, ThumbsUp, MessageSquare, Clock, User as UserIcon, Share2, Bookmark, Trash2 } from 'lucide-react';
import Navbar from '~/components/Navbar';
import Sidebar from '~/components/Sidebar';
import { supabase, type Article, type Comment, deleteComment as deleteCommentApi } from '~/lib/supabase';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function ArticleDetail() {
  const { id } = useParams();
  const [article, setArticle] = useState<Article | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    // 重置点赞和收藏状态，避免状态残留
    setLiked(false);
    setBookmarked(false);
    
    if (id) {
      fetchArticle(id);
      fetchComments(id);
      incrementViewCount(id);
      checkUserInteractions(id);
      checkCurrentUser();
    }
  }, [id]);

  const fetchArticle = async (articleId: string) => {
    try {
      const { data, error } = await supabase
        .from('articles')
        .select('*')
        .eq('id', articleId)
        .single();

      if (error) {
        console.error('Error fetching article:', error);
        setArticle(getMockArticle(articleId));
      } else {
        setArticle(data);
      }
    } catch (err) {
      console.error('Error:', err);
      setArticle(getMockArticle(articleId));
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async (articleId: string) => {
    try {
      const { data, error } = await supabase
        .from('comments')
        .select('*')
        .eq('article_id', articleId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching comments:', error);
        setComments(getMockComments());
      } else {
        setComments(data || []);
        
        // 评论数现在由数据库触发器自动管理
        // 如果需要手动校准，可以调用数据库中的calibrate_comment_counts()函数
      }
    } catch (err) {
      console.error('Error:', err);
      setComments(getMockComments());
    }
  };

  const checkUserInteractions = async (articleId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        // 如果用户未登录，明确设置点赞和收藏状态为false
        setLiked(false);
        setBookmarked(false);
        return;
      }

      // 检查是否已点赞 - 修复 406 错误
      const { data: likeData, error: likeError } = await supabase
        .from('likes')
        .select('id')
        .eq('article_id', articleId)
        .eq('user_id', user.id)
        .maybeSingle(); // 使用 maybeSingle 而不是 single

      if (likeError) {
        console.error('检查点赞状态错误:', likeError);
        setLiked(false); // 出错时默认设置为未点赞
      } else {
        setLiked(!!likeData); // 明确设置点赞状态，无论是否找到记录
      }

      // 检查是否已收藏 - 修复 406 错误
      const { data: bookmarkData, error: bookmarkError } = await supabase
        .from('bookmarks')
        .select('id')
        .eq('article_id', articleId)
        .eq('user_id', user.id)
        .maybeSingle(); // 使用 maybeSingle 而不是 single

      if (bookmarkError) {
        console.error('检查收藏状态错误:', bookmarkError);
        setBookmarked(false); // 出错时默认设置为未收藏
      } else {
        setBookmarked(!!bookmarkData); // 明确设置收藏状态，无论是否找到记录
      }
    } catch (err) {
      // 静默失败，但仍明确设置状态
      console.log('检查用户交互状态:', err);
      setLiked(false);
      setBookmarked(false);
    }
  };

  const incrementViewCount = async (articleId: string) => {
    try {
      // 直接更新文章浏览量
      const { data, error } = await supabase
        .from('articles')
        .select('view_count')
        .eq('id', articleId)
        .single();

      if (!error && data) {
        await supabase
          .from('articles')
          .update({ view_count: data.view_count + 1 })
          .eq('id', articleId);
      }
    } catch (err) {
      console.log('更新浏览量失败:', err);
    }
  };

  const handleLike = async () => {
    if (!article || !id) return;

    try {
      // 检查用户是否登录
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert('请先登录后再点赞');
        return;
      }

      // 点赞操作前先存储当前状态，用于错误处理
      const previousLikedState = liked;

      // 执行数据库操作
      let error = null;
      if (!liked) {
        // 点赞
        const { error: likeError } = await supabase
          .from('likes')
          .insert([{
            article_id: id,
            user_id: user.id,
          }]);
        error = likeError;
      } else {
        // 取消点赞
        const { error: unlikeError } = await supabase
          .from('likes')
          .delete()
          .eq('article_id', id)
          .eq('user_id', user.id);
        error = unlikeError;
      }

      if (error) {
        console.error(previousLikedState ? '取消点赞失败:' : '添加点赞失败:', error);
        // 操作失败，不更新UI状态
        if (error.code === '23505') {
          alert('您已经点赞过了');
        } else {
          alert(previousLikedState ? '取消点赞失败，请重试' : '添加点赞失败，请重试');
        }
        return;
      }

      // 操作成功，更新点赞状态
      setLiked(!previousLikedState);
      
      // 依赖数据库触发器自动更新计数，重新获取文章最新数据
      const { data } = await supabase
        .from('articles')
        .select('like_count')
        .eq('id', id)
        .single();
      if (data && article) {
        setArticle({ ...article, like_count: data.like_count || 0 });
      }
    } catch (err: any) {
      console.error('点赞异常:', err);
      alert('操作失败：' + (err.message || '请稍后重试'));
      // 捕获到任何异常，重新获取最新状态以确保一致性
      await checkUserInteractions(id);
      // 重新获取文章以更新点赞计数
      const { data } = await supabase
        .from('articles')
        .select('like_count')
        .eq('id', id)
        .single();
      if (data && article) {
        setArticle({ ...article, like_count: data.like_count || 0 });
      }
    }
  };

  const handleBookmark = async () => {
    if (!id) return;

    try {
      // 检查用户是否登录
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert('请先登录后再收藏');
        return;
      }

      // 操作前先存储当前状态，用于错误处理
      const previousBookmarkedState = bookmarked;

      // 执行数据库操作
      let error = null;
      if (!bookmarked) {
        // 收藏
        const { error: bookmarkError } = await supabase
          .from('bookmarks')
          .insert([{
            article_id: id,
            user_id: user.id,
          }]);
        error = bookmarkError;
      } else {
        // 取消收藏
        const { error: unbookmarkError } = await supabase
          .from('bookmarks')
          .delete()
          .eq('article_id', id)
          .eq('user_id', user.id);
        error = unbookmarkError;
      }

      if (error) {
        console.error(previousBookmarkedState ? '取消收藏失败:' : '添加收藏失败:', error);
        // 操作失败，不更新UI状态
        if (error.code === '23505') {
          alert('您已经收藏过了');
        } else {
          alert(previousBookmarkedState ? '取消收藏失败，请重试' : '添加收藏失败，请重试');
        }
        return;
      }

      // 操作成功，更新收藏状态
      setBookmarked(!previousBookmarkedState);
      
      // 依赖数据库触发器自动更新计数，重新获取文章最新数据
      const { data } = await supabase
        .from('articles')
        .select('bookmark_count')
        .eq('id', id)
        .single();
      if (data && article) {
        setArticle({ ...article, bookmark_count: data.bookmark_count || 0 });
      }
    } catch (err: any) {
      console.error('收藏异常:', err);
      alert('操作失败：' + (err.message || '请稍后重试'));
      // 捕获到任何异常，重新获取最新状态以确保一致性
      await checkUserInteractions(id);
      // 重新获取文章以更新收藏计数
      const { data } = await supabase
        .from('articles')
        .select('bookmark_count')
        .eq('id', id)
        .single();
      if (data && article) {
        setArticle({ ...article, bookmark_count: data.bookmark_count || 0 });
      }
    }
  };

  const checkCurrentUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
    } catch (error) {
      console.error('获取用户信息失败:', error);
      setCurrentUser(null);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    // 显示确认对话框
    if (!confirm('确定要删除这条评论吗？')) {
      return;
    }

    try {
      // 调用删除评论API
      const success = await deleteCommentApi(commentId);
      
      if (success) {
        // 更新本地评论列表，移除被删除的评论
        setComments(comments.filter(comment => comment.id !== commentId));
        
        // 评论数现在由数据库触发器自动更新
        // 重新获取文章以更新评论计数
        if (article) {
          const { data } = await supabase
            .from('articles')
            .select('comment_count')
            .eq('id', article.id)
            .single();
          if (data) {
            setArticle({ ...article, comment_count: data.comment_count });
          }
        }
      } else {
        alert('删除评论失败，请稍后重试');
      }
    } catch (error) {
      console.error('删除评论时发生错误:', error);
      alert('删除评论失败：' + (error as Error).message || '请稍后重试');
    }
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !id) return;

    try {
      // 检查用户是否登录
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert('请先登录后再评论');
        return;
      }

      const commentData = {
        article_id: id,
        user_id: user.id,
        username: user.user_metadata?.username || user.email?.split('@')[0] || '匿名用户',
        user_avatar: user.user_metadata?.avatar_url || '',
        content: newComment.trim(),
      };

      console.log('发表评论:', commentData);

      const { data, error } = await supabase
        .from('comments')
        .insert([commentData])
        .select()
        .single();

      if (error) {
        console.error('评论错误:', error);
        alert('评论失败：' + error.message);
      } else {
        console.log('评论成功:', data);
        // 添加到评论列表
        setComments([data, ...comments]);
        setNewComment('');
        
        // 评论数现在由数据库触发器自动更新
        // 重新获取文章以更新评论计数
        if (article) {
          const { data } = await supabase
            .from('articles')
            .select('comment_count')
            .eq('id', id)
            .single();
          if (data) {
            setArticle({ ...article, comment_count: data.comment_count });
          }
        }
      }
    } catch (err: any) {
      console.error('评论异常:', err);
      alert('评论失败：' + (err.message || '请稍后重试'));
    }
  };

  const getMockArticle = (articleId: string): Article => {
    return {
      id: articleId,
      title: 'React 19 新特性详解：全面拥抱并发渲染',
      content: `# React 19 新特性详解

React 19 是一个重要的版本更新，带来了许多激动人心的新特性。本文将详细介绍这些变化。

## 主要特性

### 1. 并发渲染优化

React 19 对并发渲染进行了重大优化，使得应用程序能够更好地处理高优先级更新。

\`\`\`javascript
import { startTransition } from 'react';

function handleUpdate() {
  startTransition(() => {
    setCount(count + 1);
  });
}
\`\`\`

### 2. 自动批处理

React 19 现在会自动批处理所有状态更新，无论它们在哪里发生。

\`\`\`javascript
function handleClick() {
  setCount(c => c + 1);
  setFlag(f => !f);
  // React 会自动批处理这些更新
}
\`\`\`

### 3. 服务器组件

服务器组件允许你在服务器端渲染组件，减少客户端 JavaScript 体积。

## 性能提升

React 19 在性能方面也有显著提升：

- 更快的渲染速度
- 更小的包体积
- 更好的内存管理

## 总结

React 19 是一个非常值得升级的版本，它带来了许多实用的新特性和性能优化。`,
      summary: 'React 19 带来了许多激动人心的新特性，包括改进的并发渲染、自动批处理优化等。',
      author_id: '1',
      author_name: '张三',
      author_avatar: '',
      category: '前端开发',
      tags: ['React', 'JavaScript', '前端'],
      view_count: 1234,
      like_count: 89,
      comment_count: 23,
      bookmark_count: 45,
      created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date().toISOString(),
    };
  };

  const getMockComments = (): Comment[] => {
    return [
      {
        id: '1',
        article_id: id || '1',
        user_id: '1',
        username: '李四',
        user_avatar: '',
        content: '这篇文章写得很好，学到了很多新知识！',
        created_at: new Date(Date.now() - 30 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: '2',
        article_id: id || '1',
        user_id: '2',
        username: '王五',
        user_avatar: '',
        content: 'React 19 的新特性确实很强大，期待更多实践案例。',
        created_at: new Date(Date.now() - 2 * 60 * 60 * 60 * 1000).toISOString(),
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">文章未找到</h1>
            <p className="text-gray-600 mb-6">抱歉，您要查找的文章不存在或已被删除。</p>
            <a
              href="/"
              className="px-6 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition"
            >
              返回首页
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* 主内容区 */}
          <div className="lg:col-span-3">
            <article className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              {/* 文章标题 */}
              <div className="p-6 border-b border-gray-200">
                <h1 className="text-3xl font-bold text-gray-900 mb-4">{article.title}</h1>
                
                {/* 作者信息 */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {article.author_avatar ? (
                      <img
                        src={article.author_avatar}
                        alt={article.author_name}
                        className="w-10 h-10 rounded-full"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                        <UserIcon size={20} className="text-gray-600" />
                      </div>
                    )}
                    <div>
                      <div className="font-semibold text-gray-900">{article.author_name}</div>
                      <div className="text-sm text-gray-500 flex items-center space-x-2">
                        <Clock size={14} />
                        <span>{formatTimeAgo(article.created_at)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={handleLike}
                      className={`flex items-center space-x-1 px-3 py-1.5 rounded-md transition ${
                        liked ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      <ThumbsUp size={16} />
                      <span>{article.like_count}</span>
                    </button>
                    <button
                      onClick={handleBookmark}
                      className={`p-2 rounded-md transition ${
                        bookmarked ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      <Bookmark size={16} />
                    </button>
                    <button className="p-2 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-md transition">
                      <Share2 size={16} />
                    </button>
                  </div>
                </div>
              </div>

              {/* 标签 */}
              <div className="flex flex-wrap gap-2 p-6 pb-0">
                {article.tags.map((tag) => (
                  <Link
                    key={tag}
                    to={`/tags/${tag}`}
                    className="px-3 py-1 bg-red-50 text-red-600 rounded-full text-sm hover:bg-red-100 transition"
                  >
                    #{tag}
                  </Link>
                ))}
              </div>

              {/* 文章内容 */}
              <div className="prose prose-lg max-w-none p-6 bg-white">
                <article className="markdown-body">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {article.content}
                  </ReactMarkdown>
                </article>
              </div>

              {/* 统计信息 */}
              <div className="px-6 pb-6 pt-0 border-t border-gray-200 flex items-center space-x-6 text-sm text-gray-500">
                <div className="flex items-center space-x-1">
                  <Eye size={16} />
                  <span>{article.view_count} 次浏览</span>
                </div>
                <div className="flex items-center space-x-1">
                  <MessageSquare size={16} />
                  <span>{article.comment_count} 条评论</span>
                </div>
              </div>
            </article>

            {/* 评论区 */}
            <div className="mt-6 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                评论 ({comments.length})
              </h3>

              {/* 评论输入框 */}
              <form onSubmit={handleCommentSubmit} className="mb-6">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="写下你的评论..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                  rows={4}
                />
                <div className="mt-2 flex justify-end">
                  <button
                    type="submit"
                    className="px-6 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={!newComment.trim()}
                  >
                    发表评论
                  </button>
                </div>
              </form>

              {/* 评论列表 */}
              <div className="space-y-4">
                {comments.map((comment) => (
                  <div key={comment.id} className="flex space-x-3 pb-4 border-b border-gray-100 last:border-0">
                    {comment.user_avatar ? (
                      <img
                        src={comment.user_avatar}
                        alt={comment.username}
                        className="w-10 h-10 rounded-full flex-shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0">
                        <UserIcon size={20} className="text-gray-600" />
                      </div>
                    )}
                    <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center space-x-2">
                            <span className="font-semibold text-gray-900">{comment.username}</span>
                            <span className="text-sm text-gray-500">{formatTimeAgo(comment.created_at)}</span>
                          </div>
                          {/* 对评论作者和文章作者显示删除按钮 */}
                          {currentUser && (comment.user_id === currentUser.id || article.author_id === currentUser.id) && (
                            <button
                              onClick={() => handleDeleteComment(comment.id)}
                              className="text-gray-400 hover:text-red-500 transition-colors"
                              aria-label="删除评论"
                            >
                              <Trash2 size={18} />
                            </button>
                          )}
                        </div>
                      <p className="text-gray-700">{comment.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
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
