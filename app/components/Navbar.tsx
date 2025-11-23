import { Link, useNavigate } from 'react-router';
import { Search, User, Edit, Home, LogIn, LogOut } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '~/lib/supabase';

export default function Navbar() {
  const [user, setUser] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    // 获取当前用户
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });

    // 监听认证状态变化
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const handleSearch = (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      // 清空搜索框（可选）
      setSearchQuery('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo和主导航 */}
          <div className="flex items-center space-x-8">
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-red-500 rounded flex items-center justify-center">
                <span className="text-white font-bold text-xl">DN</span>
              </div>
              <span className="text-xl font-bold text-gray-900">DevNexus</span>
            </Link>
            
            <div className="hidden md:flex space-x-6">
              <Link to="/" className="flex items-center space-x-1 text-gray-700 hover:text-red-500 transition">
                <Home size={18} />
                <span>首页</span>
              </Link>
            </div>
          </div>

          {/* 搜索栏 */}
          <div className="flex items-center flex-1 max-w-md mx-8">
            <div className="relative w-full">
              <input
                type="text"
                placeholder="搜索文章、标签..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
              <button
                onClick={handleSearch}
                className="absolute left-3 top-2.5 text-gray-400 hover:text-red-500 transition-colors"
                aria-label="搜索"
              >
                <Search size={20} />
              </button>
            </div>
          </div>

          {/* 用户操作 */}
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <Link
                  to="/write"
                  className="flex items-center space-x-1 px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition"
                >
                  <Edit size={18} />
                  <span>写文章</span>
                </Link>
                <Link to="/profile" className="flex items-center space-x-2">
                  {user.user_metadata?.avatar_url ? (
                    <img
                      src={user.user_metadata.avatar_url}
                      alt="avatar"
                      className="w-8 h-8 rounded-full"
                    />
                  ) : (
                    <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                      <User size={18} className="text-gray-600" />
                    </div>
                  )}
                  <span className="text-gray-700">{user.user_metadata?.username || '用户'}</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-1 text-gray-600 hover:text-red-500 transition"
                >
                  <LogOut size={18} />
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="flex items-center space-x-1 px-4 py-2 text-gray-700 hover:text-red-500 transition"
                >
                  <LogIn size={18} />
                  <span>登录</span>
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition"
                >
                  注册
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
