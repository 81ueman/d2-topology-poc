# d2-topology-poc

D2 で書いたトポロジを、**ブラウザ内 WASM でコンパイル**し、その結果（座標・接続）を
**React Flow** で描画する PoC。「D2 の画像を貼る」のではなく、**D2 を記法＋レイアウト
エンジンとして使い、描画・操作は Web 側が持つ**方式（前段の検討でいう B 案）の実証。

## 起動

```sh
npm install
npm run dev      # http://localhost:5173
npm run build    # 型チェック + 本番ビルド
```

初回は D2 エンジン（WASM、バンドル約 11.9MB / gzip 約 8.7MB）の読み込みが入る。

## できること

- D2 ソースを左パネルで編集 → `描画`（⌘/Ctrl+Enter）で再コンパイル
- レイアウトエンジン切替（`elk` / `dagre` / `tala`）
- サンプル: 3層構成 / Spine-Leaf / 生成 123ノード（3×4 グリッド）
- キャンバス: パン・ズーム、ミニマップ、フィット表示
- ノード/リンクのクリックで詳細パネル（ラベル・ID・shape・サイズ・接続一覧）
- 「ノードをドラッグ」トグル: ON にするとノードを動かせ、エッジは直線で追従
- ツールバーにノード数 / リンク数 / コンパイル時間を表示

## 仕組み

```
D2 ソース
  └─ @d2lang/d2 (WASM, Web Worker) で compile()
       ├─ diagram.shapes[]      … id / type / pos(x,y) / width / height / label / tooltip / link
       └─ diagram.connections[] … src / dst / label / route[{x,y}...] / srcArrow / dstArrow
            └─ React Flow の nodes / edges にマップ
```

- 実装の入口は `src/d2/client.ts`（`compile()` が `res.diagram` を返す）。
- マッピングは `src/components/TopologyFlow.tsx`。
  - コンテナ判定は「自分の id + `.` で始まる shape が他にあるか」で行う。
  - **D2 が出した絶対座標をそのままノード位置に使う**ので、D2 のレイアウトがそのまま再現される。
  - エッジは `route` の折れ線をそのまま描く（`src/components/D2Edge.tsx`）。
- `diagram` は D2 のレンダラが使う「配置済みターゲット」なので、AST を自前で解釈せずに済む。

## 計測結果（M シリーズ Mac / Chrome headless）

| 項目 | 結果 |
| --- | --- |
| 初回描画（WASM ロード込み） | 約 750 ms |
| 123 ノード / 110 リンク（elk） | 約 100 ms |
| 本番バンドル | 11.9 MB（gzip 8.7 MB） |

## 現状の制限 / 次の一手

- **ドラッグ時のエッジ再配線は未実装**。ドラッグ ON では直線エッジに切り替わるだけ。
  - エッジをきちんと引き直すなら、①ノード→エッジ再計算（直線/直交）を自前で持つ、
    ②編集後の座標を D2 に戻して再レイアウト（tala の `top` / `left` で座標固定）のどちらか。
- **数百〜数千ノード**は D2 のレイアウトが重くなる（公式も "big data 向けではない" と明言）。
  その規模は Web 側のレイアウト（force / 階層）＋フィルタ・折りたたみ主体に切り替える。
- 検索・フィルタ、コンテナの折りたたみ、SVG/PNG エクスポートは未実装。
- データを正にして D2 と Web の両方へ出す（NetBox / LLDP など）構成は未着手。

## ファイル構成

```
src/
  App.tsx                    … 画面全体（状態・ツールバー・適用）
  samples.ts                 … サンプル D2 ソースと生成トポロジ
  d2/client.ts               … D2(WASM) のラッパ。compile して diagram を返す
  d2/theme.ts                … shape 種別ごとの配色
  d2/model.ts                … label 取得・コンテナ判定などの小道具
  components/
    SourceEditor.tsx         … D2 ソース編集サイドバー
    TopologyFlow.tsx         … diagram → React Flow マッピング＆キャンバス
    D2Node.tsx               … カスタムノード（shape ごとの見た目）
    D2Edge.tsx               … D2 の route を描くカスタムエッジ
    DetailPanel.tsx          … 選択ノード/リンクの詳細
    context.ts               … ドラッグモードの Context
  styles.css
```

## 依存

- React 19 / Vite 8 / TypeScript 7
- `@xyflow/react`（React Flow 12）
- `@d2lang/d2`（D2 の WebAssembly ビルド）
