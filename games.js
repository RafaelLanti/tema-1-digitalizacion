(() => {
  "use strict";
  const $ = (s) => document.querySelector(s);
  const area = $("#game-area"), title = $("#game-title"), intro = $("#game-intro");
  const topEl = $("#top-three"), modeEl = $("#leaderboard-mode");
  const localKey = "digitalizacion-top20-v2";
  const playerIdKey = "digitalizacion-player-id-v1";
  const bannedWords = new Set(("mesa casa perro gato hola mundo prueba usuario jugador admin password amor sol luna agua libro papel ordenador tecnologia digitalizacion amigo amiga coche silla puerta ventana escuela clase profesor alumno nombre apellido españa madrid barcelona").split(" "));
  const config = window.LEADERBOARD_CONFIG || {};
  const quiz = [
    {q:"¿Qué describe mejor la digitalización empresarial?",a:["Transformar información y tareas mediante tecnología digital","Comprar más ordenadores sin cambiar procesos","Eliminar toda intervención humana"],c:0,e:"La digitalización transforma información, tareas y procesos mediante tecnologías digitales."},
    {q:"¿Con qué se compara IT en el tema?",a:["Los brazos y piernas","El cerebro de la empresa","Una máquina aislada"],c:1,e:"IT procesa información, comunica, analiza y ayuda a decidir."},
    {q:"¿Cuál es un ejemplo típico de OT?",a:["Un ERP de finanzas","Una plataforma de correo electrónico","Un PLC que controla una máquina"],c:2,e:"OT se orienta al control y automatización de procesos físicos."},
    {q:"¿Para qué sirven los gemelos digitales?",a:["Para simular y optimizar procesos físicos en un entorno virtual","Para sustituir todas las copias de seguridad","Para enviar mensajes publicitarios"],c:0,e:"Permiten probar escenarios y optimizar máquinas, sistemas o procesos."},
    {q:"¿Qué ventaja puede aportar la integración IT-OT?",a:["Impedir el análisis de datos","Detectar problemas y planificar mantenimiento","Eliminar la necesidad de ciberseguridad"],c:1,e:"Los datos de OT pueden analizarse en IT para anticiparse a fallos."},
    {q:"¿Qué es una posible consecuencia de la digitalización?",a:["No se necesitan nuevas habilidades","Los datos dejan de ser importantes","Puede mejorar la eficiencia, pero también generar riesgos de seguridad"],c:2,e:"La transformación aporta beneficios, pero requiere formación y protección."},
    {q:"¿Qué tecnología conecta objetos y sensores para recopilar datos?",a:["IoT","Procesador de textos sin conexión","Papel autocopiativo"],c:0,e:"El Internet de las cosas conecta objetos para intercambiar o utilizar información."},
    {q:"¿Qué significa que IT y OT estén integradas?",a:["Que nunca comparten datos","Que información y operación física se coordinan","Que solo se usa tecnología en oficinas"],c:1,e:"La integración permite conectar datos empresariales con procesos físicos."}
  ];
  const classify = [
    {q:"Sensores de temperatura en una fábrica",c:"OT",e:"Los sensores observan procesos físicos."},
    {q:"ERP para gestionar compras y ventas",c:"IT",e:"Un ERP gestiona información y procesos empresariales."},
    {q:"PLC que automatiza una línea de producción",c:"OT",e:"Un PLC controla operaciones físicas."},
    {q:"Analítica de datos para estudiar ventas",c:"IT",e:"Analiza información para apoyar decisiones."},
    {q:"Gemelo digital conectado a datos de una máquina",c:"AMBAS",e:"OT aporta datos de la operación e IT los analiza y simula."},
    {q:"Ciberseguridad que protege servidores y sistemas industriales",c:"AMBAS",e:"La seguridad debe cubrir tanto sistemas IT como OT."},
    {q:"Plataforma de comercio electrónico",c:"IT",e:"Gestiona ventas y datos mediante servicios digitales."},
    {q:"Red industrial que conecta máquinas",c:"OT",e:"Conecta equipos y procesos industriales."}
  ];
  const rapid = [
    {q:"IT se ocupa principalmente de procesar información.",c:true,e:"Correcto: IT gestiona, procesa y analiza información."},
    {q:"OT solo se utiliza en ordenadores de oficina.",c:false,e:"OT controla procesos físicos en entornos industriales, domésticos y comerciales."},
    {q:"La automatización puede reducir tareas repetitivas.",c:true,e:"Puede hacer tareas más rápidas, precisas y ordenadas."},
    {q:"La integración IT-OT elimina todos los riesgos de seguridad.",c:false,e:"La integración también puede ampliar la superficie de ataque."},
    {q:"La nube permite acceder a recursos desde distintos lugares.",c:true,e:"El procesamiento y almacenamiento remoto facilitan el acceso."},
    {q:"Los datos personales nunca presentan riesgos de privacidad.",c:false,e:"Los datos requieren protección y usos legítimos."},
    {q:"El mantenimiento predictivo utiliza datos para anticiparse a fallos.",c:true,e:"Los datos de sensores ayudan a planificar mantenimiento."},
    {q:"IT y OT siempre han funcionado integradas desde los años 70.",c:false,e:"El tema describe etapas desde sistemas diferenciados hasta la integración."}
  ];
  let game = null, questions = [], index = 0, score = 0, locked = false, deadline = null, timer = null, rapidEnd = 0;

  function loadLocal() {
    try { const v = JSON.parse(localStorage.getItem(localKey) || "[]"); return Array.isArray(v) ? v : []; }
    catch (_) { return []; }
  }
  function saveLocal(rows) { localStorage.setItem(localKey, JSON.stringify(sortRows(rows).slice(0,20))); }
  function sortRows(rows) {
    const bestByPlayer = new Map();
    rows.forEach(r => {
      const key = r.player_id || (String(r.name||"").toLocaleLowerCase("es") + "|" + (r.game||""));
      const prev = bestByPlayer.get(key);
      if (!prev || Number(r.score) > Number(prev.score)) bestByPlayer.set(key,r);
    });
    return [...bestByPlayer.values()].sort((a,b) => Number(b.score)-Number(a.score) || (a.date||"").localeCompare(b.date||"")).slice(0,20);
  }
  function validNickname(value) {
    const name = String(value || "").trim();
    const normalized = name.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLocaleLowerCase("es");
    if (!/^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ][A-Za-zÁÉÍÓÚÜÑáéíóúüñ0-9_-]{2,17}$/.test(name)) {
      return "Usa entre 3 y 18 caracteres: empieza por una letra y añade al menos un número (por ejemplo, Luna7). No se permiten espacios.";
    }
    if (!/[0-9]/.test(name)) return "El alias debe incluir al menos un número; no se aceptan palabras comunes como «mesa». Ejemplo: Mesa7.";
    if (bannedWords.has(normalized)) return "Ese alias es una palabra común. Elige un alias personal con números, por ejemplo, Luna7.";
    return "";
  }
  function getPlayerId() {
    let id = localStorage.getItem(playerIdKey);
    if (!id) {
      id = (typeof crypto !== "undefined" && crypto.randomUUID)
        ? crypto.randomUUID()
        : "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g,c=>{const r=Math.random()*16|0;return (c==="x"?r:(r&3|8)).toString(16);});
      localStorage.setItem(playerIdKey,id);
    }
    return id;
  }
  function isConfigured() {
    return !!(config.url && config.anonKey && !config.url.includes("TU_PROYECTO") && !config.anonKey.includes("TU_CLAVE"));
  }
  async function getGlobal() {
    if (!isConfigured()) return null;
    try {
      const url = config.url.replace(/\/$/,"") + "/rest/v1/leaderboard_players?select=name,score,game,updated_at,player_id&order=score.desc,updated_at.asc&limit=20";
      const res = await fetch(url,{headers:{apikey:config.anonKey,Authorization:"Bearer "+config.anonKey}});
      if (!res.ok) throw new Error("No se pudo leer la clasificación global.");
      return (await res.json()).map(r=>({name:r.name,score:r.score,game:r.game,date:r.updated_at,player_id:r.player_id}));
    } catch (e) { console.warn(e); return null; }
  }
  async function renderScores() {
    const globalRows = await getGlobal();
    let rows, label;
    if (globalRows !== null) { rows=globalRows; label="Top 20 global · todos los dispositivos"; }
    else { rows=sortRows(loadLocal()); label=isConfigured()?"Top 20 local (no se pudo conectar con la base de datos)":"Top 20 local · configura Supabase para compartirlo"; }
    modeEl.textContent=label;
    topEl.innerHTML="";
    if (!rows.length) { const li=document.createElement("li"); li.textContent="Aún no hay puntuaciones. ¡Sé el primero!"; topEl.append(li); return; }
    rows.forEach((r,i)=>{
      const li=document.createElement("li");
      const name=document.createElement("span"); name.className="score-name"; name.textContent=(i<3?["🥇 ","🥈 ","🥉 "][i]:"#"+(i+1)+" ")+(r.name||"Jugador");
      const points=document.createElement("span"); points.className="score-points"; points.textContent=String(r.score)+" pts";
      li.append(name,points);
      const detail=document.createElement("div"); detail.className="small"; detail.textContent=(r.game||"Juego")+" · "+(r.date?new Date(r.date).toLocaleDateString("es-ES"):""); li.append(detail);
      topEl.append(li);
    });
  }
  async function submitScore(name) {
    const validation = validNickname(name);
    if (validation) {
      const error = $("#nickname-error");
      if (error) error.textContent = validation;
      const input = $("#player-name"); if (input) input.focus();
      return false;
    }
    const row={player_id:getPlayerId(),name:name.trim().slice(0,18),score:score,game:game.label,date:new Date().toISOString()};
    saveLocal([...loadLocal(),row]);
    let globalSaved=false;
    if (isConfigured()) {
      try {
        const res=await fetch(config.url.replace(/\/$/,"")+"/rest/v1/rpc/submit_score",{method:"POST",headers:{apikey:config.anonKey,Authorization:"Bearer "+config.anonKey,"Content-Type":"application/json"},body:JSON.stringify({p_player_id:row.player_id,p_name:row.name,p_score:row.score,p_game:row.game})});
        if (!res.ok) { const body=await res.text(); throw new Error(body||"No se pudo guardar en Supabase"); }
        globalSaved=true;
      } catch(e) { console.warn(e); alert("No se pudo guardar en el Top 20 global. Comprueba que has ejecutado el SQL de la guía y configurado Supabase. La puntuación queda guardada en este navegador."); }
    }
    await renderScores();
    area.innerHTML=`<h3>¡Puntuación guardada!</h3><p> ${escapeHtml(row.name)}, has conseguido <strong>${score} puntos</strong>.</p><p class="callout ok">${globalSaved?"Tu mejor puntuación se ha sincronizado con el Top 20 global.":"Tu puntuación está guardada en este navegador."}</p><button class="btn" id="play-again">Jugar otra vez</button>`;
    $("#play-again").addEventListener("click",()=>start(game.type));
    return true;
  }
  function start(type) {
    clearInterval(timer); game={type,label:type==="quiz"?"Quiz de digitalización":type==="classify"?"¿IT, OT o ambas?":"Reto relámpago"};
    questions=(type==="quiz"?quiz:type==="classify"?classify:rapid).map(x=>({...x})).sort(()=>Math.random()-.5);
    index=0; score=0; locked=false; deadline=Date.now()+45000;
    title.textContent=game.label; intro.textContent=type==="rapid"?"Tienes 45 segundos. Cada acierto suma 10 puntos.":"Cada respuesta correcta suma 10 puntos. ¡A por todas!";
    if(type==="rapid"){rapidEnd=deadline;timer=setInterval(()=>{const el=$("#game-clock");if(el){const left=Math.max(0,Math.ceil((rapidEnd-Date.now())/1000));el.textContent=left+" s";if(left<=0){clearInterval(timer);finish();}}},250);}
    renderQuestion();
  }
  function renderQuestion() {
    if(index>=questions.length || (game.type==="rapid"&&Date.now()>=rapidEnd)){finish();return;}
    locked=false; const q=questions[index];
    area.innerHTML=`<div class="game-status"><span>Pregunta ${index+1}/${questions.length}</span><span id="score-live">${score} puntos</span>${game.type==="rapid"?'<span id="game-clock">45 s</span>':""}</div><div class="game-question"><h3>${escapeHtml(q.q)}</h3><div class="answer-list" id="answer-list"></div></div><p class="game-feedback" id="feedback"></p><button class="btn" id="next-question" hidden>Siguiente →</button>`;
    const list=$("#answer-list");
    let answers;
    if(game.type==="quiz") answers=q.a.map((text,i)=>({text,index:i}));
    else if(game.type==="classify") answers=["IT","OT","AMBAS"].map((text)=>({text,index:text}));
    else answers=[{text:"Verdadero",index:true},{text:"Falso",index:false}];
    answers.sort(()=>Math.random()-.5).forEach(ans=>{const b=document.createElement("button");b.type="button";b.className="answer-btn";b.textContent=ans.text;b.addEventListener("click",()=>answer(b,ans.index,q));list.append(b);});
    $("#next-question").addEventListener("click",()=>{index++;renderQuestion();});
  }
  function answer(button,value,q) {
    if(locked)return;locked=true;
    const correct=value=== (game.type==="quiz"?q.c:game.type==="classify"?q.c:q.c);
    document.querySelectorAll(".answer-btn").forEach(b=>{b.disabled=true;if((game.type==="quiz"&&b.textContent===q.a[q.c])||(game.type==="classify"&&b.textContent===q.c)||(game.type==="rapid"&&((b.textContent==="Verdadero")===q.c)))b.classList.add("correct");});
    if(correct)score+=10;else button.classList.add("incorrect");
    $("#score-live").textContent=score+" puntos";$("#feedback").textContent=(correct?"¡Correcto! ":"No exactamente. ")+q.e;
    $("#next-question").hidden=false;$("#next-question").textContent=index===questions.length-1?"Ver resultado →":"Siguiente →";
    if(game.type==="rapid")setTimeout(()=>{if(locked&&$("#next-question")&&!$("#next-question").hidden){index++;renderQuestion();}},900);
  }
  function finish(){
    clearInterval(timer);
    area.innerHTML=`<h3>Resultado: ${score} puntos</h3><p>Elige un alias para aparecer en el Top 20 compartido.</p><p class="small">Por seguridad, el alias debe incluir letras y al menos un número (por ejemplo, Luna7). No se admiten palabras sueltas como «mesa».</p><form class="player-form" id="score-form"><input id="player-name" maxlength="18" minlength="3" placeholder="Ejemplo: Luna7" required autocomplete="nickname" aria-describedby="nickname-error"><button class="btn" type="submit">Guardar puntuación</button><p id="nickname-error" class="game-feedback" role="alert"></p></form>`;
    $("#score-form").addEventListener("submit",async ev=>{ev.preventDefault();const button=ev.submitter;if(button)button.disabled=true;const ok=await submitScore($("#player-name").value);if(!ok&&button)button.disabled=false;});
  }
  function escapeHtml(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
  document.querySelectorAll("[data-start]").forEach(b=>b.addEventListener("click",()=>start(b.dataset.start)));
  $("#refresh-scores").addEventListener("click",renderScores);
  renderScores();
})();