import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../firebase";
import "./BlogPost.css";

export default function BlogPost() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPost() {
      try {
        const snap = await getDoc(doc(db, "blogPosts", id));

        if (snap.exists()) {
          setPost({
            id: snap.id,
            ...snap.data(),
          });
        } else {
          setPost(null);
        }
      } catch (error) {
        console.error("Failed to load blog post:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchPost();
  }, [id]);

  if (loading) {
    return (
      <main className="blogPostPage">
        <div className="blogPostCard">
          <p>Loading blog post...</p>
        </div>
      </main>
    );
  }

  if (!post) {
    return (
      <main className="blogPostPage">
        <div className="blogPostCard">
          <h1>Blog post not found</h1>
          <button className="blogBackBtn" onClick={() => navigate("/")}>
            Back to home
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="blogPostPage">
      <article className="blogPostCard">
        <button className="blogBackBtn" onClick={() => navigate("/")}>
          ← Back to home
        </button>

        {post.mediaType === "image" && post.mediaUrl && (
          <img className="blogPostMedia" src={post.mediaUrl} alt={post.title} />
        )}

        {post.mediaType === "video" && post.mediaUrl && (
          <video className="blogPostMedia" src={post.mediaUrl} controls />
        )}

        <h1>{post.title}</h1>

        {post.excerpt && <p className="blogPostExcerpt">{post.excerpt}</p>}

        <div className="blogPostContent">{post.content}</div>
      </article>
    </main>
  );
}