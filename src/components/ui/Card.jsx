export default function Card({ children, style = {}, ...props }) {
  return (
    <div
      {...props}
      style={{
        background: "#ffffff14",
       border: "1.5px solid rgba(255,255,255,0.85)",
        borderRadius: "var(--radius-lg)",
        padding: 16,
        cursor: "pointer",
        ...style, // ⬅️ OVO JE KLJUČ
      }}
    >
      {children}
    </div>
  );
}
