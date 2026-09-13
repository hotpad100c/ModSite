import test from "node:test";
import assert from "node:assert/strict";
import AdmZip from "adm-zip";
import { inspectFabricJar, parseFabricModJson } from "../scripts/fabric.mjs";

test("正确解析标准 fabric.mod.json 中的源码、作者与游戏版本", () => {
  const modJson = {
    schemaVersion: 1,
    id: "lucidity",
    name: "Lucidity",
    version: "2.0.2",
    description: "All-in-One Minecraft Client Visual Assistance Mod",
    authors: [
      "Ryan100c",
      { name: "ContributorOne" }
    ],
    contact: {
      homepage: "https://modrinth.com/mod/lucidity",
      sources: "https://github.com/Ryan100c/Lucidity",
      issues: "https://github.com/Ryan100c/Lucidity/issues"
    },
    depends: {
      fabricloader: ">=0.16.0",
      minecraft: ">=1.21.1 <=1.21.2"
    }
  };

  const result = parseFabricModJson(modJson, "lucidity-2.0.2+1.21.1.jar");
  assert.equal(result.isFabric, true);
  assert.equal(result.id, "lucidity");
  assert.equal(result.name, "Lucidity");
  assert.equal(result.version, "2.0.2");
  assert.equal(result.source, "https://github.com/Ryan100c/Lucidity");
  assert.deepEqual(result.authors, ["Ryan100c", "ContributorOne"]);
  assert.deepEqual(result.gameVersions, ["1.21.1", "1.21.2"]);
  assert.equal(result.loader, "Fabric");
});

test("支持单个作者字符串与波浪号游戏版本", () => {
  const modJson = {
    id: "minimap",
    name: "MiniMap",
    version: "1.0.0",
    authors: "Alice",
    contact: {
      source: "https://gitlab.com/alice/minimap"
    },
    depends: {
      minecraft: "~1.20.4"
    }
  };

  const result = parseFabricModJson(modJson);
  assert.deepEqual(result.authors, ["Alice"]);
  assert.equal(result.source, "https://gitlab.com/alice/minimap");
  assert.deepEqual(result.gameVersions, ["1.20.4"]);
});

test("从 zip 包中读取 fabric.mod.json", () => {
  const zip = new AdmZip();
  const modJson = {
    id: "testmod",
    name: "Test Mod",
    version: "0.1.0",
    authors: ["Dev"],
    contact: { sources: "https://github.com/example/testmod" },
    depends: { minecraft: "1.21.1" }
  };
  zip.addFile("fabric.mod.json", Buffer.from(JSON.stringify(modJson), "utf8"));
  const buffer = zip.toBuffer();

  const inspected = inspectFabricJar(buffer, "testmod-0.1.0.jar");
  assert.ok(inspected);
  assert.equal(inspected.id, "testmod");
  assert.equal(inspected.source, "https://github.com/example/testmod");
  assert.deepEqual(inspected.authors, ["Dev"]);
  assert.deepEqual(inspected.gameVersions, ["1.21.1"]);
});

test("非 Fabric 包返回 null", () => {
  const zip = new AdmZip();
  zip.addFile("dummy.txt", Buffer.from("hello", "utf8"));
  const buffer = zip.toBuffer();
  assert.equal(inspectFabricJar(buffer), null);
});
