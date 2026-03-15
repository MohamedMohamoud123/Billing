import fs from 'fs';
const path = 'c:/Users/Taban-pc/Pictures/Taban-Billing/src/pages/timeTracking/TimeTrackingProject.tsx';

try {
  const content = fs.readFileSync(path, 'utf8');
  const isCRLF = content.includes('\r\n');
  const lines = isCRLF ? content.split('\r\n') : content.split('\n');

  const correctStart = [
    'import React, { useState, useEffect, useRef, useMemo } from "react";',
    'import { useNavigate, useLocation } from "react-router-dom";',
    'import { X, Search, ArrowUpDown, ChevronRight, ChevronDown, Download, Upload, Settings, Eye, EyeOff, Info, List, LayoutGrid, SlidersHorizontal, MoreVertical, MoreHorizontal, Plus, Pause, Play, Square, Trash2, AlertTriangle, Clock, Receipt } from "lucide-react";',
    'import { projectsAPI, timeEntriesAPI, customersAPI, usersAPI } from "../../services/api";',
    'import { toast } from "react-toastify";',
    'import NewCustomViewForm from "./NewCustomViewForm";',
    'import NewLogEntryForm from "./NewLogEntryForm";',
    'import BulkUpdateModal, { BulkFieldOption } from "../Expense/shared/BulkUpdateModal";',
    'import ProjectsCustomizeColumnsModal from "./components/ProjectsCustomizeColumnsModal";',
    'import { useCurrency } from "../../hooks/useCurrency";',
    '',
    'export default function TimeTrackingProject() {',
    '  const navigate = useNavigate();',
    '  const location = useLocation();',
    '  const { code: rawCurrencyCode } = useCurrency();',
    '  const baseCurrencyCode = rawCurrencyCode ? rawCurrencyCode.split(\' \')[0].substring(0, 3).toUpperCase() : "KES";',
    '  const [isDropdownOpen, setIsDropdownOpen] = useState(false);',
    '  const [selectedView, setSelectedView] = useState("All");',
    '  const [showCustomViewForm, setShowCustomViewForm] = useState(false);',
    '  const [showLogEntryForm, setShowLogEntryForm] = useState(false);',
    '  const [selectedProjectForLog, setSelectedProjectForLog] = useState("");'
  ];

  // We want to replace whatever is at the start with this block.
  // The current line 1 is "import React ...", then it jumps to "const [projects ...]"
  // So we replace line 1 (index 0). 
  // Wait, I should find exactly where "const [projects ..." starts.
  let projectsLineIndex = lines.findIndex(l => l.includes('const [projects, setProjects]'));
  if (projectsLineIndex === -1) projectsLineIndex = 1;

  lines.splice(0, projectsLineIndex, ...correctStart);

  fs.writeFileSync(path, lines.join(isCRLF ? '\r\n' : '\n'));
  console.log('Successfully updated file');
} catch (err) {
  console.error('FAILED TO UPDATE FILE:');
  console.error(err.message);
  process.exit(1);
}
