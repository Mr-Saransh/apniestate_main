const fs = require('fs');

function cleanFile(filePath) {
    if (!fs.existsSync(filePath)) return;
    let content = fs.readFileSync(filePath, 'utf8');

    // SettingsPage.tsx fixes
    if (filePath.includes('SettingsPage.tsx')) {
        content = content.replace('await companiesApi.deleteCompany(user.company.id);', 'await companiesApi.deleteCompany(user.company_id);');
        content = content.replace('const companyName = "Apni Estate (Pvt.) Ltd." || \'Apni Estate (Pvt.) Ltd.\';', 'const companyName = "Apni Estate (Pvt.) Ltd.";');
    }

    // MyInvitationsPage.tsx
    if (filePath.includes('MyInvitationsPage.tsx')) {
        content = content.replace('const { switchWorkspace } = useAuth();', 'const { user } = useAuth();');
        content = content.replace('await switchWorkspace(inv.company_id, inv.role);', '');
    }

    fs.writeFileSync(filePath, content);
}

const files = [
    'src/pages/MyInvitationsPage.tsx',
    'src/pages/SettingsPage.tsx'
];

files.forEach(cleanFile);
console.log('Cleaned up files completely 3');
