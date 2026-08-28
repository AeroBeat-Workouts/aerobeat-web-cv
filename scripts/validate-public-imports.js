// @ts-check

import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const packageJson = JSON.parse(readFileSync("package.json", "utf8"));

/**
 * Concrete pose runtimes belong only in assembly/vendor packages. Matching is
 * intentionally package-specifier based so generic test vendor IDs and the
 * historical replay source identity remain valid vendor-neutral fixtures.
 *
 * @param {string} specifier
 * @returns {boolean}
 */
function isConcretePoseVendorSpecifier(specifier) {
  return specifier.startsWith("@aerobeat/web-vendor-")
    || specifier.startsWith("@mediapipe/")
    || specifier === "onnxruntime-web"
    || specifier.startsWith("onnxruntime-web/")
    || specifier === "@tensorflow-models/pose-detection"
    || specifier.startsWith("@tensorflow-models/pose-detection/")
    || specifier.startsWith("@tensorflow/tfjs-");
}

/**
 * @param {string} path
 * @returns {string[]}
 */
function collectJavaScriptFiles(path) {
  /** @type {string[]} */
  const files = [];
  for (const entry of readdirSync(path)) {
    const fullPath = join(path, entry);
    const stat = statSync(fullPath);
    if (stat.isDirectory() && entry !== "node_modules") {
      files.push(...collectJavaScriptFiles(fullPath));
    } else if (entry.endsWith(".js") || entry.endsWith(".mjs")) {
      files.push(fullPath);
    }
  }
  return files;
}

/**
 * @param {string} source
 * @returns {string[]}
 */
function collectModuleSpecifiers(source) {
  const specifiers = [];
  const pattern = /(?:\bfrom\s*|\bimport\s*\(\s*|\bimport\s*)["']([^"']+)["']/gu;
  for (const match of source.matchAll(pattern)) {
    specifiers.push(match[1]);
  }
  return specifiers;
}

// Prove this validator is substantive rather than a name-only placeholder.
for (const forbidden of [
  "@aerobeat/web-vendor-mediapipe",
  "@aerobeat/web-vendor-movenet",
  "@aerobeat/web-vendor-onnxruntime",
  "@mediapipe/tasks-vision",
  "onnxruntime-web",
  "@tensorflow-models/pose-detection",
  "@tensorflow/tfjs-backend-webgl"
]) {
  assert.equal(isConcretePoseVendorSpecifier(forbidden), true, `validator must reject ${forbidden}`);
}
assert.equal(isConcretePoseVendorSpecifier("@aerobeat/web-contracts"), false);
assert.equal(isConcretePoseVendorSpecifier("./replay-pose-adapter.js"), false);

const failures = [];
const dependencySections = ["dependencies", "optionalDependencies", "peerDependencies", "devDependencies"];
for (const section of dependencySections) {
  for (const dependency of Object.keys(packageJson[section] ?? {})) {
    if (isConcretePoseVendorSpecifier(dependency)) {
      failures.push(`package.json ${section}: concrete pose vendor dependency ${dependency}`);
    }
  }
}

for (const root of ["src", ".testbed"]) {
  for (const file of collectJavaScriptFiles(root)) {
    const source = readFileSync(file, "utf8");
    for (const specifier of collectModuleSpecifiers(source)) {
      if (isConcretePoseVendorSpecifier(specifier)) {
        failures.push(`${file}: concrete pose vendor import ${specifier}`);
      }
      if (/aerobeat-web-[^/"']*\/src\//u.test(specifier)) {
        failures.push(`${file}: imports a sibling repo source path`);
      }
      if (/^@aerobeat\/web-[^/]+\/internal/u.test(specifier)) {
        failures.push(`${file}: imports another package internal surface`);
      }
    }
  }
}

if (failures.length > 0) {
  console.error(failures.join("\n"));
  process.exit(1);
}

console.log("Vendor-neutral dependency and public import boundary validation passed.");
