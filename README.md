# d2-topology-poc

▶ **デモ: <https://81ueman.github.io/d2-topology-poc/>**

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

## デプロイ

`main` に push すると GitHub Actions（`.github/workflows/deploy.yml`）が
`dist/` をビルドして GitHub Pages に公開する。手動実行は Actions の
`workflow_dispatch` から。

## できること

- D2 ソースを左パネルで編集 → `描画`（⌘/Ctrl+Enter）で再コンパイル
- レイアウトエンジン切替（`elk` / `dagre` / `tala`、変更で即再描画）
- **方向の切替**（ソースに従う / 右 / 下 / 左 / 上）: ソースの `direction` を壊さずに上書きして再描画
- サンプル: 3層構成 / Web3層 / 冗長化 / 本社-支店WAN / 拠点LAN / ハイブリッド /
  Spine-Leaf / 生成 123ノード（3×4 グリッド）/ 生成 1000ノード（10×4 グリッド）
- キャンバス: パン・ズーム、ミニマップ、フィット表示（ビューポート外は描画しない）
- **エッジは既定で直線**。ツールバーの「直線エッジ」を OFF にすると D2 のルート（直交折れ線）表示に切替。
  自己ループも表示する
- **ノードをドラッグすると、つながっているエッジが追従**（直線/ルートどちらでも）
- **コンテナの折りたたみ**: コンテナ右上の `−` / `＋` で子を畳める。外部との接続はコンテナに付け替わる
- ノード/リンクのクリックで詳細パネル（ラベル・ID・shape・サイズ・接続一覧）。`Esc` で選択解除
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
- エッジは既定で**直線**（ノード中心を結んだ線を矩形境界でクリップ）。「直線エッジ」を OFF に
  すると D2 の `route` の折れ線をそのまま描く。**ドラッグされたノードに接続するエッジは常に
  追従**する（`src/components/D2Edge.tsx`）。どのノードが動いたかは Context で持っている
  （`src/components/context.ts`）。
- 折りたたみは、隠れた子を除外し、その端点を最上位の折りたたみコンテナへ付け替える
  （`collapsedAncestor`）。付け替えたエッジはルートが合わないので直線で描く。

## 計測結果（M シリーズ Mac / Chrome headless）

| 項目 | 結果 |
| --- | --- |
| 初回描画（WASM ロード込み） | 約 750 ms |
| 123 ノード / 110 リンク（elk） | 約 100 ms |
| 1085 ノード / 1042 リンク（elk） | 約 620 ms |
| 本番バンドル | 11.9 MB（gzip 8.7 MB） |

## 現状の制限 / 次の一手

- 直線表示では D2 の厳密なルートは失われる（トグル OFF で確認できる）。編集後の座標を D2 に
  戻して再レイアウトする（tala の `top` / `left` で座標固定）のは未着手。
- 折りたたみは Web 側の表示だけ。D2 のレイアウトは再計算しないので畳んだ分の空間は残る。
  また、同じコンテナへ複数のリンクがあると線が重なる。
- **1000 ノード級**でも D2 のレイアウトは 0.6〜0.8 秒で実用範囲（実測: 1085 ノード / 1042 リンクで約 620 ms）。
  ただし一画面に収めるには生成側で正方形に近い配置が要る（`minZoom` が 0.05 のため、生成 1000 ノードの
  サンプルはそれで収まる 10×4 グリッドにしてある）。それ以上は折りたたみ・フィルタ前提。
- 検索・フィルタ、SVG/PNG エクスポートは未実装。
- データを正にして D2 と Web の両方へ出す（NetBox / LLDP など）構成は未着手。

## ファイル構成

```
src/
  App.tsx                    … 画面全体（状態・ツールバー・適用）
  samples.ts                 … サンプル D2 ソースと生成トポロジ
  d2/client.ts               … D2(WASM) のラッパ。compile して diagram を返す
  d2/direction.ts            … ルート方向の上書きヘルパ
  d2/theme.ts                … shape 種別ごとの配色
  d2/model.ts                … label 取得・コンテナ判定などの小道具
  components/
    SourceEditor.tsx         … D2 ソース編集・エンジン/方向/サンプルのサイドバー
    TopologyFlow.tsx         … diagram → React Flow マッピング＆キャンバス
    D2Node.tsx               … カスタムノード（shape ごとの見た目）
    D2Edge.tsx               … D2 の route を描く／ドラッグ時に追従するエッジ
    DetailPanel.tsx          … 選択ノード/リンクの詳細
    context.ts               … ドラッグ済みノードの Context
  styles.css
```

## 依存

- React 19 / Vite 8 / TypeScript 7
- `@xyflow/react`（React Flow 12）
- `@d2lang/d2`（D2 の WebAssembly ビルド）
