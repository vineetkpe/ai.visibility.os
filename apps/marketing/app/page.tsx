const engines = ['Gemini', 'ChatGPT', 'Claude', 'Perplexity'];

function Chart() {
  return <svg viewBox="0 0 600 130" preserveAspectRatio="none" aria-label="Visibility trend"><path d="M0 112 C55 106 72 92 125 98 S190 75 238 84 S302 62 348 68 S410 42 458 52 S520 27 600 18" fill="none" stroke="#111" strokeWidth="3"/><path d="M0 112 C55 106 72 92 125 98 S190 75 238 84 S302 62 348 68 S410 42 458 52 S520 27 600 18 L600 130 L0 130Z" fill="#111" opacity=".045"/></svg>;
}

export default function Home() {
  return <main>
    <header><div className="container nav">
      <a className="logo" href="#"><span className="logo-mark">AI</span> AI Visibility OS</a>
      <nav className="nav-links"><a href="#platform">Platform</a><a href="#intelligence">Intelligence</a><a href="#workflow">How it works</a><a href="#resources">Resources</a></nav>
      <div className="nav-actions"><a className="btn" href="/login">Sign in</a><a className="btn btn-dark" href="/signup">Start free →</a></div>
    </div></header>

    <section className="container hero">
      <div><span className="eyebrow"><i className="dot"/> AI visibility intelligence</span>
        <h1 className="display">Be the answer<br/><span style={{color:'#9aa0aa'}}>AI recommends.</span></h1>
        <p className="hero-copy">Measure how AI systems see your brand, understand why you are being cited—or ignored—and turn every finding into a prioritized growth plan.</p>
        <div className="hero-actions"><a className="btn btn-dark" href="/signup">Create your workspace →</a><a className="btn" href="#platform">Explore the platform</a></div>
        <div className="proof"><span>✓ No credit card required</span><span>✓ Evidence-first reporting</span><span>✓ Built for teams</span></div>
      </div>
      <div className="window"><div className="window-inner"><div className="window-top"><span>VISIBILITY OVERVIEW</span><span>acme.com · 30 days</span></div>
        <div className="score"><div><div style={{fontSize:12,color:'#777'}}>AI visibility score</div><div className="score-num">78</div></div><span className="good">↑ 8.4%</span></div>
        <div className="chart"><Chart/></div>
        <div className="grid" style={{gridTemplateColumns:'repeat(3,1fr)',marginTop:12}}>{[['Mentions','142'],['Citations','86'],['Competitor gap','-12%']].map(([a,b])=><div key={a} className="card" style={{minHeight:0,padding:15,borderRadius:12}}><div style={{fontSize:10,color:'#888'}}>{a}</div><strong style={{display:'block',font:'700 22px Manrope',marginTop:7}}>{b}</strong></div>)}</div>
      </div></div>
    </section>

    <div className="stats container">{[['4+','AI engines'],['30+','visibility signals'],['1','operating workspace'],['∞','queries to learn from']].map(([a,b])=><div className="stat" key={b}><strong>{a}</strong><span>{b}</span></div>)}</div>

    <section id="platform" className="section container"><span className="kicker">One operating view</span><h2>From AI visibility signal to business action.</h2><p className="section-intro">Everything you need to understand where your brand appears in AI answers, what influences those answers, and what to improve next.</p>
      <div className="grid grid-3"><article className="card"><div className="icon">01</div><h3>Measure visibility</h3><p>A single score backed by query-level evidence, provider coverage and trend data.</p></article><article className="card"><div className="icon">02</div><h3>Understand citations</h3><p>See which pages and external sources AI systems trust when they talk about your category.</p></article><article className="card"><div className="icon">03</div><h3>Track competitors</h3><p>Compare mentions, citations and movement against the brands that matter to you.</p></article></div>
    </section>

    <section id="intelligence" className="section gray"><div className="container engine"><div><span className="kicker">Engine intelligence</span><h2>One view across the AI landscape.</h2><p className="section-intro">Your provider mix stays configurable as the landscape changes. Compare how different engines discover, describe and cite your brand.</p><div className="engine-list">{engines.map(e=><span className="pill" key={e}>{e}</span>)}</div></div><div className="engine-panel"><span className="kicker">Current engine</span><h3 className="display" style={{fontSize:34,margin:'10px 0'}}>Gemini</h3><div style={{display:'flex',alignItems:'end',gap:8}}><strong style={{font:'700 68px Manrope',letterSpacing:'-.07em'}}>82</strong><span style={{color:'#777',paddingBottom:12}}>/ 100 visibility</span></div><div style={{height:8,background:'#edf0f3',borderRadius:20,marginTop:18}}><div style={{height:8,width:'82%',background:'#111',borderRadius:20}}/></div><div className="grid" style={{gridTemplateColumns:'1fr 1fr',marginTop:22}}><div className="card" style={{minHeight:0,padding:18}}><b>Mentions</b><div style={{fontSize:13,color:'#777',marginTop:5}}>+14% this month</div></div><div className="card" style={{minHeight:0,padding:18}}><b>Citations</b><div style={{fontSize:13,color:'#777',marginTop:5}}>64% coverage</div></div></div></div></div></section>

    <section id="workflow" className="section container"><span className="kicker">A clearer workflow</span><h2>Know what happened. Know what to do next.</h2><div className="grid" style={{gridTemplateColumns:'1fr 1fr'}}><div className="card" style={{minHeight:300}}><div className="icon">A</div><h3>Evidence first</h3><p>Every recommendation traces back to the AI queries, answers, citations and competitive signals behind it.</p></div><div className="card" style={{minHeight:300}}><div className="icon">B</div><h3>Action second</h3><p>Turn findings into prioritized work instead of another dashboard your team has to interpret.</p></div></div><div style={{marginTop:70}} className="quote">“The goal isn't another analytics dashboard. It's knowing what AI believes about your business—and what you can change.”</div></section>

    <section id="resources" className="container section" style={{paddingTop:20}}><div className="cta"><div><span className="kicker" style={{color:'#858b95'}}>Start with visibility</span><h2 className="display">See how AI sees your brand.</h2></div><a className="btn" href="/signup">Create your workspace →</a></div></section>

    <footer><div className="container footer"><div style={{display:'flex',justifyContent:'space-between',gap:20,flexWrap:'wrap'}}><span>© 2026 AI Visibility OS</span><span>Measure · Understand · Improve</span></div></div></footer>
  </main>;
}
