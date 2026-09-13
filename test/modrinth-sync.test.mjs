import test from "node:test";
import assert from "node:assert/strict";
import { syncModrinthProject } from "../scripts/publish.mjs";

test("syncModrinthProject: 首次同步全新 Modrinth 项目及版本", () => {
  const catalog = { projects: [] };
  const modrinthProject = {
    id: "jEXj32z7",
    slug: "cauldronfix",
    title: "CauldronFix",
    description: "Makes cauldron even better for Mojang!",
    body: "# CauldronFix\nDetails here...",
    icon_url: "https://cdn.modrinth.com/icon.png",
    source_url: "https://github.com/hotpad100c/cauldronfix",
    gallery: [
      { url: "https://cdn.modrinth.com/banner.png", featured: true }
    ],
    authors: ["Ryan100C"]
  };

  const versions = [
    {
      version_number: "1.3.0",
      date_published: "2024-11-11T12:29:48.339Z",
      game_versions: ["1.21", "1.21.1"],
      loaders: ["fabric"],
      changelog: "Fixes bugs",
      files: [
        {
          filename: "cauldronfix-1.3.0.jar",
          size: 222722,
          url: "https://cdn.modrinth.com/file.jar",
          hashes: {
            sha256: "aabbcc",
            sha512: "ddeeff"
          }
        }
      ]
    }
  ];

  const project = syncModrinthProject(catalog, modrinthProject, versions, { syncVersions: true });
  assert.equal(catalog.projects.length, 1);
  assert.equal(project.slug, "cauldronfix");
  assert.equal(project.name, "CauldronFix");
  assert.equal(project.banner, "https://cdn.modrinth.com/banner.png");
  assert.equal(project.releases.length, 1);
  assert.equal(project.releases[0].version, "1.3.0");
  assert.deepEqual(project.releases[0].loaders, ["Fabric"]);
  assert.equal(project.releases[0].files[0].name, "cauldronfix-1.3.0.jar");
  assert.equal(project.releases[0].files[0].url, "https://cdn.modrinth.com/file.jar");
});

test("syncModrinthProject: 更新已有项目元数据并追加新版本", () => {
  const catalog = {
    projects: [
      {
        slug: "cauldronfix",
        name: "Old CauldronFix",
        description: "Old desc",
        longDescription: "Old body",
        icon: "old_icon.png",
        banner: "",
        source: "",
        authors: ["OldAuthor"],
        releases: [
          {
            version: "1.0.0",
            publishedAt: "2024-01-01T00:00:00.000Z",
            gameVersions: ["1.20"],
            loaders: ["Fabric"],
            notes: "",
            files: []
          }
        ]
      }
    ]
  };

  const modrinthProject = {
    slug: "cauldronfix",
    title: "CauldronFix Updated",
    description: "New desc",
    body: "New body",
    icon_url: "new_icon.png",
    source_url: "https://github.com/hotpad100c/cauldronfix",
    gallery: [],
    authors: ["Ryan100C"]
  };

  const versions = [
    {
      version_number: "1.1.0",
      date_published: "2024-06-01T00:00:00.000Z",
      game_versions: ["1.21"],
      loaders: ["fabric", "quilt"],
      changelog: "New release",
      files: []
    }
  ];

  syncModrinthProject(catalog, modrinthProject, versions, { syncVersions: true, overwrite: false });
  assert.equal(catalog.projects.length, 1);
  const p = catalog.projects[0];
  assert.equal(p.name, "CauldronFix Updated");
  assert.equal(p.description, "New desc");
  assert.equal(p.releases.length, 2);
  assert.equal(p.releases[0].version, "1.1.0");
  assert.equal(p.releases[1].version, "1.0.0");
});
