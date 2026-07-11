const fs = require('fs');

function cleanFile(filePath) {
    if (!fs.existsSync(filePath)) return;
    let content = fs.readFileSync(filePath, 'utf8');

    // SettingsPage.tsx fixes
    if (filePath.includes('SettingsPage.tsx')) {
        content = content.replace('const { user, updateUser, logout, user } = useAuth();', 'const { user, updateUser, logout } = useAuth();');
        content = content.replace(/user\?\.company\?\.id/g, 'user?.company_id');
        content = content.replace(/user\?\.company\.id/g, 'user?.company_id');
        content = content.replace(/user\?\.company\?\.name/g, '"Apni Estate (Pvt.) Ltd."');
    }

    // Company pages fixes
    if (filePath.includes('CompanyInvitationsPage.tsx') || 
        filePath.includes('CompanyResignationsPage.tsx')) {
        content = content.replace(/user\?\.company\?\.id/g, 'user?.company_id');
        content = content.replace(/user\?\.company\.id/g, 'user?.company_id');
        content = content.replace(/user\?\.company\?\.name/g, '"Company"');
    }

    // MyInvitationsPage.tsx
    if (filePath.includes('MyInvitationsPage.tsx')) {
        content = content.replace('const { user, switchWorkspace } = useAuth();', 'const { user } = useAuth();');
    }

    fs.writeFileSync(filePath, content);
}

const files = [
    'src/pages/CompanyInvitationsPage.tsx',
    'src/pages/CompanyResignationsPage.tsx',
    'src/pages/MyInvitationsPage.tsx',
    'src/pages/SettingsPage.tsx'
];

files.forEach(cleanFile);
console.log('Cleaned up files completely 2');
