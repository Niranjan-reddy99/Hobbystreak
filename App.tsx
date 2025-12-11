import './App.css';
import React, { useState, useEffect } from 'react';

// ==========================================
// 1. DIRECT SUPABASE CONFIGURATION
// ==========================================
// Paste your actual keys here temporarily to test
const SUPABASE_URL = 'https://vfmwapcfycmpgbnsubic.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZmbXdhcGNmeWNtcGdicnN1YmljIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzI5MzQwNTMsImV4cCI6MjA0ODUxMDA1M30.uHjkNn8JY8Oke3JgN2Gk7L6L9_hA0t7g-Q4dXcVKjR8';

// Create a custom fetch client that doesn't use localStorage
const createDirectSupabaseClient = () => {
  let currentSession = null;
  
  return {
    auth: {
      signInWithPassword: async ({ email, password }: { email: string, password: string }) => {
        const response = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`
          },
          body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        if (data.access_token) {
          currentSession = {
            user: { id: data.user?.id, email: data.user?.email },
            access_token: data.access_token
          };
          return { data: { session: currentSession, user: data.user }, error: null };
        } else {
          return { data: null, error: data };
        }
      },
      
      signUp: async ({ email, password }: { email: string, password: string }) => {
        const response = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`
          },
          body: JSON.stringify({ email, password })
        });
        
        return await response.json();
      },
      
      signOut: async () => {
        currentSession = null;
      },
      
      getSession: () => ({ data: { session: currentSession } })
    },
    
    from: (table: string) => ({
      select: (columns = '*') => ({
        eq: (column: string, value: string) => ({
          single: async () => {
            const headers: any = {
              'apikey': SUPABASE_KEY,
              'Authorization': `Bearer ${SUPABASE_KEY}`
            };
            
            if (currentSession?.access_token) {
              headers['Authorization'] = `Bearer ${currentSession.access_token}`;
            }
            
            const response = await fetch(
              `${SUPABASE_URL}/rest/v1/${table}?${column}=eq.${value}&select=${columns}`,
              { headers }
            );
            
            if (response.status === 406) {
              throw new Error('Permission denied - Check RLS policies');
            }
            
            const data = await response.json();
            return { data: data[0], error: null };
          }
        }),
        
        order: (column: string, options: { ascending: boolean }) => ({
          async then(callback: Function) {
            const headers: any = {
              'apikey': SUPABASE_KEY,
              'Authorization': `Bearer ${SUPABASE_KEY}`
            };
            
            const response = await fetch(
              `${SUPABASE_URL}/rest/v1/${table}?select=${columns}&order=${column}.${options.ascending ? 'asc' : 'desc'}`,
              { headers }
            );
            
            const data = await response.json();
            callback({ data, error: null });
          }
        })
      }),
      
      insert: (data: any) => ({
        select: () => ({
          single: async () => {
            const headers: any = {
              'Content-Type': 'application/json',
              'apikey': SUPABASE_KEY,
              'Prefer': 'return=representation'
            };
            
            if (currentSession?.access_token) {
              headers['Authorization'] = `Bearer ${currentSession.access_token}`;
            } else {
              headers['Authorization'] = `Bearer ${SUPABASE_KEY}`;
            }
            
            const response = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
              method: 'POST',
              headers,
              body: JSON.stringify(data)
            });
            
            const result = await response.json();
            return { data: result[0], error: null };
          }
        })
      }),
      
      update: (data: any) => ({
        eq: (column: string, value: string) => ({
          async then(callback: Function) {
            const headers: any = {
              'Content-Type': 'application/json',
              'apikey': SUPABASE_KEY,
              'Prefer': 'return=representation'
            };
            
            if (currentSession?.access_token) {
              headers['Authorization'] = `Bearer ${currentSession.access_token}`;
            }
            
            const response = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${column}=eq.${value}`, {
              method: 'PATCH',
              headers,
              body: JSON.stringify(data)
            });
            
            callback({ error: null });
          }
        })
      })
    })
  };
};

const supabase = createDirectSupabaseClient();

// ==========================================
// 2. SIMPLE TYPES
// ==========================================
enum ViewState { LOGIN, REGISTER, FEED, CREATE_POST, PROFILE }

interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar: string;
  stats: { totalStreak: number; points: number };
}

interface Post {
  id: string;
  userId: string;
  content: string;
  authorName: string;
  authorAvatar: string;
  timestamp: string;
}

// ==========================================
// 3. MAIN APP - ULTRA SIMPLE
// ==========================================
export default function App() {
  const [view, setView] = useState<ViewState>(ViewState.LOGIN);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [postContent, setPostContent] = useState('');
  
  const [toast, setToast] = useState<string>('');
  const [loading, setLoading] = useState(false);

  // Show toast
  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(''), 3000);
  };

  // Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      
      if (error) {
        showToast(`Error: ${error.message}`);
      } else if (data?.session?.user) {
        // Get user profile
        const profileResponse = await fetch(
          `${SUPABASE_URL}/rest/v1/profiles?id=eq.${data.session.user.id}&select=*`,
          {
            headers: {
              'apikey': SUPABASE_KEY,
              'Authorization': `Bearer ${data.session.access_token || SUPABASE_KEY}`
            }
          }
        );
        
        const profileData = await profileResponse.json();
        
        if (profileData[0]) {
          setCurrentUser({
            id: data.session.user.id,
            name: profileData[0].name || email.split('@')[0],
            email: email,
            avatar: profileData[0].avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`,
            stats: profileData[0].stats || { totalStreak: 0, points: 0 }
          });
          
          setView(ViewState.FEED);
          fetchPosts();
          showToast(`Welcome ${profileData[0].name || email.split('@')[0]}!`);
        } else {
          // Create profile if doesn't exist
          await fetch(`${SUPABASE_URL}/rest/v1/profiles`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': SUPABASE_KEY,
              'Authorization': `Bearer ${data.session.access_token || SUPABASE_KEY}`,
              'Prefer': 'return=representation'
            },
            body: JSON.stringify({
              id: data.session.user.id,
              name: name || email.split('@')[0],
              email: email,
              avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`,
              stats: { points: 0, totalStreak: 0 }
            })
          });
          
          setCurrentUser({
            id: data.session.user.id,
            name: name || email.split('@')[0],
            email: email,
            avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`,
            stats: { totalStreak: 0, points: 0 }
          });
          
          setView(ViewState.FEED);
          fetchPosts();
          showToast('Profile created! Welcome!');
        }
      }
    } catch (error: any) {
      showToast(`Login failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Register
  const handleRegister = async () => {
    setLoading(true);
    
    try {
      const { data, error } = await supabase.auth.signUp({ email, password });
      
      if (error) {
        showToast(`Error: ${error.message}`);
      } else if (data?.user) {
        // Create profile
        await fetch(`${SUPABASE_URL}/rest/v1/profiles`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`,
            'Prefer': 'return=representation'
          },
          body: JSON.stringify({
            id: data.user.id,
            name: name,
            email: email,
            avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`,
            stats: { points: 0, totalStreak: 0 }
          })
        });
        
        showToast('Account created! Please login.');
        setView(ViewState.LOGIN);
        setEmail('');
        setPassword('');
        setName('');
      }
    } catch (error: any) {
      showToast(`Registration failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Fetch posts
  const fetchPosts = async () => {
    try {
      const response = await fetch(
        `${SUPABASE_URL}/rest/v1/posts?select=*&order=created_at.desc`,
        {
          headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`
          }
        }
      );
      
      const data = await response.json();
      
      setPosts(data.map((post: any) => ({
        id: post.id,
        userId: post.user_id,
        content: post.content,
        authorName: post.author_name || 'User',
        authorAvatar: post.author_avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.user_id || 'anonymous'}`,
        timestamp: new Date(post.created_at).toLocaleDateString()
      })));
    } catch (error) {
      console.error('Error fetching posts:', error);
    }
  };

  // Create post
  const handleCreatePost = async () => {
    if (!postContent.trim()) {
      showToast('Please write something!');
      return;
    }
    
    if (!currentUser) {
      showToast('Please login first!');
      setView(ViewState.LOGIN);
      return;
    }
    
    setLoading(true);
    
    try {
      const session = await supabase.auth.getSession();
      const accessToken = session.data?.session?.access_token || SUPABASE_KEY;
      
      await fetch(`${SUPABASE_URL}/rest/v1/posts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${accessToken}`,
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({
          user_id: currentUser.id,
          content: postContent,
          author_name: currentUser.name,
          author_avatar: currentUser.avatar
        })
      });
      
      // Update user points
      const newPoints = (currentUser.stats.points || 0) + 10;
      await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${currentUser.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${accessToken}`,
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({
          stats: { ...currentUser.stats, points: newPoints, totalStreak: (currentUser.stats.totalStreak || 0) + 1 }
        })
      });
      
      setCurrentUser({
        ...currentUser,
        stats: { ...currentUser.stats, points: newPoints, totalStreak: (currentUser.stats.totalStreak || 0) + 1 }
      });
      
      setPostContent('');
      fetchPosts();
      setView(ViewState.FEED);
      showToast('Posted! +10 points');
    } catch (error: any) {
      showToast(`Error posting: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Logout
  const handleLogout = async () => {
    await supabase.auth.signOut();
    setCurrentUser(null);
    setView(ViewState.LOGIN);
    showToast('Logged out');
  };

  // Initial fetch
  useEffect(() => {
    fetchPosts();
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="p-6 border-b">
          <h1 className="text-2xl font-bold text-center">Hobbystreak</h1>
          {toast && (
            <div className="mt-2 p-2 bg-green-100 text-green-800 text-sm rounded text-center">
              {toast}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-6">
          {/* LOGIN */}
          {view === ViewState.LOGIN && (
            <div>
              <h2 className="text-xl font-bold mb-4">Login</h2>
              <form onSubmit={handleLogin} className="space-y-3">
                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-3 border rounded-lg"
                  required
                />
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full p-3 border rounded-lg"
                  required
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-black text-white p-3 rounded-lg font-bold disabled:opacity-50"
                >
                  {loading ? 'Logging in...' : 'Login'}
                </button>
              </form>
              <button
                onClick={() => setView(ViewState.REGISTER)}
                className="w-full mt-3 text-gray-600"
              >
                Create new account
              </button>
            </div>
          )}

          {/* REGISTER */}
          {view === ViewState.REGISTER && (
            <div>
              <h2 className="text-xl font-bold mb-4">Register</h2>
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-3 border rounded-lg"
                  required
                />
                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-3 border rounded-lg"
                  required
                />
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full p-3 border rounded-lg"
                  required
                />
                <button
                  onClick={handleRegister}
                  disabled={loading}
                  className="w-full bg-black text-white p-3 rounded-lg font-bold disabled:opacity-50"
                >
                  {loading ? 'Creating account...' : 'Create Account'}
                </button>
              </div>
              <button
                onClick={() => setView(ViewState.LOGIN)}
                className="w-full mt-3 text-gray-600"
              >
                Back to login
              </button>
            </div>
          )}

          {/* FEED */}
          {view === ViewState.FEED && currentUser && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Feed</h2>
                <div className="flex items-center gap-2">
                  <span className="text-sm bg-yellow-100 px-2 py-1 rounded">
                    {currentUser.stats.points} pts
                  </span>
                  <button
                    onClick={handleLogout}
                    className="text-red-500 text-sm"
                  >
                    Logout
                  </button>
                </div>
              </div>
              
              <div className="mb-4 p-3 bg-gray-100 rounded-lg">
                <p className="font-bold">{currentUser.name}</p>
                <p className="text-sm text-gray-600">{currentUser.email}</p>
              </div>
              
              <button
                onClick={() => setView(ViewState.CREATE_POST)}
                className="w-full bg-black text-white p-3 rounded-lg font-bold mb-4"
              >
                + Create Post
              </button>
              
              <div className="space-y-3">
                {posts.map(post => (
                  <div key={post.id} className="p-4 border rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <img
                        src={post.authorAvatar}
                        alt={post.authorName}
                        className="w-8 h-8 rounded-full"
                      />
                      <div>
                        <p className="font-bold">{post.authorName}</p>
                        <p className="text-xs text-gray-500">{post.timestamp}</p>
                      </div>
                    </div>
                    <p>{post.content}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* CREATE POST */}
          {view === ViewState.CREATE_POST && currentUser && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">New Post</h2>
                <button
                  onClick={() => setView(ViewState.FEED)}
                  className="text-gray-600"
                >
                  Cancel
                </button>
              </div>
              
              <div className="flex items-center gap-2 mb-4 p-3 bg-gray-100 rounded-lg">
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  className="w-10 h-10 rounded-full"
                />
                <div>
                  <p className="font-bold">Posting as {currentUser.name}</p>
                </div>
              </div>
              
              <textarea
                value={postContent}
                onChange={(e) => setPostContent(e.target.value)}
                placeholder="What's on your mind?"
                className="w-full h-32 p-3 border rounded-lg mb-4"
              />
              
              <button
                onClick={handleCreatePost}
                disabled={loading}
                className="w-full bg-black text-white p-3 rounded-lg font-bold disabled:opacity-50"
              >
                {loading ? 'Posting...' : 'Post Now'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
