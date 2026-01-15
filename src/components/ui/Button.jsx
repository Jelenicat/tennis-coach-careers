export default function Button({ children, variant = "primary", ...props }) {
  const styles = {
    primary: {
      background: "var(--accent)",
      color: "#0b2a3d",
      border: "none",
    },
   outline: {
  background: "transparent",
  color: "var(--text)",
  border: "2px solid var(--line)", // ⬅️ DEBLJI BORDER
},

  };

  return (
    <button
      {...props}
      style={{
        padding: "12px 18px",
        borderRadius: 999,
        fontWeight: 800,
        cursor: "pointer",
        minWidth: 140,
        ...styles[variant],
      }}
    >
      {children}
    </button>
  );
}
