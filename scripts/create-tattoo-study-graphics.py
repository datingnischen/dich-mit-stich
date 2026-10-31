from PIL import Image,ImageDraw,ImageFont,ImageOps
from pathlib import Path
O=Path('public/magazin/wp-content/uploads/2026/10'); O.mkdir(parents=True,exist_ok=True)
B='#67133c'; S='#f5edf1'; T='#494949'; C='#a8758e'
def f(n,b=False): return ImageFont.truetype('C:/Windows/Fonts/'+('arialbd.ttf' if b else 'arial.ttf'),n)
def text(x,y,t,n=28,b=False,c=T): d.multiline_text((x,y),t,font=f(n,b),fill=c,spacing=7)
def base(h,title,sub):
 global im,d
 im=Image.new('RGB',(1200,h),'white'); d=ImageDraw.Draw(im); d.rectangle((0,0,1200,14),fill=B); text(60,50,title,43,True,B); text(60,115,sub,26)
def save(n): im.save(O/(n+'.webp'),quality=90,method=6)
base(1000,'Tattoos: Wer trägt sie, wer mag sie?','Singles in Deutschland · Anteile in Prozent')
d.rounded_rectangle((60,175,1140,250),15,fill=S); text(80,196,'Gesamt: 14 % tätowiert · 35 % mögen kleine Tattoos',31,True,B)
for x,col,lab in [(60,B,'tätowiert'),(330,C,'kleine Tattoos attraktiv')]:
 d.rectangle((x,285,x+24,309),fill=col); text(x+38,280,lab,27)
for i,(lab,a,b) in enumerate([('18–29',15,44),('30–39',19,42),('40–49',20,43),('50–59',12,32),('ab 60',6,21)]):
 y=350+106*i; text(60,y+14,lab,30,True)
 for j,(v,col) in enumerate([(a,B),(b,C)]):
  yy=y+39*j; d.rounded_rectangle((230,yy,230+17*v,yy+29),5,fill=col); text(245+17*v,yy-3,str(v)+' %',28,True)
text(60,945,'Quelle: Parship/Innofact · Juli 2021 · 3.653 Singles in Deutschland',23)
save('tattoo-singles-deutschland-alter')
base(850,'Wer selbst Tattoos hat, urteilt anders','Tätowierte Menschen wirken auf die Befragten …')
for i,(lab,values) in enumerate([('Befragte ohne Tattoo',[(10.2,'10,2 %'),(35.4,'35,4 %')]),('Befragte mit Tattoo',[(26,'26,0 %'),(5.5,'5,5 %')])]):
 y=190+i*230; text(60,y,lab,32,True,B)
 for j,(v,num) in enumerate(values):
  yy=y+65+j*65; text(60,yy,['attraktiver','weniger attraktiv'][j],27); d.rounded_rectangle((330,yy,330+18*v,yy+37),6,fill=[B,C][j]); text(345+18*v,yy,num,30,True)
d.rounded_rectangle((60,680,1140,752),14,fill=S); text(85,699,'Die meisten sehen keinen Unterschied.',33,True,B)
text(60,793,'Quelle: Morlock & Morlock · Cureus 2023 · 3.033 Erwachsene in den USA',23)
save('tattoos-attraktiv-taetowierte-vs-nicht-taetowierte')
base(1240,'Was Tattoos in Experimenten verändern','Bewertungen und Verhalten · keine Aussagen über einzelne Menschen')
for x,title in [(60,'Tätowierte Männer'),(620,'Tätowierte Frauen')]:
 d.rounded_rectangle((x,180,x+520,985),18,fill=S); text(x+25,210,title,34,True,B)
for i,(sym,lab) in enumerate([('↑','männlicher'),('↑','dominanter'),('↑','aggressiver'),('↑','gesünder aus Frauensicht'),('=','attraktiver aus Frauensicht'),('↓','als Partner und Vater\naus Frauensicht bewertet'),('↑','attraktiver aus Männersicht')]):
 y=290+80*i; text(85,y,sym,40,True,B); text(137,y+4,lab,27)
text(85,905,'Galbarczyk & Ziomkiewicz 2017',23); text(85,940,'2.584 Teilnehmende',23)
for sym,lab,y in [('↑','häufiger und schneller\nvon Männern angesprochen',290),('=','als attraktiv bewertet',410),('↑','stärker und unabhängiger',610),('↓','bei anderen Eigenschaften\nbewertet',710)]:
 text(645,y,sym,40,True,B); text(697,y+4,lab,27)
text(645,495,'Guéguen 2013 · Strandexperiment',23); text(645,830,'Broussard & Harton 2018',23)
text(60,1025,'Gesichtstattoos: in allen Gruppen am schlechtesten\nbewertet (Weiler u. a. 2024).',32,True,B)
text(60,1150,'↑ höher / häufiger    ↓ niedriger    = kein Unterschied',25)
text(60,1195,'Quellen: genannte Studien · eigene Darstellung · Grenzen im Artikel',23)
save('tattoo-experimente-wirkung-maenner-frauen')
