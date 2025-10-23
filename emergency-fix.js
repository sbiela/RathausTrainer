// EMERGENCY FIX for Vercel App
// Run this in browser console (F12) to fix UI issues

console.log('Applying emergency UI fixes...');

// Force visibility of critical elements
const selectionArea = document.getElementById('selectionArea');
const roomSettings = document.getElementById('roomSettings');
const roleSelection = document.querySelector('.role-selection');

if (selectionArea) {
    selectionArea.style.display = 'block';
    selectionArea.style.visibility = 'visible';
    console.log('✅ Selection area made visible');
}

if (roomSettings) {
    roomSettings.style.display = 'block';
    roomSettings.style.visibility = 'visible';
    console.log('✅ Room settings made visible');
}

if (roleSelection) {
    roleSelection.style.display = 'block';
    roleSelection.style.visibility = 'visible';
    console.log('✅ Role selection made visible');
}

// Set SinglePlayer as default
const singlePlayerRadio = document.getElementById('roleSinglePlayer');
if (singlePlayerRadio) {
    singlePlayerRadio.checked = true;
    console.log('✅ SinglePlayer mode activated');
}

// Call updateRole if it exists
if (typeof updateRole === 'function') {
    updateRole();
    console.log('✅ updateRole called');
}

// Force show all role options
const roleOptions = document.querySelectorAll('.role-option');
roleOptions.forEach(option => {
    option.style.display = 'block';
    option.style.visibility = 'visible';
});

console.log('🚀 Emergency fixes applied! You should now see:');
console.log('- SinglePlayer option');
console.log('- Room selection');
console.log('- All UI elements');
