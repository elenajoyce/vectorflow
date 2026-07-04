import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Wallet,
  Play,
  XCircle,
  PlusCircle,
  Clock,
  Sparkles,
} from 'lucide-react';

interface Stream {
  id: number;
  sender: string;
  recipient: string;
  token: string;
  totalAmount: number;
  withdrawnAmount: number;
  startTime: number;
  stopTime: number;
  active: boolean;
}

export default function App() {
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [activeStreams, setActiveStreams] = useState<Stream[]>([
    {
      id: 1,
      sender: 'GB3J2W4CUBM6E4NOHGOHGDMX265W62O7GB4N332J2Z2Z2Z2Z2Z2Z2Z2Z',
      recipient: 'GD4K5L6M...WXYZ789',
      token: 'USDC (Stellar)',
      totalAmount: 3600,
      withdrawnAmount: 450,
      startTime: Math.floor(Date.now() / 1000) - 1800, // 30 mins ago
      stopTime: Math.floor(Date.now() / 1000) + 1800, // 30 mins from now
      active: true,
    },
  ]);

  // Form states
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [duration, setDuration] = useState('10'); // minutes
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Time ticker state for continuous counters
  const [currentTime, setCurrentTime] = useState(Date.now() / 1000);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(Date.now() / 1000);
    }, 50); // 20 updates per second for smooth ticker effect
    return () => clearInterval(timer);
  }, []);

  const connectMockWallet = () => {
    setWalletConnected(true);
    setWalletAddress('GB3J2W4CUBM6E4NOHGOHGDMX265W62O7GB4N332J2Z2Z2Z2Z2Z2Z2Z2Z');
  };

  const handleCreateStream = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipient || !amount) return;

    const newStream: Stream = {
      id: activeStreams.length + 1,
      sender: walletAddress,
      recipient,
      token: 'USDC (Stellar)',
      totalAmount: parseFloat(amount),
      withdrawnAmount: 0,
      startTime: Math.floor(Date.now() / 1000),
      stopTime: Math.floor(Date.now() / 1000) + parseInt(duration) * 60,
      active: true,
    };

    setActiveStreams([newStream, ...activeStreams]);
    setRecipient('');
    setAmount('');
    setShowCreateModal(false);
  };

  const handleWithdraw = (id: number) => {
    setActiveStreams((streams) =>
      streams.map((s) => {
        if (s.id === id) {
          const accrued = calculateAccrued(s);
          return {
            ...s,
            withdrawnAmount: s.withdrawnAmount + accrued,
          };
        }
        return s;
      })
    );
  };

  const handleCancel = (id: number) => {
    setActiveStreams((streams) =>
      streams.map((s) => (s.id === id ? { ...s, active: false } : s))
    );
  };

  // Logic to calculate how much has accrued up to the millisecond
  const calculateAccrued = (stream: Stream) => {
    if (!stream.active) return 0;
    const time = Date.now() / 1000;
    if (time <= stream.startTime) return 0;
    if (time >= stream.stopTime) return stream.totalAmount - stream.withdrawnAmount;

    const totalDuration = stream.stopTime - stream.startTime;
    const elapsed = time - stream.startTime;
    const totalFlowed = (stream.totalAmount * elapsed) / totalDuration;
    return Math.max(0, totalFlowed - stream.withdrawnAmount);
  };

  // Calculate percentage progress of the stream
  const calculateProgress = (stream: Stream) => {
    const time = Date.now() / 1000;
    if (time <= stream.startTime) return 0;
    if (time >= stream.stopTime) return 100;
    return ((time - stream.startTime) / (stream.stopTime - stream.startTime)) * 100;
  };

  return (
    <div className="min-h-screen p-6 md:p-12">
      {/* Header */}
      <header className="max-w-6xl mx-auto flex justify-between items-center mb-16">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/30">
            <TrendingUp className="text-white" size={20} />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white glow-title">
              Vector<span className="text-purple-400">Flow</span>
            </h1>
            <span className="text-xs text-gray-400">Soroban Token Streaming</span>
          </div>
        </div>

        {walletConnected ? (
          <div className="flex items-center gap-3 bg-purple-950/40 border border-purple-500/20 px-4 py-2 rounded-xl">
            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-sm font-medium text-purple-200">
              {walletAddress.substring(0, 6)}...{walletAddress.substring(52)}
            </span>
          </div>
        ) : (
          <button
            onClick={connectMockWallet}
            className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-semibold px-5 py-2.5 rounded-xl shadow-lg shadow-purple-600/20 transition-all duration-200 hover:-translate-y-0.5"
          >
            <Wallet size={16} />
            Connect Wallet
          </button>
        )}
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto">
        {/* Banner Section */}
        <section className="glass-panel p-8 md:p-10 mb-10 flex flex-col md:flex-row items-center gap-8 justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 h-40 w-40 bg-purple-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 h-40 w-40 bg-pink-500/10 rounded-full blur-3xl" />

          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 bg-purple-500/10 border border-purple-500/20 text-purple-300 px-3 py-1 rounded-full text-xs font-semibold mb-4">
              <Sparkles size={12} /> Live on Soroban Testnet
            </div>
            <h2 className="text-3xl font-bold text-white mb-3">
              Second-by-Second continuous payments & token streams.
            </h2>
            <p className="text-gray-400 text-sm leading-relaxed">
              Create real-time streaming payments for payroll, subscriptions, or consulting rates. Recipients can claim accrued assets instantly with no deposit delays.
            </p>
          </div>

          <button
            onClick={() => {
              if (!walletConnected) {
                connectMockWallet();
              }
              setShowCreateModal(true);
            }}
            className="flex items-center gap-2 bg-white text-purple-950 font-bold px-6 py-4 rounded-xl hover:bg-purple-100 transition-all shadow-lg hover:shadow-white/10 shrink-0"
          >
            <PlusCircle size={18} />
            Start Stream
          </button>
        </section>

        {/* Streaming Panel */}
        <section className="mb-12">
          <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <Clock size={20} className="text-purple-400" /> Active Flows
          </h3>

          <div className="space-y-6">
            {activeStreams.map((stream) => {
              const accrued = calculateAccrued(stream);
              const progress = calculateProgress(stream);
              const isFinished = Date.now() / 1000 >= stream.stopTime;

              return (
                <div key={stream.id} className="glass-panel p-6 relative overflow-hidden">
                  {/* Neon Indicator */}
                  <div className="absolute top-0 left-0 bottom-0 w-1.5 bg-gradient-to-b from-purple-500 to-pink-500" />

                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    {/* Left: Stream Info */}
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-xs bg-purple-500/10 text-purple-300 font-bold px-2 py-0.5 rounded">
                          ID: #{stream.id}
                        </span>
                        <span className="text-sm font-semibold text-gray-300">{stream.token}</span>
                      </div>
                      <div className="text-xs text-gray-500 space-y-1">
                        <div>
                          <span className="text-gray-400">To:</span> {stream.recipient}
                        </div>
                        <div>
                          <span className="text-gray-400">Total Stream Deposit:</span>{' '}
                          {stream.totalAmount} USDC
                        </div>
                      </div>
                    </div>

                    {/* Middle: Counter Ticker */}
                    <div className="text-center md:text-right">
                      <div className="glow-counter">
                        +
                        {accrued.toLocaleString(undefined, {
                          minimumFractionDigits: 6,
                          maximumFractionDigits: 6,
                        })}
                      </div>
                      <div className="text-xs text-purple-300 font-semibold uppercase tracking-wider mt-1">
                        Accrued (Unwithdrawn)
                      </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleWithdraw(stream.id)}
                        disabled={!stream.active || accrued <= 0}
                        className="flex-1 md:flex-initial btn-flow px-5 py-2.5 rounded-xl text-sm disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        Claim Balance
                      </button>
                      <button
                        onClick={() => handleCancel(stream.id)}
                        disabled={!stream.active}
                        className="h-10 w-10 border border-red-500/20 text-red-400 hover:bg-red-500/10 rounded-xl flex items-center justify-center transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <XCircle size={18} />
                      </button>
                    </div>
                  </div>

                  {/* Flow Progress Bar */}
                  <div className="mt-6">
                    <div className="flex justify-between text-xs text-gray-500 mb-2">
                      <span>Progress: {progress.toFixed(1)}%</span>
                      <span>
                        {isFinished ? 'Stream Completed' : `${Math.ceil((stream.stopTime - currentTime) / 60)}m remaining`}
                      </span>
                    </div>
                    <div className="h-2 w-full bg-purple-950/60 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-100"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </main>

      {/* Create Stream Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-filter backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="glass-panel w-full max-w-md p-8 relative">
            <button
              onClick={() => setShowCreateModal(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-white"
            >
              ✕
            </button>

            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <Play size={18} className="text-purple-400" /> Start New Flow
            </h3>

            <form onSubmit={handleCreateStream} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                  Recipient Address (Stellar G...)
                </label>
                <input
                  type="text"
                  required
                  placeholder="GD4K5L6M..."
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  className="w-full bg-purple-950/20 border border-purple-500/20 rounded-xl px-4 py-3 text-white outline-none focus:border-purple-500 transition-all text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                    Total Amount (USDC)
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="1000"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full bg-purple-950/20 border border-purple-500/20 rounded-xl px-4 py-3 text-white outline-none focus:border-purple-500 transition-all text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                    Duration (Minutes)
                  </label>
                  <select
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    className="w-full bg-purple-950/20 border border-purple-500/20 rounded-xl px-4 py-3 text-white outline-none focus:border-purple-500 transition-all text-sm"
                  >
                    <option value="5">5 Minutes</option>
                    <option value="10">10 Minutes</option>
                    <option value="30">30 Minutes</option>
                    <option value="60">1 Hour</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="w-full btn-flow py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 mt-4"
              >
                Create Continuous Stream
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
