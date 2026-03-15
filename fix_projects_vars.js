import fs from 'fs';
const path = 'c:/Users/Taban-pc/Pictures/Taban-Billing/src/pages/timeTracking/TimeTrackingProject.tsx';

try {
  const content = fs.readFileSync(path, 'utf8');
  const isCRLF = content.includes('\r\n');
  const lines = isCRLF ? content.split('\r\n') : content.split('\n');

  const missingVariables = [
    '  const [isDropdownOpen, setIsDropdownOpen] = useState(false);',
    '  const [selectedView, setSelectedView] = useState("All");',
    '  const [showCustomViewForm, setShowCustomViewForm] = useState(false);',
    '  const [showLogEntryForm, setShowLogEntryForm] = useState(false);',
    '  const [selectedProjectForLog, setSelectedProjectForLog] = useState("");'
  ];

  // Insert missing variables after line 13 (index 12 is '  const location = useLocation();')
  lines.splice(13, 0, ...missingVariables);

  fs.writeFileSync(path, lines.join(isCRLF ? '\r\n' : '\n'));
  console.log('Successfully updated file');
} catch (err) {
  console.error('FAILED TO UPDATE FILE:');
  console.error(err.message);
  process.exit(1);
}
