import { useEffect } from "react";

const SITE_NAME = "Tennis Coach Careers";
const SITE_URL = "https://tennis-coach-careers.com";

export default function SEO({
  title,
  description,
  image = "/og-tennis-coach-careers.jpg",
  url,
  type = "website",
  noindex = false,
  jsonLd,
}) {
  useEffect(() => {
    const finalTitle = title ? `${title} | ${SITE_NAME}` : SITE_NAME;

    const finalDescription =
      description ||
      "Tennis Coach Careers connects tennis coaches with academies, clubs and coaching opportunities worldwide.";

    const finalUrl = url || window.location.href;

    const finalImage = image.startsWith("http")
      ? image
      : `${SITE_URL}${image}`;

    document.title = finalTitle;

    setMeta("name", "description", finalDescription);
    setMeta("name", "robots", noindex ? "noindex,nofollow" : "index,follow");

    setMeta("property", "og:type", type);
    setMeta("property", "og:title", finalTitle);
    setMeta("property", "og:description", finalDescription);
    setMeta("property", "og:image", finalImage);
    setMeta("property", "og:url", finalUrl);
    setMeta("property", "og:site_name", SITE_NAME);

    setMeta("name", "twitter:card", "summary_large_image");
    setMeta("name", "twitter:title", finalTitle);
    setMeta("name", "twitter:description", finalDescription);
    setMeta("name", "twitter:image", finalImage);

    setCanonical(finalUrl);

    let script;

    if (jsonLd) {
      script = document.createElement("script");
      script.type = "application/ld+json";
      script.setAttribute("data-seo-jsonld", "true");
      script.textContent = JSON.stringify(jsonLd);
      document.head.appendChild(script);
    }

    return () => {
      if (script) script.remove();
    };
  }, [title, description, image, url, type, noindex, jsonLd]);

  return null;
}

function setMeta(attribute, key, content) {
  if (!content) return;

  let element = document.head.querySelector(`meta[${attribute}="${key}"]`);

  if (!element) {
    element = document.createElement("meta");
    element.setAttribute(attribute, key);
    document.head.appendChild(element);
  }

  element.setAttribute("content", content);
}

function setCanonical(href) {
  let link = document.head.querySelector('link[rel="canonical"]');

  if (!link) {
    link = document.createElement("link");
    link.setAttribute("rel", "canonical");
    document.head.appendChild(link);
  }

  link.setAttribute("href", href);
}