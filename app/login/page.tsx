"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { getSupabase } from "@/lib/supabase";

export default function LoginPage() {
  const [email,setEmail]=useState("");
  const [password,setPassword]=useState("");
  const [message,setMessage]=useState("");
  const [loading,setLoading]=useState(false);

  async function submit(e:FormEvent) {
    e.preventDefault();
    const supabase=getSupabase();
    if(!supabase){setMessage("Supabase пока не подключён. Основной дашборд работает в локальном режиме.");return}
    setLoading(true); setMessage("");
    const {error}=await supabase.auth.signInWithPassword({email,password});
    setLoading(false);
    if(error)setMessage(error.message); else window.location.href="/";
  }

  return <main className="auth-page">
    <form className="auth-card" onSubmit={submit}>
      <div className="brand-mark">F</div>
      <h1>FRANCHISE OS</h1>
      <p>Вход владельца сети</p>
      <label>Email<input type="email" value={email} onChange={e=>setEmail(e.target.value)} required/></label>
      <label>Пароль<input type="password" value={password} onChange={e=>setPassword(e.target.value)} required/></label>
      <button className="primary" disabled={loading}>{loading?"Входим…":"Войти"}</button>
      {message&&<div className="auth-message">{message}</div>}
      <Link href="/">Вернуться в локальный режим</Link>
    </form>
  </main>
}
