'use client';

import { useState } from 'react';
import { Post } from '@/types';
import { likePost, unlikePost } from '@/lib/api';
import { useSession } from 'next-auth/react';

const TYPE_LABELS: Record<string, string> = {
  achievement: 'Achievement',
  cv_share: 'CV Share',
  opportunity_share: 'Opportunity',
  learning_update: 'Learning Update',
};

const TYPE_COLORS: Record<string, string> = {
  achievement: 'bg-yellow-100 text-yellow-800',
  cv_share: 'bg-blue-100 text-blue-800',
  opportunity_share: 'bg-green-100 text-green-800',
  learning_update: 'bg-purple-100 text-purple-800',
};

const LEVEL_COLORS: Record<string, string> = {
  beginner: 'bg-gray-100 text-gray-700',
  explorer: 'bg-blue-100 text-blue-700',
  learner: 'bg-cyan-100 text-cyan-700',
  achiever: 'bg-green-100 text-green-700',
  expert: 'bg-orange-100 text-orange-700',
  master: 'bg-purple-100 text-purple-700',
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

interface Props {
  post: Post;
}

export default function PostCard({ post }: Props) {
  const { data: session } = useSession();
  const token = (session as any)?.accessToken as string;

  const [liked, setLiked] = useState(post.is_liked);
  const [likeCount, setLikeCount] = useState(post.like_count);

  async function handleLike() {
    const prevLiked = liked;
    const prevCount = likeCount;
    setLiked(!prevLiked);
    setLikeCount(prevLiked ? prevCount - 1 : prevCount + 1);
    try {
      if (prevLiked) {
        await unlikePost(token, post.id);
      } else {
        await likePost(token, post.id);
      }
    } catch {
      setLiked(prevLiked);
      setLikeCount(prevCount);
    }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
            {post.user_initials}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-gray-900 text-sm">{post.user_name}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${LEVEL_COLORS[post.user_level] ?? 'bg-gray-100 text-gray-700'}`}>
                {post.user_level}
              </span>
            </div>
            <span className="text-xs text-gray-400">{timeAgo(post.created_at)}</span>
          </div>
        </div>
        <span className={`text-xs px-2 py-1 rounded-full font-medium flex-shrink-0 ${TYPE_COLORS[post.type] ?? 'bg-gray-100 text-gray-700'}`}>
          {TYPE_LABELS[post.type] ?? post.type}
        </span>
      </div>

      <p className="text-gray-700 text-sm leading-relaxed">{post.content}</p>

      <button
        onClick={handleLike}
        className={`flex items-center gap-1.5 text-sm font-medium transition-colors ${
          liked ? 'text-red-500' : 'text-gray-400 hover:text-red-400'
        }`}
      >
        <span>{liked ? '❤️' : '🤍'}</span>
        <span>{likeCount}</span>
      </button>
    </div>
  );
}
