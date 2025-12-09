import React from 'react';

interface ListItem {
  title: string;
  subtitle: string;
  data: any;
}

interface ContentListProps {
  items: ListItem[];
  onSelect: (item: any) => void;
  title: string;
}

export const ContentList: React.FC<ContentListProps> = ({ items, onSelect, title }) => {
  return (
    <div className="flex-1 w-full h-full overflow-y-auto scroll-smooth">
      <div className="min-h-full flex flex-col items-center p-8 animate-in fade-in duration-500">
        <div className="w-full max-w-5xl">
          <h2 className="font-heading text-3xl text-slate-800 dark:text-slate-200 mb-8 text-center">{title}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map((item, idx) => (
              <button
                key={idx}
                onClick={() => onSelect(item.data)}
                className="group relative overflow-hidden p-6 bg-white dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/50 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-amber-500/50 transition-all text-left shadow-sm hover:shadow-md"
              >
                <div className="absolute top-0 left-0 w-1 h-full bg-amber-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200 group-hover:text-amber-600 dark:group-hover:text-amber-400 mb-2 transition-colors">
                  {item.title}
                </h3>
                <p className="text-sm text-slate-500 font-mono">
                  {item.subtitle}
                </p>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};