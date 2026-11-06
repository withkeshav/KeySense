const fs=require('fs'),os=require('os'),path=require('path'),{spawn}=require('child_process'),assert=require('assert');
const root=path.resolve(__dirname,'..');
const {pathToFileURL}=require('url');
const http=require('http');
const chromeBin=process.env.CHROME_BIN || ['/usr/bin/google-chrome','/usr/bin/chromium','/usr/bin/chromium-browser'].find(p=>fs.existsSync(p));
if(!chromeBin) throw Error('Chrome is required. Set CHROME_BIN to its executable path.');
// Serve the packaged site, not the development checkout, for hosted-page checks.
const release=fs.mkdtempSync(path.join(os.tmpdir(),'keysense-public-'));
const packaged=path.join(release,'site');
require('child_process').execFileSync(process.execPath,[path.join(root,'tools/package-site.js'),packaged]);
const server=http.createServer((req,res)=>{
 const name=new URL(req.url,'http://localhost').pathname;
 const file=path.join(packaged,name==='/'?'index.html':name);
 if(!file.startsWith(packaged+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404);res.end();return;}
 const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png'};
 res.setHeader('Content-Type',mime[path.extname(file)]||'text/plain');
 fs.createReadStream(file).pipe(res);
});
const pause=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const profile=fs.mkdtempSync(path.join(os.tmpdir(),'keysense-chrome-'));
 const chrome=spawn(chromeBin,['--headless=new','--no-sandbox','--disable-gpu','--remote-debugging-port=0','--user-data-dir='+profile,'about:blank'],{stdio:'ignore'});
 try{
  for(let i=0;i<100&&!fs.existsSync(path.join(profile,'DevToolsActivePort'));i++)await pause(100);
  const port=fs.readFileSync(path.join(profile,'DevToolsActivePort'),'utf8').split('\n')[0];
  for(const mode of ['healthy','zero','throws','missing','second-zero','hosted-healthy']){
   const healthy=mode==='healthy'||mode==='hosted-healthy';
   const target=await (await fetch(`http://127.0.0.1:${port}/json/new?about:blank`,{method:'PUT'})).json();
   const ws=new WebSocket(target.webSocketDebuggerUrl);await new Promise((r,j)=>{ws.onopen=r;ws.onerror=j;});
   let seq=0;const pending=new Map(),errors=[];
   ws.onmessage=ev=>{const d=JSON.parse(ev.data);if(d.id){const p=pending.get(d.id);pending.delete(d.id);d.error?p.reject(d.error):p.resolve(d.result);}else if(d.method==='Runtime.exceptionThrown')errors.push(d.params.exceptionDetails.text);};
   const send=(method,params={})=>new Promise((resolve,reject)=>{const id=++seq;const timeout=setTimeout(()=>{pending.delete(id);reject(Error('Browser command timed out: '+method));},20000);pending.set(id,{resolve:v=>{clearTimeout(timeout);resolve(v);},reject:e=>{clearTimeout(timeout);reject(e);}});ws.send(JSON.stringify({id,method,params}));});
   const evaluate=async expression=>{const r=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value;};
   await send('Page.enable');await send('Runtime.enable');
   const stubs={zero:'b=>{b.fill(0);return b}',throws:'()=>{throw Error("test source failed")}',missing:'undefined','second-zero':'b=>{for(let i=0;i<b.length;i++)b[i]=window.__draw?0:i;window.__draw=1;return b}'};
   if(!healthy)await send('Page.addScriptToEvaluateOnNewDocument',{source:`Object.defineProperty(crypto,'getRandomValues',{value:${stubs[mode]},configurable:true});`});
   const url=mode==='hosted-healthy'?'http://127.0.0.1:'+server.address().port+'/index.html':pathToFileURL(path.join(root,'index.html')).href;await send('Page.navigate',{url});
   for(let i=0;i<100;i++){if(await evaluate(`location.href===${JSON.stringify(url)} && document.readyState==='complete'`))break;await pause(100);}
   const result=await evaluate(`(()=>{document.getElementById('genMnemonic').click();return {valid:ethers.utils.isValidMnemonic(document.getElementById('mnemonic').value),error:document.getElementById('error').textContent,warning:document.getElementById('entropyCanaryWarning').textContent}})()`);
   assert.equal(result.valid,healthy,mode+' generate');
   if(!healthy){assert.match(result.error,/blocked/);assert.match(result.warning,/blocked/);}
   await evaluate(`document.getElementById('vanityPattern').value='0xa';document.getElementById('vanityStart').click()`);
   for(let i=0;i<50;i++){if(await evaluate(`document.getElementById('vanityResult').style.display==='block' || document.getElementById('vanityError').textContent.length>0`))break;await pause(100);}
   const vanity=await evaluate(`({visible:document.getElementById('vanityResult').style.display==='block',error:document.getElementById('vanityError').textContent,startDisabled:document.getElementById('vanityStart').disabled})`);
   assert.equal(vanity.visible,healthy,mode+' vanity');if(!healthy){assert.match(vanity.error,/blocked/);assert.equal(vanity.startDisabled,false);}
   const entropy=await evaluate(`(()=>{let dice=document.getElementById('diceInput');dice.value='123456'.repeat(9);dice.dispatchEvent(new Event('input'));document.getElementById('entropyGenBtn').click();return document.getElementById('entropyError').textContent})()`);
   if(!healthy)assert.match(entropy,/blocked|no crypto/);else assert.equal(entropy,'');
   if(!healthy){
    const replay=await evaluate(`(()=>{document.getElementById('entropyReproducible').checked=true;document.getElementById('entropyGenBtn').click();return {error:document.getElementById('entropyError').textContent,valid:ethers.utils.isValidMnemonic(document.getElementById('mnemonic').value)}})()`);
    assert.equal(replay.error,'');assert.equal(replay.valid,true);
   }
   assert.deepEqual(errors,[],mode+' uncaught errors');
   if(healthy){
    const phrase='abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';
    const addresses=await evaluate(`(async()=>{
      const phrase=${JSON.stringify(phrase)};
      const root=ethers.utils.HDNode.fromMnemonic(phrase);
      const ethPath="m/44'/60'/0'/0/0";
      const btcPath="m/84'/0'/0'/0/0";
      return {eth:(await formatAddress(phrase,ethPath,44,60,root.derivePath(ethPath).privateKey,'')).address,
       btc:(await formatAddress(phrase,btcPath,84,0,root.derivePath(btcPath).privateKey,'')).address};
    })()`);
    assert.equal(addresses.eth,'0x9858EfFD232B4033E47d90003D41EC34EcaEda94');
    assert.equal(addresses.btc,'bc1qcr8te4kr609gcawutmrza0j4xv80jy8z306fyu');
    await evaluate(`document.getElementById('mnemonicWordCount').value='24';document.getElementById('genMnemonic').click()`);
    assert.equal(await evaluate(`document.getElementById('mnemonic').value.trim().split(/\\s+/).length`),24);
    await evaluate(`document.getElementById('seedBarClear').click()`);
    assert.equal(await evaluate(`document.getElementById('mnemonic').value`),'');
   }
   if(healthy){
    await evaluate(`document.querySelector('[data-tab="learn"]').click()`);
    const state=await evaluate(`(async()=>{
      const host=document.getElementById('recoveryDetective');
      const before=document.getElementById('mnemonic').value;
      const saved=JSON.stringify([Object.entries(localStorage),Object.entries(sessionStorage)]);
      const byId=id=>document.getElementById('rd-'+id);
      const choose=(name,value)=>host.querySelector('input[name="rd-'+name+'"][value="'+value+'"]').click();
      const outcomes=[];
      const phrase='abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';
      const root=ethers.utils.HDNode.fromMnemonic(phrase);
      for(const [name,purpose] of [['legacy',44],['native',84],['taproot',86]]){
        choose('format',name);
        const path=byId('path').textContent;
        const actual=await formatAddress(phrase,path,purpose,0,root.derivePath(path).privateKey,'');
        outcomes.push(byId('address').textContent===actual.address);
      }
      byId('reset').click();byId('compare').click();
      outcomes.push(byId('match').textContent.startsWith('Not a match') && byId('explain').hidden);
      choose('format','native');byId('compare').click();byId('check').click();
      outcomes.push(byId('feedback').textContent.startsWith('Choose'));
      choose('reason','network');byId('check').click();outcomes.push(byId('complete').hidden);
      choose('reason','route');byId('check').click();
      outcomes.push(!byId('complete').hidden && byId('completionNote').textContent.includes('with help'));
      choose('format','legacy');outcomes.push(byId('complete').hidden);
      byId('reset').click();byId('hint').click();choose('format','native');byId('compare').click();choose('reason','route');byId('check').click();
      outcomes.push(byId('completionNote').textContent.includes('with help'));
      byId('reset').click();choose('format','native');byId('compare').click();choose('reason','route');byId('check').click();
      outcomes.push(!byId('complete').hidden && byId('completionNote').textContent.includes('explained'));
      byId('reset').click();
      outcomes.push(byId('complete').hidden && byId('hintText').hidden);
      outcomes.push(before===document.getElementById('mnemonic').value);
      outcomes.push(saved===JSON.stringify([Object.entries(localStorage),Object.entries(sessionStorage)]));
      return outcomes;
    })()`);
    assert(state.every(Boolean),'Recovery Detective fixtures, feedback, reset and isolation: '+JSON.stringify(state));
    console.log('PASS Recovery Detective in '+mode+' with unchanged seed and no saved progress');
   }
   if(mode==='healthy'){
    await evaluate(`document.querySelector('[data-tab="learn"]').click()`);
    for(const [theme,width] of [['light',1200],['dark',390]]){
     await send('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:false});
     await evaluate(`applyTheme(${JSON.stringify(theme)})`);
     await evaluate(`document.getElementById('recoveryDetective').scrollIntoView({block:'start'})`);
     await pause(400); // Let the existing theme transition finish before inspecting pixels.
     assert.equal(await evaluate(`document.documentElement.scrollWidth<=innerWidth+1`),true,'page fits '+width);
     if(process.env.SCREENSHOT_DIR){
      fs.mkdirSync(process.env.SCREENSHOT_DIR,{recursive:true});
      const shot=await send('Page.captureScreenshot',{format:'png'});
      fs.writeFileSync(path.join(process.env.SCREENSHOT_DIR,'learn-'+theme+'.png'),Buffer.from(shot.data,'base64'));
     }
    }
    const selfTest=pathToFileURL(path.join(root,'test/self-test.html')).href;
    await send('Page.navigate',{url:selfTest});
    let summary='';
    for(let i=0;i<200;i++){
     summary=await evaluate(`document.getElementById('summary')?.textContent || ''`);
     if(/passed|failed|harness error/.test(summary))break;
     await pause(100);
    }
    assert.match(summary,/0 failed/,'browser vector suite: '+summary);
    console.log('PASS Chrome vector suite and Learn page at desktop/mobile widths');
   }
   console.log('PASS Chrome '+mode+': Generate, vanity, mixed entropy, replay, no uncaught errors');
   ws.close();await fetch(`http://127.0.0.1:${port}/json/close/${target.id}`);
  }
 }finally{chrome.kill();await new Promise(r=>chrome.once('exit',r));fs.rmSync(profile,{recursive:true,force:true});await new Promise(r=>server.close(r));fs.rmSync(release,{recursive:true,force:true});}
})().catch(e=>{console.error(e);process.exitCode=1;});
