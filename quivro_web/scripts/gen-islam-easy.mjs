import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

/** @type {{ prompt: { en: string; bs: string }; options: [{ en: string; bs: string }, ...4]; correctIndex: 0|1|2|3 }[]} */
const raw = [
  {
    prompt: {
      en: 'What does the word sira literally mean?',
      bs: 'Šta riječ sira doslovno znači?',
    },
    options: [
      { en: 'To travel or follow a path', bs: 'Putovati ili ići stopama nekoga' },
      { en: 'To write chronicles', bs: 'Pisati kronike' },
      { en: 'To judge disputes', bs: 'Suditi sporove' },
      { en: 'To build a mosque', bs: 'Graditi džamiju' },
    ],
    correctIndex: 0,
  },
  {
    prompt: {
      en: 'The Prophet Muhammad was from which tribe?',
      bs: 'Od kojeg plemena je bio poslanik Muhammed, sallallahu alejhi ve sellem?',
    },
    options: [
      { en: 'Quraysh (Banu Hashim)', bs: 'Kurejš (Banu Hašim)' },
      { en: 'Khazraj', bs: 'Hazredž' },
      { en: 'Aws', bs: 'Evs' },
      { en: 'Thaqif', bs: 'Sekif' },
    ],
    correctIndex: 0,
  },
  {
    prompt: {
      en: 'Who was the Prophet\'s father?',
      bs: 'Ko je bio otac Allahovog Poslanika, sallallahu alejhi ve sellem?',
    },
    options: [
      { en: 'Abdullah ibn Abd al-Muttalib', bs: 'Abdullah b. Abdulmuttalib' },
      { en: 'Abu Talib', bs: 'Ebu Talib' },
      { en: 'Hamza', bs: 'Hamza' },
      { en: 'Abbas', bs: 'Abbas' },
    ],
    correctIndex: 0,
  },
  {
    prompt: {
      en: 'Who was the Prophet\'s mother?',
      bs: 'Ko je bila majka Allahovog Poslanika, sallallahu alejhi ve sellem?',
    },
    options: [
      { en: 'Amina bint Wahb', bs: 'Amina b. Vehb' },
      { en: 'Khadija', bs: 'Hadidža' },
      { en: 'Fatima', bs: 'Fatima' },
      { en: 'Halima', bs: 'Halima' },
    ],
    correctIndex: 0,
  },
  {
    prompt: {
      en: 'Which wet-nurse raised the Prophet in the desert?',
      bs: 'Koja je dojilja odgajala Poslanika, sallallahu alejhi ve sellem, u pustinji?',
    },
    options: [
      { en: 'Halima as-Sa\'diyya', bs: 'Halima es-Sa\'dijja' },
      { en: 'Khadija', bs: 'Hadidža' },
      { en: 'Asma', bs: 'Asma' },
      { en: 'Sawda', bs: 'Sevda' },
    ],
    correctIndex: 0,
  },
  {
    prompt: {
      en: 'At about what age did the Prophet\'s mother Amina pass away?',
      bs: 'U kojoj je dobi (približno) preminula majka Poslanika, sallallahu alejhi ve sellem, Amina?',
    },
    options: [
      { en: 'About six years old', bs: 'Oko šest godina' },
      { en: 'At birth', bs: 'Pri rođenju' },
      { en: 'About twenty', bs: 'Oko dvadeset godina' },
      { en: 'After his marriage', bs: 'Nakon ženidbe' },
    ],
    correctIndex: 0,
  },
  {
    prompt: {
      en: 'Who became the Prophet\'s guardian after his grandfather died?',
      bs: 'Ko je postao staratelj Poslanika, sallallahu alejhi ve sellem, nakon smrti djeda?',
    },
    options: [
      { en: 'His uncle Abu Talib', bs: 'Njegov amidža Ebu Talib' },
      { en: 'Abu Bakr', bs: 'Ebu Bekr' },
      { en: 'Hamza', bs: 'Hamza' },
      { en: 'Abbas', bs: 'Abbas' },
    ],
    correctIndex: 0,
  },
  {
    prompt: {
      en: 'What job did the Prophet have in youth, like other prophets before him?',
      bs: 'Koji je posao Poslanik, sallallahu alejhi ve sellem, obavljao u mladosti, poput drugih poslanika?',
    },
    options: [
      { en: 'Shepherd', bs: 'Pastir' },
      { en: 'Blacksmith', bs: 'Kovač' },
      { en: 'Sailor', bs: 'Mornar' },
      { en: 'Royal scribe', bs: 'Kraljevski pisar' },
    ],
    correctIndex: 0,
  },
  {
    prompt: {
      en: 'What was Hilf al-Fudul?',
      bs: 'Šta je bio Hilful-fudul?',
    },
    options: [
      { en: 'A pre-Islamic pact to defend the oppressed', bs: 'Predislamski savez za zaštitu ugnjetenih' },
      { en: 'A battle against Persia', bs: 'Bitka protiv Perzije' },
      { en: 'A trade route to Yemen', bs: 'Trgovačka ruta u Jemen' },
      { en: 'A pagan festival at the Kaaba', bs: 'Poganski praznik kod Kabe' },
    ],
    correctIndex: 0,
  },
  {
    prompt: {
      en: 'Who was the Prophet\'s first wife?',
      bs: 'Ko je bila prva supruga Poslanika, sallallahu alejhi ve sellem?',
    },
    options: [
      { en: 'Khadija bint Khuwaylid', bs: 'Hadidža b. Huvejlid' },
      { en: 'Aisha', bs: 'Aiša' },
      { en: 'Hafsa', bs: 'Hafsa' },
      { en: 'Zaynab bint Jahsh', bs: 'Zeinab b. Džahš' },
    ],
    correctIndex: 0,
  },
  {
    prompt: {
      en: 'Which daughter of the Prophet outlived him?',
      bs: 'Koja kći Poslanika, sallallahu alejhi ve sellem, je preživjela njegovu smrt?',
    },
    options: [
      { en: 'Fatima', bs: 'Fatima' },
      { en: 'Zaynab', bs: 'Zeinab' },
      { en: 'Ruqayya', bs: 'Rukajja' },
      { en: 'Umm Kulthum', bs: 'Umm Kulsum' },
    ],
    correctIndex: 0,
  },
  {
    prompt: {
      en: 'At what age did revelation first come to the Prophet?',
      bs: 'U kojoj je dobi Poslaniku, sallallahu alejhi ve sellem, prvi put došla objava?',
    },
    options: [
      { en: 'Forty', bs: 'Četrdeset' },
      { en: 'Twenty-five', bs: 'Dvadeset pet' },
      { en: 'Thirty-three', bs: 'Trideset tri' },
      { en: 'Fifty', bs: 'Pedeset' },
    ],
    correctIndex: 0,
  },
  {
    prompt: {
      en: 'Where did the first revelation occur?',
      bs: 'Gdje se dogodila prva objava Poslaniku, sallallahu alejhi ve sellem?',
    },
    options: [
      { en: 'Cave of Hira', bs: 'Pećina Hira' },
      { en: 'Cave of Thawr', bs: 'Pećina Sevr' },
      { en: 'Mount Uhud', bs: 'Planina Uhud' },
      { en: 'His house in Medina', bs: 'Njegova kuća u Medini' },
    ],
    correctIndex: 0,
  },
  {
    prompt: {
      en: 'Which angel brought the first revelation?',
      bs: 'Koji melek je donio prvu objavu?',
    },
    options: [
      { en: 'Jibril (Gabriel)', bs: 'Džibril' },
      { en: 'Mikail', bs: 'Mikail' },
      { en: 'Israfil', bs: 'Israfil' },
      { en: 'No angel was involved', bs: 'Nijedan melek nije učestvovao' },
    ],
    correctIndex: 0,
  },
  {
    prompt: {
      en: 'The first revealed words "Read!" come from which surah?',
      bs: 'Prve objavljene riječi „Čitaj!“ dolaze iz koje sure?',
    },
    options: [
      { en: 'Al-Alaq', bs: 'El-Alek' },
      { en: 'Al-Fatiha', bs: 'El-Fatiha' },
      { en: 'Al-Muddaththir', bs: 'El-Mudessir' },
      { en: 'Al-Ikhlas', bs: 'El-Ihlas' },
    ],
    correctIndex: 0,
  },
  {
    prompt: {
      en: 'Which surah marks the public start of prophethood with "Arise and warn"?',
      bs: 'Koja sura označava javni početak poslanstva riječima „Ustani i upozoravaj“?',
    },
    options: [
      { en: 'Al-Muddaththir', bs: 'El-Mudessir' },
      { en: 'Al-Baqara', bs: 'El-Bekara' },
      { en: 'An-Nas', bs: 'En-Nas' },
      { en: 'Al-Kawthar', bs: 'El-Kevser' },
    ],
    correctIndex: 0,
  },
  {
    prompt: {
      en: 'Who was among the very first adult men to accept Islam?',
      bs: 'Ko je bio među prvima odraslih muškaraca koji su prihvatili islam?',
    },
    options: [
      { en: 'Abu Bakr', bs: 'Ebu Bekr' },
      { en: 'Khalid ibn al-Walid', bs: 'Halid b. Velid' },
      { en: 'Amr ibn al-As', bs: 'Amr b. As' },
      { en: 'Abu Jahl', bs: 'Ebu Jehl' },
    ],
    correctIndex: 0,
  },
  {
    prompt: {
      en: 'Where did the Prophet first call people publicly in Mecca?',
      bs: 'Gdje je Poslanik, sallallahu alejhi ve sellem, prvi put javno pozivao ljude u Meki?',
    },
    options: [
      { en: 'Mount Safa', bs: 'Brdo Safa' },
      { en: 'Mount Arafat', bs: 'Planina Arafat' },
      { en: 'Mount Sinai', bs: 'Planina Sinaj' },
      { en: 'The market of Basra', bs: 'Tržnica u Basri' },
    ],
    correctIndex: 0,
  },
  {
    prompt: {
      en: 'Where did early Muslims secretly learn Islam in Mecca?',
      bs: 'Gdje su rani muslimani u Meki potajno učili islam?',
    },
    options: [
      { en: 'House of al-Arqam', bs: 'Kuća el-Erkama' },
      { en: 'Dar al-Nadwa only', bs: 'Samo Dar en-Nedva' },
      { en: 'The Kaaba treasury', bs: 'Riznica Kabe' },
      { en: 'Cave Hira permanently', bs: 'Trajno u pećini Hira' },
    ],
    correctIndex: 0,
  },
  {
    prompt: {
      en: 'To which land did Muslims first migrate to escape Meccan persecution?',
      bs: 'U koju zemlju su muslimani prvi put emigrirali zbog mekanskog progona?',
    },
    options: [
      { en: 'Abyssinia (Habasha)', bs: 'Abesinija (Habeš)' },
      { en: 'Syria', bs: 'Šam' },
      { en: 'Persia', bs: 'Perzija' },
      { en: 'Yemen as a permanent state', bs: 'Jemen kao trajna država' },
    ],
    correctIndex: 0,
  },
  {
    prompt: {
      en: 'Who spoke before the Negus defending the Muslim migrants?',
      bs: 'Ko je govorio pred Negusom u odbranu muslimanskih migranata?',
    },
    options: [
      { en: 'Ja\'far ibn Abi Talib', bs: 'Džafer b. Ebi Talib' },
      { en: 'Umar ibn al-Khattab', bs: 'Omer b. Hattab' },
      { en: 'Khalid ibn al-Walid', bs: 'Halid b. Velid' },
      { en: 'Abu Hurayra', bs: 'Ebu Hurejre' },
    ],
    correctIndex: 0,
  },
  {
    prompt: {
      en: 'The Year of Grief is linked to the deaths of whom?',
      bs: 'Godina tuge povezana je sa smrću koga?',
    },
    options: [
      { en: 'Abu Talib and Khadija', bs: 'Ebu Taliba i Hadidže' },
      { en: 'Abu Bakr and Umar', bs: 'Ebu Bekra i Omera' },
      { en: 'Hamza and Ja\'far', bs: 'Hamze i Džafera' },
      { en: 'Amina and Abdullah', bs: 'Amine i Abdullaha' },
    ],
    correctIndex: 0,
  },
  {
    prompt: {
      en: 'How long was the Meccan period of prophethood?',
      bs: 'Koliko je trajao mekanski period poslanstva?',
    },
    options: [
      { en: 'Thirteen years', bs: 'Trinaest godina' },
      { en: 'Ten years', bs: 'Deset godina' },
      { en: 'Seven years', bs: 'Sedam godina' },
      { en: 'Twenty-three years', bs: 'Dvadeset tri godine' },
    ],
    correctIndex: 0,
  },
  {
    prompt: {
      en: 'How long was the Medinan period of prophethood?',
      bs: 'Koliko je trajao medinski period poslanstva?',
    },
    options: [
      { en: 'Ten years', bs: 'Deset godina' },
      { en: 'Thirteen years', bs: 'Trinaest godina' },
      { en: 'Five years', bs: 'Pet godina' },
      { en: 'Forty years', bs: 'Četrdeset godina' },
    ],
    correctIndex: 0,
  },
  {
    prompt: {
      en: 'At age twelve, which monk recognized signs of prophethood on a trade trip?',
      bs: 'Koji je monah u dvanaestoj godini prepoznao znakove poslanstva na trgovačkom putu?',
    },
    options: [
      { en: 'Bahira (Bahira) at Busra', bs: 'Behira u Busri' },
      { en: 'Waraqah in Medina', bs: 'Vereka u Medini' },
      { en: 'Heraclius in Rome', bs: 'Iraklije u Rimu' },
      { en: 'Salman in Persia', bs: 'Salman u Perziji' },
    ],
    correctIndex: 0,
  },
  {
    prompt: {
      en: 'What is akida in Islamic terminology?',
      bs: 'Šta je akida u islamskoj terminologiji?',
    },
    options: [
      { en: 'Firm belief in Allah and pillars of faith without doubt', bs: 'Čvrsto vjerovanje u Allaha i temelje imana bez sumnje' },
      { en: 'Optional devotional habits only', bs: 'Samo dobrovoljne navike' },
      { en: 'Islamic trade law only', bs: 'Samo trgovačko pravo' },
      { en: 'The science of hadith chains only', bs: 'Samo nauka o lancima hadisa' },
    ],
    correctIndex: 0,
  },
  {
    prompt: {
      en: 'According to the hadith of Jibril, how many pillars of iman are there?',
      bs: 'Prema hadisu Džibrila, koliko stubova imana postoji?',
    },
    options: [
      { en: 'Six', bs: 'Šest' },
      { en: 'Four', bs: 'Četiri' },
      { en: 'Five', bs: 'Pet' },
      { en: 'Seven', bs: 'Sedam' },
    ],
    correctIndex: 0,
  },
  {
    prompt: {
      en: 'What does fitra mean in the context of belief?',
      bs: 'Šta znači fitra u kontekstu vjerovanja?',
    },
    options: [
      { en: 'Natural disposition to recognize Allah', bs: 'Prirodna dispozicija da se prepozna Allah' },
      { en: 'A mandatory pilgrimage ritual', bs: 'Obavezni hadž ritual' },
      { en: 'A type of voluntary charity', bs: 'Vrsta dobrovoljne sadake' },
      { en: 'A school of Islamic law', bs: 'Pravna škola (mezheb)' },
    ],
    correctIndex: 0,
  },
  {
    prompt: {
      en: 'According to the famous hadith, every newborn is born upon fitra; who then changes the child?',
      bs: 'Prema poznatom hadisu, svako novorođenče se rađa na fitri; ko ga onda mijenja?',
    },
    options: [
      { en: 'The parents through upbringing', bs: 'Roditelji kroz odgoj' },
      { en: 'The angels', bs: 'Meleki' },
      { en: 'The government', bs: 'Vlast' },
      { en: 'The first school teacher', bs: 'Prvi učitelj u školi' },
    ],
    correctIndex: 0,
  },
  {
    prompt: {
      en: 'What is tagut in akida?',
      bs: 'Šta je tagut u akidi?',
    },
    options: [
      { en: 'Anything worshipped besides Allah willingly', bs: 'Ono što se obožava mimo Allaha, i time je zadovoljno' },
      { en: 'A type of angel', bs: 'Vrsta meleka' },
      { en: 'A chapter of the Qur\'an', bs: 'Poglavlje Kur\'ana' },
      { en: 'A voluntary night prayer', bs: 'Dobrovoljni noćni namaz' },
    ],
    correctIndex: 0,
  },
  {
    prompt: {
      en: 'The saved group (al-firqa an-najiya) is also called:',
      bs: 'Spašena skupina (el-firka en-nadžija) također se naziva:',
    },
    options: [
      { en: 'Ahl al-Sunna wa\'l-Jama\'a', bs: 'Ehlus-sunnet vel-džemaa' },
      { en: 'Followers of Pharaoh', bs: 'Sljedbenici faraona' },
      { en: 'People of the Book only', bs: 'Samo ehli-kitab' },
      { en: 'Greek philosophers', bs: 'Grčki filozofi' },
    ],
    correctIndex: 0,
  },
  {
    prompt: {
      en: 'Tevhid ar-rububiyya means believing Allah alone is:',
      bs: 'Tevhidur-rububijjet znači vjerovanje da je samo Allah:',
    },
    options: [
      { en: 'Creator, Provider, and Controller of all worlds', bs: 'Stvoritelj, Opskrbitelj i Upravitelj svih svjetova' },
      { en: 'God of Arabs only', bs: 'Bog samo Arapa' },
      { en: 'A symbolic force in nature', bs: 'Simbolička sila u prirodi' },
      { en: 'One of many co-rulers', bs: 'Jedan od mnogih suvlasnika' },
    ],
    correctIndex: 0,
  },
  {
    prompt: {
      en: 'Linguistically, the root of akida (akd) means:',
      bs: 'Jezički, korijen akide (el-akd) znači:',
    },
    options: [
      { en: 'To tie firmly / bind', bs: 'Svezati, čvrsto zategnuti' },
      { en: 'To release or untie', bs: 'Odvezati, osloboditi' },
      { en: 'To travel', bs: 'Putovati' },
      { en: 'To forget', bs: 'Zaboraviti' },
    ],
    correctIndex: 0,
  },
  {
    prompt: {
      en: 'Angels in Islamic belief are created from:',
      bs: 'Meleki su u islamskom vjerovanju stvoreni od:',
    },
    options: [
      { en: 'Light', bs: 'Svjetlosti' },
      { en: 'Fire', bs: 'Vatre' },
      { en: 'Clay', bs: 'Gline' },
      { en: 'Water', bs: 'Vode' },
    ],
    correctIndex: 0,
  },
  {
    prompt: {
      en: 'All prophets called people first to:',
      bs: 'Svi poslanici su ljude prvo pozivali u:',
    },
    options: [
      { en: 'Correct belief in Allah alone', bs: 'Ispravno vjerovanje u Allaha jedinog' },
      { en: 'Building large temples', bs: 'Gradnju velikih hramova' },
      { en: 'Political revolution only', bs: 'Samo političku revoluciju' },
      { en: 'Abandoning all laws', bs: 'Odbacivanje svih zakona' },
    ],
    correctIndex: 0,
  },
  {
    prompt: {
      en: 'In hadith science, what is isnad (sened)?',
      bs: 'U hadiskoj nauci, šta je isnad (sened)?',
    },
    options: [
      { en: 'The chain of transmitters of a hadith', bs: 'Lanac prenosilaca hadisa' },
      { en: 'The text of the Qur\'an', bs: 'Tekst Kur\'ana' },
      { en: 'A type of prayer', bs: 'Vrsta namaza' },
      { en: 'A legal analogy', bs: 'Pravna analogija (kijas)' },
    ],
    correctIndex: 0,
  },
  {
    prompt: {
      en: 'In hadith science, what is matn?',
      bs: 'U hadiskoj nauci, šta je matn?',
    },
    options: [
      { en: 'The actual text/content of the hadith', bs: 'Tekst (sadržaj) hadisa' },
      { en: 'Biography of a narrator', bs: 'Biografija prenosilaca' },
      { en: 'A chapter of fiqh', bs: 'Poglavlje fikha' },
      { en: 'A Qur\'anic verse', bs: 'Kur\'anski ajet' },
    ],
    correctIndex: 0,
  },
  {
    prompt: {
      en: 'The second source of Islam after the Qur\'an is:',
      bs: 'Drugi izvor islama nakon Kur\'ana je:',
    },
    options: [
      { en: 'Authentic Sunnah / hadith', bs: 'Autentični sunnet / hadis' },
      { en: 'Personal reasoning alone', bs: 'Samo lično mišljenje' },
      { en: 'Tribal tradition', bs: 'Plemenska tradicija' },
      { en: 'Greek philosophy', bs: 'Grčka filozofija' },
    ],
    correctIndex: 0,
  },
  {
    prompt: {
      en: 'In the hadith of Jibril, the three levels of religion are:',
      bs: 'U hadisu Džibrila, tri nivoa vjere su:',
    },
    options: [
      { en: 'Islam, iman, and ihsan', bs: 'Islam, iman i ihsan' },
      { en: 'Qur\'an, fiqh, and grammar', bs: 'Kur\'an, fikh i gramatika' },
      { en: 'Mecca, Medina, and Jerusalem', bs: 'Meka, Medina i Jerusalim' },
      { en: 'Farz, sunnet, and mubah only', bs: 'Samo farz, sunnet i mubah' },
    ],
    correctIndex: 0,
  },
  {
    prompt: {
      en: 'Ihsan is defined in the hadith of Jibril as:',
      bs: 'Ihsan se u hadisu Džibrila definiše kao:',
    },
    options: [
      { en: 'Worshipping Allah as if you see Him', bs: 'Da Allaha obožavaš kao da Ga vidiš' },
      { en: 'Giving all wealth to charity', bs: 'Davanje cjelokupne imovine u sadaku' },
      { en: 'Fasting every day of life', bs: 'Post svaki dan života' },
      { en: 'Never sleeping', bs: 'Nikada ne spavati' },
    ],
    correctIndex: 0,
  },
  {
    prompt: {
      en: 'The five pillars of Islam include shahada, prayer, zakat, Ramadan fasting, and:',
      bs: 'Pet stubova islama uključuju šehadet, namaz, zekat, post u ramazanu i:',
    },
    options: [
      { en: 'Hajj for those able', bs: 'Hadž za onoga ko je sposoban' },
      { en: 'Daily reading of entire Qur\'an', bs: 'Dnevno čitanje cijelog Kur\'ana' },
      { en: 'Giving all inheritance to mosque', bs: 'Predavanje cijelog nasljedstva džamiji' },
      { en: 'Military service only', bs: 'Samo vojnu službu' },
    ],
    correctIndex: 0,
  },
  {
    prompt: {
      en: 'The Prophet said he left two things; if held firmly, people will not go astray:',
      bs: 'Poslanik, sallallahu alejhi ve sellem, rekao je da je ostavio dvije stvari; ako ih se držimo, nećemo zalutati:',
    },
    options: [
      { en: 'The Qur\'an and his Sunnah', bs: 'Allahovu Knjigu i njegov sunnet' },
      { en: 'The Qur\'an and poetry', bs: 'Kur\'an i poeziju' },
      { en: 'Sunnah and tribal law', bs: 'Sunnet i plemensko pravo' },
      { en: 'Hadith books and philosophy', bs: 'Hadiske zbirke i filozofiju' },
    ],
    correctIndex: 0,
  },
  {
    prompt: {
      en: 'Who came in human form to ask the Prophet about Islam, iman, and ihsan?',
      bs: 'Ko je u ljudskom obliku pitao Poslanika o islamu, imanu i ihsanu?',
    },
    options: [
      { en: 'Jibril', bs: 'Džibril' },
      { en: 'Mikail', bs: 'Mikail' },
      { en: 'A random Bedouin only', bs: 'Samo slučajni beduin' },
      { en: 'Abu Bakr in disguise', bs: 'Ebu Bekr u preruši' },
    ],
    correctIndex: 0,
  },
  {
    prompt: {
      en: 'According to a famous hadith, every action is judged by what?',
      bs: 'Prema poznatom hadisu, svako djelo se procjenjuje prema čemu?',
    },
    options: [
      { en: 'Intention (niyyah)', bs: 'Namjeri (nijetu)' },
      { en: 'Wealth of the doer', bs: 'Bogatstvu onoga ko ga čini' },
      { en: 'Number of witnesses', bs: 'Broju svjedoka' },
      { en: 'Time of day only', bs: 'Samo dobu dana' },
    ],
    correctIndex: 0,
  },
  {
    prompt: {
      en: 'The four types of hadith include words, actions, tacit approval, and:',
      bs: 'Četiri vrste hadisa uključuju riječi, djela, prešutno odobrenje i:',
    },
    options: [
      { en: 'Descriptions of his qualities', bs: 'Opis njegovih osobina' },
      { en: 'Dreams of companions only', bs: 'Snovi ashaba' },
      { en: 'Poetry of tabi\'in', bs: 'Poezija tabina' },
      { en: 'Rulings of kings', bs: 'Presude vladara' },
    ],
    correctIndex: 0,
  },
  {
    prompt: {
      en: 'The five legal categories in fiqh are farz, mustahabb, haram, makruh, and:',
      bs: 'Pet pravnih kategorija u fikhu su farz, mustehab, haram, mekruh i:',
    },
    options: [
      { en: 'Mubah (permitted)', bs: 'Mubah (dozvoljeno)' },
      { en: 'Wajib al-nafs only', bs: 'Samo vadžibun-nefs' },
      { en: 'Nafilah as fifth only', bs: 'Samo nafile' },
      { en: 'Sunna mu\'akkadah only', bs: 'Samo sunnet mu\'ekked' },
    ],
    correctIndex: 0,
  },
  {
    prompt: {
      en: 'The four primary sources of Islamic law are Qur\'an, hadith, ijma\', and:',
      bs: 'Četiri glavna izvora islamskog prava su Kur\'an, hadis, idžma i:',
    },
    options: [
      { en: 'Qiyas (analogy)', bs: 'Kijas (analogija)' },
      { en: 'Dreams', bs: 'Snovi' },
      { en: 'Majority vote of laypeople', bs: 'Glasanje običnih ljudi' },
      { en: 'Local customs without limits', bs: 'Lokalni običaji bez granica' },
    ],
    correctIndex: 0,
  },
  {
    prompt: {
      en: 'Linguistically, fiqh means:',
      bs: 'Jezički, fikh znači:',
    },
    options: [
      { en: 'Understanding', bs: 'Razumijevanje' },
      { en: 'Fighting', bs: 'Borba' },
      { en: 'Memorization without meaning', bs: 'Pamćenje bez razumijevanja' },
      { en: 'Poetry', bs: 'Poezija' },
    ],
    correctIndex: 0,
  },
  {
    prompt: {
      en: 'Tahara (purification) is a condition for validity of:',
      bs: 'Taharet (čistoća) je uvjet ispravnosti:',
    },
    options: [
      { en: 'Prayer', bs: 'Namaza' },
      { en: 'Trade contracts only', bs: 'Samo trgovačkih ugovora' },
      { en: 'Marriage only', bs: 'Samo braka' },
      { en: 'Hajj only, not prayer', bs: 'Samo hadža, ne namaza' },
    ],
    correctIndex: 0,
  },
  {
    prompt: {
      en: 'What meal distinguishes Muslim fasting from the fasting of Ahl al-Kitab?',
      bs: 'Koji obrok razlikuje naš post od posta ehli-kitaba?',
    },
    options: [
      { en: 'Suhur (pre-dawn meal)', bs: 'Sehur' },
      { en: 'Iftar only', bs: 'Samo iftar' },
      { en: 'Lunch', bs: 'Ručak' },
      { en: 'Midnight snack', bs: 'Užina u ponoć' },
    ],
    correctIndex: 0,
  },
  {
    prompt: {
      en: 'Imam Malik\'s famous book combining hadith and fiqh is:',
      bs: 'Poznato djelo imama Malika koje spaja hadis i fikh je:',
    },
    options: [
      { en: 'Al-Muwatta', bs: 'El-Muvatta' },
      { en: 'Sahih al-Bukhari', bs: 'Sahihul-Buhari' },
      { en: 'Ihya Ulum al-Din', bs: 'Ihyau ulumid-din' },
      { en: 'Al-Kafi', bs: 'El-Kafi' },
    ],
    correctIndex: 0,
  },
  {
    prompt: {
      en: 'Tafsir in shari\'ah terminology means:',
      bs: 'Tefsir u šerijatskoj terminologiji znači:',
    },
    options: [
      { en: 'Explanation of Allah\'s speech (the Qur\'an)', bs: 'Tumačenje Allahovog govora (Kur\'ana)' },
      { en: 'A hadith collection', bs: 'Zbirka hadisa' },
      { en: 'History of kings', bs: 'Historija vladara' },
      { en: 'Arabic grammar (nahw)', bs: 'Arapska gramatika (en-nehv)' },
    ],
    correctIndex: 0,
  },
  {
    prompt: {
      en: 'Another name for tafsir is:',
      bs: 'Drugi naziv za tefsir je:',
    },
    options: [
      { en: 'Ta\'wil', bs: 'Te\'vil' },
      { en: 'Balagha (rhetoric)', bs: 'Belaga' },
      { en: 'Sarf (morphology)', bs: 'Sarf' },
      { en: 'Usul al-fiqh', bs: 'Usul el-fikha' },
    ],
    correctIndex: 0,
  },
  {
    prompt: {
      en: 'Al-Fatiha is also called:',
      bs: 'El-Fatiha se također naziva:',
    },
    options: [
      { en: 'Umm al-Kitab (Mother of the Book)', bs: 'Ummul-kitab (Majka Knjige)' },
      { en: 'Surah of Moses', bs: 'Sura Musaa' },
      { en: 'Last surah of the Qur\'an', bs: 'Posljednja sura Kur\'ana' },
      { en: 'A surah revealed in Medina', bs: 'Sura objavljena u Medini' },
    ],
    correctIndex: 0,
  },
  {
    prompt: {
      en: 'How many verses are in Surah Al-Fatiha?',
      bs: 'Koliko ajeta ima sura El-Fatiha?',
    },
    options: [
      { en: 'Seven', bs: 'Sedam' },
      { en: 'Five', bs: 'Pet' },
      { en: 'Ten', bs: 'Deset' },
      { en: 'Twelve', bs: 'Dvanaest' },
    ],
    correctIndex: 0,
  },
  {
    prompt: {
      en: 'In Al-Fatiha, "Maliki yawm ad-din" means:',
      bs: 'U El-Fatiha, „Maliki jevmid-din“ znači:',
    },
    options: [
      { en: 'Master of the Day of Judgment', bs: 'Gospodar Dana suda' },
      { en: 'Ruler of this world', bs: 'Gospodar ovoga svijeta' },
      { en: 'Angel of death', bs: 'Melek smrti' },
      { en: 'A companion of the Prophet', bs: 'Ashab Poslanika' },
    ],
    correctIndex: 0,
  },
  {
    prompt: {
      en: 'Approximately what percentage of Qur\'anic verses deal with detailed legal rulings?',
      bs: 'Otprilike koliki postotak kur\'anskih ajeta govori o detaljnim pravnim propisima?',
    },
    options: [
      { en: 'About 10%', bs: 'Oko 10%' },
      { en: 'About 90%', bs: 'Oko 90%' },
      { en: 'About 50%', bs: 'Oko 50%' },
      { en: 'Less than 1%', bs: 'Manje od 1%' },
    ],
    correctIndex: 0,
  },
  {
    prompt: {
      en: 'The Prophet said he was sent to perfect:',
      bs: 'Poslanik, sallallahu alejhi ve sellem, rekao je da je poslan da usavrši:',
    },
    options: [
      { en: 'Noble moral character (akhlaq)', bs: 'Plemeniti ahlak' },
      { en: 'Trade regulations', bs: 'Trgovačka pravila' },
      { en: 'End of all education', bs: 'Kraj sveg obrazovanja' },
      { en: 'Replacement of prayer', bs: 'Zamjenu namaza' },
    ],
    correctIndex: 0,
  },
  {
    prompt: {
      en: 'Aisha said the Prophet\'s character was:',
      bs: 'Aiša, radijallahu anha, rekla je da je Poslanikov karakter bio:',
    },
    options: [
      { en: 'The Qur\'an (lived Qur\'an)', bs: 'Kur\'an (življeni Kur\'an)' },
      { en: 'Unrelated to revelation', bs: 'Nepovezan s objavom' },
      { en: 'Poetry', bs: 'Poezija' },
      { en: 'Military strategy', bs: 'Vojna strategija' },
    ],
    correctIndex: 0,
  },
  {
    prompt: {
      en: 'The most honorable before Allah among people is:',
      bs: 'Najplemenitiji kod Allaha među ljudima je onaj koji:',
    },
    options: [
      { en: 'The most God-fearing (taqwa)', bs: 'Se najviše boji Allaha (takva)' },
      { en: 'The richest', bs: 'Je najbogatiji' },
      { en: 'The tallest', bs: 'Je najviši' },
      { en: 'The oldest in age always', bs: 'Je uvijek najstariji' },
    ],
    correctIndex: 0,
  },
  {
    prompt: {
      en: 'In the hadith on fulfilling rights, besides Allah and yourself, who has rights over you?',
      bs: 'U hadisu o ispunjavanju prava, ko osim Allaha i sebe ima prava nad tobom?',
    },
    options: [
      { en: 'Your family (ahl)', bs: 'Tvoja porodica (ahl)' },
      { en: 'Government officials', bs: 'Državni službenici' },
      { en: 'Angels you worship', bs: 'Meleci koje obožavaš' },
      { en: 'Ancient kings', bs: 'Drevni vladari' },
    ],
    correctIndex: 0,
  },
  {
    prompt: {
      en: 'What will weigh heaviest on the believer\'s scale on Judgment Day?',
      bs: 'Šta će na Sudnjem danu najteže ležati na vagi vjernika?',
    },
    options: [
      { en: 'Good character', bs: 'Lijep ahlak' },
      { en: 'Expensive clothes', bs: 'Skupa odjeća' },
      { en: 'A large house in dunya', bs: 'Velika kuća na dunjaluku' },
      { en: 'Number of travel trips', bs: 'Broj putovanja' },
    ],
    correctIndex: 0,
  },
  {
    prompt: {
      en: 'The Prophet was sent as mercy to:',
      bs: 'Poslanik, sallallahu alejhi ve sellem, poslan je kao milost:',
    },
    options: [
      { en: 'All worlds (alamin)', bs: 'Svjetovima (alaminima)' },
      { en: 'The Arabs', bs: 'Arapima' },
      { en: 'Men', bs: 'Muškarcima' },
      { en: 'The people of Medina', bs: 'Narodu Medine' },
    ],
    correctIndex: 0,
  },
  {
    prompt: {
      en: 'Ibadah and good character (akhlaq) are:',
      bs: 'Ibadet i lijep ahlak su:',
    },
    options: [
      { en: 'Inseparable—both required', bs: 'Neraskidivo povezani—oba su potrebna' },
      { en: 'Opposites—choose one', bs: 'Suprotnosti—biraj jedno' },
      { en: 'Character replaces prayer', bs: 'Ahlak zamjenjuje namaz' },
      { en: 'Prayer replaces all ethics', bs: 'Namaz zamjenjuje sav etos' },
    ],
    correctIndex: 0,
  },
  {
    prompt: {
      en: 'Changing evil has three levels: by hand, by tongue, and:',
      bs: 'Mijenjanje zla ima tri nivoa: rukom, jezikom i:',
    },
    options: [
      { en: 'By heart (hating it)—weakest faith', bs: 'Srcem (mržnjom prema zlu)—najslabiji iman' },
      { en: 'By running away always', bs: 'Bijegom uvijek' },
      { en: 'By joining the wrongdoing', bs: 'Pridruživanjem zlu' },
      { en: 'By ignoring with joy', bs: 'Radostnim ignorisanjem' },
    ],
    correctIndex: 0,
  },
  {
    prompt: {
      en: 'Islam is built on how many pillars according to the famous hadith?',
      bs: 'Islam je izgrađen na koliko stubova prema poznatom hadisu?',
    },
    options: [
      { en: 'Five', bs: 'Pet' },
      { en: 'Four', bs: 'Četiri' },
      { en: 'Six', bs: 'Šest' },
      { en: 'Ten', bs: 'Deset' },
    ],
    correctIndex: 0,
  },
  {
    prompt: {
      en: 'In the hadith on the five pillars, what comes immediately after prayer (salat)?',
      bs: 'U hadisu o pet stubova islama, šta dolazi neposredno nakon namaza?',
    },
    options: [
      { en: 'Zakat', bs: 'Zekat' },
      { en: 'Fasting in Ramadan', bs: 'Post u ramazanu' },
      { en: 'Hajj', bs: 'Hadž' },
      { en: 'Shahada', bs: 'Šehadet' },
    ],
    correctIndex: 0,
  },
  {
    prompt: {
      en: 'The first phrase of the shahada — "La ilaha illallah" — affirms:',
      bs: 'Prva rečenica šehadeta — „La ilaha illallah“ — potvrđuje da:',
    },
    options: [
      { en: 'No one deserves worship except Allah', bs: 'Niko osim Allaha ne zaslužuje ibadet' },
      { en: 'Angels share in Allah\'s lordship', bs: 'Meleki dijele Allahovo gospodarenje' },
      { en: 'Muhammad is equal to Allah', bs: 'Je Muhammed jednak Allahu' },
      { en: 'Prayer replaces belief', bs: 'Namaz zamjenjuje vjerovanje' },
    ],
    correctIndex: 0,
  },
  {
    prompt: {
      en: 'Synonyms for akida in Islamic terminology include:',
      bs: 'Sinonimi za akidu u islamskoj terminologiji uključuju:',
    },
    options: [
      { en: 'At-tawhid, as-sunna, al-usul ad-din', bs: 'Et-tevhid, es-sunnet, el-usulud-din' },
      { en: 'At-tafsir, al-balagha, an-nahw', bs: 'Et-tefsir, el-belaga, en-nahv' },
      { en: 'Al-adab, ash-shi\'r, al-falsafa', bs: 'El-edeb, eš-ši\'r, el-falsafa' },
      { en: 'Al-hadith and al-fiqh', bs: 'El-hadis i el-fikh' },
    ],
    correctIndex: 0,
  },
  {
    prompt: {
      en: 'Correct akida is described as all of the following EXCEPT:',
      bs: 'Ispravna akida se opisuje kao sve navedeno OSIM:',
    },
    options: [
      { en: 'Constantly changing with each generation', bs: 'Stalno se mijenja sa svakom generacijom' },
      { en: 'Clear and natural', bs: 'Jasna i prirodna' },
      { en: 'Based on clear evidence', bs: 'Počiva na jasnim dokazima' },
      { en: 'The middle path between extremes', bs: 'Akida sredine između krajnosti' },
    ],
    correctIndex: 0,
  },
  {
    prompt: {
      en: 'Leaving a mustahabb act without excuse brings:',
      bs: 'Ostavljanje mustehaba bez izgovora donosi:',
    },
    options: [
      { en: 'No punishment', bs: 'Nema kazne' },
      { en: 'Major sin equal to haram', bs: 'Veliki grijeh kao haram' },
      { en: 'Automatic expulsion from Islam', bs: 'Automatski izlazak iz islama' },
      { en: 'A government fine', bs: 'Državnu kaznu' },
    ],
    correctIndex: 0,
  },
  {
    prompt: {
      en: 'Which of the following is haram in Islam?',
      bs: 'Šta je od navedenog haram u islamu?',
    },
    options: [
      { en: 'Alcohol, interest, adultery, gambling', bs: 'Alkohol, riba, blud, kockanje' },
      { en: 'Sleeping and walking', bs: 'Spavanje i hodanje' },
      { en: 'Drinking water', bs: 'Pijenje vode' },
      { en: 'Wearing clean clothes', bs: 'Nošenje čiste odjeće' },
    ],
    correctIndex: 0,
  },
  {
    prompt: {
      en: 'The two main subjects of fiqh are ibadat and:',
      bs: 'Dva glavna predmeta fikha su ibadeti i:',
    },
    options: [
      { en: 'Mu\'amalat (transactions and relations)', bs: 'Muamelati (poslovi i odnosi)' },
      { en: 'Poetry and grammar', bs: 'Poezija i gramatika' },
      { en: 'Astronomy', bs: 'Astronomija' },
      { en: 'Medicine', bs: 'Medicina' },
    ],
    correctIndex: 0,
  },
  {
    prompt: {
      en: 'When Mu\'adh was sent as judge, he said he would first refer to:',
      bs: 'Kada je poslan kao sudija, Muaz je rekao da će prvo suditi po:',
    },
    options: [
      { en: 'The Book of Allah', bs: 'Knjizi Allaha' },
      { en: 'His personal desire', bs: 'Svom ličnom želji' },
      { en: 'Roman law', bs: 'Rimskom pravu' },
      { en: 'Tribal revenge custom', bs: 'Plemenskoj osveti' },
    ],
    correctIndex: 0,
  },
  {
    prompt: {
      en: 'Reward for each letter of Qur\'an recited is traditionally:',
      bs: 'Nagrada za svako slovo Kur\'ana koje se pročita je tradicionalno:',
    },
    options: [
      { en: 'Ten rewards per letter', bs: 'Deset nagrada po slovu' },
      { en: 'One reward per entire surah', bs: 'Jedna nagrada po suri' },
      { en: 'No special reward', bs: 'Nema posebne nagrade' },
      { en: 'When recited silently', bs: 'Kada se čita tiho' },
    ],
    correctIndex: 0,
  },
  {
    prompt: {
      en: 'Sins are not recorded against a child until:',
      bs: 'Grijeh se djetetu ne zapisuje dok ne:',
    },
    options: [
      { en: 'Reaches legal maturity (bulugh)', bs: 'Ne dostigne bogošt (pubertet)' },
      { en: 'Turns thirty', bs: 'Ne napuni trideset' },
      { en: 'Marries', bs: 'Se ne oženi/udaje' },
      { en: 'Memorizes Qur\'an', bs: 'Ne napamet nauči Kur\'an' },
    ],
    correctIndex: 0,
  },
  {
    prompt: {
      en: 'The best method of tafsir is:',
      bs: 'Najbolji način tefsira je:',
    },
    options: [
      { en: 'Qur\'an explaining Qur\'an', bs: 'Tefsir Kur\'ana Kur\'anom' },
      { en: 'Personal opinion without knowledge', bs: 'Lično mišljenje bez znanja' },
      { en: 'Foreign philosophy', bs: 'Strana filozofija' },
      { en: 'Ignoring the Sunnah completely', bs: 'Potpuno ignorisanje sunneta' },
    ],
    correctIndex: 0,
  },
  {
    prompt: {
      en: '"Iyyaaka na\'budu wa iyyaaka nasta\'een" teaches that worship and help belong to:',
      bs: '„Ijjake na\'budu ve ijjake nesta\'in“ uči da ibadet i pomoć pripadaju:',
    },
    options: [
      { en: 'Allah exclusively', bs: 'Isključivo Allahu' },
      { en: 'Angels in worship', bs: 'Melecima u ibadetu' },
      { en: 'Prophets in worship', bs: 'Poslanicima u ibadetu' },
      { en: 'Ancestors in worship', bs: 'Precima u ibadetu' },
    ],
    correctIndex: 0,
  },
  {
    prompt: {
      en: 'The straight path in Al-Fatiha refers to:',
      bs: 'Siratul-mustakim u El-Fatiha označava:',
    },
    options: [
      { en: 'Islam / following Allah and His Messenger', bs: 'Islam / slijeđenje Allaha i Poslanika' },
      { en: 'A road in Mecca', bs: 'Put u Meki' },
      { en: 'Any path one prefers', bs: 'Bilo koji put po želji' },
      { en: 'Scholars without prophets', bs: 'Učenjaci bez poslanika' },
    ],
    correctIndex: 0,
  },
  {
    prompt: {
      en: 'Best among believers in iman are those with:',
      bs: 'Najpotpuniji iman ima vjernik s:',
    },
    options: [
      { en: 'Best manners (akhlaq)', bs: 'Najljepšim ahlakom' },
      { en: 'Most wealth', bs: 'Najviše imovine' },
      { en: 'Loudest voice', bs: 'Najglasnijim glasom' },
      { en: 'Most travel', bs: 'Najviše putovanja' },
    ],
    correctIndex: 0,
  },
  {
    prompt: {
      en: 'Two qualities that admit people to Paradise most, according to a famous hadith:',
      bs: 'Dvije osobine koje najviše uvoze u Džennet, prema hadisu:',
    },
    options: [
      { en: 'God-consciousness and good character', bs: 'Takva i lijep ahlak' },
      { en: 'Wealth and fame', bs: 'Bogatstvo i slava' },
      { en: 'Silence and isolation', bs: 'Šutnja i izolacija' },
      { en: 'Poetry and art', bs: 'Poezija i umjetnost' },
    ],
    correctIndex: 0,
  },
  {
    prompt: {
      en: 'The true bankrupt person on Judgment Day comes with prayers and fasting but:',
      bs: 'Pravi bankrot na Sudnjem danu dolazi s namazom i postom, ali:',
    },
    options: [
      { en: 'Harmed and wronged people', bs: 'Je uvrijedio i učinio nepravdu ljudima' },
      { en: 'Never fasted', bs: 'Nikada nije postio' },
      { en: 'Never prayed', bs: 'Nikada nije klanjao' },
      { en: 'Never gave charity', bs: 'Nikada nije davao sadaku' },
    ],
    correctIndex: 0,
  },
  {
    prompt: {
      en: 'Best people are those most beneficial to:',
      bs: 'Najbolji ljudi su oni koji su najkoristniji:',
    },
    options: [
      { en: 'Other people', bs: 'Drugim ljudima' },
      { en: 'Themselves', bs: 'Sebi' },
      { en: 'Rulers', bs: 'Vladarima' },
      { en: 'Animals, not humans', bs: 'Životinjama, ne ljudima' },
    ],
    correctIndex: 0,
  },
  {
    prompt: {
      en: 'Those closest to the Prophet on Judgment Day will be those with:',
      bs: 'Najbliži Poslaniku na Sudnjem danu biće oni s:',
    },
    options: [
      { en: 'Best manners', bs: 'Najljepšim ahlakom' },
      { en: 'Most money donated once', bs: 'Najviše jednokratno donirane novce' },
      { en: 'The longest beard', bs: 'Najduža brada' },
      { en: 'Most descendants', bs: 'Najviše potomaka' },
    ],
    correctIndex: 0,
  },
  {
    prompt: {
      en: 'Belief in divine decree (qadar) means Allah\'s decree as decree contains:',
      bs: 'Vjerovanje u kader znači da Allahova odredba kao odredba:',
    },
    options: [
      { en: 'No inherent evil—evil lies in what occurs', bs: 'Ne sadrži zlo po sebi—zlo je u onome što se dogodi' },
      { en: 'Both good and evil as Allah creating sin directly', bs: 'Direktno stvara grijeh kao dobro' },
      { en: 'No role for human choice', bs: 'Ne ostavlja mjesta ljudskom izboru' },
      { en: 'Punishment without mercy', bs: 'Kazna bez milosti' },
    ],
    correctIndex: 0,
  },
  {
    prompt: {
      en: 'Muslims must believe in earlier scriptures in what sense?',
      bs: 'Muslimani moraju vjerovati u ranija pisma u smislu da:',
    },
    options: [
      { en: 'They were true from Allah, later distorted by people', bs: 'Su istinito bila od Allaha, a ljudi su ih iskrivili' },
      { en: 'Every word in today\'s Bible is unchanged', bs: 'Je svaka riječ današnje Biblije nepromijenjena' },
      { en: 'No books existed before the Qur\'an', bs: 'Prije Kur\'ana nije bilo knjiga' },
      { en: 'That the Zabur is sufficient today', bs: 'Da su Zeburi danas dovoljni' },
    ],
    correctIndex: 0,
  },
  {
    prompt: {
      en: 'The Last Day (yawm al-qiyama) includes belief in:',
      bs: 'Sudnji dan (jevmul-kijame) uključuje vjerovanje u:',
    },
    options: [
      { en: 'Grave questioning and bodily resurrection', bs: 'Pitanje u grobu i uskrsnuće tijela' },
      { en: 'Reincarnation into animals', bs: 'Reinkarnaciju u životinje' },
      { en: 'A symbolic judgment', bs: 'Simbolički sud' },
      { en: 'Immediate paradise for all', bs: 'Trenutni džennet za sve' },
    ],
    correctIndex: 0,
  },
  {
    prompt: {
      en: 'Without hadith we would not know details such as:',
      bs: 'Bez hadisa ne bismo znali detalje poput:',
    },
    options: [
      { en: 'How many daily prayers and how to perform them', bs: 'Koliko je dnevnih namaza i kako se klanjaju' },
      { en: 'That prayer exists at all', bs: 'Da namaz uopšte postoji' },
      { en: 'That Allah is One', bs: 'Da je Allah Jedan' },
      { en: 'That angels exist', bs: 'Da meleki postoje' },
    ],
    correctIndex: 0,
  },
  {
    prompt: {
      en: '"A Muslim is one from whose tongue and hand other Muslims are safe" is a hadith of:',
      bs: '„Musliman je onaj od čijeg su jezika i ruku sigurni drugi muslimani“ je hadis:',
    },
    options: [
      { en: 'Words (qawli)', bs: 'Riječi (el-kavli)' },
      { en: 'Tacit approval (taqriri)', bs: 'Prešutno odobrenje (takriri)' },
      { en: 'Physical description (sifati)', bs: 'Fizički opis (sifati)' },
      { en: 'Companion statement (mawqufi)', bs: 'Izjava ashaba (mevkufi)' },
    ],
    correctIndex: 0,
  },
  {
    prompt: {
      en: 'The Prophet warned: whoever turns away from my Sunnah is:',
      bs: 'Poslanik, sallallahu alejhi ve sellem, upozorio je: ko se udalji od mog sunneta:',
    },
    options: [
      { en: 'Not of me', bs: 'Nije od mene' },
      { en: 'Guaranteed paradise', bs: 'Ima zajamčen džennet' },
      { en: 'Excused if educated', bs: 'Ima izgovor ako je učen' },
      { en: 'Equal in reward to followers', bs: 'Jednak je u nagradi sljedbenicima' },
    ],
    correctIndex: 0,
  },
  {
    prompt: {
      en: 'Sehur is described in hadith as:',
      bs: 'Sehur se u hadisu opisuje kao:',
    },
    options: [
      { en: 'Blessed food—do not skip it', bs: 'Blagoslovljena hrana—nemojte ga propuštati' },
      { en: 'Forbidden in Ramadan', bs: 'Zabranjen u ramazanu' },
      { en: 'The same as iftar', bs: 'Isto što i iftar' },
      { en: 'Reserved for travelers', bs: 'Namijenjen putnicima' },
    ],
    correctIndex: 0,
  },
  {
    prompt: {
      en: 'Post (fasting) was prescribed primarily to develop:',
      bs: 'Post je propisan prije svega da se razvije:',
    },
    options: [
      { en: 'God-consciousness (taqwa)', bs: 'Bogobojaznost (takva)' },
      { en: 'Physical strength', bs: 'Fizička snaga' },
      { en: 'Wealth', bs: 'Bogatstvo' },
      { en: 'Fame among people', bs: 'Slava među ljudima' },
    ],
    correctIndex: 0,
  },
  {
    prompt: {
      en: 'Imam al-Shafi\'i is known as:',
      bs: 'Imam Šafii poznat je kao:',
    },
    options: [
      { en: 'Nasir as-Sunna (Helper of the Sunnah)', bs: 'Nasirus-sunne (branilac sunneta)' },
      { en: 'Imam of philosophers', bs: 'Imam filozofa' },
      { en: 'Founder of Sufism', bs: 'Osnivač sufizma' },
      { en: 'Collector of the Qur\'an', bs: 'Sakupilac Kur\'ana' },
    ],
    correctIndex: 0,
  },
  {
    prompt: {
      en: 'The Qur\'an was revealed over approximately how many years?',
      bs: 'Kur\'an je objavljivan otprilike koliko godina?',
    },
    options: [
      { en: 'Twenty-three years', bs: 'Dvadeset tri godine' },
      { en: 'Ten years', bs: 'Deset godina' },
      { en: 'One year', bs: 'Jednu godinu' },
      { en: 'Forty years', bs: 'Četrdeset godina' },
    ],
    correctIndex: 0,
  },
  {
    prompt: {
      en: 'The Hijra (migration to Medina) marks the start of:',
      bs: 'Hidžra (selidba u Medinu) označava početak:',
    },
    options: [
      { en: 'The Islamic calendar', bs: 'Islamskog kalendara' },
      { en: 'The Meccan period', bs: 'Mekanskog perioda' },
      { en: 'The Year of the Elephant', bs: 'Godine slona' },
      { en: 'The first revelation', bs: 'Prve objave' },
    ],
    correctIndex: 0,
  },
  {
    prompt: {
      en: 'Which companion is known as As-Siddiq (the Truthful)?',
      bs: 'Koji ashab je poznat kao Es-Siddik (istiniti)?',
    },
    options: [
      { en: 'Abu Bakr', bs: 'Ebu Bekr' },
      { en: 'Umar', bs: 'Omer' },
      { en: 'Uthman', bs: 'Osman' },
      { en: 'Ali', bs: 'Ali' },
    ],
    correctIndex: 0,
  },
  {
    prompt: {
      en: 'The Night Journey and Ascension (Isra and Mi\'raj) are associated with travel to:',
      bs: 'Isra i Miradž povezani su s putovanjem prema:',
    },
    options: [
      { en: 'Jerusalem and the heavens', bs: 'Jerusalimu i nebesima' },
      { en: 'Persia', bs: 'Perzija' },
      { en: 'Abyssinia', bs: 'Abesinija' },
      { en: 'India', bs: 'Indiji' },
    ],
    correctIndex: 0,
  },
  {
    prompt: {
      en: 'The first mosque in Islam was built in:',
      bs: 'Prva džamija u islamu sagrađena je u:',
    },
    options: [
      { en: 'Quba', bs: 'Kubi' },
      { en: 'Jerusalem', bs: 'Jerusalim' },
      { en: 'Taif', bs: 'Taifu' },
      { en: 'Basra', bs: 'Basri' },
    ],
    correctIndex: 0,
  },
  {
    prompt: {
      en: 'Zakat is the pillar of Islam concerning:',
      bs: 'Zekat je stub islama koji se odnosi na:',
    },
    options: [
      { en: 'Obligatory charity on wealth', bs: 'Obaveznu milostinju od imovine' },
      { en: 'Fasting in Ramadan', bs: 'Post u ramazanu' },
      { en: 'Pilgrimage to Mecca', bs: 'Hadž u Meku' },
      { en: 'Daily prayer times', bs: 'Vremena dnevnog namaza' },
    ],
    correctIndex: 0,
  },
  {
    prompt: {
      en: 'Wudu (ablution) is required before which act of worship?',
      bs: 'Abdest je potreban prije kojeg ibadeta?',
    },
    options: [
      { en: 'Prayer (salat)', bs: 'Namaza' },
      { en: 'Hajj', bs: 'Hadž' },
      { en: 'Zakat', bs: 'Zekat' },
      { en: 'Trade in the market', bs: 'Trgovine na pijaci' },
    ],
    correctIndex: 0,
  },
];

if (raw.length !== 100) {
  console.error('Expected 100 questions, got', raw.length);
  process.exit(1);
}

/** Rotate correct answer position for variety */
const rotated = raw.map((q, i) => {
  const target = i % 4;
  if (q.correctIndex === target) return q;
  const opts = [...q.options];
  const correct = opts[q.correctIndex];
  const wrong = opts.filter((_, j) => j !== q.correctIndex);
  const newOpts = [...wrong];
  newOpts.splice(target, 0, correct);
  return { ...q, options: newOpts, correctIndex: target };
});

function esc(s) {
  return s.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

const lines = [
  "import type { Question } from '../../types';",
  '',
  'export const islamEasy: Question[] = [',
];

rotated.forEach((q, i) => {
  const id = `islam-easy-${String(i + 1).padStart(3, '0')}`;
  lines.push('  {');
  lines.push(`    id: '${id}',`);
  lines.push("    type: 'mcq',");
  lines.push("    category: 'islam',");
  lines.push("    difficulty: 'easy',");
  lines.push(`    prompt: { en: '${esc(q.prompt.en)}', bs: '${esc(q.prompt.bs)}' },`);
  lines.push('    options: [');
  q.options.forEach((o) => {
    lines.push(`      { en: '${esc(o.en)}', bs: '${esc(o.bs)}' },`);
  });
  lines.push('    ],');
  lines.push(`    correctIndex: ${q.correctIndex},`);
  lines.push('  },');
});

lines.push('];');
lines.push('');

const out = join(__dirname, '../src/data/questions/mcq/islam/easy.ts');
writeFileSync(out, lines.join('\n'), 'utf8');
console.log('Wrote', out, 'with', raw.length, 'questions');
