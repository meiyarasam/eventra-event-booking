'use client';

import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { formatCurrency } from '@/lib/utils';
import {
  ShieldCheck,
  Lock,
  CreditCard,
  Smartphone,
  Building2,
  Wallet,
  CheckCircle2,
  XCircle,
  Zap,
  X,
  Sparkles,
} from 'lucide-react';

interface MockPaymentGatewayModalProps {
  isOpen: boolean;
  onClose: () => void;
  reservationId: string;
  totalAmount: number;
  eventTitle?: string;
  onConfirmPayment: (payload: {
    reservationId: string;
    paymentMethod: 'CARD' | 'UPI' | 'NETBANKING' | 'WALLET';
    simulateSuccess: boolean;
    paymentDetails: {
      cardLast4?: string;
      cardHolder?: string;
      upiId?: string;
      bankName?: string;
      walletName?: string;
    };
  }) => Promise<any>;
  isProcessing: boolean;
}

export function MockPaymentGatewayModal({
  isOpen,
  onClose,
  reservationId,
  totalAmount,
  eventTitle = 'EVENTRA Admission Tickets',
  onConfirmPayment,
}: MockPaymentGatewayModalProps) {
  const [activeTab, setActiveTab] = useState<'UPI' | 'CARD' | 'NETBANKING' | 'WALLET'>('UPI');
  const [simulateSuccess, setSimulateSuccess] = useState<boolean>(true);

  // Card details
  const [cardNumber, setCardNumber] = useState('4242 4242 4242 4242');
  const [cardHolder, setCardHolder] = useState('Alex Chen');
  const [cardExpiry, setCardExpiry] = useState('12/28');
  const [cardCvv, setCardCvv] = useState('123');
  const [cardType, setCardType] = useState<'VISA' | 'MASTERCARD' | 'RUPAY'>('VISA');

  // UPI details
  const [upiMode, setUpiMode] = useState<'QR' | 'ID'>('QR');
  const [upiId, setUpiId] = useState('alex@okaxis');

  // Net banking details
  const [selectedBank, setSelectedBank] = useState('HDFC Bank');

  // Wallet details
  const [selectedWallet, setSelectedWallet] = useState('Paytm Wallet');

  // Simulation step: 'IDLE' | 'AUTHORIZING' | 'SUCCESS' | 'DECLINED'
  const [gatewayStep, setGatewayStep] = useState<'IDLE' | 'AUTHORIZING' | 'SUCCESS' | 'DECLINED'>('IDLE');
  const [txnRef, setTxnRef] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Handle format of card number
  const handleCardNumberChange = (val: string) => {
    const raw = val.replace(/\D/g, '').slice(0, 16);
    const formatted = raw.replace(/(\d{4})(?=\d)/g, '$1 ');
    setCardNumber(formatted);

    if (raw.startsWith('4')) setCardType('VISA');
    else if (raw.startsWith('5')) setCardType('MASTERCARD');
    else if (raw.startsWith('6') || raw.startsWith('3')) setCardType('RUPAY');
  };

  const handleQuickCard = (type: 'VISA' | 'RUPAY' | 'DECLINE') => {
    setActiveTab('CARD');
    if (type === 'VISA') {
      setCardNumber('4242 4242 4242 4242');
      setCardType('VISA');
      setCardHolder('Alex Chen');
      setCardExpiry('12/28');
      setCardCvv('123');
      setSimulateSuccess(true);
    } else if (type === 'RUPAY') {
      setCardNumber('6071 8293 4819 1024');
      setCardType('RUPAY');
      setCardHolder('Priya Sharma');
      setCardExpiry('08/29');
      setCardCvv('889');
      setSimulateSuccess(true);
    } else {
      setCardNumber('4000 0000 0000 0002');
      setCardHolder('Declined Tester');
      setCardExpiry('01/25');
      setCardCvv('000');
      setSimulateSuccess(false);
    }
  };

  const handleStartPayment = async () => {
    setGatewayStep('AUTHORIZING');
    setErrorMessage('');

    // Simulated short 1-second bank connection animation
    await new Promise((r) => setTimeout(r, 1000));

    try {
      const cardLast4 = cardNumber.replace(/\s/g, '').slice(-4) || '4242';
      const res = await onConfirmPayment({
        reservationId,
        paymentMethod: activeTab,
        simulateSuccess,
        paymentDetails: {
          cardLast4,
          cardHolder,
          upiId: activeTab === 'UPI' ? upiId : undefined,
          bankName: activeTab === 'NETBANKING' ? selectedBank : undefined,
          walletName: activeTab === 'WALLET' ? selectedWallet : undefined,
        },
      });

      const ref = res?.data?.bookingReference || `TXN-${Date.now().toString().slice(-6)}`;
      setTxnRef(ref);
      setGatewayStep('SUCCESS');
    } catch (err: any) {
      setGatewayStep('DECLINED');
      setErrorMessage(err?.message || 'Payment simulation declined by test bank.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-navy-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Gateway Header */}
        <div className="bg-gradient-to-r from-navy-950 via-slate-900 to-navy-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-500/20 border border-brand-500/30 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6 text-brand-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base tracking-tight text-white">EVENTRA Secure Pay</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  SANDBOX 256-BIT SSL
                </span>
              </div>
              <span className="text-xs text-slate-400 block truncate max-w-xs">{eventTitle}</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Amount Due</span>
              <span className="font-extrabold text-xl text-emerald-400">{formatCurrency(totalAmount)}</span>
            </div>
            {gatewayStep === 'IDLE' && (
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Interview Simulation Banner */}
        <div className="bg-amber-50 border-b border-amber-200/80 px-6 py-2.5 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-amber-900 font-medium">
            <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Demonstration Sandbox: Toggle bank authorization outcome</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSimulateSuccess(true)}
              className={`px-2.5 py-1 rounded-md font-bold transition-all ${
                simulateSuccess
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-stone-200/70 text-stone-600 hover:bg-stone-200'
              }`}
            >
              ✓ Approve
            </button>
            <button
              type="button"
              onClick={() => setSimulateSuccess(false)}
              className={`px-2.5 py-1 rounded-md font-bold transition-all ${
                !simulateSuccess
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'bg-stone-200/70 text-stone-600 hover:bg-stone-200'
              }`}
            >
              ✕ Decline
            </button>
          </div>
        </div>

        {/* Main Body */}
        {gatewayStep === 'AUTHORIZING' ? (
          <div className="p-12 flex flex-col items-center justify-center text-center space-y-5 my-auto">
            <div className="relative w-20 h-20">
              <div className="absolute inset-0 rounded-full border-4 border-brand-200 animate-ping opacity-30" />
              <div className="w-20 h-20 rounded-full border-4 border-brand-500 border-t-transparent animate-spin flex items-center justify-center">
                <Lock className="w-8 h-8 text-brand-600 animate-pulse" />
              </div>
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-stone-900">Contacting Simulated Bank Gateway...</h3>
              <p className="text-xs text-stone-500 max-w-sm">
                Authenticating 3D Secure / UPI Pin with virtual banking node. Do not refresh this page.
              </p>
            </div>
          </div>
        ) : gatewayStep === 'DECLINED' ? (
          <div className="p-8 flex flex-col items-center justify-center text-center space-y-4 my-auto">
            <div className="w-16 h-16 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center">
              <XCircle className="w-10 h-10" />
            </div>
            <div className="space-y-1">
              <h3 className="text-xl font-bold text-stone-900">Payment Simulation Declined</h3>
              <p className="text-sm text-stone-600 max-w-sm">{errorMessage}</p>
            </div>
            <div className="pt-2 flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setSimulateSuccess(true);
                  setGatewayStep('IDLE');
                }}
                className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm shadow-md transition-all"
              >
                Switch to Approved & Retry
              </button>
              <button
                type="button"
                onClick={() => setGatewayStep('IDLE')}
                className="px-4 py-2.5 rounded-xl border border-stone-300 text-stone-700 font-semibold text-sm hover:bg-stone-50 transition-all"
              >
                Change Method
              </button>
            </div>
          </div>
        ) : gatewayStep === 'SUCCESS' ? (
          <div className="p-8 flex flex-col items-center justify-center text-center space-y-4 my-auto animate-in zoom-in-95">
            <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10 animate-bounce" />
            </div>
            <div className="space-y-1">
              <h3 className="text-xl font-extrabold text-stone-900">Payment Verified!</h3>
              <p className="text-sm text-stone-600">Booking and QR Ticket Passes successfully generated.</p>
              {txnRef && (
                <span className="inline-block mt-2 font-mono text-xs font-semibold px-3 py-1 bg-stone-100 rounded-lg text-stone-700">
                  Ref: {txnRef}
                </span>
              )}
            </div>
            <p className="text-xs text-stone-400">Redirecting to your digital tickets...</p>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row flex-1 overflow-hidden">
            {/* Left Tabs */}
            <div className="w-full sm:w-48 bg-stone-50 border-r border-stone-200 p-2 sm:p-3 space-y-1 shrink-0">
              <button
                type="button"
                onClick={() => setActiveTab('UPI')}
                className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-bold transition-all text-left ${
                  activeTab === 'UPI'
                    ? 'bg-brand-600 text-white shadow-sm'
                    : 'text-stone-700 hover:bg-stone-200/60'
                }`}
              >
                <Smartphone className="w-4 h-4 shrink-0" />
                <span>UPI / QR Code</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('CARD')}
                className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-bold transition-all text-left ${
                  activeTab === 'CARD'
                    ? 'bg-brand-600 text-white shadow-sm'
                    : 'text-stone-700 hover:bg-stone-200/60'
                }`}
              >
                <CreditCard className="w-4 h-4 shrink-0" />
                <span>Cards (Debit/Credit)</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('NETBANKING')}
                className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-bold transition-all text-left ${
                  activeTab === 'NETBANKING'
                    ? 'bg-brand-600 text-white shadow-sm'
                    : 'text-stone-700 hover:bg-stone-200/60'
                }`}
              >
                <Building2 className="w-4 h-4 shrink-0" />
                <span>Net Banking</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('WALLET')}
                className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-bold transition-all text-left ${
                  activeTab === 'WALLET'
                    ? 'bg-brand-600 text-white shadow-sm'
                    : 'text-stone-700 hover:bg-stone-200/60'
                }`}
              >
                <Wallet className="w-4 h-4 shrink-0" />
                <span>Wallets</span>
              </button>
            </div>

            {/* Right Content Area */}
            <div className="flex-1 p-5 overflow-y-auto space-y-4">
              {/* UPI Tab */}
              {activeTab === 'UPI' && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 p-1 bg-stone-100 rounded-xl text-xs">
                    <button
                      type="button"
                      onClick={() => setUpiMode('QR')}
                      className={`flex-1 py-1.5 rounded-lg font-bold transition-all ${
                        upiMode === 'QR' ? 'bg-white shadow-sm text-stone-900' : 'text-stone-600 hover:text-stone-900'
                      }`}
                    >
                      Scan QR Code
                    </button>
                    <button
                      type="button"
                      onClick={() => setUpiMode('ID')}
                      className={`flex-1 py-1.5 rounded-lg font-bold transition-all ${
                        upiMode === 'ID' ? 'bg-white shadow-sm text-stone-900' : 'text-stone-600 hover:text-stone-900'
                      }`}
                    >
                      Enter UPI ID / VPA
                    </button>
                  </div>

                  {upiMode === 'QR' ? (
                    <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-3">
                      <div className="p-3 bg-white rounded-2xl shadow-sm border border-stone-200 relative">
                        <QRCodeSVG
                          value={`upi://pay?pa=eventra@bank&pn=EVENTRA&am=${totalAmount}&cu=INR`}
                          size={150}
                          level="H"
                        />
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <div className="w-8 h-8 rounded-full bg-navy-950 border-2 border-white flex items-center justify-center text-white font-black text-xs">
                            ₹
                          </div>
                        </div>
                      </div>
                      <div className="text-center space-y-0.5">
                        <span className="text-xs font-bold text-stone-800 block">
                          Scan & Pay with Any UPI App
                        </span>
                        <span className="text-[11px] text-stone-500 block">
                          Google Pay • PhonePe • Paytm • BHIM • Cred
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={handleStartPayment}
                        className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2"
                      >
                        <Zap className="w-3.5 h-3.5" />
                        Simulate App Scan & Pay {formatCurrency(totalAmount)}
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-bold text-stone-700 mb-1">
                          UPI Virtual Payment Address (VPA)
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            value={upiId}
                            onChange={(e) => setUpiId(e.target.value)}
                            placeholder="e.g. mobile@upi or name@okaxis"
                            className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-stone-300 focus:border-brand-500 focus:outline-none"
                          />
                          <span className="absolute right-3 top-3 text-emerald-600 flex items-center gap-1 text-[11px] font-bold">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Verified
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {['alex@okhdfcbank', 'alex@okicici', 'alex@paytm', 'alex@ybl'].map((handle) => (
                          <button
                            key={handle}
                            type="button"
                            onClick={() => setUpiId(handle)}
                            className="px-2.5 py-1 rounded-lg border border-stone-200 bg-stone-50 hover:bg-stone-100 text-[11px] font-semibold text-stone-600 transition-colors"
                          >
                            {handle}
                          </button>
                        ))}
                      </div>

                      <button
                        type="button"
                        onClick={handleStartPayment}
                        className="w-full py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm shadow-md transition-all"
                      >
                        Verify & Pay {formatCurrency(totalAmount)}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* CARD Tab */}
              {activeTab === 'CARD' && (
                <div className="space-y-4">
                  {/* Virtual Card Preview */}
                  <div className="rounded-2xl p-4 bg-gradient-to-tr from-slate-900 via-navy-950 to-slate-800 text-white shadow-md relative overflow-hidden border border-slate-700">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-xs font-extrabold uppercase tracking-widest text-brand-400">
                        EVENTRA PassCard
                      </span>
                      <span className="font-mono text-xs font-black px-2 py-0.5 rounded bg-white/10 text-white">
                        {cardType}
                      </span>
                    </div>
                    <div className="w-8 h-6 rounded bg-amber-400/80 mb-3 border border-amber-300" />
                    <div className="font-mono text-base tracking-widest mb-3">{cardNumber}</div>
                    <div className="flex items-center justify-between text-[10px] text-slate-300 font-mono">
                      <div>
                        <span className="block text-[8px] text-slate-400 uppercase">Card Holder</span>
                        <span className="font-bold text-white uppercase">{cardHolder}</span>
                      </div>
                      <div>
                        <span className="block text-[8px] text-slate-400 uppercase">Expires</span>
                        <span className="font-bold text-white">{cardExpiry}</span>
                      </div>
                    </div>
                  </div>

                  {/* Test Presets */}
                  <div className="flex flex-wrap gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => handleQuickCard('VISA')}
                      className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold hover:bg-emerald-100"
                    >
                      ⚡ Test Visa
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickCard('RUPAY')}
                      className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 font-semibold hover:bg-blue-100"
                    >
                      ⚡ Test RuPay
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickCard('DECLINE')}
                      className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 font-semibold hover:bg-rose-100"
                    >
                      ⚡ Test Decline
                    </button>
                  </div>

                  {/* Form */}
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-bold text-stone-700 mb-1">Card Number</label>
                      <input
                        type="text"
                        value={cardNumber}
                        onChange={(e) => handleCardNumberChange(e.target.value)}
                        placeholder="4242 4242 4242 4242"
                        className="w-full px-3.5 py-2 text-sm rounded-xl border border-stone-300 focus:border-brand-500 focus:outline-none font-mono"
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div className="col-span-2">
                        <label className="block text-xs font-bold text-stone-700 mb-1">Cardholder Name</label>
                        <input
                          type="text"
                          value={cardHolder}
                          onChange={(e) => setCardHolder(e.target.value)}
                          className="w-full px-3.5 py-2 text-sm rounded-xl border border-stone-300 focus:border-brand-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-stone-700 mb-1">Expires</label>
                        <input
                          type="text"
                          value={cardExpiry}
                          onChange={(e) => setCardExpiry(e.target.value)}
                          placeholder="MM/YY"
                          className="w-full px-3 py-2 text-sm rounded-xl border border-stone-300 focus:border-brand-500 focus:outline-none font-mono text-center"
                        />
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleStartPayment}
                      className="w-full py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm shadow-md transition-all"
                    >
                      Pay {formatCurrency(totalAmount)}
                    </button>
                  </div>
                </div>
              )}

              {/* NETBANKING Tab */}
              {activeTab === 'NETBANKING' && (
                <div className="space-y-4">
                  <span className="text-xs font-bold text-stone-700 block">Select Popular Bank</span>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { name: 'HDFC Bank' },
                      { name: 'State Bank of India' },
                      { name: 'ICICI Bank' },
                      { name: 'Axis Bank' },
                      { name: 'Kotak Mahindra' },
                      { name: 'Punjab National Bank' },
                    ].map((bank) => (
                      <button
                        key={bank.name}
                        type="button"
                        onClick={() => setSelectedBank(bank.name)}
                        className={`p-3 rounded-xl border text-xs font-bold text-left transition-all ${
                          selectedBank === bank.name
                            ? 'border-brand-500 bg-brand-50 text-brand-900 ring-2 ring-brand-500/20'
                            : 'border-stone-200 bg-white hover:bg-stone-50 text-stone-700'
                        }`}
                      >
                        {bank.name}
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={handleStartPayment}
                    className="w-full py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm shadow-md transition-all"
                  >
                    Proceed with {selectedBank}
                  </button>
                </div>
              )}

              {/* WALLET Tab */}
              {activeTab === 'WALLET' && (
                <div className="space-y-4">
                  <span className="text-xs font-bold text-stone-700 block">Select Digital Wallet</span>
                  <div className="space-y-2">
                    {[
                      { name: 'Paytm Wallet', balance: '₹4,500.00' },
                      { name: 'Amazon Pay', balance: '₹8,250.00' },
                      { name: 'Mobikwik', balance: '₹1,200.00' },
                    ].map((w) => (
                      <button
                        key={w.name}
                        type="button"
                        onClick={() => setSelectedWallet(w.name)}
                        className={`w-full p-3.5 rounded-xl border flex items-center justify-between transition-all ${
                          selectedWallet === w.name
                            ? 'border-brand-500 bg-brand-50/60 ring-2 ring-brand-500/20'
                            : 'border-stone-200 bg-white hover:bg-stone-50'
                        }`}
                      >
                        <span className="text-xs font-bold text-stone-800">{w.name}</span>
                        <span className="text-xs text-stone-500">Avail. Bal: {w.balance}</span>
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={handleStartPayment}
                    className="w-full py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm shadow-md transition-all"
                  >
                    Pay from {selectedWallet}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="px-6 py-3 bg-stone-50 border-t border-stone-200 flex items-center justify-between text-[11px] text-stone-500">
          <div className="flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-emerald-600" />
            <span>End-to-End Encrypted Mock Payment Gateway</span>
          </div>
          <span>EVENTRA Sandbox v2.4</span>
        </div>
      </div>
    </div>
  );
}
