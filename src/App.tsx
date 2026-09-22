import { FormEvent, useEffect, useMemo, useRef, useState } from 'react'
import {
  Activity, BarChart3, Bot, Check, ChevronDown, CircleUserRound, Clipboard, Code2,
  Database, Eye, EyeOff, FileText, Gauge, Globe2, KeyRound, Link2, Menu,
  MessageSquareText, MoreHorizontal, PackageSearch, Plus, Search, Send, Settings,
  ShieldCheck, Sparkles, TestTube2, Trash2, UploadCloud, Users, WalletCards, X, Zap
} from 'lucide-react'

type Page = 'overview' | 'chat' | 'api-test' | 'connections' | 'documents' | 'widget' | 'api-keys' | 'settings'
type Message = { id: number; role: 'assistant' | 'user'; content: string; meta?: string }
type Doc = { id: number; name: string; type: string; size: string; ready: boolean }
type ApiKey = { id: number; name: string; value: string; created: string }
type ProviderHealth = {
  configured: boolean
  provider: string
  model: string
  fallbackModel: string
  models?: { id: string; label: string; role: string }[]
}

const nav = [
  ['overview', 'Overview', Gauge],
  ['chat', 'AI Chat', MessageSquareText],
  ['api-test', 'API Test', TestTube2],
  ['connections', 'Connections', Link2],
  ['documents', 'Documents', FileText],
  ['widget', 'Widget', Code2],
  ['api-keys', 'API Keys', KeyRound],
  ['settings', 'Settings', Settings],
] as const

const modelOptions = [
  ['google/gemma-4-31b-it:free', 'Google Gemma 4 31B (free)'],
  ['nvidia/nemotron-3-ultra-550b-a55b:free', 'NVIDIA Nemotron 3 Ultra (free)'],
  ['nvidia/nemotron-3.5-lightning:free', 'NVIDIA Nemotron 3.5 Lightning (free)'],
  ['google/gemma-4-26b-a4b-it:free', 'Google Gemma 4 26B A4B (free)'],
  ['openrouter/free', 'OpenRouter Free Router'],
] as const

const intro = "Hello! I'm your AI Agent powered by LangChain/LangGraph and OpenRouter. I can help you with:\n\n📊 SQL Database Queries — Query your WooCommerce or custom databases\n🔎 RAG Data Search — Semantic search through uploaded documents\n📄 PDF Extraction — Extract text and tables from PDF files\n🌐 Web Scraping — Scrape and analyze web pages\n📈 Analytics — Get insights and reports from your data\n\nSelect a database or documents above and ask me anything!"

function Toggle({value, onChange}:{value:boolean;onChange:(v:boolean)=>void}) {
  return <button className={'toggle '+(value?'on':'')} onClick={()=>onChange(!value)} aria-label="toggle"><span /></button>
}

function PageTitle({eyebrow,title,subtitle,action}:{eyebrow:string;title:string;subtitle:string;action?:React.ReactNode}) {
  return <div className="page-title"><div><div className="eyebrow">{eyebrow}</div><h2>{title}</h2><p>{subtitle}</p></div>{action}</div>
}

function Overview({go}:{go:(p:Page)=>void}) {
  const stats = [
    [WalletCards,'Revenue','$84,920','+12.4%','last 30 days'],
    [PackageSearch,'Orders','1,284','+8.1%','164 processing'],
    [Users,'Customers','4,692','+6.3%','312 new'],
    [Activity,'AI Queries','3,906','+18.9%','97.8% successful']
  ] as const
  return <div className="scroll page-pad">
    <PageTitle eyebrow="Workspace overview" title="E-commerce intelligence at a glance" subtitle="Connected data, documents and agent activity from one clean dashboard." action={<button className="primary" onClick={()=>go('chat')}><Sparkles size={14}/> Ask AI</button>} />
    <div className="stats">{stats.map(([Icon,label,value,delta,hint])=><div className="card stat" key={label}><div className="stat-icon"><Icon size={18}/></div><div><span>{label}</span><div className="stat-main"><b>{value}</b><i>{delta}</i></div><small>{hint}</small></div></div>)}</div>
    <div className="grid2">
      <section className="card panel"><div className="panel-head"><div><b>Sales activity</b><small>Mock reporting preview</small></div><BarChart3 size={17}/></div><div className="chart">{[44,65,52,78,59,82,72,88,68,92,84,96].map((v,i)=><span key={i} style={{height:v+'%'}} />)}</div><div className="chart-labels"><span>Sep 1</span><span>Sep 30</span></div></section>
      <section className="card panel"><div className="panel-head"><div><b>AI Agent</b><small>OpenRouter + LangChain-ready</small></div><span className="status"><span/> Agent Active</span></div><div className="agent-summary"><div className="agent-orb"><Bot size={27}/></div><div><strong>Ready to query your data</strong><p>Ask natural-language questions across SQL data and uploaded documents.</p></div></div><button className="soft" onClick={()=>go('chat')}>Open AI Chat <span>→</span></button></section>
    </div>
    <section className="card quick"><div className="panel-head"><div><b>Quick access</b><small>Core areas from the original dashboard</small></div></div><div className="quick-grid">{[['Connections','Connect SQL, WooCommerce or web sources','connections',Database],['Documents','Manage PDF / CSV knowledge sources','documents',FileText],['Widget','Configure the embeddable storefront chat','widget',Code2]].map(([t,d,p,Icon]:any)=><button key={t} onClick={()=>go(p)}><span><Icon size={17}/></span><div><b>{t}</b><small>{d}</small></div><strong>›</strong></button>)}</div></section>
  </div>
}

function ChatPage() {
  const [model,setModel]=useState('google/gemma-4-31b-it:free')
  const [db,setDb]=useState('WooCommerce')
  const [doc,setDoc]=useState('3 selected documents')
  const [debug,setDebug]=useState(false)
  const [text,setText]=useState('')
  const [busy,setBusy]=useState(false)
  const [messages,setMessages]=useState<Message[]>([{id:1,role:'assistant',content:intro,meta:'Agent ready'}])
  const bottom = useRef<HTMLDivElement>(null)
  const legacyApi = (import.meta as any).env.VITE_API_URL as string | undefined

  async function submit(e?:FormEvent) {
    e?.preventDefault()
    const q=text.trim()
    if(!q || busy) return
    setText('')
    const user:Message={id:Date.now(),role:'user',content:q}
    const history=[...messages.filter(m=>m.id!==1),user]
    setMessages(v=>[...v,user])
    setBusy(true)
    try {
      const endpoint=legacyApi ? legacyApi.replace(/\/$/,'')+'/query' : '/api/chat'
      const payload=legacyApi
        ? {query:q}
        : {
            model,
            database:db,
            documents:doc,
            query:q,
            messages:history.map(m=>({role:m.role,content:m.content}))
          }
      const res=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)})
      const data=await res.json().catch(()=>({}))
      if(!res.ok) throw new Error(data?.error || 'API request failed')
      const answer=data.response || data.answer || JSON.stringify(data,null,2)
      const meta=data.model ? 'OpenRouter · '+data.model : (data.queryType ? 'Query type: '+data.queryType : 'Connected backend')
      setMessages(v=>[...v,{id:Date.now()+1,role:'assistant',content:answer,meta}])
    } catch(err) {
      const reason=err instanceof Error ? err.message : 'Unknown connection error'
      setMessages(v=>[...v,{id:Date.now()+1,role:'assistant',content:'I could not reach the AI provider. '+reason,meta:'Connection error'}])
    } finally {
      setBusy(false)
      setTimeout(()=>bottom.current?.scrollIntoView({behavior:'smooth'}),20)
    }
  }

  return <div className="chat-page">
    <div className="chat-heading"><div className="agent-badge"><Zap size={14}/></div><div><div className="chat-name">AI Agent</div><div className="powered">Powered by LangChain + LangGraph · OpenRouter <span className="status compact"><span/> Agent Active</span></div></div><div className="chat-right"><button className="debug" onClick={()=>setDebug(!debug)}>{debug?'Hide Debug':'Show Debug'}</button></div></div>
    <div className="chat-tools">
      <label><span>AI Model</span><div className="select"><Bot size={12}/><select value={model} onChange={e=>setModel(e.target.value)}>{modelOptions.map(([id,label])=><option key={id} value={id}>{label}</option>)}</select><ChevronDown size={11}/></div></label>
      <label><span>Database</span><div className="select"><Database size={12}/><select value={db} onChange={e=>setDb(e.target.value)}><option>WooCommerce</option><option>PostgreSQL Demo</option><option>None</option></select><ChevronDown size={11}/></div></label>
      <label className="wide"><span>Documents</span><div className="select"><FileText size={12}/><select value={doc} onChange={e=>setDoc(e.target.value)}><option>3 selected documents</option><option>All documents</option><option>store-products.pdf</option><option>No documents</option></select><ChevronDown size={11}/></div></label>
    </div>
    {debug&&<div className="debug-strip"><code>model={model} · database={db} · documents={doc} · backend={legacyApi?'legacy API':'/api/chat (Vercel)'}</code></div>}
    <div className="conversation">
      {messages.map(m=><div className={'msg '+m.role} key={m.id}>{m.role==='assistant'&&<div className="msg-avatar"><Bot size={14}/></div>}<div><div className="bubble">{m.content.split('\n').map((l,i)=><span key={i}>{l}<br/></span>)}</div>{m.meta&&<small className="msg-meta">{m.meta}</small>}</div></div>)}
      {busy&&<div className="msg assistant"><div className="msg-avatar"><Bot size={14}/></div><div className="bubble typing"><i/><i/><i/></div></div>}
      <div ref={bottom}/>
    </div>
    <form className="composer" onSubmit={submit}><input value={text} onChange={e=>setText(e.target.value)} placeholder="Ask about your data, search documents, scrape web..." /><button disabled={!text.trim()||busy}><Send size={14}/></button></form>
  </div>
}

function ApiTest() {
  const [method,setMethod]=useState('POST')
  const [endpoint,setEndpoint]=useState('/api/chat')
  const [body,setBody]=useState('{\n  "query": "Explain what an e-commerce RAG assistant can do.",\n  "model": "google/gemma-4-31b-it:free"\n}')
  const [response,setResponse]=useState('Click Send Request to test the deployed Vercel API.')
  const [status,setStatus]=useState('Ready')
  async function send(){
    setStatus('Sending...')
    try{
      const init:RequestInit={method}
      if(method!=='GET'){
        init.headers={'Content-Type':'application/json'}
        init.body=body
      }
      const res=await fetch(endpoint,init)
      const text=await res.text()
      let parsed:any=text
      try{parsed=JSON.parse(text)}catch{}
      setResponse(typeof parsed==='string'?parsed:JSON.stringify(parsed,null,2))
      setStatus(String(res.status)+' '+res.statusText)
    }catch(err){
      setResponse(err instanceof Error?err.message:'Request failed')
      setStatus('Error')
    }
  }
  return <div className="scroll page-pad"><PageTitle eyebrow="Developer tools" title="API Test" subtitle="Validate the live server-side AI endpoint before embedding it into another application." />
    <div className="grid2"><section className="card panel"><div className="panel-head"><div><b>Request</b><small>Vercel Function · OpenRouter proxy</small></div><TestTube2 size={17}/></div><div className="form-row"><select value={method} onChange={e=>setMethod(e.target.value)}><option>POST</option><option>GET</option></select><input value={endpoint} onChange={e=>setEndpoint(e.target.value)}/></div><label className="field-label">JSON body<textarea rows={10} value={body} onChange={e=>setBody(e.target.value)}/></label><button className="primary" onClick={send}><Send size={14}/> Send Request</button></section>
    <section className="card panel"><div className="panel-head"><div><b>Response</b><small>{status}</small></div><span className="status"><span/> Live test</span></div><pre className="response">{response}</pre></section></div>
  </div>
}

function Connections() {
  const [state,setState]=useState<Record<string,boolean>>({WooCommerce:true,PostgreSQL:true,Supabase:false,'Website scraper':false})
  const items=[['WooCommerce','Orders, customers and product catalog',Database],['PostgreSQL','Structured analytics database',Database],['Supabase','Hosted PostgreSQL connection',Globe2],['Website scraper','Public pages and tables',Globe2]] as const
  return <div className="scroll page-pad"><PageTitle eyebrow="Data sources" title="Connections" subtitle="Control the sources the agent can use when answering a question." action={<button className="primary"><Plus size={14}/> New connection</button>} />
    <div className="connection-grid">{items.map(([name,desc,Icon])=><section className="card connection" key={name}><div className="connection-top"><div className="connection-icon"><Icon size={18}/></div><Toggle value={!!state[name]} onChange={v=>setState(s=>({...s,[name]:v}))}/></div><h3>{name}</h3><p>{desc}</p><div className="connection-foot"><span className={state[name]?'connected':'muted'}>{state[name]?'● Connected':'○ Not connected'}</span><button><MoreHorizontal size={16}/></button></div></section>)}</div>
    <div className="security"><ShieldCheck size={18}/><div><b>Read-only by design</b><p>Keep production database credentials server-side and restrict the AI database tool to safe read operations.</p></div></div>
  </div>
}

function Documents() {
  const [docs,setDocs]=useState<Doc[]>([
    {id:1,name:'store-products.pdf',type:'PDF',size:'1.8 MB',ready:true},
    {id:2,name:'woocommerce-export.csv',type:'CSV',size:'632 KB',ready:true},
    {id:3,name:'refund-policy.pdf',type:'PDF',size:'324 KB',ready:true},
  ])
  const input=useRef<HTMLInputElement>(null)
  function add(files:FileList|null) {
    if(!files) return
    const newDocs=Array.from(files).map((f,i)=>({id:Date.now()+i,name:f.name,type:(f.name.split('.').pop()||'FILE').toUpperCase(),size:Math.max(1,Math.round(f.size/1024))+' KB',ready:true}))
    setDocs(v=>[...newDocs,...v])
  }
  return <div className="scroll page-pad"><PageTitle eyebrow="RAG knowledge" title="Documents" subtitle="Upload contextual sources that can be searched semantically by the AI agent." action={<button className="primary" onClick={()=>input.current?.click()}><UploadCloud size={14}/> Upload</button>} />
    <input ref={input} type="file" multiple hidden onChange={e=>add(e.target.files)} />
    <button className="card drop" onClick={()=>input.current?.click()}><UploadCloud size={26}/><b>Drop PDF, CSV or text files here</b><span>or click to browse</span></button>
    <section className="card table-card"><div className="table-toolbar"><div><b>Knowledge sources</b><small>{docs.length} documents</small></div><label className="search"><Search size={13}/><input placeholder="Search documents"/></label></div>
      <div className="table head"><span>Name</span><span>Type</span><span>Size</span><span>Status</span><span/></div>
      {docs.map(d=><div className="table row" key={d.id}><span className="file-name"><i><FileText size={13}/></i><b>{d.name}</b></span><span>{d.type}</span><span>{d.size}</span><span className="ready"><Check size={12}/> Ready</span><button onClick={()=>setDocs(v=>v.filter(x=>x.id!==d.id))}><Trash2 size={13}/></button></div>)}
    </section>
  </div>
}

function WidgetPage() {
  const [open,setOpen]=useState(true)
  const snippet='<script src="https://cdn.example.com/ecommerce-ai-widget.js" data-agent="store-agent"></script>'
  const [copied,setCopied]=useState(false)
  async function copy(){try{await navigator.clipboard.writeText(snippet);setCopied(true);setTimeout(()=>setCopied(false),1200)}catch{}}
  return <div className="scroll page-pad"><PageTitle eyebrow="Customer experience" title="Widget" subtitle="Preview and configure a lightweight AI assistant for an e-commerce storefront." />
    <div className="widget-grid"><section className="card panel"><div className="panel-head"><div><b>Widget settings</b><small>Visual prototype</small></div><Code2 size={17}/></div><label className="field-label">Widget title<input defaultValue="Ask our AI assistant"/></label><label className="field-label">Welcome message<textarea rows={4} defaultValue="Hello! How can I help you find the right product today?"/></label><div className="setting-row"><div><b>Show on storefront</b><small>Display the floating launcher</small></div><Toggle value={open} onChange={setOpen}/></div><h4>Embed code</h4><div className="code-copy"><code>{snippet}</code><button onClick={copy}>{copied?<Check size={14}/>:<Clipboard size={14}/>}</button></div></section>
    <section className="card storefront"><div className="browser"><span/><span/><span/></div><div className="fake-store"><b className="store-logo">NOVA STORE</b><div className="fake-hero"><span/><span/><span/></div>{open&&<div className="widget-pop"><div className="widget-head"><div><Bot size={14}/> Ask our AI assistant</div><button onClick={()=>setOpen(false)}><X size={13}/></button></div><div className="widget-body"><p>Hello! How can I help you find the right product today?</p></div><div className="widget-input">Type a message... <Send size={12}/></div></div>}<button className="widget-launch" onClick={()=>setOpen(true)}><MessageSquareText size={17}/></button></div></section></div>
  </div>
}

function ApiKeys() {
  const [keys,setKeys]=useState<ApiKey[]>([{id:1,name:'Production widget',value:'ecom_live_7sP2LhJ9vQ4cT8mN',created:'Sep 18, 2026'}])
  const [shown,setShown]=useState<number|null>(null)
  const [health,setHealth]=useState<ProviderHealth|null>(null)
  const [checking,setChecking]=useState(false)

  async function checkProvider(){
    setChecking(true)
    try{
      const res=await fetch('/api/health',{cache:'no-store'})
      const data=await res.json()
      setHealth(data)
    }catch{
      setHealth({configured:false,provider:'OpenRouter',model:'unknown',fallbackModel:'openrouter/free'})
    }finally{
      setChecking(false)
    }
  }

  useEffect(()=>{void checkProvider()},[])

  function create(){setKeys(v=>[...v,{id:Date.now(),name:'New API key',value:'ecom_live_'+Math.random().toString(36).slice(2,18),created:new Date().toLocaleDateString()}])}

  return <div className="scroll page-pad"><PageTitle eyebrow="Developer access" title="API Keys" subtitle="The OpenRouter secret stays server-side in Vercel; browser-facing keys can be managed separately." action={<button className="primary" onClick={create}><Plus size={14}/> Create client key</button>} />
    <section className="card provider-card">
      <div className="provider-main"><div className="connection-icon"><KeyRound size={18}/></div><div><b>OpenRouter provider</b><p>Environment variable: <code>OPENROUTER_API_KEY</code></p></div></div>
      <div className="provider-status"><span className={health?.configured?'status':'status provider-off'}><span/>{health?.configured?'Configured':'Not configured'}</span><button className="soft" onClick={checkProvider} disabled={checking}>{checking?'Checking...':'Check status'}</button></div>
      <div className="provider-meta"><span>Default model <b>{health?.model || 'google/gemma-4-31b-it:free'}</b></span><span>Fallback <b>{health?.fallbackModel || 'openrouter/free'}</b></span><span>Secret exposure <b>Server-side only</b></span></div>
    </section>
    <div className="security"><ShieldCheck size={18}/><div><b>Do not paste the provider secret into frontend code</b><p>Add it in Vercel → Project Settings → Environment Variables. The deployed browser never receives the OpenRouter key.</p></div></div>
    <section className="card table-card client-keys"><div className="table key-head"><span>Name</span><span>Client key</span><span>Created</span><span/></div>{keys.map(k=><div className="table key-row" key={k.id}><span><b>{k.name}</b></span><span className="key-value"><code>{shown===k.id?k.value:'••••••••••••••••••••••••'}</code><button onClick={()=>setShown(shown===k.id?null:k.id)}>{shown===k.id?<EyeOff size={13}/>:<Eye size={13}/>}</button></span><span>{k.created}</span><button onClick={()=>setKeys(v=>v.filter(x=>x.id!==k.id))}><Trash2 size={13}/></button></div>)}</section>
  </div>
}

function SettingsPage() {
  const [memory,setMemory]=useState(false)
  const [citations,setCitations]=useState(true)
  const [safe,setSafe]=useState(true)
  const [saved,setSaved]=useState(false)
  return <div className="scroll page-pad"><PageTitle eyebrow="Workspace" title="Settings" subtitle="Control agent defaults and interface preferences." action={<button className="primary" onClick={()=>{setSaved(true);setTimeout(()=>setSaved(false),1200)}}>{saved?<Check size={14}/>:<Settings size={14}/>} {saved?'Saved':'Save changes'}</button>} />
    <div className="settings-stack"><section className="card panel"><div className="panel-head"><div><b>Agent behavior</b><small>Defaults for new conversations</small></div><Bot size={17}/></div><div className="setting-row"><div><b>Conversation memory</b><small>Keep context during the current browser session</small></div><Toggle value={memory} onChange={setMemory}/></div><div className="setting-row"><div><b>Show source citations</b><small>Expose the documents used in RAG responses</small></div><Toggle value={citations} onChange={setCitations}/></div><div className="setting-row"><div><b>Safe SQL mode</b><small>Restrict database tools to read-only operations</small></div><Toggle value={safe} onChange={setSafe}/></div></section>
    <section className="card panel"><div className="panel-head"><div><b>Default model</b><small>OpenRouter free models available in AI Chat</small></div><Sparkles size={17}/></div><div className="form-grid"><label className="field-label">Provider<select defaultValue="OpenRouter"><option>OpenRouter</option></select></label><label className="field-label">Model<select defaultValue="google/gemma-4-31b-it:free">{modelOptions.map(([id,label])=><option value={id} key={id}>{label}</option>)}</select></label></div></section></div>
  </div>
}

export default function App() {
  const [page,setPage]=useState<Page>('chat')
  const [sidebar,setSidebar]=useState(false)
  const title=useMemo(()=>nav.find(n=>n[0]===page)?.[1]||'AI Chat',[page])
  function go(p:Page){setPage(p);setSidebar(false)}
  return <div className="app">
    <aside className={'sidebar '+(sidebar?'open':'')}><div className="brand"><div className="brand-icon">E</div><b>E-Commerce AI</b><button className="mobile-close" onClick={()=>setSidebar(false)}><X size={15}/></button></div><nav>{nav.map(([id,label,Icon])=><button key={id} className={page===id?'active':''} onClick={()=>go(id)}><Icon size={14}/><span>{label}</span></button>)}</nav><div className="sidebar-bottom"><div className="user-mini"><div>JD</div><span><b>John Doe</b><small>john@example.com</small></span><MoreHorizontal size={14}/></div></div></aside>
    {sidebar&&<button className="overlay" onClick={()=>setSidebar(false)}/>}
    <main><header className="global-header"><button className="mobile-menu" onClick={()=>setSidebar(true)}><Menu size={16}/></button><span className="crumb">{title}</span><div className="global-actions"><button><span>?</span> Help</button><button><CircleUserRound size={13}/> User</button></div></header>
      {page==='overview'&&<Overview go={go}/>}
      {page==='chat'&&<ChatPage/>}
      {page==='api-test'&&<ApiTest/>}
      {page==='connections'&&<Connections/>}
      {page==='documents'&&<Documents/>}
      {page==='widget'&&<WidgetPage/>}
      {page==='api-keys'&&<ApiKeys/>}
      {page==='settings'&&<SettingsPage/>}
    </main>
  </div>
}
