import { useState, FormEvent } from 'react';
import type { Task, CreateCommentInput } from '../types';
import { api } from '../api';
import { useComments } from '../hooks';

interface CommentThreadProps {
  task: Task;
}

export default function CommentThread({ task }: CommentThreadProps) {
  const [newComment, setNewComment] = useState('');
  const [authorType, setAuthorType] = useState<'user' | 'agent'>('user');
  const [authorName, setAuthorName] = useState('');
  const [loading, setLoading] = useState(false);

  const { comments, refetch } = useComments(task.id);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setLoading(true);
    try {
      const input: CreateCommentInput = {
        content: newComment.trim(),
        author_type: authorType,
        author_name: authorName.trim() || (authorType === 'agent' ? 'agent' : 'user'),
      };
      await api.comments.create(task.id, input);
      setNewComment('');
      refetch();
    } catch (error) {
      console.error('Failed to add comment:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString();
  };

  return (
    <div className="comment-thread">
      <h3>Comments</h3>
      
      <div className="comments-list">
        {comments.length === 0 ? (
          <p className="no-comments">No comments yet</p>
        ) : (
          comments.map((comment) => (
            <div
              key={comment.id}
              className={`comment ${comment.author_type === 'agent' ? 'comment-agent' : 'comment-user'}`}
            >
              <div className="comment-header">
                <span className="comment-author">
                  {comment.author_type === 'agent' ? '🤖' : '👤'} {comment.author_name}
                </span>
                <span className="comment-date">{formatDate(comment.created_at)}</span>
              </div>
              <div className="comment-content">{comment.content}</div>
            </div>
          ))
        )}
      </div>

      <form className="comment-form" onSubmit={handleSubmit}>
        <div className="comment-form-row">
          <select
            value={authorType}
            onChange={(e) => setAuthorType(e.target.value as 'user' | 'agent')}
            className="author-type-select"
          >
            <option value="user">User</option>
            <option value="agent">Agent</option>
          </select>
          <input
            type="text"
            value={authorName}
            onChange={(e) => setAuthorName(e.target.value)}
            placeholder="Name (optional)"
            className="author-name-input"
          />
        </div>
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Write a comment..."
          rows={3}
          disabled={loading}
        />
        <button type="submit" className="btn-primary" disabled={loading || !newComment.trim()}>
          {loading ? 'Posting...' : 'Post Comment'}
        </button>
      </form>
    </div>
  );
}