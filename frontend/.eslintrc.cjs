// Simple ESLint Configuration for Mixed JS/TS React Project
module.exports = {
  root: true,
  env: { 
    browser: true, 
    es2020: true, 
    node: true 
  },
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
  ],
  ignorePatterns: [
    'dist', 
    '.eslintrc.cjs', 
    'node_modules',
    '*.test.*',
    '*.spec.*',
    'coverage',
    'build'
  ],
  parserOptions: { 
    ecmaVersion: 'latest', 
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true
    }
  },
  settings: { 
    react: { 
      version: '18.2' 
    }
  },
  plugins: ['react-refresh'],
  rules: {
    // === REACT RULES ===
    'react/jsx-no-target-blank': 'off',
    'react/prop-types': 'off',
    'react/react-in-jsx-scope': 'off', // Not needed in React 17+
    'react/jsx-uses-react': 'off',
    'react/jsx-uses-vars': 'error',
    
    // === REACT HOOKS RULES ===
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'off', // Disabled for development
    
    // === DEVELOPMENT FRIENDLY RULES ===
    'react-refresh/only-export-components': 'off', // Disabled for development
    
    // === GENERAL RULES ===
    'no-console': 'off',
    'no-debugger': 'warn',
    'no-unused-vars': 'off', // Disabled for development
    'prefer-const': 'off',
    'no-var': 'error'
  }
}
