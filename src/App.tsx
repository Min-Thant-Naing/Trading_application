/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { Loader2, Newspaper, ExternalLink, Clock } from 'lucide-react';

interface NewsItem {
  title: string;
  link: string;
  pubDate: string;
  source: string;
}

export default function App() {
  const [newsData, setNewsData] = useState<NewsItem[]>([]);
  const [isScanning, setIsScanning] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchNews() {
      try {
        // Start the scan!
        const response = await fetch('/api/news');
        if (!response.ok) {
          throw new Error('Failed to fetch news');
        }
        const data = await response.json();
        
        // Scan is successful! Save the data.
        setNewsData(data);
      } catch (err: any) {
        // Scan failed! Save the error.
        setError(err.message || "Failed to fetch the news.");
      } finally {
        // No matter what happens (success or fail), the scan is over.
        setIsScanning(false);
      }
    }

    fetchNews();
  }, []);

  if (isScanning) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center space-y-6 bg-white p-12 rounded-2xl shadow-sm border border-slate-100 max-w-md w-full text-center">
          <div className="relative">
            <div className="absolute inset-0 bg-indigo-100 rounded-full animate-ping opacity-75"></div>
            <div className="relative bg-indigo-50 text-indigo-600 p-4 rounded-full">
              <Loader2 className="w-10 h-10 animate-spin" />
            </div>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-slate-800 mb-2">Scanning News Sources</h2>
            <p className="text-slate-500 text-sm">Fetching the latest 12-hour updates for MYR and Malaysia...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-red-100 text-center max-w-md w-full">
          <div className="text-red-500 mb-4 flex justify-center">
            <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-slate-800 mb-2">Scan Failed</h2>
          <p className="text-slate-500">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-6 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <header className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
              <Newspaper className="w-8 h-8 text-indigo-600" />
              Latest MYR News
            </h1>
            <p className="text-slate-500 mt-2">Updates from the last 12 hours</p>
          </div>
          <div className="bg-emerald-50 text-emerald-700 px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2 border border-emerald-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Scan Complete
          </div>
        </header>

        {newsData.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-slate-100">
            <p className="text-slate-500">No news found in the last 12 hours.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {newsData.map((item, index) => {
              // Parse the date to make it look nicer
              const date = new Date(item.pubDate);
              const timeAgo = Math.round((new Date().getTime() - date.getTime()) / (1000 * 60 * 60));
              
              return (
                <a 
                  key={index}
                  href={item.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md hover:border-indigo-100 transition-all group block"
                >
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors leading-snug mb-2">
                        {item.title}
                      </h3>
                      <div className="flex items-center gap-4 text-sm text-slate-500">
                        <span className="font-medium text-slate-700">{item.source}</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {timeAgo === 0 ? 'Just now' : `${timeAgo}h ago`}
                        </span>
                      </div>
                    </div>
                    <div className="text-slate-300 group-hover:text-indigo-500 transition-colors">
                      <ExternalLink className="w-5 h-5" />
                    </div>
                  </div>
                </a>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
