const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Check if .husky directory exists
const huskyDir = path.join(__dirname, '..', '.husky');

try {
  if (!fs.existsSync(huskyDir)) {
    console.log('Setting up Husky...');
    // Create .husky directory
    fs.mkdirSync(huskyDir, { recursive: true });
    
    // Create _directory
    fs.mkdirSync(path.join(huskyDir, '_'), { recursive: true });
    
    // Initialize Husky
    execSync('npx husky install', { stdio: 'inherit' });
    
    // Add pre-commit hook
    execSync('npx husky add .husky/pre-commit "npx lint-staged"', { stdio: 'inherit' });
    
    console.log('Husky setup completed successfully!');
  } else {
    console.log('Husky is already set up.');
  }
} catch (error) {
  console.error('Error setting up Husky:', error);
  process.exit(1);
}
