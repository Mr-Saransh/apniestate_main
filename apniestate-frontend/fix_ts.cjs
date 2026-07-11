const fs = require('fs');

function cleanFile(filePath) {
    if (!fs.existsSync(filePath)) return;
    let content = fs.readFileSync(filePath, 'utf8');

    // TopBar.tsx fixes
    if (filePath.includes('TopBar.tsx')) {
        content = content.replace('const { user, memberships, logout, switchWorkspace } = useAuth();', 'const { user, logout } = useAuth();');
        content = content.replace(/<div style={{ padding: '8px 12px', fontSize: '11px'[\s\S]*?Switch Workspace[\s\S]*?<\/div>\s*<div style={{ display: 'flex', flexDirection: 'column', maxHeight: '180px', overflowY: 'auto' }}>[\s\S]*?memberships\.map\(\(m\) => \{[\s\S]*?\}\)[\s\S]*?<\/div>/, '');
    }

    // Company pages fixes
    if (filePath.includes('CompanyInvitationsPage.tsx') || 
        filePath.includes('CompanyResignationsPage.tsx') || 
        filePath.includes('SettingsPage.tsx') ||
        filePath.includes('MyInvitationsPage.tsx')) {
        
        content = content.replace('const { user, activeWorkspace } = useAuth();', 'const { user } = useAuth();');
        content = content.replace('const { user, switchWorkspace } = useAuth();', 'const { user } = useAuth();');
        content = content.replace('activeWorkspace.company_id', 'user?.company_id');
        content = content.replace('activeWorkspace?.company_id', 'user?.company_id');
    }

    fs.writeFileSync(filePath, content);
}

const files = [
    'src/components/design-system/TopBar.tsx',
    'src/pages/CompanyInvitationsPage.tsx',
    'src/pages/CompanyResignationsPage.tsx',
    'src/pages/MyInvitationsPage.tsx',
    'src/pages/SettingsPage.tsx'
];

files.forEach(cleanFile);
console.log('Cleaned up files');
