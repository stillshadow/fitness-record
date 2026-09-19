(() => {
  const $=id=>document.getElementById(id);
  const CFG_KEY="chibianyingGithubBackupV1";
  const toast=msg=>{
    const t=$("toast");if(!t)return;
    t.textContent=msg;t.classList.add("show");
    clearTimeout(toast._t);toast._t=setTimeout(()=>t.classList.remove("show"),1800);
  };
  const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const readCfg=()=>{
    try{
      return {owner:"stillshadow",repo:"",branch:"main",path:"fitness-backup.json",token:"",...JSON.parse(localStorage.getItem(CFG_KEY)||"{}")};
    }catch{
      return {owner:"stillshadow",repo:"",branch:"main",path:"fitness-backup.json",token:""};
    }
  };
  const saveCfg=cfg=>localStorage.setItem(CFG_KEY,JSON.stringify(cfg));
  const bytesToBase64=text=>{
    const bytes=new TextEncoder().encode(text);
    let binary="",chunk=0x8000;
    for(let i=0;i<bytes.length;i+=chunk)binary+=String.fromCharCode(...bytes.subarray(i,i+chunk));
    return btoa(binary);
  };
  const apiPath=(owner,repo,path)=>"https://api.github.com/repos/"+encodeURIComponent(owner)+"/"+encodeURIComponent(repo)+"/contents/"+String(path).split("/").filter(Boolean).map(encodeURIComponent).join("/");
  async function githubFetch(url,token,options={}){
    const resp=await fetch(url,{
      ...options,
      headers:{
        Accept:"application/vnd.github+json",
        Authorization:"Bearer "+token,
        "X-GitHub-Api-Version":"2026-03-10",
        ...(options.headers||{})
      }
    });
    const data=await resp.json().catch(()=>null);
    return {resp,data};
  }
  async function backup(){
    const cfg=readCfg();
    if(!cfg.owner||!cfg.repo||!cfg.token){
      $("githubBackupDetails")?.setAttribute("open","");
      toast("先填写 GitHub 备份配置");
      return;
    }
    const btn=$("githubBackupNow"),status=$("githubBackupStatus");
    if(btn){btn.disabled=true;btn.textContent="备份中…"}
    try{
      const url=apiPath(cfg.owner,cfg.repo,cfg.path||"fitness-backup.json")+"?ref="+encodeURIComponent(cfg.branch||"main");
      const existing=await githubFetch(url,cfg.token);
      let sha=null;
      if(existing.resp.ok)sha=existing.data?.sha||null;
      else if(existing.resp.status!==404){
        throw new Error(existing.data?.message||("读取仓库失败 HTTP "+existing.resp.status));
      }
      const db=window.fitnessApp?.getDB?.();
      if(!db)throw new Error("本机数据尚未初始化");
      const body={
        message:"Backup fitness data "+new Date().toISOString().slice(0,10),
        content:bytesToBase64(JSON.stringify(db,null,2)),
        branch:cfg.branch||"main"
      };
      if(sha)body.sha=sha;
      const put=await githubFetch(apiPath(cfg.owner,cfg.repo,cfg.path||"fitness-backup.json"),cfg.token,{
        method:"PUT",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify(body)
      });
      if(!put.resp.ok)throw new Error(put.data?.message||("备份失败 HTTP "+put.resp.status));
      const now=new Date();
      localStorage.setItem("chibianyingGithubBackupLast",now.toISOString());
      if(status)status.textContent="上次备份："+now.toLocaleString();
      toast("已备份到 GitHub");
    }catch(err){
      if(status)status.textContent="备份失败："+(err.message||"未知错误");
      if(/404|not found/i.test(err.message||""))toast("仓库不可访问，请检查仓库名和 Token 权限");
      else toast(err.message||"GitHub 备份失败");
    }finally{
      if(btn){btn.disabled=false;btn.textContent="备份到 GitHub"}
    }
  }
  async function test(){
    const cfg=readCfg(),btn=$("githubBackupTest");
    if(!cfg.owner||!cfg.repo||!cfg.token)return toast("先填写仓库和 Token");
    if(btn){btn.disabled=true;btn.textContent="测试中…"}
    try{
      const url="https://api.github.com/repos/"+encodeURIComponent(cfg.owner)+"/"+encodeURIComponent(cfg.repo);
      const r=await githubFetch(url,cfg.token);
      if(!r.resp.ok)throw new Error(r.data?.message||("HTTP "+r.resp.status));
      toast("GitHub 连接正常");
      const status=$("githubBackupStatus");
      if(status)status.textContent="已连接："+cfg.owner+"/"+cfg.repo;
    }catch(err){toast("连接失败："+(err.message||"请检查配置"))}
    finally{if(btn){btn.disabled=false;btn.textContent="测试连接"}}
  }
  function inject(){
    const exportBtn=$("exportJson"),card=exportBtn?.closest(".card");
    if(!card||$("githubBackupNow"))return;
    const toolbar=exportBtn.closest(".toolbar");
    const btn=document.createElement("button");
    btn.type="button";btn.className="btn";btn.id="githubBackupNow";btn.textContent="备份到 GitHub";
    toolbar?.prepend(btn);

    const cfg=readCfg(),last=localStorage.getItem("chibianyingGithubBackupLast");
    const details=document.createElement("details");
    details.id="githubBackupDetails";details.style.marginTop="12px";
    details.innerHTML='<summary class="meta" style="cursor:pointer">GitHub 备份设置</summary>'+
      '<div class="callout" style="margin-top:8px">建议使用单独的 <b>Private</b> 仓库保存体重、饮食和训练数据。GitHub Token 只保存在这台设备。</div>'+
      '<div class="field-grid" style="margin-top:9px">'+
        '<div><label for="githubBackupOwner">GitHub 用户名</label><input id="githubBackupOwner" autocomplete="off" value="'+esc(cfg.owner)+'"></div>'+
        '<div><label for="githubBackupRepo">私有备份仓库</label><input id="githubBackupRepo" autocomplete="off" placeholder="例如 fitness-backup" value="'+esc(cfg.repo)+'"></div>'+
        '<div><label for="githubBackupBranch">分支</label><input id="githubBackupBranch" autocomplete="off" value="'+esc(cfg.branch)+'"></div>'+
        '<div><label for="githubBackupPath">备份文件路径</label><input id="githubBackupPath" autocomplete="off" value="'+esc(cfg.path)+'"></div>'+
        '<div class="s12"><label for="githubBackupToken">Fine-grained PAT</label><input id="githubBackupToken" type="password" autocomplete="off" spellcheck="false" placeholder="只需给该仓库 Contents: write 权限" value="'+esc(cfg.token)+'"></div>'+
      '</div>'+
      '<div class="toolbar"><button type="button" class="btn soft" id="githubBackupSave">保存设置</button><button type="button" class="btn ghost" id="githubBackupTest">测试连接</button><button type="button" class="btn danger" id="githubBackupForget">清除 Token</button></div>'+
      '<div class="meta" id="githubBackupStatus" style="margin-top:8px">'+(last?"上次备份："+new Date(last).toLocaleString():"尚未备份")+'</div>';
    card.appendChild(details);

    $("githubBackupSave").onclick=()=>{
      const next={
        owner:$("githubBackupOwner").value.trim(),
        repo:$("githubBackupRepo").value.trim(),
        branch:$("githubBackupBranch").value.trim()||"main",
        path:$("githubBackupPath").value.trim()||"fitness-backup.json",
        token:$("githubBackupToken").value.trim()
      };
      if(!next.owner||!next.repo||!next.token)return toast("请填写 GitHub 用户名、仓库和 Token");
      saveCfg(next);toast("GitHub 备份设置已保存");
    };
    $("githubBackupForget").onclick=()=>{
      const cur=readCfg();cur.token="";saveCfg(cur);$("githubBackupToken").value="";toast("已清除本机 GitHub Token");
    };
    $("githubBackupTest").onclick=()=>{saveCfg({
      owner:$("githubBackupOwner").value.trim(),repo:$("githubBackupRepo").value.trim(),
      branch:$("githubBackupBranch").value.trim()||"main",path:$("githubBackupPath").value.trim()||"fitness-backup.json",
      token:$("githubBackupToken").value.trim()
    });test()};
    btn.onclick=backup;
  }
  function setup(){
    if(!window.fitnessApp?.getDB)return setTimeout(setup,80);
    inject();
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",()=>setTimeout(setup,0),{once:true});else setTimeout(setup,0);
})();