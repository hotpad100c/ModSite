import test from "node:test";
import assert from "node:assert/strict";
import { parseGradleProperties, inspectProjectDir } from "../scripts/scanner.mjs";
import { mkdtemp, rm, writeFile, mkdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

test("parseGradleProperties: 正确解析 gradle.properties", () => {
  const content = `
# Some comments
mod_version = 1.2.3
minecraft_version=1.21.1
archives_base_name = my-cool-mod
`;
  const props = parseGradleProperties(content);
  assert.equal(props.mod_version, "1.2.3");
  assert.equal(props.minecraft_version, "1.21.1");
  assert.equal(props.archives_base_name, "my-cool-mod");
});

test("inspectProjectDir: 识别未构建但含 gradle.properties 与 fabric.mod.json 的工程", async () => {
  const dir = await mkdtemp(join(tmpdir(), "modtest-"));
  try {
    await writeFile(join(dir, "gradle.properties"), "mod_version=2.0.0\nminecraft_version=1.21\narchives_base_name=testmod");
    await mkdir(join(dir, "src/main/resources"), { recursive: true });
    await writeFile(
      join(dir, "src/main/resources/fabric.mod.json"),
      JSON.stringify({
        id: "testmod",
        name: "Test Mod",
        description: "A test mod description",
        authors: ["TestAuthor"]
      })
    );

    const catalog = [
      { slug: "testmod", name: "Test Mod", releases: [{ version: "1.0.0" }] }
    ];

    const result = await inspectProjectDir(dir, catalog);
    assert.ok(result);
    assert.equal(result.id, "testmod");
    assert.equal(result.name, "Test Mod");
    assert.equal(result.version, "2.0.0");
    assert.equal(result.description, "A test mod description");
    assert.deepEqual(result.authors, ["TestAuthor"]);
    assert.equal(result.isPublished, true);
    assert.equal(result.latestPublishedVersion, "1.0.0");
    assert.equal(result.builtJars.length, 0);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("inspectProjectDir & scanWorkspace: 成功扫描工作区并发现编译产物 jar", async () => {
  const root = await mkdtemp(join(tmpdir(), "workspace-root-"));
  try {
    const projDir = join(root, "my-sub-mod");
    await mkdir(projDir);
    await writeFile(join(projDir, "build.gradle"), "// empty gradle build file");
    await writeFile(join(projDir, "gradle.properties"), "mod_version=1.5.0\narchives_base_name=submod");

    const libsDir = join(projDir, "build/libs");
    await mkdir(libsDir, { recursive: true });
    await writeFile(join(libsDir, "submod-1.5.0.jar"), Buffer.from("fake-jar-data"));
    await writeFile(join(libsDir, "submod-1.5.0-sources.jar"), Buffer.from("sources-jar-data"));

    // Also create an unrelated non-mod folder
    const randomDir = join(root, "random-non-mod");
    await mkdir(randomDir);
    await writeFile(join(randomDir, "readme.txt"), "hello");

    const { scanWorkspace } = await import("../scripts/scanner.mjs");
    const scanResult = await scanWorkspace(root, []);
    assert.equal(scanResult.totalScanned, 2);
    assert.equal(scanResult.matchedCount, 1);
    assert.equal(scanResult.projects[0].id, "submod");
    assert.equal(scanResult.projects[0].builtJars.length, 1);
    assert.equal(scanResult.projects[0].builtJars[0].name, "submod-1.5.0.jar");
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

