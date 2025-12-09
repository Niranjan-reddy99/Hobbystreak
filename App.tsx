export default function App() {
  const view: ViewState = "home";

  return (
    <div style={{ padding: 20 }}>
      <h1>🚀 Hobbystreak UI</h1>
      <p>Current view: {view}</p>

      <div style={{ display: "flex", gap: "12px", marginTop: "20px" }}>
        <HomeIcon />
        <CompassIcon />
        <UserIcon />
        <HeartIcon />
      </div>
    </div>
  );
}

