/**
 * Unused Code Detection Script
 * Detect unreferenced files and code in the project
 */

const fs = require('fs');
const path = require('path');

console.log('================================================================================');
console.log('  SchemaIO Unused Code Detection (Deep Scan)');
console.log('================================================================================\n');

const unusedFiles = [];
const suspiciousFiles = [];

// 1. Check files with suffixes like -new, -old, -backup
console.log('Step 1: Checking suffix files...\n');

function findSuffixFiles(dir, suffixes) {
  const results = [];
  const files = fs.readdirSync(dir, { withFileTypes: true });

  for (const file of files) {
    const fullPath = path.join(dir, file.name);

    if (file.isDirectory()) {
      if (!file.name.startsWith('.') && file.name !== 'node_modules') {
        results.push(...findSuffixFiles(fullPath, suffixes));
      }
    } else {
      for (const suffix of suffixes) {
        if (file.name.includes(suffix)) {
          results.push(fullPath.replace(/\\/g, '/'));
        }
      }
    }
  }

  return results;
}

const projectRoot = path.join(__dirname, '..');
const suffixFiles = findSuffixFiles(projectRoot, ['-new', '-old', '-backup', '.bak', '.tmp']);

if (suffixFiles.length > 0) {
  console.log('WARNING: Found suffix files:');
  suffixFiles.forEach(file => {
    console.log(`   - ${file.replace(projectRoot, '')}`);
    unusedFiles.push(file);
  });
} else {
  console.log('OK: No suffix files found');
}

console.log('\n' + '='.repeat(80) + '\n');

// 2. Check unreferenced files in lib directory
console.log('Step 2: Checking unreferenced lib files...\n');

function getAllJsFiles(dir) {
  const results = [];
  const files = fs.readdirSync(dir, { withFileTypes: true });

  for (const file of files) {
    const fullPath = path.join(dir, file.name);

    if (file.isDirectory()) {
      if (!file.name.startsWith('.')) {
        results.push(...getAllJsFiles(fullPath));
      }
    } else if (file.name.endsWith('.js')) {
      results.push(fullPath);
    }
  }

  return results;
}

function isFileReferenced(filePath, allFiles) {
  const fileName = path.basename(filePath, '.js');
  const relativePath = path.relative(projectRoot, filePath).replace(/\\/g, '/');

  // Exclude index.js (entry point)
  if (fileName === 'index' || filePath.includes('index.js')) {
    return true;
  }

  // Check if referenced
  for (const file of allFiles) {
    if (file === filePath) continue;

    try {
      const content = fs.readFileSync(file, 'utf-8');

      // Check require statements
      if (content.includes(`require('./${fileName}')`)) return true;
      if (content.includes(`require('./${fileName}.js')`)) return true;
      if (content.includes(`require('${fileName}')`)) return true;
      if (content.includes(relativePath)) return true;

      // Check import statements
      if (content.includes(`from './${fileName}'`)) return true;
      if (content.includes(`from '${fileName}'`)) return true;
    } catch (e) {
      // Ignore read errors
    }
  }

  return false;
}

const libDir = path.join(projectRoot, 'lib');
const testDir = path.join(projectRoot, 'test');
const examplesDir = path.join(projectRoot, 'examples');

const libFiles = getAllJsFiles(libDir);
const testFiles = getAllJsFiles(testDir);
const exampleFiles = getAllJsFiles(examplesDir);
const allProjectFiles = [...libFiles, ...testFiles, ...exampleFiles];

console.log(`Total files: ${libFiles.length} (lib directory)`);

const unreferencedLibFiles = [];

libFiles.forEach(file => {
  const fileName = path.basename(file);

  // Skip index.js
  if (fileName === 'index.js') return;

  if (!isFileReferenced(file, allProjectFiles)) {
    const relativePath = path.relative(projectRoot, file).replace(/\\/g, '/');
    unreferencedLibFiles.push(relativePath);
  }
});

if (unreferencedLibFiles.length > 0) {
  console.log(`\nWARNING: Possibly unreferenced files (${unreferencedLibFiles.length}):\n`);
  unreferencedLibFiles.forEach(file => {
    console.log(`   - ${file}`);
    suspiciousFiles.push(file);
  });
  console.log('\nNOTE: These files might be referenced dynamically, please verify manually');
} else {
  console.log('\nOK: All lib files are referenced');
}

console.log('\n' + '='.repeat(80) + '\n');

// 3. Check empty directories
console.log('Step 3: Checking empty directories...\n');

function findEmptyDirs(dir, results = []) {
  const files = fs.readdirSync(dir, { withFileTypes: true });

  if (files.length === 0) {
    results.push(dir);
    return results;
  }

  for (const file of files) {
    if (file.isDirectory() && !file.name.startsWith('.') && file.name !== 'node_modules') {
      findEmptyDirs(path.join(dir, file.name), results);
    }
  }

  return results;
}

const emptyDirs = findEmptyDirs(projectRoot);

if (emptyDirs.length > 0) {
  console.log('WARNING: Found empty directories (can consider deleting):\n');
  emptyDirs.forEach(dir => {
    console.log(`   - ${path.relative(projectRoot, dir).replace(/\\/g, '/')}`);
  });
} else {
  console.log('OK: No empty directories found');
}

console.log('\n' + '='.repeat(80) + '\n');

// 4. Check test file correspondence
console.log('Step 4: Checking test file correspondence...\n');

const missingTests = [];

// Check if core files have tests
const coreFiles = [
  'DslBuilder.js',
  'StringExtensions.js',
  'CacheManager.js'
];

coreFiles.forEach(file => {
  const testFile = path.join(testDir, 'unit', 'core', file.replace('.js', '.test.js'));
  if (!fs.existsSync(testFile)) {
    missingTests.push(`test/unit/core/${file.replace('.js', '.test.js')}`);
  }
});

if (missingTests.length > 0) {
  console.log('WARNING: Missing test files:\n');
  missingTests.forEach(file => {
    console.log(`   - ${file}`);
  });
} else {
  console.log('OK: All core files have corresponding tests');
}

console.log('\n' + '='.repeat(80) + '\n');

// Summary
console.log('Detection Summary\n');
console.log(`Clearly unused files: ${unusedFiles.length}`);
console.log(`Suspicious files: ${suspiciousFiles.length}`);
console.log(`Empty directories: ${emptyDirs.length}`);
console.log(`Missing tests: ${missingTests.length}`);

if (unusedFiles.length > 0) {
  console.log('\nSuggested commands to delete clearly unused files:\n');
  unusedFiles.forEach(file => {
    console.log(`   rm ${file.replace(projectRoot, '.')}`);
  });
}

console.log('\n================================================================================');
console.log('  Detection completed! Please manually clean up based on the report');
console.log('================================================================================\n');

