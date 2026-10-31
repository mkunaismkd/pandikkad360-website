const MAX_BODY = 3000;
module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') { res.setHeader('Allow','POST'); return res.status(405).json({error:'Method not allowed'}); }
  const origin = req.headers.origin || '';
  if (origin && !['https://pandikkad360.online','https://www.pandikkad360.online'].includes(origin)) return res.status(403).json({error:'Invalid origin'});
  const key = process.env.RESEND_API_KEY;
  const from = process.env.STORY_FROM_EMAIL;
  if (!key || !from) return res.status(503).json({error:'Submission is temporarily unavailable'});
  const data = req.body || {};
  const name = String(data.name || '').trim(), phone = String(data.phone || '').trim(), email = String(data.email || '').trim(), story = String(data.story || '').trim();
  if (name.length>80 || phone.length>25 || email.length>150 || story.length<1 || story.length>MAX_BODY || (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) return res.status(400).json({error:'Invalid form data'});
  if (String(data.website||'').trim()) return res.status(200).json({ok:true});
  const esc = s => s.replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const fields = [['Name',name||'Not provided'],['Phone',phone||'Not provided'],['Email',email||'Not provided'],['Story / Feedback',story]];
  try {
    const result = await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:'Bearer '+key,'Content-Type':'application/json'},body:JSON.stringify({from,to:['contact@pandikkad360.online'],subject:'Pandikkad 360 | Story / Feedback',text:fields.map(([k,v])=>k+': '+v).join('\n\n'),html:fields.map(([k,v])=>'<p><strong>'+esc(k)+'</strong><br>'+esc(v).replace(/\n/g,'<br>')+'</p>').join(''),...(email?{reply_to:email}:{})})});
    if (!result.ok) { console.error('Resend delivery error',result.status); return res.status(502).json({error:'Could not send message. Please try again.'}); }
    return res.status(200).json({ok:true});
  } catch(e) { console.error('Story submission failed',e); return res.status(502).json({error:'Could not send message. Please try again.'}); }
};