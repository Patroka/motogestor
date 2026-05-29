import Link from "next/link";

export default function NotFound() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        backgroundColor: "#0f172a",
        color: "#ffffff",
        fontFamily: "sans-serif",
        textAlign: "center",
        gap: "16px",
      }}
    >
      <div style={{ fontSize: "72px", fontWeight: "bold", color: "#ef4444" }}>
        404
      </div>
      <h1 style={{ fontSize: "24px", margin: 0 }}>Página não encontrada</h1>
      <p style={{ color: "#94a3b8", margin: 0 }}>
        A página que você tentou acessar não existe.
      </p>
      <Link
        href="/dashboard"
        style={{
          marginTop: "16px",
          padding: "12px 24px",
          backgroundColor: "#ef4444",
          color: "#ffffff",
          borderRadius: "8px",
          textDecoration: "none",
          fontWeight: "bold",
        }}
      >
        Voltar ao Dashboard
      </Link>
    </div>
  );
}
