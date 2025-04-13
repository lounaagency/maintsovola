
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Post } from '@/types/post';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Shell } from '@/components/Shell';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

interface FeedItem {
  id: number;
  title: string;
  content: string;
  created_at: string;
  entity_type?: string;
  entity_id?: number;
  id_utilisateur: string;
  author?: {
    nom?: string;
    prenoms?: string;
    avatar_url?: string;
  };
}

const Feed: React.FC = () => {
  const [posts, setPosts] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      // Using a view or table that actually exists
      const { data, error } = await supabase
        .from('feed')
        .select(`
          *,
          author:id_utilisateur (
            nom,
            prenoms,
            avatar_url
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      setPosts(data || []);
    } catch (error: any) {
      console.error('Error fetching posts:', error);
      toast.error(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), {
        addSuffix: true,
        locale: fr,
      });
    } catch (error) {
      console.error("Error formatting date:", error);
      return 'Date inconnue';
    }
  };

  if (loading) {
    return (
      <Shell>
        <div className="flex justify-center items-center h-full">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="space-y-4">
        {posts.map((post) => (
          <Card key={post.id} className="bg-white">
            <CardHeader>
              <div className="flex items-center space-x-4">
                <Avatar>
                  <AvatarImage src={post.author?.avatar_url || "https://avatars.dicebear.com/api/open-peeps/:seed.svg"} />
                  <AvatarFallback>
                    {post.author?.nom?.charAt(0)}
                    {post.author?.prenoms?.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <CardTitle className="green-title">{post.title}</CardTitle>
                  <CardDescription>
                    {post.author?.nom} {post.author?.prenoms} - {formatDate(post.created_at || '')}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p>{post.content}</p>
              {post.entity_type && post.entity_id && (
                <div className="mt-4">
                  <Badge>{post.entity_type}</Badge>
                  {post.entity_type === 'terrain' && (
                    <Button variant="secondary" size="sm" asChild>
                      <Link to={`/terrains/${post.entity_id}`}>Voir le terrain</Link>
                    </Button>
                  )}
                  {post.entity_type === 'projet' && (
                    <Button variant="secondary" size="sm" asChild>
                      <Link to={`/projets/${post.entity_id}`}>Voir le projet</Link>
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </Shell>
  );
};

export default Feed;
