import { Route, Routes } from "react-router-dom";
import { AppShell } from "./components/AppShell";
import { Home } from "./screens/Home";
import { Solo } from "./screens/Solo";
import { CreateRoom } from "./screens/CreateRoom";
import { Room } from "./screens/Room";
import { Draft } from "./screens/Draft";
import { Simulate } from "./screens/Simulate";
import { Result } from "./screens/Result";
import { Proof } from "./screens/Proof";
import { Agents } from "./screens/Agents";
import { Leaderboard } from "./screens/Leaderboard";
import { Pitch } from "./screens/Pitch";

function Wrapped({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}

export function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/solo" element={<Wrapped><Solo /></Wrapped>} />
      <Route path="/room/create" element={<Wrapped><CreateRoom /></Wrapped>} />
      <Route path="/room/:id" element={<Wrapped><Room /></Wrapped>} />
      <Route path="/draft/:roomId" element={<Wrapped><Draft /></Wrapped>} />
      <Route path="/simulate/:roomId" element={<Wrapped><Simulate /></Wrapped>} />
      <Route path="/result/:roomId" element={<Wrapped><Result /></Wrapped>} />
      <Route path="/proof/:roomId" element={<Wrapped><Proof /></Wrapped>} />
      <Route path="/agents" element={<Wrapped><Agents /></Wrapped>} />
      <Route path="/leaderboard" element={<Wrapped><Leaderboard /></Wrapped>} />
      <Route path="/pitch" element={<Wrapped><Pitch /></Wrapped>} />
    </Routes>
  );
}
