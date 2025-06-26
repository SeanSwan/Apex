// Quick fix script to reset app state and navigation
console.log('🚀 RESETTING APP STATE AND NAVIGATION...\n');

// 1. Clear localStorage to remove any stuck state
console.log('1. Clearing localStorage...');
localStorage.clear();
console.log('   ✅ localStorage cleared');

// 2. Clear sessionStorage as well
console.log('2. Clearing sessionStorage...');
sessionStorage.clear();
console.log('   ✅ sessionStorage cleared');

// 3. Force navigation to homepage
console.log('3. Forcing navigation to homepage...');
if (window.location.pathname !== '/') {
  window.location.href = '/';
  console.log('   ✅ Redirecting to homepage');
} else {
  console.log('   ✅ Already on homepage');
}

// 4. Force page reload to ensure clean state
console.log('4. Forcing page reload...');
setTimeout(() => {
  window.location.reload(true);
}, 100);

console.log('\n✨ APP RESET COMPLETE!');
console.log('If you still see issues:');
console.log('- Clear browser cache manually');
console.log('- Open developer tools and check console for errors');
console.log('- Ensure development server is running');
