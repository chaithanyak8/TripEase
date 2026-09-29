import React from 'react';
import { useApp } from '../../context/AppContext';
import { Bell, CloudSun, Hotel, AlertCircle, MapPin, CheckCheck, X } from 'lucide-react';

interface NotificationDropdownProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationDropdown: React.FC<NotificationDropdownProps> = ({ isOpen, onClose }) => {
  const { notifications, markNotificationsAsRead } = useApp();

  if (!isOpen) return null;

  const getIcon = (type: string) => {
    switch (type) {
      case 'weather':
        return <CloudSun className="w-4 h-4 text-amber-500" />;
      case 'budget':
        return <AlertCircle className="w-4 h-4 text-sky-600" />;
      case 'info':
      default:
        return <Hotel className="w-4 h-4 text-blue-500" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end p-4 pt-16 sm:pr-8 bg-black/20 backdrop-blur-xs">
      <div className="bg-white w-full max-w-sm rounded-2xl shadow-elevated border border-slate-200 overflow-hidden animate-slideDown">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-sky-600" />
            <span className="font-bold text-sm text-slate-800">Smart Trip Notifications</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={markNotificationsAsRead}
              className="text-[11px] text-sky-600 hover:text-sky-700 font-semibold cursor-pointer flex items-center gap-1"
              title="Mark all as read"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span>Mark read</span>
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
          {notifications.map(item => (
            <div
              key={item.id}
              className={`p-3.5 flex items-start gap-3 transition ${
                item.read ? 'bg-white opacity-80' : 'bg-sky-50/40'
              }`}
            >
              <div className="p-2 rounded-xl bg-slate-100 shrink-0 mt-0.5">
                {getIcon(item.type)}
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-900">{item.title}</h4>
                  <span className="text-[10px] text-slate-400">{item.time}</span>
                </div>
                <p className="text-xs text-slate-600 leading-snug">{item.message}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="p-2.5 bg-slate-50 border-t border-slate-100 text-center">
          <span className="text-[11px] text-slate-500 font-medium">
            AI updates real-time based on weather, schedule & budget.
          </span>
        </div>
      </div>
    </div>
  );
};
