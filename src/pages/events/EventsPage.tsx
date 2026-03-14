import React, { useState, useEffect, useMemo } from 'react';
import { eventsAPI } from '../../services/api';
import { 
  Search, 
  Filter, 
  ChevronDown, 
  RefreshCw, 
  X, 
  Copy, 
  Clock, 
  Info,
  ChevronLeft,
  ChevronRight,
  MoreVertical
} from 'lucide-react';
import { toast } from 'react-toastify';

interface Event {
  id: string;
  event_id: string;
  event_type: string;
  occurred_at: string;
  source: string;
  data: any;
}

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [filterType, setFilterType] = useState('All Events');
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    setIsLoading(true);
    try {
      const response = await eventsAPI.getAll();
      if (response.success) {
        setEvents(response.data);
      }
    } catch (error) {
      console.error('Failed to load events', error);
      toast.error('Failed to load events');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredEvents = useMemo(() => {
    return events.filter(event => {
      const matchesSearch = 
        event.event_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.event_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.source.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesFilter = filterType === 'All Events' || event.event_type === filterType;
      
      return matchesSearch && matchesFilter;
    });
  }, [events, searchQuery, filterType]);

  const eventTypes = useMemo(() => {
    const types = new Set(events.map(e => e.event_type));
    return ['All Events', ...Array.from(types)];
  }, [events]);

  const formatDateTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      }).format(date);
    } catch (e) {
      return dateString;
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  return (
    <div className="flex flex-col h-full bg-white overflow-hidden relative">
      {/* Header / Toolbar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-white sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <div className="relative group">
            <button 
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className="flex items-center gap-2 px-3 py-1.5 text-lg font-semibold text-gray-800 hover:bg-gray-50 rounded-md transition-colors"
            >
              {filterType}
              <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${isFilterOpen ? 'rotate-180' : ''}`} />
            </button>
            
            {isFilterOpen && (
              <>
                <div 
                  className="fixed inset-0 z-20" 
                  onClick={() => setIsFilterOpen(false)}
                />
                <div className="absolute left-0 mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-xl z-30 py-1 max-h-96 overflow-auto">
                  {eventTypes.map(type => (
                    <button
                      key={type}
                      onClick={() => {
                        setFilterType(type);
                        setIsFilterOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors ${filterType === type ? 'text-blue-600 bg-blue-50 font-medium' : 'text-gray-700'}`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search in Events (/)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-full w-64 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
            />
          </div>
          <button 
            onClick={loadEvents}
            className={`p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors ${isLoading ? 'animate-spin' : ''}`}
            title="Refresh"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
          <button className="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors">
            <MoreVertical className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Table Container */}
        <div className={`flex-1 overflow-auto transition-all duration-300`}>
          <table className="w-full text-left border-separate border-spacing-0">
            <thead className="bg-[#fbfcff] sticky top-0 z-[5]">
              <tr>
                <th className="px-6 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100 w-1/4">
                  Occurred At
                </th>
                <th className="px-6 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100 w-1/4">
                  Event ID
                </th>
                <th className="px-6 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100 w-1/4">
                  Event Type
                </th>
                <th className="px-6 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100 w-1/4">
                  Event Source
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                    <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-gray-300" />
                    Loading events...
                  </td>
                </tr>
              ) : filteredEvents.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                    No events found matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredEvents.map((event) => (
                  <tr 
                    key={event.id}
                    onClick={() => setSelectedEvent(selectedEvent?.id === event.id ? null : event)}
                    className={`hover:bg-blue-50/30 cursor-pointer transition-colors group ${selectedEvent?.id === event.id ? 'bg-blue-50' : ''}`}
                  >
                    <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap">
                      {formatDateTime(event.occurred_at)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 font-mono">
                      {event.event_id}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-gray-800">
                        {event.event_type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {event.source}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Side Detail Panel */}
        {selectedEvent && (
          <div className="w-[450px] border-l border-gray-200 bg-white flex flex-col shadow-[-10px_0_15px_-3px_rgba(0,0,0,0.05)] z-20 animate-in slide-in-from-right duration-300">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-800">{selectedEvent.event_type}</h2>
              <button 
                onClick={() => setSelectedEvent(null)}
                className="p-1.5 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-auto p-6 space-y-6">
              {/* Event Metadata */}
              <div className="space-y-4">
                <div>
                  <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Event ID</label>
                  <div className="flex items-center gap-2 group">
                    <span className="text-sm font-mono text-gray-700">{selectedEvent.event_id}</span>
                    <button 
                      onClick={() => copyToClipboard(selectedEvent.event_id)}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-100 rounded transition-all text-gray-400"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <div>
                  <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Occurred At</label>
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <Clock className="w-4 h-4 text-gray-400" />
                    {formatDateTime(selectedEvent.occurred_at)}
                  </div>
                </div>
                <div>
                  <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Source</label>
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <Info className="w-4 h-4 text-gray-400" />
                    {selectedEvent.source}
                  </div>
                </div>
              </div>

              {/* Event Data JSON */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">Event Data</label>
                  <button 
                    onClick={() => copyToClipboard(JSON.stringify(selectedEvent.data, null, 2))}
                    className="text-[11px] text-blue-600 hover:underline flex items-center gap-1"
                  >
                    <Copy className="w-3 h-3" />
                    Copy JSON
                  </button>
                </div>
                <div className="relative group">
                  <pre className="bg-[#1e1e1e] text-blue-200 p-4 rounded-lg text-[12px] leading-relaxed overflow-auto max-h-[500px] font-mono shadow-inner border border-gray-800">
                    {JSON.stringify(selectedEvent.data, null, 2)}
                  </pre>
                </div>
              </div>
            </div>
            
            <div className="p-4 border-t border-gray-100 bg-gray-50/50 flex justify-end gap-3">
              <button 
                onClick={() => setSelectedEvent(null)}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-md transition-colors border border-gray-200 shadow-sm"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Pagination Placeholder to match Zoho */}
      <div className="px-6 py-3 border-t border-gray-100 bg-[#fbfcff] flex items-center justify-between text-sm text-gray-500">
        <div>
          Showing {filteredEvents.length} of {events.length} events
        </div>
        <div className="flex items-center gap-1">
          <button className="p-1 hover:bg-gray-100 rounded disabled:opacity-30" disabled>
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="px-2 font-medium text-gray-700">1</span>
          <button className="p-1 hover:bg-gray-100 rounded disabled:opacity-30" disabled>
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
