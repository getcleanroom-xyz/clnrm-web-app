export function OgImageContent() {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        background: "#0A0A0A",
        color: "#F0F0F0",
        padding: "72px",
        position: "relative",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          width: 220,
          height: 220,
          background:
            "repeating-linear-gradient(90deg, rgba(0,255,65,0.35) 0 2px, transparent 2px 34px)",
          opacity: 0.35,
        }}
      />
      <div
        style={{
          position: "absolute",
          right: 72,
          top: 0,
          width: 3,
          height: "100%",
          background:
            "linear-gradient(rgba(0,255,65,0.9), rgba(0,255,65,0.25))",
        }}
      />
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 18,
        }}
      >
        <div
          style={{
            width: 14,
            height: 14,
            borderRadius: 999,
            background: "#00FF41",
            boxShadow: "0 0 24px #00FF41",
          }}
        />
        <div
          style={{
            fontSize: 30,
            letterSpacing: 12,
            color: "#00FF41",
            textTransform: "uppercase",
          }}
        >
          CleanRoom
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            fontSize: 74,
            fontWeight: 700,
            lineHeight: 1.02,
            letterSpacing: -1,
            maxWidth: 780,
          }}
        >
          Virtual disposable browsers.{" "}
          <span style={{ color: "#00FF41" }}>Browse without being watched.</span>
        </div>
        <div
          style={{
            fontSize: 34,
            color: "#A0A0A0",
            letterSpacing: 2,
          }}
        >
          Tor-routed &middot; Pay with Monero &middot; Auto-destructs
        </div>
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontSize: 26,
          letterSpacing: 4,
          color: "#6A6A6A",
        }}
      >
        <span>getcleanroom.xyz</span>
        <span style={{ color: "#00FF41" }}>~$0.025/min</span>
      </div>
    </div>
  );
}