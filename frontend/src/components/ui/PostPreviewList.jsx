import React from "react";
import { Link } from "react-router-dom";

const PostPreviewList = ({ posts }) => {
  if (!posts.length) return <p>게시글이 없습니다.</p>;

  return (
    <ul className="space-y-4">
      {posts.map((post) => (
        <li key={post.bno} className="border-b pb-2">
          <Link to={`/posts/${post.bno}`} className="text-lg font-bold text-blue-600 hover:underline">
            {post.title}
          </Link>
          <div className="text-sm text-gray-500">
            {post.writerName} | {post.createdDate} | 댓글 {post.replyCount || 0}
          </div>
        </li>
      ))}
    </ul>
  );
};

export default PostPreviewList;