#!/usr/bin/env node
'use strict';

const path = require('path');
const I18nExtractor = require('../extract-i18n.js');

function printHelp() {
  console.log(`Rue i18n extraction tool\n\nUsage:\n  rue-i18n-extract [target-directory] [options]\n\nExamples:\n  rue-i18n-extract .\n  rue-i18n-extract ./src --output ./locales\n  rue-i18n-extract . --languages en,zh-Hant,zh-Hans --default-lang en\n\nOptions:\n  -o, --output <dir>          Output directory. Default: ./locales\n  -l, --languages <codes>    Comma-separated language codes\n      --default-lang <code>  Default language code\n      --exclude <names>      Comma-separated directory names to ignore\n  -h, --help                 Show this help text\n\nThe tool scans HTML/JS/TS/Vue/JSX/TSX files for data-i18n="...", i18n.t("...") and t("...") keys, then creates translation JSON files and a browser loader.\n`);
}

const args = process.argv.slice(2);
if (args.includes('--help') || args.includes('-h')) {
  printHelp();
  process.exit(0);
}

let targetDir = '.';
const options = {};
let i = 0;
if (args[0] && !args[0].startsWith('-')) {
  targetDir = args[0];
  i = 1;
}

while (i < args.length) {
  const arg = args[i];
  const value = args[i + 1];
  switch (arg) {
    case '--output':
    case '-o':
      if (!value) throw new Error(`${arg} requires a directory`);
      options.outputDir = value;
      i += 2;
      break;
    case '--languages':
    case '-l':
      if (!value) throw new Error(`${arg} requires comma-separated language codes`);
      options.languages = value.split(',').map(v => v.trim()).filter(Boolean);
      i += 2;
      break;
    case '--default-lang':
      if (!value) throw new Error(`${arg} requires a language code`);
      options.defaultLang = value;
      i += 2;
      break;
    case '--exclude':
      if (!value) throw new Error(`${arg} requires comma-separated directory names`);
      options.exclude = value.split(',').map(v => v.trim()).filter(Boolean);
      i += 2;
      break;
    default:
      throw new Error(`Unknown option: ${arg}. Run rue-i18n-extract --help for usage.`);
  }
}

const extractor = new I18nExtractor(options);
extractor.extract(path.resolve(targetDir)).catch(error => {
  console.error(error);
  process.exitCode = 1;
});
