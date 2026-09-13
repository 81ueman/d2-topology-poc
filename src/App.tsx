import { useCallback, useEffect, useRef, useState } from "react";
import type { Diagram } from "@d2lang/d2";
import type { Edge } from "@xyflow/react";
import type { LayoutEngine } from "./d2/client";
import { compile } from "./d2/client";
import type { DirectionSetting } from "./d2/direction";
import { withDirection } from "./d2/direction";
import TopologyFlow from "./components/TopologyFlow";
import type { D2NodeType } from "./components/D2Node";
import DetailPanel from "./components/DetailPanel";
import type { Selection } from "./components/DetailPanel";
import SourceEditor from "./components/SourceEditor";
import type { Sample } from "./samples";
import { DEFAULT_SOURCE } from "./samples";

export default function App() {
  const [source, setSource] = useState(DEFAULT_SOURCE);
  const [layout, setLayout] = useState<LayoutEngine>("elk");
  const [direction, setDirection] = useState<DirectionSetting>("auto");
  const [diagram, setDiagram] = useState<Diagram | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<{ shapes: number; links: number; ms: number } | null>(null);
  const [selection, setSelection] = useState<Selection>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [renderId, setRenderId] = useState(0);

  const sourceRef = useRef(source);
  const layoutRef = useRef(layout);
  const directionRef = useRef(direction);
  sourceRef.current = source;
  layoutRef.current = layout;
  directionRef.current = direction;

  const apply = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const src = withDirection(sourceRef.current, directionRef.current);
      const { diagram: next, ms } = await compile(src, layoutRef.current);
      setDiagram(next);
      setStats({
        shapes: next.shapes?.length ?? 0,
        links: next.connections?.length ?? 0,
        ms,
      });
      setSelection(null);
      setRenderId((v) => v + 1);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  const didInit = useRef(false);
  useEffect(() => {
    if (didInit.current) return;
    didInit.current = true;
    void apply();
  }, [apply]);

  const handleNodeSelect = useCallback((node: D2NodeType | null) => {
    setSelection(node ? { kind: "node", node } : null);
  }, []);

  const handleEdgeSelect = useCallback((edge: Edge | null) => {
    setSelection(edge ? { kind: "edge", edge } : null);
  }, []);

  const handlePickSample = useCallback((sample: Sample) => {
    setSource(sample.source);
    sourceRef.current = sample.source;
    void apply();
  }, [apply]);

  const handleDirectionChange = useCallback((value: DirectionSetting) => {
    setDirection(value);
    directionRef.current = value;
    void apply();
  }, [apply]);

  return (
    <div className="app">
      <header className="toolbar">
        <button
          className="icon-btn"
          onClick={() => setSidebarOpen((v) => !v)}
          aria-label="ソースパネル開閉"
          title="ソースパネル開閉"
        >
          ☰
        </button>
        <h1>D2 Network Topology</h1>
        <div className="spacer" />
        {stats ? (
          <div className="stats">
            <span>{stats.shapes} nodes</span>
            <span>{stats.links} links</span>
            <span>{stats.ms.toFixed(0)} ms</span>
          </div>
        ) : null}
        <button className="btn primary" onClick={() => void apply()} disabled={loading}>
          再描画
        </button>
      </header>

      <div className="body">
        {sidebarOpen ? (
          <SourceEditor
            source={source}
            onSourceChange={setSource}
            layout={layout}
            onLayoutChange={setLayout}
            direction={direction}
            onDirectionChange={handleDirectionChange}
            onApply={() => void apply()}
            loading={loading}
            error={error}
            onPickSample={handlePickSample}
          />
        ) : null}

        <main className="canvas">
          {diagram ? (
            <TopologyFlow
              key={renderId}
              diagram={diagram}
              onSelectNode={handleNodeSelect}
              onSelectEdge={handleEdgeSelect}
            />
          ) : (
            <div className="placeholder">
              {loading ? "D2 エンジン(WASM)を読み込み中…" : "D2 ソースを描画してください"}
            </div>
          )}
          {loading && diagram ? <div className="loading-pill">再描画中…</div> : null}
        </main>

        <DetailPanel
          selection={selection}
          diagram={diagram}
          onClose={() => setSelection(null)}
        />
      </div>
    </div>
  );
}
