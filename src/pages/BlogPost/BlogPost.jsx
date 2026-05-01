import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../firebase";
import SEO from "../../components/SEO";
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
      <>
        <SEO
          title="Loading Blog Post"
          description="Loading article from Tennis Coach Careers."
          noindex
        />

        <main className="blogPostPage">
          <div className="blogPostCard">
            <p>Loading blog post...</p>
          </div>
        </main>
      </>
    );
  }

  if (!post) {
    return (
      <>
        <SEO
          title="Blog Post Not Found"
          description="The requested blog post could not be found."
          noindex
        />

        <main className="blogPostPage">
          <div className="blogPostCard">
            <h1>Blog post not found</h1>

            <button className="blogBackBtn" onClick={() => navigate("/")}>
              Back to home
            </button>
          </div>
        </main>
      </>
    );
  }

  const postDescription =
    post.excerpt ||
    "Read tennis coaching insights, career advice and academy updates from Tennis Coach Careers.";

  const postImage =
    post.mediaType === "image" && post.mediaUrl
      ? post.mediaUrl
      : "/og-tennis-coach-careers.jpg";

  const postUrl = `https://tennis-coach-careers.com/blog/${post.id}`;

  return (
    <>
      <SEO
        title={post.title}
        description={postDescription}
        image={postImage}
        url={postUrl}
        type="article"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "BlogPosting",
          headline: post.title,
          description: postDescription,
          image:
            post.mediaType === "image" && post.mediaUrl
              ? post.mediaUrl
              : "https://tennis-coach-careers.com/og-tennis-coach-careers.jpg",
          url: postUrl,
          publisher: {
            "@type": "Organization",
            name: "Tennis Coach Careers",
            logo: {
              "@type": "ImageObject",
              url: "https://tennis-coach-careers.com/favicon.png",
            },
          },
        }}
      />

      <main className="blogPostPage">
        <article className="blogPostCard">
          <button className="blogBackBtn" onClick={() => navigate("/")}>
            ← Back to home
          </button>

          {post.mediaType === "image" && post.mediaUrl && (
            <img
              className="blogPostMedia"
              src={post.mediaUrl}
              alt={post.title}
            />
          )}

          {post.mediaType === "video" && post.mediaUrl && (
            <video className="blogPostMedia" src={post.mediaUrl} controls />
          )}

          <h1>{post.title}</h1>

          {post.excerpt && <p className="blogPostExcerpt">{post.excerpt}</p>}

          <div className="blogPostContent">{post.content}</div>
        </article>
      </main>
    </>
  );
}