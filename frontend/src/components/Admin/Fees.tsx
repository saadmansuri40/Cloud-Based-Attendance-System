import { useState } from 'react';
import { AlertCircle, CheckCircle, Clock, CreditCard, X, Smartphone, Wallet, ChevronRight, Shield, Lock } from 'lucide-react';

interface FeesProps {
    studentId: string;
}

const TODAY = new Date();
const dueDate = new Date(TODAY.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString();

type FeeStatus = 'Paid' | 'Pending' | 'Overdue';
interface Fee {
    id: string;
    description: string;
    amount: number;
    dueDate: string;
    status: FeeStatus;
    paymentDate: string | null;
}

const INITIAL_FEES: Fee[] = [
    { id: 'f1', description: 'Tuition Fee – Semester 1', amount: 45000, dueDate: '2026-01-15', status: 'Paid', paymentDate: '2026-01-10' },
    { id: 'f2', description: 'Library & Lab Fee', amount: 3500, dueDate: '2026-01-15', status: 'Paid', paymentDate: '2026-01-10' },
    { id: 'f3', description: 'Examination Fee – Semester 1', amount: 1500, dueDate, status: 'Pending', paymentDate: null },
    { id: 'f4', description: 'Hostel & Mess Dues', amount: 32000, dueDate: '2026-01-20', status: 'Overdue', paymentDate: null },
];

type PayMode = 'cc' | 'dc' | 'upi' | null;

const STATUS_ICON: Record<FeeStatus, JSX.Element> = {
    Paid: <CheckCircle className="w-6 h-6 text-green-600" />,
    Pending: <Clock className="w-6 h-6 text-yellow-600" />,
    Overdue: <AlertCircle className="w-6 h-6 text-red-600" />,
};
const STATUS_BG: Record<FeeStatus, string> = { Paid: 'bg-green-100', Pending: 'bg-yellow-100', Overdue: 'bg-red-100' };
const STATUS_TEXT: Record<FeeStatus, string> = { Paid: 'text-green-600', Pending: 'text-yellow-600', Overdue: 'text-red-600' };

function formatCard(val: string) {
    return val.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();
}

export default function Fees({ studentId: _ }: FeesProps) {
    const [fees, setFees] = useState<Fee[]>(INITIAL_FEES);
    const [payingFee, setPayingFee] = useState<Fee | null>(null);
    const [amountType, setAmountType] = useState<'full' | 'custom'>('full');
    const [customAmount, setCustomAmount] = useState('');
    const [amountConfirmed, setAmountConfirmed] = useState(false);
    const [payMode, setPayMode] = useState<PayMode>(null);
    const [cardNum, setCardNum] = useState('');
    const [cardName, setCardName] = useState('');
    const [expiry, setExpiry] = useState('');
    const [cvv, setCvv] = useState('');
    const [processing, setProcessing] = useState(false);
    const [success, setSuccess] = useState(false);

    const totalPaid = fees.filter(f => f.status === 'Paid').reduce((s, f) => s + f.amount, 0);
    const totalPending = fees.filter(f => f.status !== 'Paid').reduce((s, f) => s + f.amount, 0);

    // Effective amount to charge
    const effectiveAmount = amountType === 'full'
        ? (payingFee?.amount ?? 0)
        : Math.min(parseInt(customAmount) || 0, payingFee?.amount ?? 0);

    const openPayment = (fee: Fee) => {
        setPayingFee(fee);
        setAmountType('full');
        setCustomAmount('');
        setAmountConfirmed(false);
        setPayMode(null);
        setCardNum(''); setCardName(''); setExpiry(''); setCvv('');
        setSuccess(false);
    };

    const closeModal = () => {
        setPayingFee(null);
        setAmountType('full');
        setCustomAmount('');
        setAmountConfirmed(false);
        setPayMode(null);
        setSuccess(false);
    };

    const handlePay = async () => {
        setProcessing(true);
        await new Promise(r => setTimeout(r, 1800));
        // Mark as Paid if full amount, or keep as Pending with reduced balance
        setFees(prev => prev.map(f => {
            if (f.id === payingFee!.id) {
                if (effectiveAmount < f.amount) {
                    return { ...f, amount: f.amount - effectiveAmount };
                } else {
                    return { ...f, status: 'Paid', paymentDate: new Date().toISOString() };
                }
            }
            return f;
        }));
        setProcessing(false);
        setSuccess(true);
    };

    const canPay =
        payMode === 'upi' ||
        ((payMode === 'cc' || payMode === 'dc') &&
            cardNum.replace(/\s/g, '').length === 16 &&
            cardName.length > 2 &&
            expiry.length === 5 &&
            cvv.length === 3);

    // PhonePe QR image (served from /public)
    const qrSrc = '/phonepay_qr.jpg';

    return (
        <div className="space-y-6">
            {/* Summary cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div className="bg-white rounded-xl shadow-sm border border-green-100 p-5 text-center">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Total Paid</p>
                    <p className="text-2xl font-bold text-green-600">₹{totalPaid.toLocaleString()}</p>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-red-100 p-5 text-center">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Pending</p>
                    <p className="text-2xl font-bold text-red-500">₹{totalPending.toLocaleString()}</p>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-indigo-100 p-5 text-center">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Due In</p>
                    <p className="text-2xl font-bold text-indigo-600">{totalPending > 0 ? '5 days' : 'All clear'}</p>
                </div>
            </div>

            {/* Fee list */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-6 border-b border-gray-200 flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-indigo-600" />
                    <h2 className="text-xl font-bold text-gray-900">Fee Payment Status</h2>
                </div>
                <div className="divide-y divide-gray-200">
                    {fees.map((fee) => (
                        <div key={fee.id} className="p-6 flex items-center justify-between hover:bg-gray-50 transition-colors">
                            <div className="flex items-center space-x-4">
                                <div className={`p-3 rounded-full ${STATUS_BG[fee.status]}`}>
                                    {STATUS_ICON[fee.status]}
                                </div>
                                <div>
                                    <h3 className="text-base font-medium text-gray-900">{fee.description}</h3>
                                    <p className="text-sm text-gray-500">Due: {new Date(fee.dueDate).toLocaleDateString()}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="text-right">
                                    <p className="text-xl font-bold text-gray-900">₹{fee.amount.toLocaleString()}</p>
                                    <p className={`text-sm font-medium mt-0.5 ${STATUS_TEXT[fee.status]}`}>{fee.status}</p>
                                    {fee.paymentDate && (
                                        <p className="text-xs text-gray-400 mt-0.5">Paid: {new Date(fee.paymentDate).toLocaleDateString()}</p>
                                    )}
                                </div>
                                {fee.status !== 'Paid' && (
                                    <button
                                        onClick={() => openPayment(fee)}
                                        className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-sm font-semibold px-4 py-2.5 rounded-lg shadow transition-all"
                                    >
                                        Pay Now <ChevronRight className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* ── Razorpay-Style Payment Modal ───────────────────────── */}
            {payingFee && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white w-full max-w-[400px] rounded-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                        
                        {/* ── Razorpay Header ── */}
                        <div className="bg-[#0b5cff] px-5 py-4 text-white relative">
                            <button onClick={closeModal} disabled={processing || success} className="absolute right-4 top-4 opacity-80 hover:opacity-100 disabled:opacity-0 transition-opacity">
                                <X className="w-5 h-5" />
                            </button>
                            <div className="flex items-center gap-2 opacity-90 mb-2">
                                <Shield className="w-4 h-4" />
                                <span className="text-xs font-semibold tracking-wider uppercase">Secure Checkout</span>
                            </div>
                            <h3 className="text-xl font-bold">{payingFee.description}</h3>
                            <div className="mt-1 flex items-baseline gap-1">
                                <span className="text-sm opacity-80">₹</span>
                                <span className="text-3xl font-extrabold tracking-tight">
                                    {effectiveAmount > 0 ? effectiveAmount.toLocaleString() : payingFee.amount.toLocaleString()}
                                </span>
                            </div>
                        </div>

                        {/* ── Modal Body ── */}
                        <div className="relative bg-white min-h-[300px]">
                            
                            {/* 1. Success State */}
                            {success && (
                                <div className="absolute inset-0 bg-white flex flex-col items-center justify-center p-8 animate-in fade-in zoom-in duration-500 z-20">
                                    <div className="w-20 h-20 bg-[#0b5cff] rounded-full flex items-center justify-center mb-6 shadow-lg shadow-blue-200 animate-bounce">
                                        <CheckCircle className="w-10 h-10 text-white" />
                                    </div>
                                    <h4 className="text-2xl font-bold text-gray-900">Payment Successful</h4>
                                    <p className="text-gray-500 mt-2 text-center">Your payment of ₹{effectiveAmount.toLocaleString()} has been received securely.</p>
                                    <button
                                        onClick={closeModal}
                                        className="mt-8 w-full bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold py-3 rounded-md transition-colors"
                                    >
                                        Close Window
                                    </button>
                                </div>
                            )}

                            {/* 2. Processing State */}
                            {processing && !success && (
                                <div className="absolute inset-0 bg-white flex flex-col items-center justify-center p-8 animate-in fade-in z-20">
                                    <div className="relative flex items-center justify-center w-20 h-20 mb-6">
                                        <div className="absolute inset-0 border-4 border-[#0b5cff]/20 rounded-full"></div>
                                        <div className="absolute inset-0 border-4 border-[#0b5cff] border-t-transparent rounded-full animate-spin"></div>
                                        <Lock className="w-6 h-6 text-[#0b5cff]" />
                                    </div>
                                    <h4 className="text-lg font-bold text-gray-900">Processing Payment...</h4>
                                    <p className="text-sm text-gray-500 mt-2 text-center">Please do not close this window or press the back button.</p>
                                </div>
                            )}

                            {/* 3. Interactive Steps */}
                            {!processing && !success && (
                                <div className="p-5 overflow-y-auto max-h-[60vh]">
                                    
                                    {/* Step A: Amount Selection */}
                                    {!amountConfirmed && (
                                        <div className="space-y-4 animate-in slide-in-from-left-4 fade-in duration-300">
                                            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Amount to Pay</p>
                                            
                                            <label className={`block border-2 p-4 rounded-lg cursor-pointer transition-colors ${amountType === 'full' ? 'border-[#0b5cff] bg-blue-50/50' : 'border-gray-200 hover:border-gray-300'}`}>
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${amountType === 'full' ? 'border-[#0b5cff]' : 'border-gray-300'}`}>
                                                            {amountType === 'full' && <div className="w-2 h-2 rounded-full bg-[#0b5cff]" />}
                                                        </div>
                                                        <span className="font-semibold text-gray-900">Pay Full Amount</span>
                                                    </div>
                                                    <span className="font-bold">₹{payingFee.amount.toLocaleString()}</span>
                                                </div>
                                            </label>

                                            <label className={`block border-2 p-4 rounded-lg cursor-pointer transition-colors ${amountType === 'custom' ? 'border-[#0b5cff] bg-blue-50/50' : 'border-gray-200 hover:border-gray-300'}`}>
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${amountType === 'custom' ? 'border-[#0b5cff]' : 'border-gray-300'}`}>
                                                        {amountType === 'custom' && <div className="w-2 h-2 rounded-full bg-[#0b5cff]" />}
                                                    </div>
                                                    <span className="font-semibold text-gray-900">Custom Amount</span>
                                                </div>
                                            </label>

                                            {amountType === 'custom' && (
                                                <div className="animate-in slide-in-from-top-2 fade-in duration-200 pl-7 mt-2">
                                                    <div className="relative">
                                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-semibold">₹</span>
                                                        <input
                                                            type="number"
                                                            value={customAmount}
                                                            onChange={e => setCustomAmount(e.target.value)}
                                                            className="w-full border border-gray-300 rounded-md pl-8 pr-3 py-2 focus:border-[#0b5cff] focus:ring-1 focus:ring-[#0b5cff] outline-none transition-all"
                                                            placeholder="Enter amount"
                                                            autoFocus
                                                        />
                                                    </div>
                                                </div>
                                            )}

                                            <button
                                                onClick={() => setAmountConfirmed(true)}
                                                disabled={amountType === 'custom' && (!customAmount || parseInt(customAmount) <= 0 || parseInt(customAmount) > payingFee.amount)}
                                                className="w-full bg-[#0b5cff] hover:bg-[#0642cc] disabled:opacity-50 text-white font-semibold py-3 rounded-md transition-colors mt-6 shadow-md shadow-blue-500/20"
                                            >
                                                Proceed to Pay
                                            </button>
                                        </div>
                                    )}

                                    {/* Step B: Payment Method Selection */}
                                    {amountConfirmed && !payMode && (
                                        <div className="space-y-1 animate-in slide-in-from-right-4 fade-in duration-300">
                                            <div className="flex items-center gap-2 mb-4">
                                                <button onClick={() => setAmountConfirmed(false)} className="p-1 -ml-1 text-gray-400 hover:text-gray-900 transition-colors">
                                                    <ChevronRight className="w-5 h-5 rotate-180" />
                                                </button>
                                                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Select Payment Method</p>
                                            </div>

                                            {[
                                                { id: 'upi', label: 'UPI / QR', sub: 'Google Pay, PhonePe, Paytm', icon: <Smartphone className="w-5 h-5 text-gray-700" /> },
                                                { id: 'cc', label: 'Credit Card', sub: 'Visa, Mastercard, Amex', icon: <CreditCard className="w-5 h-5 text-gray-700" /> },
                                                { id: 'dc', label: 'Debit Card', sub: 'Visa, Mastercard, Rupay', icon: <CreditCard className="w-5 h-5 text-gray-700" /> },
                                            ].map(m => (
                                                <button
                                                    key={m.id}
                                                    onClick={() => setPayMode(m.id as PayMode)}
                                                    className="w-full flex items-center justify-between p-4 border-b border-gray-100 hover:bg-gray-50 group transition-colors text-left"
                                                >
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 border border-gray-200 rounded flex items-center justify-center bg-white group-hover:border-gray-300 transition-colors">
                                                            {m.icon}
                                                        </div>
                                                        <div>
                                                            <p className="font-semibold text-gray-900">{m.label}</p>
                                                            <p className="text-xs text-gray-500">{m.sub}</p>
                                                        </div>
                                                    </div>
                                                    <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-colors" />
                                                </button>
                                            ))}
                                            <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-center gap-2 text-xs text-gray-400">
                                                <Lock className="w-3 h-3" /> Payments are 100% secure
                                            </div>
                                        </div>
                                    )}

                                    {/* Step C1: UPI Flow */}
                                    {payMode === 'upi' && (
                                        <div className="animate-in slide-in-from-right-4 fade-in duration-300">
                                            <div className="flex items-center gap-2 mb-4">
                                                <button onClick={() => setPayMode(null)} className="p-1 -ml-1 text-gray-400 hover:text-gray-900 transition-colors">
                                                    <ChevronRight className="w-5 h-5 rotate-180" />
                                                </button>
                                                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Pay via UPI</p>
                                            </div>

                                            <div className="bg-gray-50 border border-gray-200 rounded-lg p-5 text-center">
                                                <p className="text-sm text-gray-600 mb-4">Scan QR using any UPI app</p>
                                                <div className="bg-white p-2 rounded-lg shadow-sm inline-block border border-gray-200">
                                                    <img src={qrSrc} alt="UPI QR" className="w-48 h-48 object-cover rounded" />
                                                </div>
                                                <p className="mt-4 font-mono text-sm font-semibold text-gray-800">college@upi</p>
                                            </div>

                                            <button
                                                onClick={handlePay}
                                                className="w-full bg-[#0b5cff] hover:bg-[#0642cc] text-white font-semibold py-3 rounded-md transition-colors mt-6 shadow-md"
                                            >
                                                Simulate Payment Completion
                                            </button>
                                        </div>
                                    )}

                                    {/* Step C2: Card Flow */}
                                    {(payMode === 'cc' || payMode === 'dc') && (
                                        <div className="animate-in slide-in-from-right-4 fade-in duration-300">
                                            <div className="flex items-center gap-2 mb-4">
                                                <button onClick={() => setPayMode(null)} className="p-1 -ml-1 text-gray-400 hover:text-gray-900 transition-colors">
                                                    <ChevronRight className="w-5 h-5 rotate-180" />
                                                </button>
                                                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Enter Card Details</p>
                                            </div>

                                            <div className="space-y-4">
                                                <div>
                                                    <input
                                                        type="text"
                                                        placeholder="Card Number"
                                                        value={cardNum}
                                                        onChange={e => setCardNum(formatCard(e.target.value))}
                                                        className="w-full border border-gray-300 rounded-md px-3 py-2.5 focus:border-[#0b5cff] focus:ring-1 focus:ring-[#0b5cff] outline-none font-mono text-sm transition-all placeholder:font-sans"
                                                    />
                                                </div>
                                                <div className="flex gap-4">
                                                    <div className="flex-1">
                                                        <input
                                                            type="text"
                                                            placeholder="Expiry (MM/YY)"
                                                            value={expiry}
                                                            maxLength={5}
                                                            onChange={e => {
                                                                let v = e.target.value.replace(/\D/g, '');
                                                                if (v.length >= 3) v = v.slice(0, 2) + '/' + v.slice(2, 4);
                                                                setExpiry(v);
                                                            }}
                                                            className="w-full border border-gray-300 rounded-md px-3 py-2.5 focus:border-[#0b5cff] focus:ring-1 focus:ring-[#0b5cff] outline-none font-mono text-sm transition-all placeholder:font-sans"
                                                        />
                                                    </div>
                                                    <div className="flex-1">
                                                        <input
                                                            type="password"
                                                            placeholder="CVV"
                                                            maxLength={3}
                                                            value={cvv}
                                                            onChange={e => setCvv(e.target.value.replace(/\D/g, '').slice(0, 3))}
                                                            className="w-full border border-gray-300 rounded-md px-3 py-2.5 focus:border-[#0b5cff] focus:ring-1 focus:ring-[#0b5cff] outline-none font-mono text-sm transition-all placeholder:font-sans"
                                                        />
                                                    </div>
                                                </div>
                                                <div>
                                                    <input
                                                        type="text"
                                                        placeholder="Cardholder Name"
                                                        value={cardName}
                                                        onChange={e => setCardName(e.target.value.toUpperCase())}
                                                        className="w-full border border-gray-300 rounded-md px-3 py-2.5 focus:border-[#0b5cff] focus:ring-1 focus:ring-[#0b5cff] outline-none text-sm transition-all uppercase"
                                                    />
                                                </div>
                                            </div>

                                            <button
                                                onClick={handlePay}
                                                disabled={!canPay}
                                                className="w-full bg-[#0b5cff] hover:bg-[#0642cc] disabled:opacity-50 text-white font-semibold py-3 rounded-md transition-colors mt-6 shadow-md flex items-center justify-center gap-2"
                                            >
                                                <Lock className="w-4 h-4" /> Pay ₹{effectiveAmount.toLocaleString()}
                                            </button>
                                        </div>
                                    )}

                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
