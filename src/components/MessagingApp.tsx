
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import UserList from './UserList';
import ChatArea from './ChatArea';
import { Button } from '@/components/ui/button';
import { LogOut, MessageCircle } from 'lucide-react';

const MessagingApp = () => {
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedUsername, setSelectedUsername] = useState<string>('');
  const { user, signOut } = useAuth();

  useEffect(() => {
    // Update user online status
    const updateOnlineStatus = async () => {
      if (user) {
        await supabase
          .from('profiles')
          .update({ 
            online_status: true,
            last_seen: new Date().toISOString()
          })
          .eq('id', user.id);
      }
    };

    updateOnlineStatus();

    // Update offline status on page unload
    const handleBeforeUnload = async () => {
      if (user) {
        await supabase
          .from('profiles')
          .update({ 
            online_status: false,
            last_seen: new Date().toISOString()
          })
          .eq('id', user.id);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [user]);

  const handleUserSelect = (userId: string, username: string) => {
    setSelectedUserId(userId);
    setSelectedUsername(username);
  };

  const handleSignOut = async () => {
    if (user) {
      await supabase
        .from('profiles')
        .update({ 
          online_status: false,
          last_seen: new Date().toISOString()
        })
        .eq('id', user.id);
    }
    await signOut();
  };

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <MessageCircle className="h-8 w-8 text-blue-500 mr-2" />
            <h1 className="text-xl font-bold text-gray-900">Messaging App</h1>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">
              Welcome, {user?.email?.split('@')[0]}
            </span>
            <Button onClick={handleSignOut} variant="outline" size="sm">
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        <UserList 
          selectedUserId={selectedUserId}
          onUserSelect={handleUserSelect}
        />
        <ChatArea 
          selectedUserId={selectedUserId}
          selectedUsername={selectedUsername}
        />
      </div>
    </div>
  );
};

export default MessagingApp;
