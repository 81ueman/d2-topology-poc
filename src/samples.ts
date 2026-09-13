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
 * Racks are laid out in a grid (3 x 4 by default) so the result stays roughly
 * square instead of collapsing into one long column.
 * Default: 12 racks x 8 hosts = ~123 shapes, ~110 edges (3-digit scale test).
 */
export function generateLargeSource(racks = 12, hostsPerRack = 8): string {
  const columns = 4;
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
  { id: "clos", label: "Spine-Leaf", source: CLOS },
  {
    id: "large",
    label: "生成 123ノード",
    source: generateLargeSource(),
  },
];

export const DEFAULT_SOURCE = SMALL;
