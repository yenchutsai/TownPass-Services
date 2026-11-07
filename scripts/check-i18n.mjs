import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const readJson = async (file) => JSON.parse(await readFile(path.join(root, file), 'utf8'));
const locales = Object.keys(await readJson('src/i18n/locales.json'));
const modules = (await readdir(path.join(root, 'src/i18n/messages'), { withFileTypes: true }))
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name);

function flatten(resource, prefix = '', result = {}) {
  for (const [key, value] of Object.entries(resource)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof value === 'string') {
      assert(value.trim(), `Empty translation: ${fullKey}`);
      result[fullKey] = value;
    } else {
      assert(
        value && typeof value === 'object' && !Array.isArray(value),
        `Invalid message: ${fullKey}`
      );
      flatten(value, fullKey, result);
    }
  }
  return result;
}

const placeholders = (value) =>
  [...new Set([...value.matchAll(/\{(\w+)\}/g)].map((match) => match[1]))].sort();
const masterKeys = new Set();

for (const module of modules) {
  const files = (await readdir(path.join(root, 'src/i18n/messages', module)))
    .filter((file) => file.endsWith('.json'))
    .map((file) => file.slice(0, -5))
    .sort();
  assert.deepEqual(
    files,
    [...locales].sort(),
    `${module}: language files differ from locales.json`
  );
  const base = flatten(await readJson(`src/i18n/messages/${module}/zh-TW.json`), module);
  const keys = Object.keys(base).sort();
  keys.forEach((key) => masterKeys.add(key));
  for (const locale of locales) {
    const translated = flatten(
      await readJson(`src/i18n/messages/${module}/${locale}.json`),
      module
    );
    assert.deepEqual(
      Object.keys(translated).sort(),
      keys,
      `${module}/${locale}: translation keys differ`
    );
    for (const key of keys) {
      assert.deepEqual(
        placeholders(translated[key]),
        placeholders(base[key]),
        `${locale}/${key}: placeholders differ`
      );
    }
  }
}

const resources = await readJson('src/data/information-resources.json');
for (const items of Object.values(resources)) {
  for (const item of items) {
    for (const key of [item.titleKey, item.descriptionKey].filter(Boolean)) {
      assert(masterKeys.has(key), `Resource references an unknown translation: ${key}`);
    }
  }
}

async function checkSource(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      await checkSource(file);
    } else if (/\.(vue|ts)$/.test(entry.name)) {
      const source = await readFile(file, 'utf8');
      if (!/vue-i18n|i18n\.global\.t|titleKey:/.test(source)) continue;
      for (const match of source.matchAll(
        /\bt\(['"]([^'"\n]+)['"]\s*[,)]|titleKey:\s*['"]([^'"\n]+)['"]/g
      )) {
        const key = match[1] ?? match[2];
        assert(masterKeys.has(key), `${path.relative(root, file)}: unknown translation ${key}`);
      }
    }
  }
}

await checkSource(path.join(root, 'src'));
console.log(
  `Validated ${locales.length} languages, ${modules.length} feature modules and ${masterKeys.size} translation keys.`
);
