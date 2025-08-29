import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SimpleDashboard } from './components/SimpleDashboard';
import { SimpleStocks } from './components/SimpleStocks';
import { FocusedTrading } from './components/FocusedTrading';
import { StreamlinedPortfolio } from './components/StreamlinedPortfolio';
import { useMarketData } from './hooks/useMarketData';
import { usePortfolio } from './hooks/usePortfolio';
import { useCounter } from './hooks/useCounter';
import { MemeMessages, useMemeMessages } from './components/MemeMessages';
import { RedditTradingLogo } from './components/RedditTradingLogo';
import { SubredditStock } from '../shared/types/api';

type View = 'dashboard' | 'stocks' | 'trading' | 'portfolio';

const pageVariants = {
  initial: { 
    opacity: 0, 
    x: -20,
    filter: "blur(10px)"
  },
  in: { 
    opacity: 1, 
    x: 0,
    filter: "blur(0px)"
  },
  out: { 
    opacity: 0, 
    x: 20,
    filter: "blur(10px)"
  }
};

const pageTransition = {
  type: "spring" as const,
  stiffness: 300,
  damping: 30
};

export const App = () => {
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [selectedStockId, setSelectedStockId] = useState<string | null>(null);
  const [selectedStock, setSelectedStock] = useState<SubredditStock | null>(null);
  
  // Get user data from the existing hook
  const { username } = useCounter();
  
  // Market data hook
  const { marketData, loading: marketLoading, error: marketError, refreshData } = useMarketData();
  
  // Portfolio hook
  const { 
    portfolio, 
    loading: portfolioLoading, 
    refreshPortfolio 
  } = usePortfolio(username || 'anonymous', marketData?.stocks || []);

  // Meme messages hook
  const { messages, addMemeMessage, dismissMessage } = useMemeMessages();

  const handleStockClick = (stockId: string) => {
    const stock = marketData?.stocks.find(s => s.id === stockId);
    if (stock) {
      setSelectedStockId(stockId);
      setSelectedStock(stock);
      setCurrentView('trading');
    }
  };

  const handleTrade = async (stockId: string, type: 'buy' | 'sell', shares: number) => {
    // Handle trade logic here - this would call the trading service
    await refreshPortfolio();
    await refreshData();
    addMemeMessage(type === 'buy' ? 'buy_success' : 'sell_success');
  };

  const handleDirectTrade = async (type: 'buy' | 'sell', shares: number) => {
    if (!selectedStock) return;
    await handleTrade(selectedStock.id, type, shares);
  };

  const handleBackToDashboard = () => {
    setCurrentView('dashboard');
    setSelectedStockId(null);
    setSelectedStock(null);
  };

  const handleBackToStocks = () => {
    setCurrentView('stocks');
    setSelectedStockId(null);
    setSelectedStock(null);
  };

  const handleNavigation = (view: View) => {
    setCurrentView(view);
    if (view !== 'trading') {
      setSelectedStockId(null);
      setSelectedStock(null);
    }
  };

  if (marketLoading && !marketData) {
    return (
      <motion.div 
        className="flex items-center justify-center min-h-screen bg-gray-900"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <div className="text-center">
          <motion.div 
            className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full mx-auto mb-4"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
          <motion.p 
            className="text-gray-300 text-lg"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            Loading market data...
          </motion.p>
        </div>
      </motion.div>
    );
  }

  if (marketError) {
    return (
      <motion.div 
        className="flex items-center justify-center min-h-screen bg-gray-900"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <div className="text-center max-w-md">
          <motion.div 
            className="text-red-500 text-6xl mb-4"
            animate={{ 
              scale: [1, 1.1, 1],
              rotate: [0, -5, 5, 0]
            }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            ⚠️
          </motion.div>
          <h2 className="text-2xl font-bold text-white mb-4">Market Closed</h2>
          <p className="text-gray-400 mb-6">{marketError}</p>
          <motion.button 
            onClick={refreshData}
            className="px-6 py-3 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Retry Connection
          </motion.button>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-gray-900 text-white pb-20">
      {/* Main Content - Scrollable */}
      <main className="w-full">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentView}
            initial="initial"
            animate="in"
            exit="out"
            variants={pageVariants}
            transition={pageTransition}
            className="w-full"
          >
            {currentView === 'dashboard' && (
              <SimpleDashboard
                portfolio={portfolio}
                marketData={marketData}
                onStockClick={handleStockClick}
              />
            )}
            
            {currentView === 'stocks' && marketData && (
              <SimpleStocks
                stocks={marketData.stocks}
                portfolio={portfolio}
                onTrade={handleTrade}
              />
            )}
            
            {currentView === 'trading' && (
              <FocusedTrading
                selectedStock={selectedStock}
                portfolio={portfolio}
                onTrade={handleDirectTrade}
                onBack={handleBackToStocks}
              />
            )}
            
            {currentView === 'portfolio' && (
              <StreamlinedPortfolio
                portfolio={portfolio}
                onStockClick={handleStockClick}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Fixed Bottom Navigation */}
      <motion.nav 
        className="fixed bottom-0 left-0 right-0 bg-gray-800 border-t border-gray-700 z-50"
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", stiffness: 100, damping: 15 }}
      >
        <div className="flex">
          {(['dashboard', 'stocks', 'portfolio'] as const).map((view) => (
            <motion.button
              key={view}
              onClick={() => handleNavigation(view)}
              className={`flex-1 py-2 px-2 text-center transition-all ${
                currentView === view
                  ? 'bg-orange-500 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.95 }}
            >
              <div className="flex flex-col items-center gap-1">
                <span className="text-base">
                  {view === 'dashboard' && (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2 10a8 8 0 018-8v8h8a8 8 0 11-16 0z" />
                      <path d="M12 2.252A8.014 8.014 0 0117.748 8H12V2.252z" />
                    </svg>
                  )}
                  {view === 'stocks' && (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.414L14.586 7H12z" clipRule="evenodd" />
                    </svg>
                  )}
                  {view === 'portfolio' && (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm0 2v2h2V6H4zm0 4v2h2v-2H4zm0 4v2h2v-2H4zm4-8v2h2V6H8zm0 4v2h2v-2H8zm0 4v2h2v-2H8zm4-8v2h4V6h-4zm0 4v2h4v-2h-4zm0 4v2h4v-2h-4z" clipRule="evenodd" />
                    </svg>
                  )}
                </span>
                <span className="text-xs capitalize font-medium">{view}</span>
              </div>
            </motion.button>
          ))}
        </div>
      </motion.nav>

      {/* Loading Overlay */}
      <AnimatePresence>
        {portfolioLoading && (
          <motion.div 
            className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div 
              className="bg-gray-800 rounded-lg p-6 text-center border border-gray-600"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
            >
              <motion.div 
                className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full mx-auto mb-4"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              />
              <p className="text-white">Processing trade...</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Meme Messages */}
      <MemeMessages 
        messages={messages}
        onDismiss={dismissMessage}
      />
    </div>
  );
};