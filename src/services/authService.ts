import { 
 signInWithEmailAndPassword, 
 createUserWithEmailAndPassword, 
 signOut 
} from'firebase/auth';
import { auth } from'./firebase';

const parseUserAgent = (ua: string) => {
  let browser = "Desconhecido";
  if (ua.includes("Firefox")) browser = "Firefox";
  else if (ua.includes("Edg")) browser = "Edge";
  else if (ua.includes("Chrome")) browser = "Chrome";
  else if (ua.includes("Safari")) browser = "Safari";
  
  let os = "Desconhecido";
  if (ua.includes("Win")) os = "Windows";
  else if (ua.includes("Mac")) os = "MacOS";
  else if (ua.includes("Linux")) os = "Linux";
  else if (ua.includes("Android")) os = "Android";
  else if (ua.includes("like Mac")) os = "iOS";
  
  let device = "Desktop";
  if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/i.test(ua)) {
    device = "Celular";
  } else if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
    device = "Tablet";
  } else if (/(macintosh|mac os x)/i.test(ua) || /(windows|win32)/i.test(ua)) {
    device = "Desktop/Notebook";
  }
  
  return { browser, os, device };
};

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const sendLoginNotification = async (email: string, displayName: string | null, attempt = 1): Promise<void> => {
  try {
    console.log(`[EmailJS] Preparando envio do e-mail (Tentativa ${attempt})...`);
    const { browser, os, device } = parseUserAgent(navigator.userAgent);
    const date = new Date().toLocaleDateString('pt-BR');
    const time = new Date().toLocaleTimeString('pt-BR');
    
    let ip = "Desconhecido";
    try {
      const ipResponse = await fetch('https://api.ipify.org?format=json');
      const ipData = await ipResponse.json();
      ip = ipData.ip;
    } catch (e) {
      console.warn("[EmailJS] Aviso: Não foi possível obter o IP do usuário.", e);
    }

    const userName = displayName || email.split('@')[0];

    // 3 & 4. Validação rigorosa das variáveis de ambiente
    const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID;
    const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
    const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

    const missingVars: string[] = [];
    if (!serviceId) missingVars.push('VITE_EMAILJS_SERVICE_ID');
    if (!templateId) missingVars.push('VITE_EMAILJS_TEMPLATE_ID');
    if (!publicKey) missingVars.push('VITE_EMAILJS_PUBLIC_KEY');

    if (missingVars.length > 0) {
      console.warn(`❌ EmailJS não configurado.\nVariáveis ausentes:\n- ${missingVars.join('\\n- ')}`);
      return;
    }

    // 11. Validação dos dados enviados para o template
    const templateParams = {
      to_email: email,
      user_name: userName,
      access_date: date,
      access_time: time,
      access_ip: ip,
      access_browser: browser,
      access_os: os,
      access_device: device
    };

    const emptyFields = Object.entries(templateParams).filter(([_, value]) => !value);
    if (emptyFields.length > 0) {
      console.warn(`[EmailJS] Aviso: Os seguintes campos estão vazios no envio do template: ${emptyFields.map(([k]) => k).join(', ')}`);
    }

    const payload = {
      service_id: serviceId,
      template_id: templateId,
      user_id: publicKey,
      template_params: templateParams
    };

    console.log("[EmailJS] Dados enviados:", { ...payload, user_id: '***' }); // Omitindo info sensível

    const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    console.log(`[EmailJS] Resposta do EmailJS recebida. Status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Erro ao enviar e-mail\nStatus: ${response.status}\nMensagem/Detalhes: ${errorText}\nDados:`, { ...payload, user_id: '***' });
      
      // 10. Retry para erros de servidor ou Too Many Requests (429, 500, 502, 503, 504)
      if ([429, 500, 502, 503, 504].includes(response.status) && attempt < 3) {
        console.log(`[EmailJS] Erro temporário. Tentando novamente em 2 segundos... (Tentativa ${attempt + 1}/3)`);
        await delay(2000);
        return sendLoginNotification(email, displayName, attempt + 1);
      }
      return;
    }

    console.log("✅ [EmailJS] E-mail enviado com sucesso.");
  } catch (error: any) {
    console.error(`❌ Erro de rede ou exceção inesperada ao enviar notificação de login:`, error.message || error);
    
    // 10. Retry para falhas de rede (fetch throws error)
    if (attempt < 3) {
      console.log(`[EmailJS] Erro de rede. Tentando novamente em 2 segundos... (Tentativa ${attempt + 1}/3)`);
      await delay(2000);
      return sendLoginNotification(email, displayName, attempt + 1);
    }
  }
};

export const loginWithEmail = async (email: string, password: string) => {
 try {
 console.log("[Login] Login iniciado...");
 const userCredential = await signInWithEmailAndPassword(auth, email, password);
 console.log("[Login] Login aprovado no provedor.");
 console.log("[Login] Usuário autenticado:", userCredential.user.email);
 
 // Dispara a notificação de forma assíncrona, sem bloquear o login
 sendLoginNotification(userCredential.user.email || email, userCredential.user.displayName).catch(e => console.error("[EmailJS] Falha crítica não tratada:", e));

 return userCredential.user;
 } catch (error) {
 console.error("❌ [Login] Falha no login:", error);
 throw error;
 }
};

export const registerWithEmail = async (email: string, password: string) => {
 try {
 const userCredential = await createUserWithEmailAndPassword(auth, email, password);
 return userCredential.user;
 } catch (error) {
 throw error;
 }
};

export const logoutUser = async () => {
 try {
 await signOut(auth);
 } catch (error) {
 throw error;
 }
};
