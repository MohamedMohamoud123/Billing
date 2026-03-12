import React, { useEffect, useRef, useState } from 'react';
import { ChevronDown, Search, Check, ChevronUp, PlusCircle } from 'lucide-react';

export type DropdownOption = {
    value: string;
    label: string;
};

export type SearchableDropdownProps = {
    value: string;
    options: Array<DropdownOption>;
    onChange: (value: string) => void;
    placeholder: string;
    accentColor: string;
    addNewLabel?: string;
    onAddNew?: () => void;
    openDirection?: 'down' | 'up';
};

const SearchableDropdown = ({
    value,
    options,
    onChange,
    placeholder,
    accentColor,
    addNewLabel,
    onAddNew,
    openDirection = 'down',
}: SearchableDropdownProps) => {
    const [open, setOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [hoveredValue, setHoveredValue] = useState<string | null>(null);
    const wrapperRef = useRef<HTMLDivElement>(null);

    const selected = options.find((opt) => opt.value === value);
    const filtered = options.filter((opt) =>
        opt.label.toLowerCase().includes(searchTerm.toLowerCase())
    );

    useEffect(() => {
        const handleOutside = (event: MouseEvent) => {
            if (!wrapperRef.current?.contains(event.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener("mousedown", handleOutside);
        return () => document.removeEventListener("mousedown", handleOutside);
    }, []);

    return (
        <div ref={wrapperRef} className={`relative ${open ? 'z-[260]' : ''}`}>
            <button
                type="button"
                onClick={() => setOpen((prev) => !prev)}
                className="flex h-[38px] w-full items-center justify-between rounded-md border border-gray-300 bg-white px-3 text-left text-[14px] outline-none transition-all focus:border-blue-400"
                style={open ? { borderColor: '#3b82f6', boxShadow: '0 0 0 1px #3b82f6' } : {}}
            >
                <span className={selected ? "text-gray-900" : "text-gray-500"}>{selected?.label || placeholder}</span>
                {open ? <ChevronUp size={16} className="text-blue-500" /> : <ChevronDown size={16} className="text-gray-400" />}
            </button>

            {open && (
                <div
                    className={`absolute left-0 z-[260] w-full rounded-lg border border-gray-200 bg-white p-2 shadow-xl animate-in fade-in duration-200 ${openDirection === 'up' ? 'bottom-full mb-1 slide-in-from-bottom-2' : 'top-full mt-1 slide-in-from-top-2'
                        }`}
                >
                    <div className="mb-2 flex items-center gap-2 rounded-md border border-blue-400 bg-white px-3 py-2">
                        <Search size={14} className="text-gray-400" />
                        <input
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Search"
                            className="w-full border-none bg-transparent text-[13px] text-gray-700 outline-none"
                            autoFocus
                        />
                    </div>

                    <div className="max-h-56 overflow-y-auto space-y-0.5">
                        {filtered.length === 0 ? (
                            <div className="px-3 py-2 text-[13px] text-gray-500 italic">No options found</div>
                        ) : (
                            filtered.map((opt) => {
                                const isSelected = value === opt.value;
                                return (
                                    <button
                                        key={opt.value}
                                        type="button"
                                        onClick={() => {
                                            onChange(opt.value);
                                            setOpen(false);
                                            setSearchTerm("");
                                        }}
                                        onMouseEnter={() => setHoveredValue(opt.value)}
                                        onMouseLeave={() => setHoveredValue(null)}
                                        className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-[13px] transition-colors ${isSelected || hoveredValue === opt.value ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-50'}`}
                                    >
                                        <span className="truncate">{opt.label}</span>
                                        {isSelected && <Check size={14} />}
                                    </button>
                                );
                            })
                        )}
                    </div>

                    {onAddNew && addNewLabel && (
                        <button
                            type="button"
                            onClick={() => {
                                setOpen(false);
                                setSearchTerm("");
                                onAddNew();
                            }}
                            className="mt-2 flex w-full items-center gap-2 border-t border-gray-100 px-2 pt-2 text-[13px] text-blue-600 font-medium hover:text-blue-700 transition-colors"
                        >
                            <PlusCircle size={14} />
                            {addNewLabel}
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};

export default SearchableDropdown;
