import { ArcadeShell } from './arcade';
import { Game2048 } from './Game2048';

export default function App() {
  return (
    <ArcadeShell gameId="2048">
      <Game2048 />
    </ArcadeShell>
  );
}
