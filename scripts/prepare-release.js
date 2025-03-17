#!/usr/bin/env node

/**
 * This script prepares the project for a new release:
 * - Updates the version number in package.json
 * - Creates a changelog entry
 * - Creates a git tag
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Paths
const packageJsonPath = path.join(__dirname, '..', 'package.json');
const changelogPath = path.join(__dirname, '..', 'CHANGELOG.md');

// Functions
function updatePackageJson(version) {
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const oldVersion = packageJson.version;
  packageJson.version = version;
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');
  console.log(`✅ Updated version in package.json from ${oldVersion} to ${version}`);
}

function updateChangelog(version, changes) {
  // Create changelog if it doesn't exist
  if (!fs.existsSync(changelogPath)) {
    fs.writeFileSync(changelogPath, '# Changelog\n\n');
  }

  const date = new Date().toISOString().split('T')[0];
  const newEntry = `## [${version}] - ${date}\n\n${changes}\n\n`;
  
  const changelog = fs.readFileSync(changelogPath, 'utf8');
  const updatedChangelog = changelog.replace('# Changelog\n\n', `# Changelog\n\n${newEntry}`);
  
  fs.writeFileSync(changelogPath, updatedChangelog);
  console.log(`✅ Updated CHANGELOG.md with new entry for version ${version}`);
}

function createGitTag(version) {
  try {
    // Add files
    execSync('git add package.json CHANGELOG.md');
    
    // Commit
    execSync(`git commit -m "Release v${version}"`);
    
    // Create tag
    execSync(`git tag v${version}`);
    
    console.log(`✅ Created git commit and tag for v${version}`);
    console.log(`\nTo push the release, run:\n  git push && git push --tags`);
  } catch (error) {
    console.error('Failed to create git tag:', error.message);
  }
}

// Main process
console.log('📦 Preparing new release...\n');

rl.question('Enter new version number (e.g., 1.0.0): ', (version) => {
  if (!/^\d+\.\d+\.\d+$/.test(version)) {
    console.error('❌ Invalid version format. Please use semver format (e.g., 1.0.0)');
    rl.close();
    return;
  }

  rl.question('Enter changes for this version (will be added to changelog):\n', (changes) => {
    if (!changes.trim()) {
      console.error('❌ Changes cannot be empty');
      rl.close();
      return;
    }

    try {
      updatePackageJson(version);
      updateChangelog(version, changes);
      
      rl.question('Create git commit and tag? (y/n): ', (answer) => {
        if (answer.toLowerCase() === 'y') {
          createGitTag(version);
        }
        rl.close();
      });
    } catch (error) {
      console.error('❌ An error occurred:', error.message);
      rl.close();
    }
  });
}); 