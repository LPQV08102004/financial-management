"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../context/AuthContext';
import { Wallet, Eye, EyeOff, AlertCircle } from 'lucide-react';

function InputField({
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  rightEl,
}: {
  label: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rightEl?: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-semibold text-slate-700 mb-1.5">{label}</label>
      <div className="relative">
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#075c09]/30 focus:border-[#075c09] text-slate-800 bg-slate-50/50 placeholder:text-slate-400 transition-colors text-sm pr-11"
        />
        {rightEl && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">{rightEl}</div>
        )}
      </div>
    </div>
  );
}

export default function SignupScreen() {
  const router = useRouter();
  const { signUp } = useAuth();
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [showPwC, setShowPwC] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSignup = async () => {
    if (!email || !fullName || !phone || !password || !passwordConfirm) {
      setError('Vui lòng điền đầy đủ thông tin');
      return;
    }
    if (password !== passwordConfirm) {
      setError('Mật khẩu không trùng khớp');
      return;
    }
    const STRONG_PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;
    if (!STRONG_PASSWORD_REGEX.test(password)) {
      setError('Mật khẩu phải từ 8 ký tự, gồm chữ hoa, chữ thường, số và ký tự đặc biệt');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const result = await signUp({ email, full_name: fullName, phone_number: phone, password });
      if (!result.success) {
        setError(result.message || 'Đăng ký thất bại');
      } else {
        router.push('/home');
      }
    } catch (err: any) {
      setError(err.message || 'Lỗi hệ thống');
    } finally {
      setLoading(false);
    }
  };

  const PwToggle = ({ show, toggle }: { show: boolean; toggle: () => void }) => (
    <button type="button" onClick={toggle} className="text-slate-400 hover:text-slate-600 transition-colors">
      {show ? <EyeOff size={18} /> : <Eye size={18} />}
    </button>
  );

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-[#075c09] flex items-center justify-center mx-auto mb-3 shadow-lg">
            <Wallet size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-black text-[#075c09]">Singitronic</h1>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8">
          <div className="mb-5">
            <h2 className="text-xl font-bold text-slate-800">Tạo tài khoản</h2>
            <p className="text-slate-500 text-sm mt-0.5">Bắt đầu quản lý tài chính của bạn</p>
          </div>

          {error && (
            <div className="flex items-center gap-2.5 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-4 text-sm">
              <AlertCircle size={16} className="flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-4 mb-5">
            <InputField label="Họ tên" value={fullName} onChange={setFullName} placeholder="Nguyễn Văn A" />
            <InputField label="Email" type="email" value={email} onChange={setEmail} placeholder="example@gmail.com" />
            <InputField label="Số điện thoại" type="tel" value={phone} onChange={setPhone} placeholder="0123456789" />
            <InputField
              label="Mật khẩu"
              type={showPw ? 'text' : 'password'}
              value={password}
              onChange={setPassword}
              placeholder="Chữ hoa, chữ thường, số, ký tự đặc biệt"
              rightEl={<PwToggle show={showPw} toggle={() => setShowPw(!showPw)} />}
            />
            <InputField
              label="Xác nhận mật khẩu"
              type={showPwC ? 'text' : 'password'}
              value={passwordConfirm}
              onChange={setPasswordConfirm}
              placeholder="Nhập lại mật khẩu"
              rightEl={<PwToggle show={showPwC} toggle={() => setShowPwC(!showPwC)} />}
            />
          </div>

          <button
            onClick={handleSignup}
            disabled={loading}
            className={`w-full py-3.5 rounded-xl font-bold text-white text-sm transition-all ${
              loading
                ? 'bg-slate-400 cursor-not-allowed'
                : 'bg-[#075c09] hover:bg-[#065308] active:scale-[0.98] shadow-sm shadow-[#075c09]/20'
            }`}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                Đang đăng ký...
              </span>
            ) : (
              'Đăng ký'
            )}
          </button>

          <p className="mt-5 text-center text-sm text-slate-500">
            Đã có tài khoản?{' '}
            <Link href="/auth/login" className="font-bold text-[#075c09] hover:underline">
              Đăng nhập
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
