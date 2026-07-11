const fs = require('fs');

function cleanFile(filePath) {
    if (!fs.existsSync(filePath)) return;
    let content = fs.readFileSync(filePath, 'utf8');

    // App.tsx fix
    if (filePath.includes('App.tsx')) {
        content = content.replace('import RouteGuard from \'@/components/auth/RouteGuard\';', 'import RouteGuard from \'@/components/shared/RouteGuard\';');
    }

    // Company pages fixes
    if (filePath.includes('CompanyInvitationsPage.tsx') || 
        filePath.includes('CompanyResignationsPage.tsx') || 
        filePath.includes('SettingsPage.tsx') ||
        filePath.includes('MyInvitationsPage.tsx')) {
        
        // Use regex for flexible spacing
        content = content.replace(/const\s*{\s*user\s*,\s*activeWorkspace\s*}\s*=\s*useAuth\(\);/g, 'const { user } = useAuth();');
        content = content.replace(/const\s*{\s*user\s*,\s*switchWorkspace\s*}\s*=\s*useAuth\(\);/g, 'const { user } = useAuth();');
        content = content.replace(/activeWorkspace\.company_id/g, '(user?.company_id || "")');
        content = content.replace(/activeWorkspace\?\.company_id/g, 'user?.company_id');
        content = content.replace(/activeWorkspace\?/g, 'user?');
        content = content.replace(/activeWorkspace/g, 'user');
    }

    fs.writeFileSync(filePath, content);
}

const files = [
    'src/App.tsx',
    'src/pages/CompanyInvitationsPage.tsx',
    'src/pages/CompanyResignationsPage.tsx',
    'src/pages/MyInvitationsPage.tsx',
    'src/pages/SettingsPage.tsx'
];

files.forEach(cleanFile);
console.log('Cleaned up files completely');
