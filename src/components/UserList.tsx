
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Profile {
  id: string;
  username: string;
  email: string;
  online_status: boolean;
  avatar_url?: string;
}

interface UserListProps {
  selectedUserId: string | null;
  onUserSelect: (userId: string, username: string) => void;
}

const UserList = ({ selectedUserId, onUserSelect }: UserListProps) => {
  const [users, setUsers] = useState<Profile[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    const fetchUsers = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, email, online_status, avatar_url')
        .neq('id', user?.id);

      if (error) {
        console.error('Error fetching users:', error);
      } else {
        setUsers(data || []);
      }
    };

    if (user) {
      fetchUsers();
    }

    // Subscribe to profile changes
    const channel = supabase
      .channel('profiles-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'profiles'
      }, () => {
        fetchUsers();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const getInitials = (username: string, email: string) => {
    const name = username || email.split('@')[0];
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Users</h2>
        <p className="text-sm text-gray-500">{users.length} users online</p>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-2">
          {users.map((profile) => (
            <div
              key={profile.id}
              onClick={() => onUserSelect(profile.id, profile.username || profile.email)}
              className={`flex items-center p-3 rounded-lg cursor-pointer transition-colors ${
                selectedUserId === profile.id 
                  ? 'bg-blue-50 border border-blue-200' 
                  : 'hover:bg-gray-50'
              }`}
            >
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-gradient-to-br from-blue-400 to-purple-500 text-white">
                  {getInitials(profile.username || '', profile.email)}
                </AvatarFallback>
              </Avatar>
              <div className="ml-3 flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {profile.username || profile.email.split('@')[0]}
                </p>
                <p className="text-xs text-gray-500 truncate">{profile.email}</p>
              </div>
              <div className={`w-3 h-3 rounded-full ${
                profile.online_status ? 'bg-green-400' : 'bg-gray-300'
              }`} />
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};

export default UserList;
