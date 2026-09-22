import { FormEvent, ReactNode, useEffect, useState } from 'react'
import { Eye, EyeOff, KeyRound, ShieldCheck } from 'lucide-react'

export default function AdminGate({children}:{children:ReactNode}) {
  const [state,setState]=useState<'checking'|'in'|'out'>('checking')
  const [configured,setConfigured]=useState(true)
  const [password,setPassword]=useState('')
  const [visible,setVisible]=useState(false)
  const [busy,setBusy]=useState(false)
  const [error,setError]=useState('')

  useEffect(()=>{
    fetch('/api/session',{cache:'no-store'})
      .then(r=>r.json())
      .then(data=>{
        setConfigured(data?.configured !== false)
        setState(data?.authenticated ? 'in' : 'out')
      })
      .catch(()=>setState('out'))
  },[])

  async function submit(e:FormEvent){
    e.preventDefault()
    if(!password || busy) return
    setBusy(true)
    setError('')
    try{
      const res=await fetch('/api/login',{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({password}),
      })
      const data=await res.json().catch(()=>({}))
      if(!res.ok) throw new Error(data?.error || 'Unable to sign in.')
      setPassword('')
      setState('in')
    }catch(err){
      setError(err instanceof Error ? err.message : 'Unable to sign in.')
    }finally{
      setBusy(false)
    }
  }

  if(state==='checking'){
    return <div className="auth-loading"><div className="auth-spinner"/><span>Securing workspace...</span></div>
  }

  if(!configured){
    return <div className="login-shell"><section className="login-card config-card">
      <div className="login-lock"><ShieldCheck size={26}/></div>
      <div className="login-copy">
        <span className="login-eyebrow">SETUP REQUIRED</span>
        <h1>Admin access is not configured</h1>
        <p>Add the admin access environment variables in Vercel, then redeploy.</p>
      </div>
    </section></div>
  }

  if(state==='out'){
    return <div className="login-shell">
      <div className="login-brand"><div className="brand-icon">E</div><b>E-Commerce AI</b></div>
      <section className="login-card">
        <div className="login-lock"><ShieldCheck size={26}/></div>
        <div className="login-copy">
          <span className="login-eyebrow">ADMIN ACCESS</span>
          <h1>Welcome back</h1>
          <p>Enter the administrator password to access the AI workspace.</p>
        </div>
        <form onSubmit={submit} className="login-form">
          <label>
            <span>Password</span>
            <div className={'login-input '+(error?'has-error':'')}>
              <KeyRound size={17}/>
              <input
                autoFocus
                autoComplete="current-password"
                type={visible?'text':'password'}
                value={password}
                onChange={e=>{setPassword(e.target.value);setError('')}}
                placeholder="Enter admin password"
              />
              <button type="button" onClick={()=>setVisible(v=>!v)} aria-label={visible?'Hide password':'Show password'}>
                {visible?<EyeOff size={17}/>:<Eye size={17}/>}
              </button>
            </div>
          </label>
          {error&&<div className="login-error">{error}</div>}
          <button className="login-submit" disabled={!password||busy}>
            {busy?'Signing in...':'Access dashboard'}
          </button>
        </form>
        <div className="login-security"><ShieldCheck size={14}/><span>Protected administrator session</span></div>
      </section>
      <div className="login-footer">E-Commerce AI · Secure workspace</div>
    </div>
  }

  return <>{children}</>
}

export async function adminLogout(){
  await fetch('/api/logout',{method:'POST'}).catch(()=>{})
  window.location.reload()
}
