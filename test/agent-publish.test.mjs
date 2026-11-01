import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import AdmZip from "adm-zip";
import { jarMatchesProject, readJarModId, signV4, uploadsToday, validateRequest } from "../scripts/agent-publish.mjs";

const catalog = () => ({
  projects: [{ slug: "demo-mod", name: "Demo", releases: [{ version: "1.0.0", files: [] }] }]
});

test("签名与 AWS 文档中的 S3 PUT 示例一致", () => {
  const headers = signV4({
    method: "PUT",
    host: "examplebucket.s3.amazonaws.com",
    path: "/test%24file.text",
    region: "us-east-1",
    accessKeyId: "AKIAIOSFODNN7EXAMPLE",
    secretAccessKey: "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",
    headers: { Date: "Fri, 24 May 2013 00:00:00 GMT", "x-amz-storage-class": "REDUCED_REDUNDANCY" },
    payloadHash: "44ce7dd67c959e0d3524ffac1771dfbba87d2b6b4b4e99e42034a8b803f8b072",
    amzDate: "20130524T000000Z"
  });
  assert.match(headers.authorization, /SignedHeaders=date;host;x-amz-content-sha256;x-amz-date;x-amz-storage-class,/);
  assert.match(headers.authorization, /Signature=98ad721746da40c64f1a55b78f14c238d841ea1380cd77a1b5971af0ece108bd$/);
});

test("只允许给已有项目追加新版本", () => {
  const ok = { project: "demo-mod", version: "1.1.0", files: ["a.jar"] };
  assert.equal(validateRequest(ok, catalog()).slug, "demo-mod");
  assert.throws(() => validateRequest({ ...ok, project: "other" }, catalog()), /不存在/);
  assert.throws(() => validateRequest({ ...ok, version: "1.0.0" }, catalog()), /不能覆盖/);
  assert.throws(() => validateRequest({ ...ok, overwrite: true }, catalog()), /不支持参数 --overwrite/);
  assert.throws(() => validateRequest({ ...ok, name: "x" }, catalog()), /不支持参数 --name/);
  assert.throws(() => validateRequest({ ...ok, files: ["a.zip"] }, catalog()), /不是 \.jar/);
  assert.throws(() => validateRequest({ ...ok, files: ["1.jar", "2.jar", "3.jar", "4.jar", "5.jar"] }, catalog()), /最多/);
});

test("读取 Fabric 与 NeoForge jar 的 mod id 并与项目比对", async () => {
  const dir = await mkdtemp(join(tmpdir(), "agent-publish-"));
  const fabric = new AdmZip();
  fabric.addFile("fabric.mod.json", Buffer.from(JSON.stringify({ id: "demo_mod", version: "1.1.0", depends: { minecraft: "1.21.11" } })));
  fabric.writeZip(join(dir, "fabric.jar"));
  const neo = new AdmZip();
  neo.addFile("META-INF/neoforge.mods.toml", Buffer.from('[[mods]]\nmodId="demomod"\nversion="1.1.0"\n'));
  neo.writeZip(join(dir, "neo.jar"));

  const project = catalog().projects[0];
  const fabricInfo = readJarModId(join(dir, "fabric.jar"));
  assert.deepEqual(fabricInfo, { id: "demo_mod", version: "1.1.0", gameVersions: ["1.21.11"], loader: "Fabric" });
  assert.equal(jarMatchesProject(fabricInfo.id, project), true);
  assert.equal(jarMatchesProject(readJarModId(join(dir, "neo.jar")).id, project), true);
  assert.equal(jarMatchesProject("othermod", project), false);
  assert.equal(jarMatchesProject("othermod", { ...project, modIds: ["othermod"] }), true);
});

test("每日上限只统计当天成功的上传", async () => {
  const dir = await mkdtemp(join(tmpdir(), "agent-publish-"));
  const log = join(dir, "log");
  await writeFile(log, [
    { at: "2026-11-01T01:00:00Z", files: ["a", "b"], ok: true },
    { at: "2026-11-01T02:00:00Z", files: ["c"], ok: false },
    { at: "2026-10-31T23:00:00Z", files: ["d"], ok: true }
  ].map((entry) => JSON.stringify(entry)).join("\n"));
  assert.equal(await uploadsToday(log, new Date("2026-11-01T12:00:00Z")), 2);
  assert.equal(await uploadsToday(join(dir, "missing")), 0);
});
