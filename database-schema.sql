-- 在 Supabase SQL Editor 中执行此脚本来创建所需的数据库表

-- 1. 创建文章表
CREATE TABLE IF NOT EXISTS articles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  summary TEXT,
  author_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  author_name TEXT NOT NULL,
  author_avatar TEXT,
  category TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  view_count INTEGER DEFAULT 0,
  like_count INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 创建评论表
CREATE TABLE IF NOT EXISTS comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  article_id UUID REFERENCES articles(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  user_avatar TEXT,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 创建用户资料扩展表
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  bio TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. 创建点赞表
CREATE TABLE IF NOT EXISTS likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  article_id UUID REFERENCES articles(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(article_id, user_id)
);

-- 5. 创建收藏表
CREATE TABLE IF NOT EXISTS bookmarks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  article_id UUID REFERENCES articles(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(article_id, user_id)
);

-- 6. 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_articles_author_id ON articles(author_id);
CREATE INDEX IF NOT EXISTS idx_articles_created_at ON articles(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_articles_view_count ON articles(view_count DESC);
CREATE INDEX IF NOT EXISTS idx_comments_article_id ON comments(article_id);
CREATE INDEX IF NOT EXISTS idx_likes_article_id ON likes(article_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_user_id ON bookmarks(user_id);

-- 7. 创建更新时间戳的函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 8. 为文章表添加更新时间戳的触发器
DROP TRIGGER IF EXISTS update_articles_updated_at ON articles;
CREATE TRIGGER update_articles_updated_at
  BEFORE UPDATE ON articles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 9. 创建增加浏览量的函数
CREATE OR REPLACE FUNCTION increment_view_count(article_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE articles
  SET view_count = view_count + 1
  WHERE id = article_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. 启用行级安全策略 (RLS)
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;

-- 11. 创建 RLS 策略

-- 文章策略：所有人可读，作者可编辑删除
CREATE POLICY "Anyone can view articles"
  ON articles FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own articles"
  ON articles FOR INSERT
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can update their own articles"
  ON articles FOR UPDATE
  USING (auth.uid() = author_id);

CREATE POLICY "Users can delete their own articles"
  ON articles FOR DELETE
  USING (auth.uid() = author_id);

-- 评论策略：所有人可读，登录用户可创建，作者可删除
CREATE POLICY "Anyone can view comments"
  ON comments FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create comments"
  ON comments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments"
  ON comments FOR DELETE
  USING (auth.uid() = user_id);

-- 用户资料策略：所有人可读，用户可更新自己的资料
CREATE POLICY "Anyone can view user profiles"
  ON user_profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update their own profile"
  ON user_profiles FOR UPDATE
  USING (auth.uid() = id);

-- 点赞策略
CREATE POLICY "Anyone can view likes"
  ON likes FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can like"
  ON likes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove their own likes"
  ON likes FOR DELETE
  USING (auth.uid() = user_id);

-- 收藏策略
CREATE POLICY "Users can view their own bookmarks"
  ON bookmarks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create bookmarks"
  ON bookmarks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own bookmarks"
  ON bookmarks FOR DELETE
  USING (auth.uid() = user_id);

-- 12. 插入一些示例数据（可选）
-- INSERT INTO articles (title, content, summary, author_id, author_name, category, tags)
-- VALUES 
--   ('欢迎来到码农社区', '# 欢迎\n\n这是一个技术分享社区...', '欢迎来到我们的技术社区', 'your-user-id', '管理员', '其他', ARRAY['公告', '欢迎']);
