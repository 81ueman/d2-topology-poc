export interface Sample {
  id: string;
  label: string;
  source: string;
}

const SMALL = `# 3層構成のシンプルなトポロジ
direction: right

internet: Internet { shape: cloud }
fw: Firewall { shape: hexagon }
core: Core Switch { shape: hexagon }

access: Access Layer {
  sw-a: SW-A
  sw-b: SW-B
}

servers: Servers {
  web: Web Server
  db: Database { shape: cylinder }
}

internet -> fw: WAN
fw -> core: 10G
core -> access.sw-a: 1G
core -> access.sw-b: 1G
access.sw-a -> servers.web: 1G
access.sw-b -> servers.db: 1G
`;

const WEB3 = `# Web 3層 (LB / AP / DB + レプリカ)
direction: right

internet: Internet { shape: cloud }
lb: Load Balancer { shape: hexagon }

web: Web層 {
  web1: web-1
  web2: web-2
}

app: AP層 {
  app1: app-1
  app2: app-2
}

db: DB層 {
  primary: Primary { shape: cylinder }
  replica: Replica { shape: cylinder }
}

internet -> lb: HTTPS
lb -> web.web1: 443
lb -> web.web2: 443
web.web1 -> app.app1
web.web2 -> app.app2
app.app1 -> db.primary: 5432
app.app2 -> db.primary: 5432
db.primary -> db.replica: レプリケーション
`;

const HA = `# 冗長化 (エッジ / コア / スイッチの二重化)
direction: right

isp1: ISP-A { shape: cloud }
isp2: ISP-B { shape: cloud }

edge1: エッジ-1 { shape: hexagon }
edge2: エッジ-2 { shape: hexagon }
core1: コア-1 { shape: hexagon }
core2: コア-2 { shape: hexagon }

sw1: L2SW-1
sw2: L2SW-2
srv: サーバ { shape: cylinder }

isp1 -> edge1: 主回線
isp2 -> edge2: 副回線

edge1 <-> core1: 10G
edge2 <-> core2: 10G
core1 <-> core2: 10G

core1 -> sw1
core2 -> sw2
sw1 <-> sw2: スタック
sw1 -> srv: 1G
sw2 -> srv: 1G
`;

const WAN = `# 本社 - 支店間 WAN (拠点間 VPN)
direction: right

internet: Internet { shape: cloud }

hq: 本社 {
  edge: エッジルータ { shape: hexagon }
  fw: ファイアウォール { shape: hexagon }
  core: コアSW { shape: hexagon }
  svr: 基幹サーバ { shape: cylinder }
}

branch1: 支店A {
  rtr: ルータ
  sw: L2SW
  pc: 業務PC { shape: person }
}

branch2: 支店B {
  rtr: ルータ
  sw: L2SW
  pc: 業務PC { shape: person }
}

internet -> hq.edge: 光回線 1G
hq.edge -> hq.fw
hq.fw -> hq.core
hq.core -> hq.svr: 1G

internet -> branch1.rtr: IPsec VPN
internet -> branch2.rtr: IPsec VPN
branch1.rtr -> branch1.sw
branch1.sw -> branch1.pc
branch2.rtr -> branch2.sw
branch2.sw -> branch2.pc
`;

const LAN = `# 拠点 LAN (アクセス層)
direction: right

l3: L3スイッチ { shape: hexagon }
l2a: L2SW-A
l2b: L2SW-B

ap1: AP-1 { shape: hexagon }
ap2: AP-2 { shape: hexagon }

pc1: 業務PC-1 { shape: person }
pc2: 業務PC-2 { shape: person }
phone: IP電話
printer: 複合機 { shape: stored_data }
tablet: タブレット { shape: person }

l3 -> l2a
l3 -> l2b
l2a -> pc1
l2a -> phone
l2b -> printer
l2b -> ap1
l2b -> ap2
ap1 -> tablet: 無線LAN
ap2 -> pc2: 無線LAN
`;

const HYBRID = `# オンプレ + クラウド (ハイブリッド構成)
direction: right

users: 利用者 { shape: person }
internet: Internet { shape: cloud }

onprem: オンプレ {
  vpn: VPN-GW { shape: hexagon }
  core: コアSW { shape: hexagon }
  db: 基幹DB { shape: cylinder }
}

aws: AWS {
  igw: Internet-GW { shape: hexagon }
  alb: ALB { shape: hexagon }
  ec2: EC2
  rds: RDS { shape: cylinder }
}

users -> internet
internet -> aws.igw: HTTPS
aws.igw -> aws.alb
aws.alb -> aws.ec2
aws.ec2 -> aws.rds: 3306

onprem.vpn <-> aws.igw: 専用線/VPN
onprem.vpn -> onprem.core
onprem.core -> onprem.db
`;

const CLOS = `# Spine-Leaf (CLOS)
direction: right

spine1: Spine-1 { shape: hexagon }
spine2: Spine-2 { shape: hexagon }

leaf1: Leaf-1
leaf2: Leaf-2
leaf3: Leaf-3

rack1: Rack-1 {
  srv1: Server-1
  srv2: Server-2
}
rack2: Rack-2 {
  srv3: Server-3
  srv4: Server-4
}

spine1 -> leaf1
spine1 -> leaf2
spine1 -> leaf3
spine2 -> leaf1
spine2 -> leaf2
spine2 -> leaf3

leaf1 -> rack1.srv1
leaf1 -> rack1.srv2
leaf2 -> rack2.srv3
leaf2 -> rack2.srv4
`;

/**
 * Generate a rack/ToR/host topology as D2 source.
 * Racks are laid out in a grid (4 columns) so the result stays roughly square
 * instead of collapsing into one long column.
 * Default: 12 racks x 8 hosts = ~125 shapes, ~110 edges (3-digit scale test).
 */
export function generateLargeSource(
  racks = 12,
  hostsPerRack = 8,
  columns = 4,
): string {
  const rows = Math.ceil(racks / columns);
  const lines: string[] = [];
  lines.push(`# 生成トポロジ: ${racks} ラック x ${hostsPerRack} ホスト (${rows} x ${columns} grid)`);
  lines.push("direction: right");
  lines.push("internet: Internet { shape: cloud }");
  lines.push("fw: Firewall { shape: hexagon }");
  lines.push("core: Core Switch { shape: hexagon }");
  lines.push("internet -> fw: WAN");
  lines.push("fw -> core: 10G");
  lines.push("racks: Racks {");
  lines.push(`  grid-rows: ${rows}`);
  lines.push(`  grid-columns: ${columns}`);
  for (let r = 0; r < racks; r++) {
    const idx = String(r + 1).padStart(2, "0");
    const rack = `rack${idx}`;
    lines.push(`  ${rack}: Rack ${r + 1} {`);
    lines.push("    tor: ToR Switch");
    for (let h = 0; h < hostsPerRack; h++) {
      lines.push(`    host${h + 1}: Host ${r + 1}-${h + 1}`);
    }
    lines.push("  }");
    lines.push(`  core -> ${rack}.tor: 1G`);
    for (let h = 0; h < hostsPerRack; h++) {
      lines.push(`  ${rack}.tor -> ${rack}.host${h + 1}`);
    }
  }
  lines.push("}");
  return lines.join("\n");
}

export const SAMPLES: Sample[] = [
  { id: "small", label: "3層構成", source: SMALL },
  { id: "web3", label: "Web3層", source: WEB3 },
  { id: "ha", label: "冗長化", source: HA },
  { id: "wan", label: "本社-支店WAN", source: WAN },
  { id: "lan", label: "拠点LAN", source: LAN },
  { id: "hybrid", label: "ハイブリッド", source: HYBRID },
  { id: "clos", label: "Spine-Leaf", source: CLOS },
  { id: "large", label: "生成 123ノード", source: generateLargeSource() },
  {
    id: "large1000",
    label: "生成 1000ノード",
    source: generateLargeSource(40, 25, 4),
  },
];

export const DEFAULT_SOURCE = SMALL;
