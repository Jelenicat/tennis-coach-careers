export default function Shell({ children }) {
  return (
    <>
      {children}

      <footer style={{ borderTop: "1px solid var(--line)" }}>
        <div
          className="container"
          style={{ padding: "16px 0", color: "var(--muted)", fontSize: 14 }}
        >
          © Tennis Coach Careers
        </div>
      </footer>
    </>
  );
}
