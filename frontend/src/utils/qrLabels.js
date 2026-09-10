import QRCode from 'qrcode';
export function equipmentLink(plant, name, origin = window.location.origin) {
 const url = new URL(name ? `/equipment/${plant}` : `/${plant}`, origin);
 if (name) url.searchParams.set('equipment', name);
 return url.href;
}
export async function createQrLabel(plant, name, origin) {
 const canvas = document.createElement('canvas'); canvas.width=768;canvas.height=1024;
 const ctx=canvas.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,768,1024);
 ctx.fillStyle='#4338ca';ctx.fillRect(0,0,768,90);ctx.fillStyle='#fff';ctx.textAlign='center';ctx.font='bold 28px Arial';
 ctx.fillText(plant.replaceAll('-',' ').toUpperCase(),384,57);
 const title=name||'Plant Dashboard';ctx.fillStyle='#172554';ctx.font='bold 32px Arial';
 const lines=[];let line='';
 for(const word of title.split(/\s+/)){const next=line?`${line} ${word}`:word;if(ctx.measureText(next).width>680&&line){lines.push(line);line=word;}else line=next;}
 if(line)lines.push(line);
 lines.slice(0,3).forEach((text,i)=>ctx.fillText(text,384,142+i*39,680));
 const qr=document.createElement('canvas');
 await QRCode.toCanvas(qr,equipmentLink(plant,name,origin),{width:704,margin:4,errorCorrectionLevel:'M',color:{dark:'#000000',light:'#ffffff'}});
 ctx.drawImage(qr,32,244,704,704);
 ctx.fillStyle='#475569';ctx.font='24px Arial';ctx.fillText(name?'Scan for monthly data & charts':'Scan to open plant dashboard',384,990);
 return canvas.toDataURL('image/png');
}
export async function createLabelsPdf(entries, origin, print = false) {
 const {jsPDF}=await import('jspdf');const pdf=new jsPDF({unit:'mm',format:'a4'});
 for(let i=0;i<entries.length;i++){
  if(i&&i%6===0)pdf.addPage();
  const col=i%2,row=Math.floor((i%6)/2),x=10+col*97,y=10+row*92;
  pdf.setDrawColor(203,213,225);pdf.roundedRect(x,y,93,88,2,2);
  const label=await createQrLabel(entries[i].plant,entries[i].name,origin);
  pdf.addImage(label,'PNG',x+14,y+1,64.5,86,undefined,'FAST');
 }
 if(print)pdf.autoPrint();
 return pdf;
}
