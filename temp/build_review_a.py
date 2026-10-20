import json
import pathlib
import re

ROOT = pathlib.Path('quivro_web/src/data/questions/mcq')
OUT = pathlib.Path('temp')

# ID, field, proposed wording, reason. Originals and source locations are read from the files.
changes = [
    ('bio-easy-007', 'pitanje', 'Koja vrsta životinja polaže jaja i može letjeti?', 'Ptice polažu jaja; „nose jaja“ ovdje je doslovan pogrešan prevod.'),
    ('bio-easy-012', 'pitanje', 'Šta pokriva vanjski dio stabla?', 'Izraz „stablo drveta“ je suvišan.'),
    ('bio-easy-025', 'pitanje', 'Kojom se bojom obično opisuje krzno polarnog medvjeda?', 'Pogrešna konstrukcija uz „koje boje“.'),
    ('bio-easy-027', 'pitanje', 'Koja ptica ne može letjeti i živi u hladnim antarktičkim područjima?', 'Ponavljanje „ptica koja“ otežava čitanje.'),
    ('bio-easy-028', 'pitanje', 'Kako se zovu žabe prije nego što im narastu noge?', '„Kao šta ... počinju život“ nije pravilno pitanje za ponuđeni odgovor.'),
    ('bio-easy-032', 'pitanje', 'Čime se hrani većina odraslih leptira?', 'Glagol se slaže s imenicom „većina“ u jednini.'),
    ('bio-easy-060', 'pitanje', 'Koji dijelovi ljudskog tijela pomažu razgradnji hrane žvakanjem?', 'Odgovor „zubi“ je u množini, a pitanje traži jedan dio.'),
    ('bio-easy-062', 'pitanje', 'Koji veliki morski grabežljivac ima karakterističnu leđnu peraju koja viri iz vode?', '„Okeansko-morski“ je nepravilno i suvišno udvajanje.'),
    ('bio-easy-064', 'pitanje', 'Mužjak koje životinje svake godine odbacuje stare rogove i dobija nove?', 'U izvorniku raste životinja umjesto rogova.'),
    ('bio-easy-083', 'pitanje', 'Koja visoka barska ptica ima jarko ružičasto perje?', 'Pridjev se mora slagati s imenicom „perje“.'),
    ('bio-easy-089', 'pitanje', 'Koji crno-bijeli morski grabežljivac je najveći član porodice delfina?', '„Okeansko-morski“ je nepravilno i suvišno udvajanje.'),
    ('bio-easy-098', 'pitanje', 'Koji insekt ima žuto-crno prugasto tijelo i može ubosti?', 'Ponavljanje „koji insekt koji“.'),
    ('bio-easy-100', 'pitanje', 'Koji sisar se sporo kreće, visi naopačke na tropskim stablima i spava veći dio dana?', '„Sporo pokretni“ je nezgrapna konstrukcija.'),

    ('bio-hard-011', 'pitanje', 'Koja je osobina paunskih škampa-bogomoljki neobično složena u životinjskom svijetu?', 'Izvornik pogrešno pripisuje „složenost“ cijeloj životinji umjesto njenoj osobini.'),
    ('bio-hard-024', 'pitanje', 'Koja australska ptica je poznata po izvanrednoj sposobnosti oponašanja zvukova motornih pila, okidača fotoaparata i glasanja drugih životinja?', 'Izvorni „i drugih vrsta“ nema jasnu vezu s oponašanim zvukovima.'),
    ('bio-hard-031', 'pitanje', 'Koja je riba, poznata kao „živi fosil“, ponovo otkrivena 1938. nakon što se smatralo da je izumrla prije miliona godina?', 'Nepravilno umetnuta apozicija „živi fosil“ i odnosna rečenica.'),
    ('bio-hard-032', 'odgovor 3', 'Oplođuju jajašca izvana u otvorenim vodama', 'Prilog „vanjski“ ne može opisivati glagol „oplođuju“.'),
    ('bio-hard-037', 'pitanje', 'Šta je, u anatomskom smislu, narvalova kljova?', '„Modificirani kljov“ ima pogrešan rod i nejasan odnos prema odgovoru „očnjak“.'),
    ('bio-hard-042', 'odgovor 1', 'Škljocanjem kliješta koja stvaraju kavitacijske mjehuriće', 'Odnosna zamjenica mora se slagati s množinom „kliješta“.'),
    ('bio-hard-062', 'odgovor 1', 'Nema hemoglobina', 'Uz „nema“ ide genitiv.'),
    ('bio-hard-073', 'odgovor 1', 'Mlijeko iz voljke', '„Voljno mlijeko“ pogrešno prevodi naziv sekreta iz ptičje voljke.'),
    ('bio-hard-091', 'pitanje', 'Koja izuzetno kamuflirana grebenska riba se smatra jednom od najotrovnijih riba na svijetu?', 'Tipfeler u riječi „kamuflirana“.'),
    ('bio-hard-096', 'pitanje', 'Koja plosnata riba može dati snažne električne udarce za omamljivanje plijena, za razliku od raža koje koriste otrovne bodlje?', '„Žilca koji“ ne odgovara značenju ni broju u poređenju s ražama.'),
    ('bio-hard-100', 'pitanje', 'Koji dijelovi tijela divovskih i kolosalnih lignji spadaju među najveće zabilježene u životinjskom carstvu?', '„Nosioci najvećih poznatih primjera“ je nejasan doslovni prevod.'),

    ('bio-med-013', 'pitanje', 'Koji organ filtrira otpadne produkte iz krvi da proizvede mokraću?', 'Pravilno je „mokraću“, a ne „mokraču“.'),
    ('bio-med-036', 'pitanje', 'Koji organ je odgovoran za razmjenu kiseonika i ugljen-dioksida kod ljudi?', 'Razmjenjuju se gasovi, ne „razmjena gasova između“ njih.'),
    ('bio-med-044', 'odgovor 4', 'Organizmi bez ćelija', '„Bezelijski“ nije pravilno napisana riječ.'),
    ('bio-med-072', 'odgovor 1', 'Jedan linearni lanac koji prikazuje ko koga jede', 'Nedostaje veza između „lanac“ i zavisne rečenice.'),
    ('bio-med-085', 'odgovor 1', 'Željezo', 'Završno slovo u izvorniku je ćirilično „о“ umjesto latiničnog „o“.'),
    ('bio-med-089', 'pitanje', 'Kako se naziva proces u kojem sjeme počinje klijati i rasti u novu biljku?', 'Odgovor „klijanje“ imenuje proces, a izvornik pita za sjeme.'),
    ('bio-med-105', 'pitanje', 'Koji par čine dva beskičmenjaka?', '„Koji par životinja se oba klasifikuju“ pogrešno veže „oba“ uz „par“.'),
    ('bio-med-106', 'odgovor 2', 'Potkožna masnoća', 'Pravilno je „potkožna“, s glasovnom promjenom d → t.'),
    ('bio-med-110', 'odgovor 1', 'Da odbace staro perje i da im izraste novo', 'Pticama izrasta perje; ptice ne „izrastaju perje“.'),

    ('cartoon-easy-002', 'pitanje', 'U kojem je Disneyjevom filmu Elsa glavni lik?', 'Prisvojni pridjev „Disneyjevom“ slaže se s „filmu“.'),
    ('cartoon-easy-035', 'pitanje', 'Koje životinje odgajaju Tarzana?', 'Odgovor „gorile“ je u množini, a pitanje ima jedninu.'),
    ('cartoon-easy-050', 'pitanje', 'Koji odjevni predmet Donald Duck često nosi i po njemu je prepoznatljiv?', 'Konstrukcija „Po čemu je ... poznat što nosi?“ nije gramatički pravilna.'),
    ('cartoon-easy-081', 'pitanje', 'Kako se zove razigrani rakun, Pocahontasin prijatelj?', 'Izvorni red riječi nejasno povezuje „prijatelj“ i „rakun“.'),

    ('cartoon-hard-032', 'pitanje', 'Jednooka lasica Buck postaje važan lik počevši od kojeg filma Ledenog doba?', 'Pridjev se mora slagati s imenicom ženskog roda „lasica“.'),

    ('cartoon-med-005', 'pitanje', 'Kako se zovu novine u kojima radi Peter Parker?', 'Uz „novine“ ide odnosna zamjenica „kojima“.'),
    ('cartoon-med-015', 'odgovor 1', 'Da njome odleti do Južne Amerike', '„Da je odleti“ nepravilan je spoj zamjenice i glagola.'),
    ('cartoon-med-022', 'pitanje', 'Ko je izvorno posudio glas Woodyju u Priči o igračkama?', '„Glasovao“ znači glasao na izborima, a ne posudio glas liku.'),
    ('cartoon-med-025', 'pitanje', 'U kojem obliku Fiona odlučuje ostati na kraju Shreka?', '„Šta odlučuje ostati“ je neprirodna konstrukcija za pitanje o Fioninom obliku.'),
    ('cartoon-med-034', 'pitanje', 'Šta se Kennyju često dešava u gotovo svakoj epizodi South Parka?', '„Šta se poznato dešava“ nije gramatički prirodna konstrukcija.'),

    ('fam-easy-001', 'pitanje', 'Koji je poznati serijal knjiga napisala J. K. Rowling?', 'Pogrešan padež „koje poznatog“ i muški oblik „autor“ za ženu.'),
    ('fam-easy-005', 'pitanje', 'Po pisanju kakvih knjiga je poznat Stephen King?', 'Izvorni red riječi pogrešno spaja „kakve knjige“ s „po pisanju“.'),
    ('fam-easy-011', 'pitanje', 'Koje dvije kompanije je Elon Musk poznat po tome što ih vodi?', '„Koji par kompanija ... po vođenju“ je nejasan red riječi.'),
    ('fam-easy-027', 'pitanje', 'Po kojem je zanimanju Pablo Picasso bio svjetski poznat?', '„Kao šta“ nije prirodna upitna konstrukcija za zanimanje.'),
    ('fam-easy-041', 'odgovor 3', 'Skijaškog skakanja', 'Nedostaje slovo „š“.'),
    ('fam-easy-046', 'pitanje', 'Po kojem je zanimanju slavan William Shakespeare?', '„Kao šta se ... slavi?“ nije pravilna upitna konstrukcija.'),
    ('fam-easy-051', 'pitanje', 'Po kojem je zanimanju Vincent van Gogh bio poznat?', '„Kao šta“ nije prirodna upitna konstrukcija za zanimanje.'),
    ('fam-easy-055', 'pitanje', 'Plafon koje je poznate građevine oslikao Michelangelo?', 'Direktni objekt glagola „oslikao“ treba biti u akuzativu: „plafon“.'),
    ('fam-easy-056', 'pitanje', 'Po kojoj je ulozi Aristotel bio poznat u drevnoj Grčkoj?', '„Kao šta“ nije prirodna upitna konstrukcija za ponuđene uloge.'),
    ('fam-easy-059', 'pitanje', 'Po kojem je zanimanju Wolfgang Amadeus Mozart bio poznat?', '„Kao šta“ nije prirodna upitna konstrukcija za zanimanje.'),
    ('fam-easy-066', 'pitanje', 'Po kojoj se ulozi pamti Marco Polo?', '„Kao šta se pamti“ nije prirodna upitna konstrukcija za ponuđene uloge.'),
    ('fam-easy-100', 'pitanje', 'Charlie Chaplin je bio legendarna zvijezda kojih filmova?', 'Pitanje u jednini „kojeg tipa filma“ ne odgovara odgovorima u genitivu množine.'),

    ('fam-hard-001', 'pitanje', 'Koju je naučnu tabelu Dmitri Mendelejev stvorio i po njoj postao poznat?', '„Koju ... najpoznatiji po stvaranju“ miješa objekt pitanja i prijedložnu konstrukciju.'),
    ('fam-hard-005', 'pitanje', 'U kojem muzeju je I. M. Pei dizajnirao staklenu ulaznu piramidu?', '„Ulaznica“ znači karta za ulaz, ne arhitektonski ulaz.'),
    ('fam-hard-006', 'pitanje', 'Ko se prvi popeo na svih 14 planina viših od 8.000 metara?', 'Uz „popeti se“ potreban je povratni oblik i prijedlog „na“.'),
    ('fam-hard-007', 'pitanje', 'Ko se prvi popeo na Mount Everest bez dodatnog kisika?', 'Uz „popeti se“ potreban je povratni oblik i prijedlog „na“.'),
    ('fam-hard-009', 'pitanje', 'Kojem sistemu rasne segregacije se Nelson Mandela suprotstavljao decenijama?', 'Izvorni red „je decenijama se“ razdvaja povratnu zamjenicu od glagola.'),
    ('fam-hard-010', 'pitanje', 'Koji je serijal proslavio Johnnyja Knoxvillea kao tvorca?', '„Po čemu ... najpoznatiji kao tvorac“ nije pravilna upitna konstrukcija.'),
    ('fam-hard-028', 'odgovor 1', 'Rendgenskog skenera', 'Engleski izraz „X-ray“ ostao je nepreveden.'),
    ('fam-hard-047', 'pitanje', 'Koji poznati pisac je imao gavrana po imenu Grip?', 'Tačan odgovor Charles Dickens bio je pisac, ne naučnik.'),
    ('fam-hard-072', 'odgovor 4', 'Rozetski kamen', 'Naziv artefakta „Rosetta Stone“ pogrešno je preveden kao „Rosetta kamen“.'),
    ('fam-hard-082', 'pitanje', 'Euklidovi Elementi su sistematizovali dokaze u kojoj grani matematike?', 'Naslov djela je djelimično ostao na engleskom.'),
    ('fam-hard-097', 'odgovor 4', 'Najlonskih vlakana', 'Pridjev izveden od „najlon“ treba biti u genitivu množine.'),
    ('fam-hard-099', 'odgovor 1', 'Panamski kanal', 'Naziv vodnog puta na bosanskom glasi „Panamski kanal“.'),

    ('fam-med-002', 'pitanje', 'Ko je bio prvi čovjek koji se popeo na El Capitan u Yosemiteu bez užadi i zaštitne opreme?', 'Uz „popeti se“ potreban je povratni oblik i prijedlog „na“.'),
    ('fam-med-020', 'pitanje', 'Koji se drevni ep pripisuje Homeru?', 'Zamjenica i pridjev moraju se slagati s imenicom muškog roda „ep“.'),
    ('fam-med-064', 'pitanje', 'Za koji tim Formule 1 je Lewis Hamilton vozio kada je osvojio svoju prvu titulu?', 'Naziv takmičenja traži genitiv: „tim Formule 1“.'),
    ('fam-med-070', 'pitanje', 'Otkrićima kojih fosila je Mary Anning postala poznata?', '„Po čemu ... zbog svojih otkrića“ nepotrebno udvaja uzrok i čini pitanje nejasnim.'),

    ('food-easy-007', 'pitanje', 'Kako se zove kratka, jaka kafa?', 'Engleski „shot“ nije uklopljen u bosansku rečenicu.'),
    ('food-easy-012', 'pitanje', 'Koje francusko pecivo je lisnato i u obliku polumjeseca?', 'Pogrešan rod upitne zamjenice uz „pecivo“.'),
    ('food-easy-016', 'pitanje', 'Koje se jelo za doručak peče u željeznom kalupu s karakterističnim uzorkom i često služi sa sirupom?', '„Koji doručak“ je neprirodna konstrukcija, a kalup treba opisati jasnije.'),
    ('food-easy-034', 'pitanje', 'Koje veliko voće sadrži mnogo vode i ljeti se često jede narezano na kriške?', '„Voće je uglavnom voda“ i „ljetne kriške“ su nepravilne formulacije.'),
    ('food-easy-043', 'pitanje', 'Koji se hladni napitak priprema miješanjem sladoleda ili mlijeka s aromama dok ne postane kremast?', 'Napitak se ne „miješa“ sam; doslovni prevod „gladak“ nije prikladan.'),
    ('food-easy-056', 'pitanje', 'Koje se japansko jelo priprema od morskih plodova ili povrća obloženih laganim tijestom i prženih u dubokom ulju?', '„Duboko prženo“ je doslovni prevod; rečenici nedostaje jasna glagolska veza.'),
    ('food-easy-065', 'pitanje', 'Koji namaz nastaje mućenjem vrhnja dok ne postane čvrsto?', 'Maslac nastaje mućenjem vrhnja, ne običnim „miješanjem“.'),
    ('food-easy-076', 'pitanje', 'S kojom se kuhinjom najviše povezuju kroasani, bageti i crème brûlée?', 'Subjekt zahtijeva nominativ množine „kroasani“.'),
    ('food-easy-078', 'pitanje', 'Koje se pecivo u obliku prstena često kuha prije pečenja?', 'Pogrešan rod upitne zamjenice uz „pecivo“.'),
    ('food-easy-081', 'pitanje', 'Koji Burger King sendvič je poznat po pljeskavici pečenoj na plamenu?', 'Engleski izraz „flame-grilled“ ostao je nepreveden.'),
    ('food-easy-082', 'pitanje', 'Koji lanac brze hrane je najpoznatiji po sendvičima u dugačkom pecivu koji se pripremaju po narudžbi?', 'Engleski „submarine“ nije uklopljen u bosansku rečenicu.'),
]

files = sorted(ROOT.glob('*/*.ts'))[:10]
records = {}
coverage = {}
for path in files:
    source = path.read_text(encoding='utf-8')
    ids = list(re.finditer(r"id: '([^']+)'", source))
    coverage[path.as_posix()] = len(ids)
    for i, match in enumerate(ids):
        start = match.start()
        end = ids[i + 1].start() if i + 1 < len(ids) else len(source)
        chunk = source[start:end]
        fields = []
        for bs in re.finditer(r"bs: '((?:\\.|[^'])*)'", chunk):
            fields.append((bs.group(1).replace("\\'", "'"), source.count('\n', 0, start + bs.start()) + 1))
        assert len(fields) == 5, (path, match.group(1), fields)
        records[match.group(1)] = (path.as_posix(), fields)

out = []
for id_, field, proposal, reason in changes:
    path, fields = records[id_]
    index = 0 if field == 'pitanje' else int(field.split()[1])
    original, line = fields[index]
    out.append(dict(id=id_, file=path, line=line, field=field, original=original,
                    proposal=proposal, reason=reason, certainty='sigurno'))

assert len(out) == len({(x['id'], x['field']) for x in out})
OUT.mkdir(exist_ok=True)
(OUT / 'review_a.json').write_text(json.dumps(out, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')

with (OUT / 'review_a.md').open('w', encoding='utf-8') as report:
    report.write('# Jezička revizija MCQ pitanja: dio A\n\n')
    report.write(f'Pregledano {sum(coverage.values())} pitanja u {len(files)} datoteka. Predloženo {len(out)} pojedinačnih ispravki. Izvorni `.ts` fajlovi nisu mijenjani.\n\n')
    report.write('## Obuhvat\n\n')
    for file, count in coverage.items():
        report.write(f'- `{file}` — {count} pitanja\n')
    report.write('\n## Prijedlozi\n\n')
    for x in out:
        report.write(f"### {x['id']} — {x['field']}\n\n")
        report.write(f"- Lokacija: `{x['file']}:{x['line']}`\n")
        report.write(f"- Izvorno: {x['original']}\n")
        report.write(f"- Prijedlog: {x['proposal']}\n")
        report.write(f"- Razlog: {x['reason']}\n\n")
    report.write('## Pitanje za provjeru činjenica\n\n')
    report.write('- `fam-hard-073`: tvrdnja da je jedan glumac osvojio dva Oscara za istog lika ne odgovara označenom odgovoru (Anthony Hopkins kao Hannibal Lecter). Potrebno je provjeriti i zamijeniti premisu ili pitanje; ovo nije samo jezička ispravka.\n')
