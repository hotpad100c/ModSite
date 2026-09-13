import test from "node:test";
import assert from "node:assert/strict";
import { removeRelease, removeReleaseFile, addReleaseFile } from "../scripts/publish.mjs";

test("removeRelease: 成功删除指定版本", () => {
  const catalog = {
    projects: [
      {
        slug: "lucidity",
        name: "Lucidity",
        releases: [
          { version: "2.0.2", files: [{ name: "lucidity-2.0.2.jar" }] },
          { version: "2.0.1", files: [{ name: "lucidity-2.0.1.jar" }] }
        ]
      }
    ]
  };

  removeRelease(catalog, "lucidity", "2.0.2");
  assert.equal(catalog.projects[0].releases.length, 1);
  assert.equal(catalog.projects[0].releases[0].version, "2.0.1");

  // 删除不存在的版本应报错
  assert.throws(() => removeRelease(catalog, "lucidity", "9.9.9"), /未找到版本/);
  // 删除不存在的项目应报错
  assert.throws(() => removeRelease(catalog, "non-existent", "1.0.0"), /找不到项目/);
});

test("removeReleaseFile: 成功从版本中移除指定文件", () => {
  const catalog = {
    projects: [
      {
        slug: "lucidity",
        name: "Lucidity",
        releases: [
          {
            version: "2.0.2",
            files: [
              { name: "lucidity-2.0.2.jar", size: 1000 },
              { name: "lucidity-2.0.2-sources.jar", size: 500 }
            ]
          }
        ]
      }
    ]
  };

  removeReleaseFile(catalog, "lucidity", "2.0.2", "lucidity-2.0.2-sources.jar");
  const files = catalog.projects[0].releases[0].files;
  assert.equal(files.length, 1);
  assert.equal(files[0].name, "lucidity-2.0.2.jar");

  // 移除不存在的文件应报错
  assert.throws(() => removeReleaseFile(catalog, "lucidity", "2.0.2", "not-found.jar"), /未找到文件/);
});

test("addReleaseFile: 成功向已有版本追加新文件", () => {
  const catalog = {
    projects: [
      {
        slug: "lucidity",
        name: "Lucidity",
        releases: [
          {
            version: "2.0.2",
            files: [
              { name: "lucidity-2.0.2.jar", size: 1000 }
            ]
          }
        ]
      }
    ]
  };

  const newFile = {
    name: "lucidity-2.0.2-quilt.jar",
    size: 980,
    sha256: "abcdef123456",
    url: "https://dl.ryan100c.party/releases/lucidity/2.0.2/lucidity-2.0.2-quilt.jar"
  };

  addReleaseFile(catalog, "lucidity", "2.0.2", newFile);
  const files = catalog.projects[0].releases[0].files;
  assert.equal(files.length, 2);
  assert.equal(files[1].name, "lucidity-2.0.2-quilt.jar");

  // 重复添加同名文件应报错
  assert.throws(() => addReleaseFile(catalog, "lucidity", "2.0.2", newFile), /已存在名为/);
});
