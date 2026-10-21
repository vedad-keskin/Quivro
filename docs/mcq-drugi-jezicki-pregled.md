# Drugi pregled MCQ pitanja i odgovora — bosanski i engleski

Skenirano je stanje svih **30 datoteka**, **3.091 pitanja** i **12.364 ponuđena odgovora** u oba jezika. Nalazi su ručno provjereni u kontekstu pitanja, odgovora i označenog tačnog odgovora. Svih **77 ispravki za 72 pitanja** primijenjeno je u izvornim `.ts` datotekama nakon odobrenja. Prethodni dokument nije prepisan.

Svaka ispravka ima ID, jezik, polje i vezu na tačnu liniju. Označena kućica znači da je ispravka primijenjena. Indeksi tačnih odgovora ostali su isti.

## Značenje i tačnost pitanja (7 polja)

Ovdje originalna formulacija ne odgovara označenom tačnom odgovoru ili provjerenoj činjenici. Za činjenične ispravke dodani su izvori.

- [x] **bio-easy-013 · EN pitanje** ([biology/easy.ts:190](../quivro_web/src/data/questions/mcq/biology/easy.ts#L190))
  - Prije: How many pulmonary lobes does a healthy human usually have?
  - Primijenjeno: How many lungs does a healthy human usually have?
  - Razlog: Englesko „pulmonary lobes“ znači plućni režnjevi (ukupno pet), a označeni odgovor 2 i bosanski tekst odnose se na dva plućna krila.
  - Izvor: [provjera činjenice 1](https://www.nhlbi.nih.gov/health/lungs/respiratory-system)

- [x] **fam-hard-073 · EN pitanje** ([famous/hard.ts:1234](../quivro_web/src/data/questions/mcq/famous/hard.ts#L1234))
  - Prije: Which actor became the first person to win two Oscars for playing the same character?
  - Primijenjeno: Which actor won an Oscar for portraying Hannibal Lecter?
  - Razlog: Anthony Hopkins nije dobio dva Oscara za istog lika: nagrađen je za The Silence of the Lambs i The Father. Izvorno pitanje nema tačan odgovor.
  - Izvor: [provjera činjenice 1](https://www.oscars.org/oscars/ceremonies/1992/memorable-moments), [provjera činjenice 2](https://www.oscars.org/oscars/ceremonies/embed/2021)

- [x] **fam-hard-073 · BS pitanje** ([famous/hard.ts:1235](../quivro_web/src/data/questions/mcq/famous/hard.ts#L1235))
  - Prije: Koji glumac je postao prvi koji je osvojio dva Oscara za igranje istog lika?
  - Primijenjeno: Koji je glumac osvojio Oscara za ulogu Hannibala Lectera?
  - Razlog: Uskladiti s ispravljenim engleskim pitanjem; postojeći označeni odgovor ostaje tačan.
  - Izvor: [provjera činjenice 1](https://www.oscars.org/oscars/ceremonies/embed/2021)

- [x] **geo-easy-105 · EN pitanje** ([geography/easy.ts:1487](../quivro_web/src/data/questions/mcq/geography/easy.ts#L1487))
  - Prije: What is the deepest point in the world’s oceans called?
  - Primijenjeno: Which ocean trench contains the deepest known point in the world’s oceans?
  - Razlog: Najdublja tačka zove se Challenger Deep, a nalazi se u Marijanskom rovu; ponuđeni odgovor je rov, ne tačka.
  - Izvor: [provjera činjenice 1](https://oceanexplorer.noaa.gov/ocean-fact/ocean-depth/)

- [x] **geo-easy-105 · BS pitanje** ([geography/easy.ts:1488](../quivro_web/src/data/questions/mcq/geography/easy.ts#L1488))
  - Prije: Kako se zove najdublja tačka u svjetskim okeanima?
  - Primijenjeno: U kojem se okeanskom rovu nalazi najdublja poznata tačka svjetskih okeana?
  - Razlog: Uskladiti pitanje s ponuđenim odgovorom „Marijanski rov“.
  - Izvor: [provjera činjenice 1](https://oceanexplorer.noaa.gov/ocean-fact/ocean-depth/)

- [x] **hist-hard-027 · EN pitanje** ([history/hard.ts:414](../quivro_web/src/data/questions/mcq/history/hard.ts#L414))
  - Prije: At which railway station did World War I officially end with the Armistice in 1918?
  - Primijenjeno: Near which French town was the 1918 Armistice signed?
  - Razlog: Primirje je potpisano u vagonu izvan Compiègnea, a ne na željezničkoj stanici; pitanje ne treba vezivati za „zvanični kraj“ rata.
  - Izvor: [provjera činjenice 1](https://www.archives.gov/publications/prologue/1999/fall/gold-star-mothers.html)

- [x] **hist-hard-027 · BS pitanje** ([history/hard.ts:415](../quivro_web/src/data/questions/mcq/history/hard.ts#L415))
  - Prije: Na kojoj željezničkoj stanici je primirjem 1918. zvanično okončan Prvi svjetski rat?
  - Primijenjeno: U blizini kojeg je francuskog grada potpisano primirje 1918. godine?
  - Razlog: Uskladiti s mjestom potpisivanja i ispravljenim engleskim pitanjem.
  - Izvor: [provjera činjenice 1](https://www.archives.gov/publications/prologue/1999/fall/gold-star-mothers.html)

## Pojedinačne jezičke i tipografske ispravke (22 polja)

- [x] **bio-easy-022 · BS pitanje** ([biology/easy.ts:327](../quivro_web/src/data/questions/mcq/biology/easy.ts#L327))
  - Prije: Koja životinja se često naziva „kraljem džungle"?
  - Primijenjeno: Koja životinja se često naziva „kraljem džungle“?
  - Razlog: Otvoreni bosanski navodnik „ zatvoren je ravnim engleskim navodnikom.

- [x] **bio-easy-074 · BS pitanje** ([biology/easy.ts:1106](../quivro_web/src/data/questions/mcq/biology/easy.ts#L1106))
  - Prije: Koji mali sisar ima tamnu „masku" oko očiju i prugasti rep?
  - Primijenjeno: Koji mali sisar ima tamnu „masku“ oko očiju i prugasti rep?
  - Razlog: Uskladiti par navodnika.

- [x] **bio-med-056 · BS pitanje** ([biology/medium.ts:837](../quivro_web/src/data/questions/mcq/biology/medium.ts#L837))
  - Prije: Koja endokrina žlijezda se često naziva „glavnom žlijezdom" jer kontroliše druge žlijezde?
  - Primijenjeno: Koja endokrina žlijezda se često naziva „glavnom žlijezdom“ jer kontroliše druge žlijezde?
  - Razlog: Uskladiti par navodnika.

- [x] **bio-med-057 · BS pitanje** ([biology/medium.ts:852](../quivro_web/src/data/questions/mcq/biology/medium.ts#L852))
  - Prije: Koji hormon pokreće reakciju „bori se ili bježi" u stresnim situacijama?
  - Primijenjeno: Koji hormon pokreće reakciju „bori se ili bježi“ u stresnim situacijama?
  - Razlog: Uskladiti par navodnika.

- [x] **bio-hard-052 · BS pitanje** ([biology/hard.ts:759](../quivro_web/src/data/questions/mcq/biology/hard.ts#L759))
  - Prije: Po proizvodnji čega u velikim količinama su sljepulje poznate kao odbrambeni mehanizam?
  - Primijenjeno: Koju supstancu sljepulje proizvode u velikim količinama kao odbrambeni mehanizam?
  - Razlog: Izvorni red riječi i veza „poznate kao odbrambeni mehanizam“ nisu prirodni; označeni odgovor je sluz.

- [x] **bio-med-058 · BS pitanje** ([biology/medium.ts:867](../quivro_web/src/data/questions/mcq/biology/medium.ts#L867))
  - Prije: Gdje u tijelu se proizvodi većina krvnih ćelija?
  - Primijenjeno: Gdje se u tijelu proizvodi većina krvnih ćelija?
  - Razlog: Povratnu riječ „se“ treba postaviti uz upitni prilog.

- [x] **fam-easy-090 · BS pitanje** ([famous/easy.ts:1403](../quivro_web/src/data/questions/mcq/famous/easy.ts#L1403))
  - Prije: Osim što je bio jedan od osnivača SAD-a, kao šta je još bio poznat Benjamin Franklin?
  - Primijenjeno: Po kojem je još zanimanju bio poznat Benjamin Franklin, jedan od osnivača SAD-a?
  - Razlog: „Kao šta“ nije prirodna upitna konstrukcija za ponuđeni odgovor „Izumitelj“.

- [x] **food-hard-021 · BS pitanje** ([food/hard.ts:351](../quivro_web/src/data/questions/mcq/food/hard.ts#L351))
  - Prije: Koji desert, sa hrskavom korom od meringe prelivenom šlagom i voćem, dobio je ime po balerini?
  - Primijenjeno: Koji je desert s hrskavom korom od meringe, prelivenom šlagom i voćem, dobio ime po balerini?
  - Razlog: Popravljen red pomoćnog glagola i nepotreban zarez poslije riječi „desert“.

- [x] **islam-easy-072 · EN odgovor 4** ([islam/easy.ts:1060](../quivro_web/src/data/questions/mcq/islam/easy.ts#L1060))
  - Prije: Touching a saliva of a dog
  - Primijenjeno: Touching a dog’s saliva
  - Razlog: „A saliva“ je nepravilan oblik jer je „saliva“ nebrojiva imenica.

- [x] **movie-med-044 · BS pitanje** ([movies/medium.ts:742](../quivro_web/src/data/questions/mcq/movies/medium.ts#L742))
  - Prije: Better Call Saul je prequel kojoj seriji?
  - Primijenjeno: Kojoj seriji prethodi radnja serije Better Call Saul?
  - Razlog: Engleski „prequel“ može se jasno izraziti na bosanskom.

- [x] **movie-med-047 · BS pitanje** ([movies/medium.ts:793](../quivro_web/src/data/questions/mcq/movies/medium.ts#L793))
  - Prije: Kojoj seriji je House of the Dragon prequel?
  - Primijenjeno: Kojoj seriji prethodi radnja serije House of the Dragon?
  - Razlog: Engleski „prequel“ može se jasno izraziti na bosanskom.

- [x] **sport-hard-064 · BS pitanje** ([sports/hard.ts:1010](../quivro_web/src/data/questions/mcq/sports/hard.ts#L1010))
  - Prije: Koji bodybuilder je poznat pod nadimkom "Austrian Oak"?
  - Primijenjeno: Koji je bodibilder poznat pod nadimkom „Austrian Oak“?
  - Razlog: Zamijeniti neprevedeni naziv zanimanja i postaviti „je“ na prirodno mjesto.

- [x] **sport-med-015 · EN pitanje** ([sports/medium.ts:227](../quivro_web/src/data/questions/mcq/sports/medium.ts#L227))
  - Prije: In basketball, how many personal fouls usually foul a player out of an NBA game?
  - Primijenjeno: In the NBA, how many personal fouls cause a player to foul out?
  - Razlog: „How many personal fouls ... foul a player out“ nepotrebno ponavlja „foul“ i zvuči nespretno.

- [x] **sport-med-094 · BS pitanje** ([sports/medium.ts:1479](../quivro_web/src/data/questions/mcq/sports/medium.ts#L1479))
  - Prije: U Formuli 1, čemu služi „safety car“?
  - Primijenjeno: U Formuli 1, čemu služi sigurnosno vozilo?
  - Razlog: Naziv „safety car“ u bosanskom pitanju može se jasno prevesti.

- [x] **tech-easy-076 · BS pitanje** ([technology/easy.ts:1159](../quivro_web/src/data/questions/mcq/technology/easy.ts#L1159))
  - Prije: Koji power-up Pac-Manu privremeno omogućava da jede duhove?
  - Primijenjeno: Koji predmet Pac-Manu privremeno omogućava da jede duhove?
  - Razlog: „Power-up“ se ovdje može zamijeniti domaćom riječju bez gubitka značenja.

- [x] **tech-easy-078 · BS pitanje** ([technology/easy.ts:1189](../quivro_web/src/data/questions/mcq/technology/easy.ts#L1189))
  - Prije: U Mario Kartu, šta mushroom power-up uglavnom radi?
  - Primijenjeno: U igri Mario Kart, šta gljiva uglavnom radi?
  - Razlog: Mješavina „mushroom power-up“ ostala je na engleskom; pitanje može imenovati predmet na bosanskom.

- [x] **tech-hard-101 · BS pitanje** ([technology/hard.ts:1510](../quivro_web/src/data/questions/mcq/technology/hard.ts#L1510))
  - Prije: Olofmeisterov poznati “Olofboost” play dogodio se na kojoj mapi?
  - Primijenjeno: Na kojoj se mapi dogodio Olofmeisterov poznati potez „Olofboost“?
  - Razlog: „Play“ je neprevedena engleska riječ u bosanskoj rečenici.

- [x] **tech-med-014 · EN odgovor 3** ([technology/medium.ts:209](../quivro_web/src/data/questions/mcq/technology/medium.ts#L209))
  - Prije: A user email password
  - Primijenjeno: A user’s email password
  - Razlog: „A user email password“ je nejasan niz imenica; prisvojni oblik pokazuje čija je lozinka.

- [x] **tech-med-014 · BS odgovor 3** ([technology/medium.ts:209](../quivro_web/src/data/questions/mcq/technology/medium.ts#L209))
  - Prije: Korisničku email lozinku
  - Primijenjeno: Lozinku korisničkog računa e-pošte
  - Razlog: „Korisničku email lozinku“ je neprirodan spoj; uskladiti s jasnijim engleskim odgovorom.

- [x] **tech-med-107 · BS odgovor 4** ([technology/medium.ts:1675](../quivro_web/src/data/questions/mcq/technology/medium.ts#L1675))
  - Prije: Automatski povećava brzinu downloada
  - Primijenjeno: Automatski povećava brzinu preuzimanja
  - Razlog: „Downloada“ je nepotrebna engleska riječ u bosanskom odgovoru.

- [x] **tech-med-122 · BS pitanje** ([technology/medium.ts:1919](../quivro_web/src/data/questions/mcq/technology/medium.ts#L1919))
  - Prije: Koja Sony kućna konzola je prva imala ugrađen DVD player?
  - Primijenjeno: Koja je Sonyjeva kućna konzola prva imala ugrađen DVD čitač?
  - Razlog: „DVD player“ zamijenjen je bosanskim izrazom; ujedno je popravljen red riječi.

- [x] **hist-med-090 · EN odgovor 3** ([history/medium.ts:1429](../quivro_web/src/data/questions/mcq/history/medium.ts#L1429))
  - Prije:  Gao
  - Primijenjeno: Gao
  - Razlog: Na početku odgovora stoji suvišan razmak.

## Red pomoćnog glagola u bosanskim pitanjima (48 pitanja)

Kod sljedećih pitanja konstrukcija poput „Koji engleski kralj bio je…“ zvuči neprirodno; prijedlog pomjera „je“ odmah iza upitne riječi. Svaki red je posebno provjeren prema sadašnjem tekstu i odgovorima.

- [x] **fam-hard-008 · BS pitanje** ([famous/hard.ts:130](../quivro_web/src/data/questions/mcq/famous/hard.ts#L130))
  - Prije: Koji anime film u režiji Makota Shinkaija postao je jedan od najuspješnijih japanskih filmova?
  - Primijenjeno: Koji je anime film u režiji Makota Shinkaija postao jedan od najuspješnijih japanskih filmova?
  - Razlog: Pomjeriti pomoćni glagol uz upitnu riječ; zadržati isti smisao i odgovor.

- [x] **hist-hard-006 · BS pitanje** ([history/hard.ts:87](../quivro_web/src/data/questions/mcq/history/hard.ts#L87))
  - Prije: Koji engleski kralj bio je prisiljen pečatirati Magna Cartu?
  - Primijenjeno: Koji je engleski kralj bio prisiljen pečatirati Magna Cartu?
  - Razlog: Pomjeriti pomoćni glagol uz upitnu riječ; zadržati isti smisao i odgovor.

- [x] **hist-hard-017 · BS pitanje** ([history/hard.ts:260](../quivro_web/src/data/questions/mcq/history/hard.ts#L260))
  - Prije: Koja bitka 1815. označila je Napoleonov konačni poraz?
  - Primijenjeno: Koja je bitka 1815. označila Napoleonov konačni poraz?
  - Razlog: Pomjeriti pomoćni glagol uz upitnu riječ; zadržati isti smisao i odgovor.

- [x] **hist-hard-020 · BS pitanje** ([history/hard.ts:307](../quivro_web/src/data/questions/mcq/history/hard.ts#L307))
  - Prije: Koji engleski kralj pobijedio je u bitci kod Agincourta 1415.?
  - Primijenjeno: Koji je engleski kralj pobijedio u bitci kod Agincourta 1415.?
  - Razlog: Pomjeriti pomoćni glagol uz upitnu riječ; zadržati isti smisao i odgovor.

- [x] **hist-hard-023 · BS pitanje** ([history/hard.ts:354](../quivro_web/src/data/questions/mcq/history/hard.ts#L354))
  - Prije: Koji kartaginski general prešao je Alpe da napadne Italiju u Drugom punskom ratu?
  - Primijenjeno: Koji je kartaginski general prešao Alpe da napadne Italiju u Drugom punskom ratu?
  - Razlog: Pomjeriti pomoćni glagol uz upitnu riječ; zadržati isti smisao i odgovor.

- [x] **hist-hard-024 · BS pitanje** ([history/hard.ts:369](../quivro_web/src/data/questions/mcq/history/hard.ts#L369))
  - Prije: Koji rimski car legalizovao je hrišćanstvo Milanskim ediktom?
  - Primijenjeno: Koji je rimski car legalizovao hrišćanstvo Milanskim ediktom?
  - Razlog: Pomjeriti pomoćni glagol uz upitnu riječ; zadržati isti smisao i odgovor.

- [x] **hist-hard-026 · BS pitanje** ([history/hard.ts:399](../quivro_web/src/data/questions/mcq/history/hard.ts#L399))
  - Prije: Koji franački kralj okrunjen je za svetog rimskog cara od pape Lava III 800.?
  - Primijenjeno: Koji je franački kralj okrunjen za svetog rimskog cara od pape Lava III 800.?
  - Razlog: Pomjeriti pomoćni glagol uz upitnu riječ; zadržati isti smisao i odgovor.

- [x] **hist-hard-030 · BS pitanje** ([history/hard.ts:465](../quivro_web/src/data/questions/mcq/history/hard.ts#L465))
  - Prije: Koji ruski car osnovao je Sankt Peterburg kao „prozor u Evropu“?
  - Primijenjeno: Koji je ruski car osnovao Sankt Peterburg kao „prozor u Evropu“?
  - Razlog: Pomjeriti pomoćni glagol uz upitnu riječ; zadržati isti smisao i odgovor.

- [x] **hist-hard-036 · BS pitanje** ([history/hard.ts:559](../quivro_web/src/data/questions/mcq/history/hard.ts#L559))
  - Prije: Koja opsada 1683. označila je prekretnicu protiv osmanskog širenja u Srednju Evropu?
  - Primijenjeno: Koja je opsada 1683. označila prekretnicu protiv osmanskog širenja u Srednju Evropu?
  - Razlog: Pomjeriti pomoćni glagol uz upitnu riječ; zadržati isti smisao i odgovor.

- [x] **hist-hard-039 · BS pitanje** ([history/hard.ts:606](../quivro_web/src/data/questions/mcq/history/hard.ts#L606))
  - Prije: Koji japanski šogunat vladao je iz Eda od 1603. do 1868.?
  - Primijenjeno: Koji je japanski šogunat vladao iz Eda od 1603. do 1868.?
  - Razlog: Pomjeriti pomoćni glagol uz upitnu riječ; zadržati isti smisao i odgovor.

- [x] **hist-hard-040 · BS pitanje** ([history/hard.ts:621](../quivro_web/src/data/questions/mcq/history/hard.ts#L621))
  - Prije: Koje korejsko kraljevstvo izumilo je pismo hangul pod kraljem Sejongom?
  - Primijenjeno: Koje je korejsko kraljevstvo izumilo pismo hangul pod kraljem Sejongom?
  - Razlog: Pomjeriti pomoćni glagol uz upitnu riječ; zadržati isti smisao i odgovor.

- [x] **hist-hard-053 · BS pitanje** ([history/hard.ts:838](../quivro_web/src/data/questions/mcq/history/hard.ts#L838))
  - Prije: Koji francuski ministar finansija pod Louisom XIV promovirao je merkantilizam?
  - Primijenjeno: Koji je francuski ministar finansija pod Louisom XIV promovirao merkantilizam?
  - Razlog: Pomjeriti pomoćni glagol uz upitnu riječ; zadržati isti smisao i odgovor.

- [x] **hist-hard-054 · BS pitanje** ([history/hard.ts:853](../quivro_web/src/data/questions/mcq/history/hard.ts#L853))
  - Prije: Koji dvorac postao je glavna rezidencija Louisa XIV?
  - Primijenjeno: Koji je dvorac postao glavna rezidencija Louisa XIV?
  - Razlog: Pomjeriti pomoćni glagol uz upitnu riječ; zadržati isti smisao i odgovor.

- [x] **hist-hard-059 · BS pitanje** ([history/hard.ts:936](../quivro_web/src/data/questions/mcq/history/hard.ts#L936))
  - Prije: Koja medicinska sestra postala je poznata po reformi vojnih bolnica tokom Krimskog rata?
  - Primijenjeno: Koja je medicinska sestra postala poznata po reformi vojnih bolnica tokom Krimskog rata?
  - Razlog: Pomjeriti pomoćni glagol uz upitnu riječ; zadržati isti smisao i odgovor.

- [x] **hist-hard-061 · BS pitanje** ([history/hard.ts:968](../quivro_web/src/data/questions/mcq/history/hard.ts#L968))
  - Prije: Koja tajna srpska nacionalistička grupa povezana je s atentatom u Sarajevu?
  - Primijenjeno: Koja je tajna srpska nacionalistička grupa povezana s atentatom u Sarajevu?
  - Razlog: Pomjeriti pomoćni glagol uz upitnu riječ; zadržati isti smisao i odgovor.

- [x] **hist-hard-062 · BS pitanje** ([history/hard.ts:983](../quivro_web/src/data/questions/mcq/history/hard.ts#L983))
  - Prije: Koja bitka iz Prvog svjetskog rata 1916. godine postala je simbol rovovskog rata iscrpljivanja zbog ogromnih gubitaka na Zapadnom frontu?
  - Primijenjeno: Koja je bitka iz Prvog svjetskog rata 1916. godine postala simbol rovovskog rata iscrpljivanja zbog ogromnih gubitaka na Zapadnom frontu?
  - Razlog: Pomjeriti pomoćni glagol uz upitnu riječ; zadržati isti smisao i odgovor.

- [x] **hist-hard-068 · BS pitanje** ([history/hard.ts:1083](../quivro_web/src/data/questions/mcq/history/hard.ts#L1083))
  - Prije: Koji osmanski reformski program 19. vijeka modernizovao je pravo, upravu i vojsku po evropskom uzoru?
  - Primijenjeno: Koji je osmanski reformski program 19. vijeka modernizovao pravo, upravu i vojsku po evropskom uzoru?
  - Razlog: Pomjeriti pomoćni glagol uz upitnu riječ; zadržati isti smisao i odgovor.

- [x] **hist-hard-069 · BS pitanje** ([history/hard.ts:1099](../quivro_web/src/data/questions/mcq/history/hard.ts#L1099))
  - Prije: Koja revolucija 1908. godine u Osmanskom Carstvu prisilila je sultana Abdulhamida II da obnovi suspendovani ustav?
  - Primijenjeno: Koja je revolucija 1908. godine u Osmanskom Carstvu prisilila sultana Abdulhamida II da obnovi suspendovani ustav?
  - Razlog: Pomjeriti pomoćni glagol uz upitnu riječ; zadržati isti smisao i odgovor.

- [x] **hist-hard-070 · BS pitanje** ([history/hard.ts:1115](../quivro_web/src/data/questions/mcq/history/hard.ts#L1115))
  - Prije: Koji sporazum 1938. omogućio je nacističkoj Njemačkoj aneksiju Sudeta?
  - Primijenjeno: Koji je sporazum 1938. omogućio nacističkoj Njemačkoj aneksiju Sudeta?
  - Razlog: Pomjeriti pomoćni glagol uz upitnu riječ; zadržati isti smisao i odgovor.

- [x] **hist-hard-073 · BS pitanje** ([history/hard.ts:1165](../quivro_web/src/data/questions/mcq/history/hard.ts#L1165))
  - Prije: Koja pacifička bitka 1942. godine zaustavila je japansko širenje prema Australiji tokom Drugog svjetskog rata?
  - Primijenjeno: Koja je pacifička bitka 1942. godine zaustavila japansko širenje prema Australiji tokom Drugog svjetskog rata?
  - Razlog: Pomjeriti pomoćni glagol uz upitnu riječ; zadržati isti smisao i odgovor.

- [x] **hist-hard-075 · BS pitanje** ([history/hard.ts:1199](../quivro_web/src/data/questions/mcq/history/hard.ts#L1199))
  - Prije: Koja konferencija 1945. godine pomogla je odrediti veliki dio poslijeratnog poretka u Evropi nakon Drugog svjetskog rata?
  - Primijenjeno: Koja je konferencija 1945. godine pomogla odrediti veliki dio poslijeratnog poretka u Evropi nakon Drugog svjetskog rata?
  - Razlog: Pomjeriti pomoćni glagol uz upitnu riječ; zadržati isti smisao i odgovor.

- [x] **hist-hard-076 · BS pitanje** ([history/hard.ts:1216](../quivro_web/src/data/questions/mcq/history/hard.ts#L1216))
  - Prije: Koja američka doktrina iz 1947. godine obećala je pomoć zemljama koje se odupiru komunizmu?
  - Primijenjeno: Koja je američka doktrina iz 1947. godine obećala pomoć zemljama koje se odupiru komunizmu?
  - Razlog: Pomjeriti pomoćni glagol uz upitnu riječ; zadržati isti smisao i odgovor.

- [x] **hist-hard-087 · BS pitanje** ([history/hard.ts:1403](../quivro_web/src/data/questions/mcq/history/hard.ts#L1403))
  - Prije: Koja sjevernoafrička zemlja stekla je nezavisnost od Francuske nakon osmogodišnjeg rata koji je završen 1962. godine?
  - Primijenjeno: Koja je sjevernoafrička zemlja stekla nezavisnost od Francuske nakon osmogodišnjeg rata koji je završen 1962. godine?
  - Razlog: Pomjeriti pomoćni glagol uz upitnu riječ; zadržati isti smisao i odgovor.

- [x] **hist-hard-098 · BS pitanje** ([history/hard.ts:1585](../quivro_web/src/data/questions/mcq/history/hard.ts#L1585))
  - Prije: Koji mongolski kan osnovao je dinastiju Yuan u Kini?
  - Primijenjeno: Koji je mongolski kan osnovao dinastiju Yuan u Kini?
  - Razlog: Pomjeriti pomoćni glagol uz upitnu riječ; zadržati isti smisao i odgovor.

- [x] **hist-hard-100 · BS pitanje** ([history/hard.ts:1618](../quivro_web/src/data/questions/mcq/history/hard.ts#L1618))
  - Prije: Koja historijska ličnost bila je poznata po tome što je imala majmuna ljubimca po imenu Pogo?
  - Primijenjeno: Koja je historijska ličnost bila poznata po tome što je imala majmuna ljubimca po imenu Pogo?
  - Razlog: Pomjeriti pomoćni glagol uz upitnu riječ; zadržati isti smisao i odgovor.

- [x] **hist-hard-102 · BS pitanje** ([history/hard.ts:1652](../quivro_web/src/data/questions/mcq/history/hard.ts#L1652))
  - Prije: Koja bitka 1297. godine proslavila je Williama Wallacea nakon iznenađujuće škotske pobjede?
  - Primijenjeno: Koja je bitka 1297. godine proslavila Williama Wallacea nakon iznenađujuće škotske pobjede?
  - Razlog: Pomjeriti pomoćni glagol uz upitnu riječ; zadržati isti smisao i odgovor.

- [x] **hist-med-039 · BS pitanje** ([history/medium.ts:616](../quivro_web/src/data/questions/mcq/history/medium.ts#L616))
  - Prije: Koji kineski istraživač vodio je ogromne flote blaga početkom 1400-ih?
  - Primijenjeno: Koji je kineski istraživač vodio ogromne flote blaga početkom 1400-ih?
  - Razlog: Pomjeriti pomoćni glagol uz upitnu riječ; zadržati isti smisao i odgovor.

- [x] **hist-med-041 · BS pitanje** ([history/medium.ts:646](../quivro_web/src/data/questions/mcq/history/medium.ts#L646))
  - Prije: Koje afričko kraljevstvo bilo je poznato po bogatstvu pod Mansom Musom?
  - Primijenjeno: Koje je afričko kraljevstvo bilo poznato po bogatstvu pod Mansom Musom?
  - Razlog: Pomjeriti pomoćni glagol uz upitnu riječ; zadržati isti smisao i odgovor.

- [x] **hist-med-048 · BS pitanje** ([history/medium.ts:759](../quivro_web/src/data/questions/mcq/history/medium.ts#L759))
  - Prije: Koji grčki polis bio je poznat po vojnoj obuci i ratničkoj kulturi?
  - Primijenjeno: Koji je grčki polis bio poznat po vojnoj obuci i ratničkoj kulturi?
  - Razlog: Pomjeriti pomoćni glagol uz upitnu riječ; zadržati isti smisao i odgovor.

- [x] **hist-med-057 · BS pitanje** ([history/medium.ts:904](../quivro_web/src/data/questions/mcq/history/medium.ts#L904))
  - Prije: Koja engleska povelja iz 1215. godine postala je simbol ograničavanja kraljevske moći?
  - Primijenjeno: Koja je engleska povelja iz 1215. godine postala simbol ograničavanja kraljevske moći?
  - Razlog: Pomjeriti pomoćni glagol uz upitnu riječ; zadržati isti smisao i odgovor.

- [x] **hist-med-060 · BS pitanje** ([history/medium.ts:949](../quivro_web/src/data/questions/mcq/history/medium.ts#L949))
  - Prije: Koji vođa Sovjetskog Saveza uveo je glasnost i perestrojku?
  - Primijenjeno: Koji je vođa Sovjetskog Saveza uveo glasnost i perestrojku?
  - Razlog: Pomjeriti pomoćni glagol uz upitnu riječ; zadržati isti smisao i odgovor.

- [x] **hist-med-062 · BS pitanje** ([history/medium.ts:979](../quivro_web/src/data/questions/mcq/history/medium.ts#L979))
  - Prije: Koja evropska zemlja kolonizovala je Brazil?
  - Primijenjeno: Koja je evropska zemlja kolonizovala Brazil?
  - Razlog: Pomjeriti pomoćni glagol uz upitnu riječ; zadržati isti smisao i odgovor.

- [x] **hist-med-063 · BS pitanje** ([history/medium.ts:994](../quivro_web/src/data/questions/mcq/history/medium.ts#L994))
  - Prije: Koja evropska zemlja kolonizovala je veći dio Srednje i Južne Amerike?
  - Primijenjeno: Koja je evropska zemlja kolonizovala veći dio Srednje i Južne Amerike?
  - Razlog: Pomjeriti pomoćni glagol uz upitnu riječ; zadržati isti smisao i odgovor.

- [x] **hist-med-065 · BS pitanje** ([history/medium.ts:1025](../quivro_web/src/data/questions/mcq/history/medium.ts#L1025))
  - Prije: Koji sukob u jugoistočnoj Aziji uključivao je veliko vojno učešće Sjedinjenih Američkih Država tokom 1960-ih i 1970-ih?
  - Primijenjeno: Koji je sukob u jugoistočnoj Aziji uključivao veliko vojno učešće Sjedinjenih Američkih Država tokom 1960-ih i 1970-ih?
  - Razlog: Pomjeriti pomoćni glagol uz upitnu riječ; zadržati isti smisao i odgovor.

- [x] **hist-med-067 · BS pitanje** ([history/medium.ts:1056](../quivro_web/src/data/questions/mcq/history/medium.ts#L1056))
  - Prije: Koji britanski monarh bio je na prijestolju na početku Prvog svjetskog rata?
  - Primijenjeno: Koji je britanski monarh bio na prijestolju na početku Prvog svjetskog rata?
  - Razlog: Pomjeriti pomoćni glagol uz upitnu riječ; zadržati isti smisao i odgovor.

- [x] **hist-med-068 · BS pitanje** ([history/medium.ts:1072](../quivro_web/src/data/questions/mcq/history/medium.ts#L1072))
  - Prije: Koji događaj 1975. godine označio je kraj Vijetnamskog rata?
  - Primijenjeno: Koji je događaj 1975. godine označio kraj Vijetnamskog rata?
  - Razlog: Pomjeriti pomoćni glagol uz upitnu riječ; zadržati isti smisao i odgovor.

- [x] **hist-med-081 · BS pitanje** ([history/medium.ts:1282](../quivro_web/src/data/questions/mcq/history/medium.ts#L1282))
  - Prije: Koja američka teritorija kupljena je od Rusije 1867.?
  - Primijenjeno: Koja je američka teritorija kupljena od Rusije 1867.?
  - Razlog: Pomjeriti pomoćni glagol uz upitnu riječ; zadržati isti smisao i odgovor.

- [x] **hist-med-083 · BS pitanje** ([history/medium.ts:1315](../quivro_web/src/data/questions/mcq/history/medium.ts#L1315))
  - Prije: Koja srednjovjekovna trgovačka mreža kontrolisala je veliki dio trgovine na Baltiku i Sjevernom moru?
  - Primijenjeno: Koja je srednjovjekovna trgovačka mreža kontrolisala veliki dio trgovine na Baltiku i Sjevernom moru?
  - Razlog: Pomjeriti pomoćni glagol uz upitnu riječ; zadržati isti smisao i odgovor.

- [x] **hist-med-085 · BS pitanje** ([history/medium.ts:1346](../quivro_web/src/data/questions/mcq/history/medium.ts#L1346))
  - Prije: Koji vođa parlamenta vladao je Engleskom kao Lord Protector nakon građanskog rata?
  - Primijenjeno: Koji je vođa parlamenta vladao Engleskom kao Lord Protector nakon građanskog rata?
  - Razlog: Pomjeriti pomoćni glagol uz upitnu riječ; zadržati isti smisao i odgovor.

- [x] **hist-med-088 · BS pitanje** ([history/medium.ts:1393](../quivro_web/src/data/questions/mcq/history/medium.ts#L1393))
  - Prije: Koju drevnu indijsku religiju osnovao je Sidarta Gautama?
  - Primijenjeno: Koju je drevnu indijsku religiju osnovao Sidarta Gautama?
  - Razlog: Pomjeriti pomoćni glagol uz upitnu riječ; zadržati isti smisao i odgovor.

- [x] **hist-med-090 · BS pitanje** ([history/medium.ts:1424](../quivro_web/src/data/questions/mcq/history/medium.ts#L1424))
  - Prije: Koji grad u Malijskom carstvu postao je poznat po islamskoj učenosti i bibliotekama?
  - Primijenjeno: Koji je grad u Malijskom carstvu postao poznat po islamskoj učenosti i bibliotekama?
  - Razlog: Pomjeriti pomoćni glagol uz upitnu riječ; zadržati isti smisao i odgovor.

- [x] **hist-med-093 · BS pitanje** ([history/medium.ts:1472](../quivro_web/src/data/questions/mcq/history/medium.ts#L1472))
  - Prije: Koja sila Osovine napala je Kinu 1930-ih prije širenja Drugog svjetskog rata?
  - Primijenjeno: Koja je sila Osovine napala Kinu 1930-ih prije širenja Drugog svjetskog rata?
  - Razlog: Pomjeriti pomoćni glagol uz upitnu riječ; zadržati isti smisao i odgovor.

- [x] **hist-med-094 · BS pitanje** ([history/medium.ts:1487](../quivro_web/src/data/questions/mcq/history/medium.ts#L1487))
  - Prije: Koja konferencija 1945. podijelila je poslijeratnu Njemačku među saveznicima?
  - Primijenjeno: Koja je konferencija 1945. podijelila poslijeratnu Njemačku među saveznicima?
  - Razlog: Pomjeriti pomoćni glagol uz upitnu riječ; zadržati isti smisao i odgovor.

- [x] **hist-med-095 · BS pitanje** ([history/medium.ts:1502](../quivro_web/src/data/questions/mcq/history/medium.ts#L1502))
  - Prije: Koji američki program pomoći pomogao je obnovi Zapadne Evrope nakon Drugog svjetskog rata?
  - Primijenjeno: Koji je američki program pomoći pomogao obnovi Zapadne Evrope nakon Drugog svjetskog rata?
  - Razlog: Pomjeriti pomoćni glagol uz upitnu riječ; zadržati isti smisao i odgovor.

- [x] **hist-med-098 · BS pitanje** ([history/medium.ts:1551](../quivro_web/src/data/questions/mcq/history/medium.ts#L1551))
  - Prije: Koji polinezijski narod naselio je Novi Zeland stoljećima prije evropskog kontakta?
  - Primijenjeno: Koji je polinezijski narod naselio Novi Zeland stoljećima prije evropskog kontakta?
  - Razlog: Pomjeriti pomoćni glagol uz upitnu riječ; zadržati isti smisao i odgovor.

- [x] **movie-med-060 · BS pitanje** ([movies/medium.ts:1014](../quivro_web/src/data/questions/mcq/movies/medium.ts#L1014))
  - Prije: Koji horor film iz 1973. godine postao je poznat po pričama o "ukletom" snimanju?
  - Primijenjeno: Koji je horor film iz 1973. godine postao poznat po pričama o "ukletom" snimanju?
  - Razlog: Pomjeriti pomoćni glagol uz upitnu riječ; zadržati isti smisao i odgovor.

- [x] **sport-easy-037 · BS pitanje** ([sports/easy.ts:565](../quivro_web/src/data/questions/mcq/sports/easy.ts#L565))
  - Prije: Koji vozač Formule 1 bio je poznat po nadimku "The Iceman"?
  - Primijenjeno: Koji je vozač Formule 1 bio poznat po nadimku "The Iceman"?
  - Razlog: Pomjeriti pomoćni glagol uz upitnu riječ; zadržati isti smisao i odgovor.

- [x] **sport-easy-043 · BS pitanje** ([sports/easy.ts:659](../quivro_web/src/data/questions/mcq/sports/easy.ts#L659))
  - Prije: Koji vozač Formule 1 bio je poznat kao "Profesor"?
  - Primijenjeno: Koji je vozač Formule 1 bio poznat kao "Profesor"?
  - Razlog: Pomjeriti pomoćni glagol uz upitnu riječ; zadržati isti smisao i odgovor.
