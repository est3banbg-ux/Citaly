/* Firebase falso para pruebas. Reemplaza firebase-app-compat.js; los demás scripts de Firebase se sirven vacíos.
   - window.__DATA   : { "ruta/del/doc": {datos} } con lo que "hay" en Firestore. {"__ts":ms} se vuelve Timestamp.
   - window.__USER   : usuario con sesión iniciada ({uid,email,...}) o null/undefined para "sin sesión".
   - window.__WRITES : bitácora de todo lo que la página escribió: ["set"|"update"|"delete", ruta, datos].
   - Como Firestore real: set con {mergeFields:[…]} conserva lo demás y los datos con undefined se rechazan.
   - window.__WOPTS  : opciones de cada escritura (mismo orden que __WRITES), ej. {merge:true} o {mergeFields:[…]}.
   - window.__AUTH_DELAY : ms que tarda en avisar quién inició sesión (opcional; como el Firebase real, que tarda un poco).
   - window.__DENY   : lista de prefijos de ruta que responden permission-denied (opcional).
   Las escrituras se aplican en memoria, así que lo que la página guarda se puede volver a leer. */
(function(){
var RAW=window.__DATA||{},D={},W=window.__WRITES=[],WO=window.__WOPTS=[],SUBS=[],DENY=window.__DENY||[],seq=0;
function Ts(ms){this._ms=ms}
Ts.prototype.toMillis=function(){return this._ms};Ts.prototype.toDate=function(){return new Date(this._ms)};
Ts.prototype.valueOf=function(){return this._ms};
Object.defineProperty(Ts.prototype,"seconds",{get:function(){return Math.floor(this._ms/1000)}});
var TsApi={fromDate:function(d){return new Ts(+d)},fromMillis:function(m){return new Ts(m)},now:function(){return new Ts(Date.now())}};
function revive(v){if(v&&typeof v==="object"){if(v instanceof Ts)return v;if(typeof v.__ts==="number")return new Ts(v.__ts);if(Array.isArray(v))return v.map(revive);var o={};Object.keys(v).forEach(function(k){o[k]=revive(v[k])});return o}return v}
Object.keys(RAW).forEach(function(k){D[k]=revive(RAW[k])});
function clone(v){if(v instanceof Ts)return v;if(Array.isArray(v))return v.map(clone);if(v&&typeof v==="object"&&!v.__fv){var o={};Object.keys(v).forEach(function(k){o[k]=clone(v[k])});return o}return v}
function plain(v){if(v instanceof Ts)return {__ts:v._ms};if(v&&v.__fv)return {__fv:v.__fv,v:v.v};if(Array.isArray(v))return v.map(plain);if(v&&typeof v==="object"){var o={};Object.keys(v).forEach(function(k){o[k]=plain(v[k])});return o}return v===undefined?null:v}
function fv(cur,v){if(v&&v.__fv){if(v.__fv==="ts")return new Ts(Date.now());if(v.__fv==="inc")return (+cur||0)+v.v;if(v.__fv==="union"){var a=(cur||[]).slice();v.v.forEach(function(x){if(a.indexOf(x)<0)a.push(x)});return a}
  if(v.__fv==="remove")return (cur||[]).filter(function(x){return v.v.indexOf(x)<0});if(v.__fv==="del")return undefined}
  if(v&&typeof v==="object"&&!Array.isArray(v)&&!(v instanceof Ts)){var o={};Object.keys(v).forEach(function(k){var r=fv(cur&&cur[k],v[k]);if(r!==undefined)o[k]=r});return o}return v}
function merge(cur,v){var o=clone(cur||{});Object.keys(v).forEach(function(k){var x=v[k];if(x&&x.__fv){var r=fv(o[k],x);if(r===undefined)delete o[k];else o[k]=r}
  else if(x&&typeof x==="object"&&!Array.isArray(x)&&!(x instanceof Ts)&&Object.keys(x).length&&o[k]&&typeof o[k]==="object"&&!Array.isArray(o[k]))o[k]=merge(o[k],x);else o[k]=clone(x)});return o}
function setPath(o,path,val){var p=path.split("."),c=o;for(var i=0;i<p.length-1;i++){if(!c[p[i]]||typeof c[p[i]]!=="object")c[p[i]]={};c=c[p[i]]}var r=fv(c[p[p.length-1]],val);if(r===undefined)delete c[p[p.length-1]];else c[p[p.length-1]]=r}
/* set(…,{mergeFields:[…]}): como Firestore real, solo cambia esas rutas y conserva lo demás */
function mergeFields(cur,v,fields){var o=clone(cur||{});fields.forEach(function(f){var x=String(f).split(".").reduce(function(a,k){return a==null?undefined:a[k]},v);if(x!==undefined)setPath(o,String(f),x)});return o}
/* Firestore real rechaza undefined en los datos (sin ignoreUndefinedProperties) */
function hasUndef(v){if(v===undefined)return true;if(v instanceof Ts||v===null||typeof v!=="object"||v.__fv)return false;if(Array.isArray(v))return v.some(hasUndef);return Object.keys(v).some(function(k){return hasUndef(v[k])})}
function undefPath(v,pre){if(v===undefined)return pre;if(v instanceof Ts||v===null||typeof v!=="object"||v.__fv)return null;var ks=Object.keys(v);for(var i=0;i<ks.length;i++){var r=undefPath(v[ks[i]],pre?pre+"."+ks[i]:ks[i]);if(r!=null)return r}return null}
function badData(p,v){var e=err("invalid-argument");e.message="Function called with invalid data. Unsupported field value: undefined (found in field "+(undefPath(v,"")||"?")+" in document "+p+")";return e}
function denied(p){return DENY.some(function(x){return p.indexOf(x)===0})}
function err(code){var e=new Error(code);e.code=code;return e}
function apply(op,p,v,opt){W.push([op,p,plain(v===undefined?null:v)]);WO.push(opt?plain(opt):null);
  if(op==="delete")delete D[p];else if(op==="set")D[p]=opt&&opt.mergeFields?mergeFields(D[p],v,opt.mergeFields):opt&&opt.merge?merge(D[p],v):fv(null,v);
  else{var o=clone(D[p]||{});Object.keys(v).forEach(function(k){setPath(o,k,v[k])});D[p]=o}
  notify()}
function snap(p){var d=D[p];return {id:p.split("/").pop(),exists:d!=null,ref:doc(p),data:function(){return d==null?undefined:clone(d)},get:function(f){return d==null?undefined:f.split(".").reduce(function(a,k){return a==null?a:a[k]},d)}}}
function notify(){setTimeout(function(){SUBS.slice().forEach(function(s){s.fire()})},0)}
function doc(p){return {id:p.split("/").pop(),path:p,
  get:function(){return denied(p)?Promise.reject(err("permission-denied")):Promise.resolve(snap(p))},
  set:function(v,opt){if(hasUndef(v))return Promise.reject(badData(p,v));if(denied(p))return Promise.reject(err("permission-denied"));apply("set",p,v,opt);return Promise.resolve()},
  update:function(v){if(hasUndef(v))return Promise.reject(badData(p,v));if(denied(p))return Promise.reject(err("permission-denied"));if(D[p]==null)return Promise.reject(err("not-found"));apply("update",p,v);return Promise.resolve()},
  delete:function(){if(denied(p))return Promise.reject(err("permission-denied"));apply("delete",p);return Promise.resolve()},
  collection:function(n){return coll(p+"/"+n)},
  onSnapshot:function(cb,ec){if(denied(p)){setTimeout(function(){ec&&ec(err("permission-denied"))},0);return function(){}}var last;var s={fire:function(){var j=JSON.stringify(plain(D[p]===undefined?null:D[p]));if(j===last)return;last=j;cb(snap(p))}};SUBS.push(s);setTimeout(s.fire,0);return function(){var i=SUBS.indexOf(s);if(i>=0)SUBS.splice(i,1)}}}}
function cmp(a,b){a=a instanceof Ts?a._ms:a;b=b instanceof Ts?b._ms:b;return a<b?-1:a>b?1:0}
function coll(p,fl,ob,lim){fl=fl||[];ob=ob||[];
  function run(){var pre=p+"/",out=Object.keys(D).filter(function(k){return k.indexOf(pre)===0&&k.slice(pre.length).indexOf("/")<0}).map(snap);
    fl.forEach(function(f){out=out.filter(function(s){var x=f[0]==="__name__"?s.id:s.get(f[0]),v=f[2];if(x===undefined)return false;
      switch(f[1]){case "==":return cmp(x,v)===0;case "!=":return cmp(x,v)!==0;case ">=":return cmp(x,v)>=0;case "<=":return cmp(x,v)<=0;case ">":return cmp(x,v)>0;case "<":return cmp(x,v)<0;
        case "in":return v.indexOf(x)>=0;case "array-contains":return Array.isArray(x)&&x.indexOf(v)>=0}return true})});
    ob.forEach(function(o){out.sort(function(a,b){return cmp(a.get(o[0]),b.get(o[0]))*(o[1]==="desc"?-1:1)})});
    if(lim)out=out.slice(0,lim);return out}
  function qs(docs,prev){return {docs:docs,size:docs.length,empty:!docs.length,forEach:function(f){docs.forEach(f)},
    docChanges:function(){var ch=[];docs.forEach(function(d){var j=JSON.stringify(plain(d.data()));if(!prev||!(d.id in prev))ch.push({type:"added",doc:d});else if(prev[d.id]!==j)ch.push({type:"modified",doc:d})});
      if(prev)Object.keys(prev).forEach(function(id){if(!docs.some(function(d){return d.id===id}))ch.push({type:"removed",doc:{id:id,data:function(){return {}}}})});return ch}}}
  return {path:p,doc:function(id){return doc(p+"/"+(id||("auto"+(++seq)+Date.now().toString(36))))},
    add:function(v){var r=this.doc();return r.set(v).then(function(){return r})},
    where:function(a,b,c){if(a&&typeof a==="object")a="__name__";return coll(p,fl.concat([[a,b,c]]),ob,lim)},orderBy:function(a,b){return coll(p,fl,ob.concat([[a,b]]),lim)},limit:function(n){return coll(p,fl,ob,n)},
    get:function(){return denied(p)?Promise.reject(err("permission-denied")):Promise.resolve(qs(run()))},
    onSnapshot:function(cb,ec){if(denied(p)){setTimeout(function(){ec&&ec(err("permission-denied"))},0);return function(){}}var prev=null,last;var s={fire:function(){var docs=run(),m={};docs.forEach(function(d){m[d.id]=JSON.stringify(plain(d.data()))});var j=JSON.stringify(m);if(j===last)return;last=j;cb(qs(docs,prev));prev=m}};SUBS.push(s);setTimeout(s.fire,0);return function(){var i=SUBS.indexOf(s);if(i>=0)SUBS.splice(i,1)}}}}
var db={doc:doc,collection:function(p){return coll(p)},
  batch:function(){var ops=[];return {set:function(r,v,o){if(hasUndef(v))throw badData(r.path,v);ops.push(["set",r.path,v,o]);return this},update:function(r,v){if(hasUndef(v))throw badData(r.path,v);ops.push(["update",r.path,v]);return this},delete:function(r){ops.push(["delete",r.path]);return this},
    commit:function(){var bad=ops.filter(function(o){return denied(o[1])})[0];if(bad)return Promise.reject(err("permission-denied"));ops.forEach(function(o){apply(o[0],o[1],o[2],o[3])});return Promise.resolve()}}},
  runTransaction:function(f){var ops=[];var t={get:function(r){return r.get()},set:function(r,v,o){ops.push(["set",r.path,v,o]);return t},update:function(r,v){ops.push(["update",r.path,v]);return t},delete:function(r){ops.push(["delete",r.path]);return t}};
    return Promise.resolve().then(function(){return f(t)}).then(function(res){ops.forEach(function(o){apply(o[0],o[1],o[2],o[3])});return res})},
  enablePersistence:function(){return Promise.resolve()},settings:function(){}};
function fs(){return db}
fs.Timestamp=TsApi;fs.FieldPath={documentId:function(){return "__name__"}};
fs.FieldValue={serverTimestamp:function(){return {__fv:"ts"}},increment:function(n){return {__fv:"inc",v:n}},arrayUnion:function(){return {__fv:"union",v:[].slice.call(arguments)}},arrayRemove:function(){return {__fv:"remove",v:[].slice.call(arguments)}},delete:function(){return {__fv:"del"}}};
/* Auth falso */
var U=window.__USER||null,LS=[];
function mkUser(u){if(!u)return null;return Object.assign({uid:"U1",email:"dueno@prueba.test",emailVerified:true,displayName:"Dueño Prueba",providerData:[{providerId:"google.com"}],
  getIdToken:function(){return Promise.resolve("token-falso")},sendEmailVerification:function(){return Promise.resolve()},reload:function(){return Promise.resolve()},updateProfile:function(){return Promise.resolve()},delete:function(){return Promise.resolve()}},u)}
var A={get currentUser(){return mkUser(U)},
  onAuthStateChanged:function(f){LS.push(f);setTimeout(function(){f(mkUser(U))},window.__AUTH_DELAY||0);return function(){}},
  signOut:function(){U=null;window.__AUTH.push(["signOut"]);LS.forEach(function(f){f(null)});return Promise.resolve()},
  getRedirectResult:function(){return Promise.resolve({user:null})},setPersistence:function(){return Promise.resolve()},useDeviceLanguage:function(){},isSignInWithEmailLink:function(){return false},
  signInWithEmailLink:function(){return Promise.reject(err("auth/invalid-action-code"))},sendSignInLinkToEmail:function(e){window.__AUTH.push(["link",e]);return Promise.resolve()},
  sendPasswordResetEmail:function(e){window.__AUTH.push(["reset",e]);return Promise.resolve()},
  signInWithEmailAndPassword:function(e,p){window.__AUTH.push(["login",e]);if(window.__LOGIN_ERR)return Promise.reject(err(window.__LOGIN_ERR));U={uid:"U1",email:e,providerData:[{providerId:"password"}]};var u=mkUser(U);LS.forEach(function(f){f(u)});return Promise.resolve({user:u})},
  createUserWithEmailAndPassword:function(e,p){window.__AUTH.push(["alta",e]);if(window.__LOGIN_ERR)return Promise.reject(err(window.__LOGIN_ERR));U={uid:"UNUEVO",email:e,emailVerified:false,providerData:[{providerId:"password"}]};var u=mkUser(U);LS.forEach(function(f){f(u)});return Promise.resolve({user:u})},
  signInWithPopup:function(){window.__AUTH.push(["popup"]);return Promise.reject(err("auth/popup-closed-by-user"))},signInWithRedirect:function(){window.__AUTH.push(["redirect"]);return Promise.resolve()}};
window.__AUTH=[];
function au(){return A}
function Prov(){this.setCustomParameters=function(){return this};this.addScope=function(){return this}}
au.GoogleAuthProvider=Prov;au.FacebookAuthProvider=Prov;au.EmailAuthProvider={credential:function(){return {}}};au.Auth={Persistence:{LOCAL:"local",SESSION:"session",NONE:"none"}};
function msg(){return {getToken:function(){return Promise.resolve("")},onMessage:function(){},deleteToken:function(){return Promise.resolve()}}}
msg.isSupported=function(){return false};
/* initializeApp devuelve una app con .auth()/.firestore() (el admin usa firebase.initializeApp(cfg,"admin").auth()) */
function mkApp(){return {auth:au,firestore:fs,messaging:msg}}
window.firebase={initializeApp:function(){return mkApp()},apps:[{}],app:function(){return mkApp()},firestore:fs,auth:au,messaging:msg};
window.__DB=D; /* para que las pruebas lean el estado final */
})();
