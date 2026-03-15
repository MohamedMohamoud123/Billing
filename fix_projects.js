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
    '',
    'export default function TimeTrackingProject() {',
    '  const navigate = useNavigate();',
    '  const location = useLocation();'
  ];

  lines.splice(0, 6, ...correctStart);

  fs.writeFileSync(path, lines.join(isCRLF ? '\r\n' : '\n'));
  console.log('Successfully updated file');
} catch (err) {
  console.error('FAILED TO UPDATE FILE:');
  console.error(err.message);
  console.error(err.stack);
  process.exit(1);
}
