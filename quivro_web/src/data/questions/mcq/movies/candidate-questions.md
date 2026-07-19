# Candidate questions – movies, TV, animation & fun facts

This is a scratch reference doc, **not** wired into the app. It contains raw
material in the `prompt` / `options` / `correctIndex` snippet shape so you can
cherry-pick the ones you like and paste them into `easy.ts`, `medium.ts`, or
`hard.ts` (remember to add `id`, `type`, `category`, and `difficulty` when you
do). None of these duplicate a question already present in the three data
files.

## Movies

```typescript
{
  prompt: {
    en: 'What is the nickname the Jaws film crew gave the mechanical shark?',
    bs: 'Kakav nadimak je filmska ekipa Jaws dala mehaničkoj ajkuli?'
  },
  options: [
    { en: 'Bruce', bs: 'Bruce' },
    { en: 'Chomper', bs: 'Chomper' },
    { en: 'Finny', bs: 'Finny' },
    { en: 'Jawsy', bs: 'Jawsy' },
  ],
  correctIndex: 0,
},
```

```typescript
{
  prompt: {
    en: 'Who played Dorothy in the original 1939 film The Wizard of Oz?',
    bs: 'Ko je glumio Dorothy u originalnom filmu Čarobnjak iz Oza iz 1939?'
  },
  options: [
    { en: 'Judy Garland', bs: 'Judy Garland' },
    { en: 'Shirley Temple', bs: 'Shirley Temple' },
    { en: 'Vivien Leigh', bs: 'Vivien Leigh' },
    { en: 'Ginger Rogers', bs: 'Ginger Rogers' },
  ],
  correctIndex: 0,
},
```

```typescript
{
  prompt: {
    en: 'What is the name of Rocky Balboa’s opponent in the first Rocky film?',
    bs: 'Kako se zove protivnik Rockyja Balboe u prvom filmu Rocky?'
  },
  options: [
    { en: 'Apollo Creed', bs: 'Apollo Creed' },
    { en: 'Clubber Lang', bs: 'Clubber Lang' },
    { en: 'Ivan Drago', bs: 'Ivan Drago' },
    { en: 'Tommy Gunn', bs: 'Tommy Gunn' },
  ],
  correctIndex: 0,
},
```

```typescript
{
  prompt: {
    en: 'Jurassic Park is based on a novel written by which author?',
    bs: 'Koji autor je napisao roman na kojem je zasnovan Jurassic Park?'
  },
  options: [
    { en: 'Michael Crichton', bs: 'Michael Crichton' },
    { en: 'Stephen King', bs: 'Stephen King' },
    { en: 'Tom Clancy', bs: 'Tom Clancy' },
    { en: 'Arthur C. Clarke', bs: 'Arthur C. Clarke' },
  ],
  correctIndex: 0,
},
```

```typescript
{
  prompt: {
    en: 'What is the name of Norman Bates’s motel in Psycho?',
    bs: 'Kako se zove motel Normana Batesa u Psychu?'
  },
  options: [
    { en: 'Bates Motel', bs: 'Bates Motel' },
    { en: 'Sunset Motel', bs: 'Sunset Motel' },
    { en: 'Roadside Inn', bs: 'Roadside Inn' },
    { en: 'Shady Rest', bs: 'Shady Rest' },
  ],
  correctIndex: 0,
},
```

```typescript
{
  prompt: {
    en: 'In Rain Man, what condition does Dustin Hoffman’s character have?',
    bs: 'U Rain Manu, od kakvog stanja boluje lik kojeg glumi Dustin Hoffman?'
  },
  options: [
    { en: 'Autism', bs: 'Autizam' },
    { en: 'Amnesia', bs: 'Amneziju' },
    { en: 'Insomnia', bs: 'Nesanicu' },
    { en: 'Dyslexia', bs: 'Disleksiju' },
  ],
  correctIndex: 0,
},
```

```typescript
{
  prompt: {
    en: 'What is the name of the Southern belle played by Vivien Leigh in Gone with the Wind?',
    bs: 'Kako se zove junakinja s juga koju glumi Vivien Leigh u Prohujalo s vihorom?'
  },
  options: [
    { en: 'Scarlett O’Hara', bs: 'Scarlett O’Hara' },
    { en: 'Melanie Hamilton', bs: 'Melanie Hamilton' },
    { en: 'Blanche DuBois', bs: 'Blanche DuBois' },
    { en: 'Daisy Buchanan', bs: 'Daisy Buchanan' },
  ],
  correctIndex: 0,
},
```

```typescript
{
  prompt: {
    en: 'What famous line does Forrest Gump repeat about life?',
    bs: 'Koju poznatu rečenicu o životu Forrest Gump ponavlja?'
  },
  options: [
    { en: 'Life is like a box of chocolates', bs: 'Život je kao kutija čokolada' },
    { en: 'Life finds a way', bs: 'Život nađe način' },
    { en: 'Life moves pretty fast', bs: 'Život se brzo kreće' },
    { en: 'Life is a highway', bs: 'Život je autoput' },
  ],
  correctIndex: 0,
},
```

```typescript
{
  prompt: {
    en: 'In the film Speed, the bus cannot slow down below what speed or it will explode?',
    bs: 'U filmu Speed, ispod koje brzine autobus ne može ići a da ne eksplodira?'
  },
  options: [
    { en: '50 mph', bs: '50 mph' },
    { en: '30 mph', bs: '30 mph' },
    { en: '70 mph', bs: '70 mph' },
    { en: '20 mph', bs: '20 mph' },
  ],
  correctIndex: 0,
},
```

```typescript
{
  prompt: {
    en: 'In Jumanji, what object brings the jungle dangers to life?',
    bs: 'U Jumanjiju, koji predmet oživljava opasnosti iz džungle?'
  },
  options: [
    { en: 'A board game', bs: 'Društvena igra' },
    { en: 'A music box', bs: 'Muzička kutija' },
    { en: 'A painting', bs: 'Slika' },
    { en: 'A mirror', bs: 'Ogledalo' },
  ],
  correctIndex: 0,
},
```

```typescript
{
  prompt: {
    en: 'What is the famous twist reveal in The Sixth Sense?',
    bs: 'Koji je poznati obrt na kraju filma The Sixth Sense?'
  },
  options: [
    { en: 'The main character has been dead the whole time', bs: 'Glavni lik je bio mrtav cijelo vrijeme' },
    { en: 'The boy was dreaming', bs: 'Dječak je sanjao' },
    { en: 'The doctor is the villain', bs: 'Doktor je negativac' },
    { en: 'It was all a movie set', bs: 'Sve se dešavalo na filmskom setu' },
  ],
  correctIndex: 0,
},
```

```typescript
{
  prompt: {
    en: 'In Gladiator, what is the name of Russell Crowe’s character?',
    bs: 'U Gladijatoru, kako se zove lik kojeg glumi Russell Crowe?'
  },
  options: [
    { en: 'Maximus', bs: 'Maximus' },
    { en: 'Commodus', bs: 'Commodus' },
    { en: 'Marcus', bs: 'Marcus' },
    { en: 'Brutus', bs: 'Brutus' },
  ],
  correctIndex: 0,
},
```

```typescript
{
  prompt: {
    en: 'In Braveheart, which Scottish hero does Mel Gibson play?',
    bs: 'U Braveheartu, kojeg škotskog heroja glumi Mel Gibson?'
  },
  options: [
    { en: 'William Wallace', bs: 'William Wallace' },
    { en: 'Robert the Bruce', bs: 'Robert the Bruce' },
    { en: 'Rob Roy', bs: 'Rob Roy' },
    { en: 'Macbeth', bs: 'Macbeth' },
  ],
  correctIndex: 0,
},
```

```typescript
{
  prompt: {
    en: 'What is the iconic introduction line in The Princess Bride?',
    bs: 'Koja je kultna rečenica za upoznavanje u The Princess Bride?'
  },
  options: [
    { en: '“Hello. My name is Inigo Montoya.”', bs: '“Zdravo. Zovem se Inigo Montoya.”' },
    { en: '“As you wish.”', bs: '“Kako želiš.”' },
    { en: '“Inconceivable!”', bs: '“Nezamislivo!”' },
    { en: '“Have fun storming the castle!”', bs: '“Zabavite se u napadu na zamak!”' },
  ],
  correctIndex: 0,
},
```

```typescript
{
  prompt: {
    en: 'A Beautiful Mind tells the story of which real mathematician?',
    bs: 'A Beautiful Mind priča priču o kojem stvarnom matematičaru?'
  },
  options: [
    { en: 'John Nash', bs: 'John Nash' },
    { en: 'Alan Turing', bs: 'Alan Turing' },
    { en: 'Stephen Hawking', bs: 'Stephen Hawking' },
    { en: 'Albert Einstein', bs: 'Albert Einstein' },
  ],
  correctIndex: 0,
},
```

```typescript
{
  prompt: {
    en: 'What musical genre is La La Land primarily celebrated for?',
    bs: 'Za koji muzički žanr je La La Land prije svega poznat?'
  },
  options: [
    { en: 'Musical/dance numbers', bs: 'Mjuzikl/plesne numere' },
    { en: 'Opera', bs: 'Opera' },
    { en: 'Heavy metal', bs: 'Heavy metal' },
    { en: 'Hip-hop battles', bs: 'Hip-hop bitke' },
  ],
  correctIndex: 0,
},
```

```typescript
{
  prompt: {
    en: 'In Whiplash, which instrument does the main character play?',
    bs: 'U Whiplashu, koji instrument svira glavni lik?'
  },
  options: [
    { en: 'Drums', bs: 'Bubnjeve' },
    { en: 'Piano', bs: 'Klavir' },
    { en: 'Trumpet', bs: 'Trubu' },
    { en: 'Violin', bs: 'Violinu' },
  ],
  correctIndex: 0,
},
```

```typescript
{
  prompt: {
    en: 'In which country is Slumdog Millionaire mainly set?',
    bs: 'U kojoj zemlji se uglavnom dešava Slumdog Millionaire?'
  },
  options: [
    { en: 'India', bs: 'Indiji' },
    { en: 'Pakistan', bs: 'Pakistanu' },
    { en: 'Sri Lanka', bs: 'Šri Lanki' },
    { en: 'Bangladesh', bs: 'Bangladešu' },
  ],
  correctIndex: 0,
},
```

```typescript
{
  prompt: {
    en: 'What does Tom Hanks’s character name his volleyball companion in Cast Away?',
    bs: 'Kako lik kojeg glumi Tom Hanks nazove svoju loptu-prijatelja u Cast Away?'
  },
  options: [
    { en: 'Wilson', bs: 'Wilson' },
    { en: 'Spalding', bs: 'Spalding' },
    { en: 'Buddy', bs: 'Buddy' },
    { en: 'Chuck', bs: 'Chuck' },
  ],
  correctIndex: 0,
},
```

```typescript
{
  prompt: {
    en: 'What is the premise of the film Groundhog Day?',
    bs: 'Šta je premisa filma Groundhog Day?'
  },
  options: [
    { en: 'The main character relives the same day over and over', bs: 'Glavni lik iznova doživljava isti dan' },
    { en: 'A town is trapped in eternal winter', bs: 'Grad je zarobljen u vječnoj zimi' },
    { en: 'Animals gain human speech for one day', bs: 'Životinje na jedan dan progovore ljudski' },
    { en: 'A family travels back one year every February', bs: 'Porodica putuje godinu unazad svakog februara' },
  ],
  correctIndex: 0,
},
```

```typescript
{
  prompt: {
    en: 'In The Truman Show, what does Truman eventually discover about his life?',
    bs: 'U The Truman Show, šta Truman naposljetku otkrije o svom životu?'
  },
  options: [
    { en: 'It has been broadcast as a TV show his whole life', bs: 'Cijeli život se emituje kao TV emisija' },
    { en: 'He is actually a robot', bs: 'On je u stvari robot' },
    { en: 'He is living in a video game', bs: 'On živi u video igri' },
    { en: 'He has a secret twin', bs: 'Ima tajnog blizanca' },
  ],
  correctIndex: 0,
},
```

```typescript
{
  prompt: {
    en: 'What is unusual about the main character’s hands in Edward Scissorhands?',
    bs: 'Šta je neobično kod ruku glavnog lika u Edward Scissorhands?'
  },
  options: [
    { en: 'They are made of scissor blades', bs: 'Sačinjene su od oštrica makaza' },
    { en: 'They are made of glass', bs: 'Sačinjene su od stakla' },
    { en: 'They are invisible', bs: 'Nevidljive su' },
    { en: 'They are made of wood', bs: 'Sačinjene su od drveta' },
  ],
  correctIndex: 0,
},
```

```typescript
{
  prompt: {
    en: 'In Legally Blonde, which prestigious school does Elle Woods attend?',
    bs: 'U Legally Blonde, koju prestižnu školu upisuje Elle Woods?'
  },
  options: [
    { en: 'Harvard Law School', bs: 'Pravni fakultet Harvarda' },
    { en: 'Yale Law School', bs: 'Pravni fakultet Yalea' },
    { en: 'Stanford Law School', bs: 'Pravni fakultet Stanforda' },
    { en: 'Columbia Law School', bs: 'Pravni fakultet Columbije' },
  ],
  correctIndex: 0,
},
```

```typescript
{
  prompt: {
    en: 'In Mean Girls, what word does Regina George use for “cool” or “trendy”?',
    bs: 'U Mean Girls, koju riječ Regina George koristi za “moderno” ili “kul”?'
  },
  options: [
    { en: 'Fetch', bs: 'Fetch' },
    { en: 'Grool', bs: 'Grool' },
    { en: 'Boss', bs: 'Boss' },
    { en: 'Rad', bs: 'Rad' },
  ],
  correctIndex: 0,
},
```

## TV Shows

```typescript
{
  prompt: {
    en: 'In How I Met Your Mother, what is the name of the bar the group hangs out at?',
    bs: 'U How I Met Your Mother, kako se zove bar u kojem se ekipa okuplja?'
  },
  options: [
    { en: 'MacLaren’s', bs: 'MacLaren’s' },
    { en: 'Central Perk', bs: 'Central Perk' },
    { en: 'Cheers', bs: 'Cheers' },
    { en: 'Paddy’s Pub', bs: 'Paddy’s Pub' },
  ],
  correctIndex: 0,
},
```

```typescript
{
  prompt: {
    en: 'What is the name of the hospital in Grey’s Anatomy?',
    bs: 'Kako se zove bolnica u seriji Grey’s Anatomy?'
  },
  options: [
    { en: 'Seattle Grace', bs: 'Seattle Grace' },
    { en: 'Chicago Med', bs: 'Chicago Med' },
    { en: 'St. Mary’s', bs: 'St. Mary’s' },
    { en: 'Mercy General', bs: 'Mercy General' },
  ],
  correctIndex: 0,
},
```

```typescript
{
  prompt: {
    en: 'In Prison Break, why does Michael Scofield get himself imprisoned?',
    bs: 'U Prison Breaku, zašto se Michael Scofield sam dovede u zatvor?'
  },
  options: [
    { en: 'To help his brother escape', bs: 'Da pomogne bratu da pobjegne' },
    { en: 'To find hidden treasure', bs: 'Da pronađe skriveno blago' },
    { en: 'To investigate a murder', bs: 'Da istraži ubistvo' },
    { en: 'To protect a witness', bs: 'Da zaštiti svjedoka' },
  ],
  correctIndex: 0,
},
```

```typescript
{
  prompt: {
    en: 'What is Dexter Morgan’s day job in the series Dexter?',
    bs: 'Čime se Dexter Morgan bavi danju u seriji Dexter?'
  },
  options: [
    { en: 'Blood-spatter analyst', bs: 'Analitičar tragova krvi' },
    { en: 'Police detective', bs: 'Policijski detektiv' },
    { en: 'Coroner', bs: 'Mrtvozornik' },
    { en: 'Crime reporter', bs: 'Crime reporter' },
  ],
  correctIndex: 0,
},
```

```typescript
{
  prompt: {
    en: 'Whose face do the robbers’ masks resemble in Money Heist (La Casa de Papel)?',
    bs: 'Na čije lice liče maske pljačkaša u Money Heist (La Casa de Papel)?'
  },
  options: [
    { en: 'Salvador Dalí', bs: 'Salvadora Dalíja' },
    { en: 'Pablo Picasso', bs: 'Pabla Picassa' },
    { en: 'Vincent van Gogh', bs: 'Vincenta van Gogha' },
    { en: 'Frida Kahlo', bs: 'Fride Kahlo' },
  ],
  correctIndex: 0,
},
```

```typescript
{
  prompt: {
    en: 'Vikings follows the legendary exploits of which Norse leader?',
    bs: 'Vikings prati legendarne pohode kojeg nordijskog vođe?'
  },
  options: [
    { en: 'Ragnar Lothbrok', bs: 'Ragnara Lothbroka' },
    { en: 'Leif Erikson', bs: 'Leifa Eriksona' },
    { en: 'Erik the Red', bs: 'Erika Crvenog' },
    { en: 'Harald Hardrada', bs: 'Haralda Hardradu' },
  ],
  correctIndex: 0,
},
```

```typescript
{
  prompt: {
    en: 'What profession do the main characters share in Suits?',
    bs: 'Kojim se zanimanjem bave glavni likovi u seriji Suits?'
  },
  options: [
    { en: 'Lawyers', bs: 'Advokati' },
    { en: 'Doctors', bs: 'Doktori' },
    { en: 'Detectives', bs: 'Detektivi' },
    { en: 'Bankers', bs: 'Bankari' },
  ],
  correctIndex: 0,
},
```

```typescript
{
  prompt: {
    en: 'What filming style does Modern Family use to tell its story?',
    bs: 'Koji stil snimanja koristi Modern Family za pripovijedanje priče?'
  },
  options: [
    { en: 'Mockumentary, with characters talking to the camera', bs: 'Mokumentarni, s likovima koji pričaju direktno u kameru' },
    { en: 'Live theatrical stage recording', bs: 'Snimanje uživo na pozorišnoj sceni' },
    { en: 'Fully animated', bs: 'Potpuno animirano' },
    { en: 'Silent film style', bs: 'Stil nemog filma' },
  ],
  correctIndex: 0,
},
```

```typescript
{
  prompt: {
    en: 'In The Fresh Prince of Bel-Air, which city does Will move from?',
    bs: 'U The Fresh Prince of Bel-Air, iz kojeg grada se Will preseli?'
  },
  options: [
    { en: 'Philadelphia', bs: 'Philadelphije' },
    { en: 'Chicago', bs: 'Chicaga' },
    { en: 'Detroit', bs: 'Detroita' },
    { en: 'New York', bs: 'New Yorka' },
  ],
  correctIndex: 0,
},
```

```typescript
{
  prompt: {
    en: 'Full House is set in which U.S. city?',
    bs: 'U kojem američkom gradu se dešava Full House?'
  },
  options: [
    { en: 'San Francisco', bs: 'San Franciscu' },
    { en: 'Los Angeles', bs: 'Los Angelesu' },
    { en: 'Boston', bs: 'Bostonu' },
    { en: 'Seattle', bs: 'Seattleu' },
  ],
  correctIndex: 0,
},
```

```typescript
{
  prompt: {
    en: 'Which decade does That ’70s Show take place in?',
    bs: 'U kojoj deceniji se dešava That ’70s Show?'
  },
  options: [
    { en: '1970s', bs: '1970-im' },
    { en: '1980s', bs: '1980-im' },
    { en: '1960s', bs: '1960-im' },
    { en: '1990s', bs: '1990-im' },
  ],
  correctIndex: 0,
},
```

```typescript
{
  prompt: {
    en: 'What is the name of the small fictional town in Gilmore Girls?',
    bs: 'Kako se zove mali izmišljeni grad u seriji Gilmore Girls?'
  },
  options: [
    { en: 'Stars Hollow', bs: 'Stars Hollow' },
    { en: 'Pawnee', bs: 'Pawnee' },
    { en: 'Twin Peaks', bs: 'Twin Peaks' },
    { en: 'Cicely', bs: 'Cicely' },
  ],
  correctIndex: 0,
},
```

```typescript
{
  prompt: {
    en: 'What is the name of the fictional town in The Vampire Diaries?',
    bs: 'Kako se zove izmišljeni grad u seriji The Vampire Diaries?'
  },
  options: [
    { en: 'Mystic Falls', bs: 'Mystic Falls' },
    { en: 'Forks', bs: 'Forks' },
    { en: 'Sunnydale', bs: 'Sunnydale' },
    { en: 'Hawkins', bs: 'Hawkins' },
  ],
  correctIndex: 0,
},
```

```typescript
{
  prompt: {
    en: 'Riverdale is based on characters from which comic book universe?',
    bs: 'Riverdale je zasnovan na likovima iz kojeg stripovnog univerzuma?'
  },
  options: [
    { en: 'Archie Comics', bs: 'Archie Comics' },
    { en: 'DC Comics', bs: 'DC Comics' },
    { en: 'Marvel Comics', bs: 'Marvel Comics' },
    { en: 'Dark Horse Comics', bs: 'Dark Horse Comics' },
  ],
  correctIndex: 0,
},
```

```typescript
{
  prompt: {
    en: 'What is the name of the fictional Indiana town in Stranger Things?',
    bs: 'Kako se zove izmišljeni grad u Indiani u Stranger Things?'
  },
  options: [
    { en: 'Hawkins', bs: 'Hawkins' },
    { en: 'Mystic Falls', bs: 'Mystic Falls' },
    { en: 'Derry', bs: 'Derry' },
    { en: 'Riverdale', bs: 'Riverdale' },
  ],
  correctIndex: 0,
},
```

```typescript
{
  prompt: {
    en: 'Narcos tells the story of which infamous drug lord?',
    bs: 'Narcos priča priču o kojem poznatom narko-bosu?'
  },
  options: [
    { en: 'Pablo Escobar', bs: 'Pablu Escobaru' },
    { en: 'El Chapo', bs: 'El Chapu' },
    { en: 'Tony Montana', bs: 'Tonyju Montani' },
    { en: 'Griselda Blanco', bs: 'Griseldi Blanco' },
  ],
  correctIndex: 0,
},
```

```typescript
{
  prompt: {
    en: 'In The Umbrella Academy, what do all the adopted siblings have in common?',
    bs: 'U The Umbrella Academy, šta je zajedničko svoj usvojenoj djeci?'
  },
  options: [
    { en: 'They were all born on the same day', bs: 'Svi su rođeni istog dana' },
    { en: 'They all have the same last name at birth', bs: 'Svi imaju isto prezime po rođenju' },
    { en: 'They all grew up on the same street', bs: 'Svi su odrasli u istoj ulici' },
    { en: 'They are all twins', bs: 'Svi su blizanci' },
  ],
  correctIndex: 0,
},
```

```typescript
{
  prompt: {
    en: 'What genre best describes Outlander, which follows a woman who travels through time?',
    bs: 'Koji žanr najbolje opisuje Outlander, koji prati ženu koja putuje kroz vrijeme?'
  },
  options: [
    { en: 'Time-travel romance', bs: 'Romansa s putovanjem kroz vrijeme' },
    { en: 'Legal drama', bs: 'Pravna drama' },
    { en: 'Space opera', bs: 'Svemirska opera' },
    { en: 'Sitcom', bs: 'Sitkom' },
  ],
  correctIndex: 0,
},
```

```typescript
{
  prompt: {
    en: 'Downton Abbey is set at an English country estate during which era?',
    bs: 'Downton Abbey se dešava na engleskom seoskom imanju u kojoj eri?'
  },
  options: [
    { en: 'Early 20th century', bs: 'Ranom 20. vijeku' },
    { en: 'Victorian era', bs: 'Viktorijanskoj eri' },
    { en: 'Medieval times', bs: 'Srednjem vijeku' },
    { en: '1980s', bs: '1980-im' },
  ],
  correctIndex: 0,
},
```

```typescript
{
  prompt: {
    en: 'Chicago Fire, Chicago P.D., and Chicago Med are all set in which city?',
    bs: 'U kojem gradu se dešavaju Chicago Fire, Chicago P.D. i Chicago Med?'
  },
  options: [
    { en: 'Chicago', bs: 'Chicagu' },
    { en: 'Detroit', bs: 'Detroitu' },
    { en: 'New York', bs: 'New Yorku' },
    { en: 'Boston', bs: 'Bostonu' },
  ],
  correctIndex: 0,
},
```

```typescript
{
  prompt: {
    en: 'The original CSI: Crime Scene Investigation is set in which city?',
    bs: 'U kojem gradu se dešava originalni CSI: Crime Scene Investigation?'
  },
  options: [
    { en: 'Las Vegas', bs: 'Las Vegasu' },
    { en: 'Miami', bs: 'Miamiju' },
    { en: 'New York', bs: 'New Yorku' },
    { en: 'Los Angeles', bs: 'Los Angelesu' },
  ],
  correctIndex: 0,
},
```

```typescript
{
  prompt: {
    en: 'What kind of group does Sons of Anarchy center on?',
    bs: 'Na kakvu grupu se fokusira Sons of Anarchy?'
  },
  options: [
    { en: 'Motorcycle club members', bs: 'Članova motociklističkog kluba' },
    { en: 'Wall Street bankers', bs: 'Wall Street bankara' },
    { en: 'Navy SEALs', bs: 'Pomorskih specijalaca' },
    { en: 'Restaurant owners', bs: 'Vlasnika restorana' },
  ],
  correctIndex: 0,
},
```

```typescript
{
  prompt: {
    en: 'What kind of facility is Orange Is the New Black set inside?',
    bs: 'U kakvoj se ustanovi dešava Orange Is the New Black?'
  },
  options: [
    { en: 'Women’s prison', bs: 'Ženskog zatvora' },
    { en: 'Boarding school', bs: 'Internata' },
    { en: 'Hospital', bs: 'Bolnice' },
    { en: 'Cruise ship', bs: 'Kruzera' },
  ],
  correctIndex: 0,
},
```

```typescript
{
  prompt: {
    en: 'What is the name of the fictional college in Community?',
    bs: 'Kako se zove izmišljeni koledž u seriji Community?'
  },
  options: [
    { en: 'Greendale Community College', bs: 'Greendale Community College' },
    { en: 'Pawnee University', bs: 'Pawnee University' },
    { en: 'Sunnydale High', bs: 'Sunnydale High' },
    { en: 'Riverdale High', bs: 'Riverdale High' },
  ],
  correctIndex: 0,
},
```

```typescript
{
  prompt: {
    en: 'In New Girl, Jess moves into a loft with how many male roommates?',
    bs: 'U New Girl, Jess se seli u potkrovlje sa koliko cimera?'
  },
  options: [
    { en: 'Three', bs: 'Tri' },
    { en: 'Two', bs: 'Dva' },
    { en: 'Four', bs: 'Četiri' },
    { en: 'One', bs: 'Jedan' },
  ],
  correctIndex: 0,
},
```

```typescript
{
  prompt: {
    en: 'What jobs do the two main characters have in 2 Broke Girls?',
    bs: 'Čime se bave dvije glavne junakinje u 2 Broke Girls?'
  },
  options: [
    { en: 'Diner waitresses', bs: 'Konobarice u restoranu' },
    { en: 'Flight attendants', bs: 'Stjuardese' },
    { en: 'Fashion designers', bs: 'Modne dizajnerke' },
    { en: 'Nurses', bs: 'Medicinske sestre' },
  ],
  correctIndex: 0,
},
```

```typescript
{
  prompt: {
    en: 'What does Carly Shay do on her webshow in iCarly?',
    bs: 'Čime se Carly Shay bavi na svom web-showu u iCarly?'
  },
  options: [
    { en: 'Hosts a comedy webcast with her friends', bs: 'Vodi komičnu web-emisiju sa prijateljima' },
    { en: 'Reviews restaurants', bs: 'Recenzira restorane' },
    { en: 'Teaches cooking', bs: 'Predaje kuhanje' },
    { en: 'Solves mysteries', bs: 'Rješava zagonetke' },
  ],
  correctIndex: 0,
},
```

## Animation & Cartoons

```typescript
{
  prompt: {
    en: 'What kind of animal is the hero of the animated western Rango?',
    bs: 'Kakva je životinja glavni junak animiranog vesterna Rango?'
  },
  options: [
    { en: 'A pet chameleon', bs: 'Kućni kameleon' },
    { en: 'A desert rat', bs: 'Pustinjski pacov' },
    { en: 'A coyote', bs: 'Kojot' },
    { en: 'A tortoise', bs: 'Kornjača' },
  ],
  correctIndex: 0,
},
```

```typescript
{
  prompt: {
    en: 'In Tarzan, what kind of animal is Tarzan raised by?',
    bs: 'Kakva životinja odgaja Tarzana?'
  },
  options: [
    { en: 'Gorillas', bs: 'Gorile' },
    { en: 'Wolves', bs: 'Vukovi' },
    { en: 'Elephants', bs: 'Slonovi' },
    { en: 'Lions', bs: 'Lavovi' },
  ],
  correctIndex: 0,
},
```

```typescript
{
  prompt: {
    en: 'In Mulan, what does Mulan disguise herself as to join the army?',
    bs: 'U Mulan, u koga se Mulan preruši da bi se pridružila vojsci?'
  },
  options: [
    { en: 'A male soldier', bs: 'Muškog vojnika' },
    { en: 'A royal guard', bs: 'Kraljevskog stražara' },
    { en: 'A messenger boy', bs: 'Dječaka-glasnika' },
    { en: 'A blacksmith', bs: 'Kovača' },
  ],
  correctIndex: 0,
},
```

```typescript
{
  prompt: {
    en: 'What is the name of Lilo’s alien friend in Lilo & Stitch?',
    bs: 'Kako se zove Lilin vanzemaljski prijatelj u Lilo & Stitch?'
  },
  options: [
    { en: 'Stitch', bs: 'Stitch' },
    { en: 'Pleakley', bs: 'Pleakley' },
    { en: 'Jumba', bs: 'Jumba' },
    { en: 'Gantu', bs: 'Gantu' },
  ],
  correctIndex: 0,
},
```

```typescript
{
  prompt: {
    en: 'What is the name of the giant ape who climbs a famous New York skyscraper in King Kong?',
    bs: 'Kako se zove velika majmunska zvijer koja se penje na poznati new-yorški neboder u King Kongu?'
  },
  options: [
    { en: 'King Kong', bs: 'King Kong' },
    { en: 'Godzilla', bs: 'Godzilla' },
    { en: 'Mighty Joe Young', bs: 'Mighty Joe Young' },
    { en: 'Gorilla Grodd', bs: 'Gorilla Grodd' },
  ],
  correctIndex: 0,
},
```

```typescript
{
  prompt: {
    en: 'What is the name of the inflatable healthcare robot in Big Hero 6?',
    bs: 'Kako se zove naduvavajući medicinski robot u filmu Big Hero 6?'
  },
  options: [
    { en: 'Baymax', bs: 'Baymax' },
    { en: 'WALL-E', bs: 'WALL-E' },
    { en: 'EVE', bs: 'EVE' },
    { en: 'Bolt', bs: 'Bolt' },
  ],
  correctIndex: 0,
},
```

```typescript
{
  prompt: {
    en: 'In Avatar: The Legend of Korra, what element does Korra need to still learn to master at the start?',
    bs: 'U Legendi o Korri, koji element Korra tek treba savladati na početku?'
  },
  options: [
    { en: 'Airbending', bs: 'Vazduhom' },
    { en: 'Waterbending', bs: 'Vodom' },
    { en: 'Earthbending', bs: 'Zemljom' },
    { en: 'Firebending', bs: 'Vatrom' },
  ],
  correctIndex: 0,
},
```

```typescript
{
  prompt: {
    en: 'What is Kim Possible’s main extracurricular activity besides fighting villains?',
    bs: 'Čime se Kim Possible bavi osim borbe protiv negativaca?'
  },
  options: [
    { en: 'Cheerleading', bs: 'Navijačkim plesom' },
    { en: 'Swimming', bs: 'Plivanjem' },
    { en: 'Chess club', bs: 'Šahovskim klubom' },
    { en: 'Debate team', bs: 'Debatnim timom' },
  ],
  correctIndex: 0,
},
```

```typescript
{
  prompt: {
    en: 'In Encanto, what is special about the Madrigal family’s house?',
    bs: 'Šta je posebno kod kuće porodice Madrigal u Encantu?'
  },
  options: [
    { en: 'It is magical and alive', bs: 'Čarobna je i živa' },
    { en: 'It floats in the sky', bs: 'Lebdi u vazduhu' },
    { en: 'It is invisible', bs: 'Nevidljiva je' },
    { en: 'It can travel through time', bs: 'Može putovati kroz vrijeme' },
  ],
  correctIndex: 0,
},
```

```typescript
{
  prompt: {
    en: 'In Up, why does Carl tie thousands of balloons to his house?',
    bs: 'U Nebesima, zašto Carl veže hiljade balona za svoju kuću?'
  },
  options: [
    { en: 'To fly it to South America', bs: 'Da je odleti do Južne Amerike' },
    { en: 'To escape a flood', bs: 'Da pobjegne od poplave' },
    { en: 'To win a contest', bs: 'Da pobijedi na takmičenju' },
    { en: 'To impress his neighbors', bs: 'Da impresionira susjede' },
  ],
  correctIndex: 0,
},
```

```typescript
{
  prompt: {
    en: 'What kind of animal is the title character in Bambi?',
    bs: 'Kakva je životinja glavni lik u Bambiju?'
  },
  options: [
    { en: 'A deer', bs: 'Jelen' },
    { en: 'A rabbit', bs: 'Zec' },
    { en: 'A fox', bs: 'Lisica' },
    { en: 'A bear', bs: 'Medvjed' },
  ],
  correctIndex: 0,
},
```

```typescript
{
  prompt: {
    en: 'What is unique about the puppies in 101 Dalmatians?',
    bs: 'Šta je posebno kod kučića u filmu 101 Dalmatinac?'
  },
  options: [
    { en: 'They are covered in spots', bs: 'Prekriveni su pjegama' },
    { en: 'They can talk', bs: 'Mogu pričati' },
    { en: 'They can fly', bs: 'Mogu letjeti' },
    { en: 'They glow in the dark', bs: 'Svijetle u mraku' },
  ],
  correctIndex: 0,
},
```

```typescript
{
  prompt: {
    en: 'What does Cruella de Vil want the Dalmatian puppies for?',
    bs: 'Zašto Cruella de Vil želi dalmatinske kučiće?'
  },
  options: [
    { en: 'To make a fur coat from their spots', bs: 'Da napravi bundu od njihove šare' },
    { en: 'To sell them at a pet shop', bs: 'Da ih proda u prodavnici kućnih ljubimaca' },
    { en: 'To train them as guard dogs', bs: 'Da ih istrenira kao pse čuvare' },
    { en: 'To breed a new fashion trend', bs: 'Da stvori novi modni trend' },
  ],
  correctIndex: 0,
},
```

```typescript
{
  prompt: {
    en: 'What does Puss in Boots discover he is running out of in his spin-off film?',
    bs: 'Šta Mačak u čizmama otkrije da mu ponestaje u svom filmu?'
  },
  options: [
    { en: 'His nine lives', bs: 'Devet života' },
    { en: 'His magic boots', bs: 'Čarobnih čizama' },
    { en: 'His sword-fighting skill', bs: 'Vještine mačevanja' },
    { en: 'His charm', bs: 'Šarma' },
  ],
  correctIndex: 0,
},
```

```typescript
{
  prompt: {
    en: 'In Penguins of Madagascar, what is the penguins’ leader named?',
    bs: 'U Pingvinima s Madagaskara, kako se zove vođa pingvina?'
  },
  options: [
    { en: 'Skipper', bs: 'Skipper' },
    { en: 'Kowalski', bs: 'Kowalski' },
    { en: 'Rico', bs: 'Rico' },
    { en: 'Private', bs: 'Private' },
  ],
  correctIndex: 0,
},
```

```typescript
{
  prompt: {
    en: 'In Over the Hedge, what do the forest animals discover has been built near their home?',
    bs: 'U Preko ograde, šta životinje otkriju da je izgrađeno blizu njihovog doma?'
  },
  options: [
    { en: 'A suburban housing development', bs: 'Predgrađe s kućama' },
    { en: 'A theme park', bs: 'Zabavni park' },
    { en: 'A highway', bs: 'Autoput' },
    { en: 'A zoo', bs: 'Zoološki vrt' },
  ],
  correctIndex: 0,
},
```

```typescript
{
  prompt: {
    en: 'In Bolt, what does the dog Bolt mistakenly believe about himself?',
    bs: 'U Boltu, šta pas Bolt pogrešno vjeruje o sebi?'
  },
  options: [
    { en: 'That he has real superpowers', bs: 'Da ima stvarne superzmoći' },
    { en: 'That he is a cat', bs: 'Da je mačka' },
    { en: 'That he can talk to humans', bs: 'Da može pričati sa ljudima' },
    { en: 'That he is royalty', bs: 'Da je plemić' },
  ],
  correctIndex: 0,
},
```

```typescript
{
  prompt: {
    en: 'In Beauty and the Beast, what must happen before the last petal falls to break the curse?',
    bs: 'U Ljepotici i zvijeri, šta se mora desiti prije nego opadne posljednja latica da bi se skinula čarolija?'
  },
  options: [
    { en: 'The Beast must learn to love and be loved', bs: 'Zvijer mora naučiti voljeti i biti voljena' },
    { en: 'The Beast must defeat Gaston', bs: 'Zvijer mora pobijediti Gastona' },
    { en: 'Belle must leave the castle forever', bs: 'Belle mora zauvijek napustiti zamak' },
    { en: 'The servants must become human again first', bs: 'Sluge se moraju prve pretvoriti u ljude' },
  ],
  correctIndex: 0,
},
```

```typescript
{
  prompt: {
    en: 'What causes the chaos in Cloudy with a Chance of Meatballs?',
    bs: 'Šta uzrokuje haos u filmu Oblačno s ćuftama?'
  },
  options: [
    { en: 'A machine that turns water into food', bs: 'Mašina koja pretvara vodu u hranu' },
    { en: 'A magical cooking pot', bs: 'Čarobni lonac za kuhanje' },
    { en: 'A talking refrigerator', bs: 'Frižider koji priča' },
    { en: 'A wish granted by a genie', bs: 'Želja koju ispuni duh' },
  ],
  correctIndex: 0,
},
```

```typescript
{
  prompt: {
    en: 'In Bee Movie, what does the bee Barry sue humans for?',
    bs: 'U Bee Movieu, zbog čega pčela Barry tuži ljude?'
  },
  options: [
    { en: 'Stealing honey from bees', bs: 'Krađe meda od pčela' },
    { en: 'Destroying flowers', bs: 'Uništavanja cvijeća' },
    { en: 'Polluting the hive', bs: 'Zagađivanja košnice' },
    { en: 'Trapping bees in jars', bs: 'Hvatanja pčela u tegle' },
  ],
  correctIndex: 0,
},
```

```typescript
{
  prompt: {
    en: 'Which member of The Incredibles has the power of ice and appears as a family friend named Frozone?',
    bs: 'Ko od porodičnih prijatelja u The Incredibles ima moć leda i zove se Frozone?'
  },
  options: [
    { en: 'Lucius Best', bs: 'Lucius Best' },
    { en: 'Bob Parr', bs: 'Bob Parr' },
    { en: 'Syndrome', bs: 'Syndrome' },
    { en: 'Edna Mode', bs: 'Edna Mode' },
  ],
  correctIndex: 0,
},
```

```typescript
{
  prompt: {
    en: 'In Wreck-It Ralph, which video game does Ralph originally live in?',
    bs: 'U Razbijaču Ralphu, u kojoj video igri Ralph originalno živi?'
  },
  options: [
    { en: 'Fix-It Felix Jr.', bs: 'Fix-It Felix Jr.' },
    { en: 'Sugar Rush', bs: 'Sugar Rush' },
    { en: 'Hero’s Duty', bs: 'Hero’s Duty' },
    { en: 'Space Invaders', bs: 'Space Invaders' },
  ],
  correctIndex: 0,
},
```

```typescript
{
  prompt: {
    en: 'What is Judy Hopps’s job in Zootopia?',
    bs: 'Čime se bavi Judy Hopps u Zootopiji?'
  },
  options: [
    { en: 'Police officer', bs: 'Policajka' },
    { en: 'Mayor', bs: 'Gradonačelnica' },
    { en: 'Reporter', bs: 'Novinarka' },
    { en: 'Lawyer', bs: 'Advokatica' },
  ],
  correctIndex: 0,
},
```

```typescript
{
  prompt: {
    en: 'What was the Madrigal family business in Coco’s hometown, Santa Cecilia?',
    bs: 'Čime se bavi porodica Rivera u Cocu, u rodnom gradu Santa Cecilia?'
  },
  options: [
    { en: 'Shoemaking', bs: 'Izradom cipela' },
    { en: 'Music teaching', bs: 'Podučavanjem muzike' },
    { en: 'Baking', bs: 'Pekarstvom' },
    { en: 'Farming', bs: 'Poljoprivredom' },
  ],
  correctIndex: 0,
},
```

```typescript
{
  prompt: {
    en: 'What does the Crood family have to do after their cave is destroyed in The Croods?',
    bs: 'Šta porodica Krkalj mora učiniti nakon što im je pećina uništena u Krkaljima?'
  },
  options: [
    { en: 'Find a new place to live', bs: 'Pronaći novo mjesto za život' },
    { en: 'Build a spaceship', bs: 'Izgraditi svemirski brod' },
    { en: 'Tame wild dinosaurs', bs: 'Ukrotiti divlje dinosauruse' },
    { en: 'Start a farm', bs: 'Pokrenuti farmu' },
  ],
  correctIndex: 0,
},
```

```typescript
{
  prompt: {
    en: 'What creatures do the main characters befriend in Trolls?',
    bs: 'S kim se glavni likovi sprijatelje u Trolls?'
  },
  options: [
    { en: 'Bergens', bs: 'Bergenima' },
    { en: 'Ogres', bs: 'Ograma' },
    { en: 'Gnomes', bs: 'Patuljcima' },
    { en: 'Fairies', bs: 'Vilama' },
  ],
  correctIndex: 0,
},
```

```typescript
{
  prompt: {
    en: 'In Sing, what event does Buster Moon organize to save his theater?',
    bs: 'U Sing, koji događaj Buster Moon organizuje da spasi svoje pozorište?'
  },
  options: [
    { en: 'A singing competition', bs: 'Pjevačko takmičenje' },
    { en: 'A dance marathon', bs: 'Plesni maraton' },
    { en: 'A talent auction', bs: 'Aukciju talenata' },
    { en: 'A comedy show', bs: 'Komičarsku emisiju' },
  ],
  correctIndex: 0,
},
```

```typescript
{
  prompt: {
    en: 'In Luca, what secret do Luca and his friend Alberto hide from humans?',
    bs: 'U Luci, koju tajnu Luca i njegov prijatelj Alberto skrivaju od ljudi?'
  },
  options: [
    { en: 'They are sea monsters that turn human on land', bs: 'Morska su čudovišta koja se na suhom pretvore u ljude' },
    { en: 'They are royalty in disguise', bs: 'Prerušeni su plemići' },
    { en: 'They can talk to fish', bs: 'Mogu pričati sa ribama' },
    { en: 'They are wanted by pirates', bs: 'Traže ih gusari' },
  ],
  correctIndex: 0,
},
```

```typescript
{
  prompt: {
    en: 'In Turning Red, what does Mei transform into when her emotions run high?',
    bs: 'U Turning Red, u šta se Mei pretvori kada joj se emocije uzbude?'
  },
  options: [
    { en: 'A giant red panda', bs: 'Velika crvena panda' },
    { en: 'A dragon', bs: 'Zmaj' },
    { en: 'A wolf', bs: 'Vuk' },
    { en: 'A phoenix', bs: 'Feniks' },
  ],
  correctIndex: 0,
},
```

```typescript
{
  prompt: {
    en: 'In Soul, what realm does Joe’s soul travel to before he is born to earth?',
    bs: 'U Soul, u koje carstvo Joeova duša putuje prije rođenja na Zemlji?'
  },
  options: [
    { en: 'The Great Before', bs: 'Prije Svega' },
    { en: 'The Underworld', bs: 'Podzemni svijet' },
    { en: 'The Spirit Realm', bs: 'Duhovno carstvo' },
    { en: 'The Dreamscape', bs: 'Svijet snova' },
  ],
  correctIndex: 0,
},
```

```typescript
{
  prompt: {
    en: 'What is the name of the origin-story film about a young chocolatier who dreams of opening his own shop?',
    bs: 'Kako se zove film o mladom čokoladžiji koji sanja o otvaranju svoje radnje?'
  },
  options: [
    { en: 'Wonka', bs: 'Wonka' },
    { en: 'Chocolat', bs: 'Chocolat' },
    { en: 'Sugar Rush', bs: 'Sugar Rush' },
    { en: 'The Sweet Life', bs: 'The Sweet Life' },
  ],
  correctIndex: 0,
},
```

```typescript
{
  prompt: {
    en: 'What is Klaus about, in the animated film of the same name?',
    bs: 'O čemu govori animirani film Klaus?'
  },
  options: [
    { en: 'The origin story of Santa Claus', bs: 'Priča o porijeklu Djeda Mraza' },
    { en: 'A robot who learns to love', bs: 'Robotu koji uči voljeti' },
    { en: 'A wizard’s apprentice', bs: 'Čarobnjakovom šegrtu' },
    { en: 'A talking reindeer', bs: 'Sobu koji priča' },
  ],
  correctIndex: 0,
},
```

```typescript
{
  prompt: {
    en: 'In Hotel Transylvania, which classic monster runs the hotel?',
    bs: 'U Hotel Transylvania, koje klasično čudovište vodi hotel?'
  },
  options: [
    { en: 'Count Dracula', bs: 'Grof Drakula' },
    { en: 'Frankenstein’s monster', bs: 'Frankeštajnovo čudovište' },
    { en: 'The Mummy', bs: 'Mumija' },
    { en: 'The Invisible Man', bs: 'Nevidljivi čovjek' },
  ],
  correctIndex: 0,
},
```

```typescript
{
  prompt: {
    en: 'In My Neighbor Totoro, what kind of creature is Totoro?',
    bs: 'U My Neighbor Totoro, kakvo je stvorenje Totoro?'
  },
  options: [
    { en: 'A large forest spirit', bs: 'Veliki šumski duh' },
    { en: 'A talking cat', bs: 'Mačka koja priča' },
    { en: 'A tiny fairy', bs: 'Sitna vila' },
    { en: 'A robot', bs: 'Robot' },
  ],
  correctIndex: 0,
},
```

```typescript
{
  prompt: {
    en: 'In Kiki’s Delivery Service, what job does young witch Kiki start doing?',
    bs: 'U Kiki’s Delivery Service, čime se mlada vještica Kiki počinje baviti?'
  },
  options: [
    { en: 'Delivering packages by broomstick', bs: 'Dostavom paketa na metli' },
    { en: 'Baking bread', bs: 'Pečenjem hljeba' },
    { en: 'Fortune telling', bs: 'Proricanjem sudbine' },
    { en: 'Teaching magic', bs: 'Podučavanjem magije' },
  ],
  correctIndex: 0,
},
```

```typescript
{
  prompt: {
    en: 'What do Rugrats mainly show the world from the perspective of?',
    bs: 'Iz čije perspektive Rugrats prikazuju svijet?'
  },
  options: [
    { en: 'Babies and toddlers', bs: 'Bebe i malu djecu' },
    { en: 'Teenagers', bs: 'Tinejdžere' },
    { en: 'Grandparents', bs: 'Bake i djedove' },
    { en: 'Pets', bs: 'Kućne ljubimce' },
  ],
  correctIndex: 0,
},
```

```typescript
{
  prompt: {
    en: 'In Hey Arnold!, what is unusual about Arnold’s head shape?',
    bs: 'Šta je neobično u obliku Arnoldove glave u Hey Arnold!?'
  },
  options: [
    { en: 'It is shaped like a football', bs: 'Oblik joj podsjeća na fudbalsku loptu' },
    { en: 'It is square', bs: 'Kvadratnog je oblika' },
    { en: 'It is triangular', bs: 'Trougaonog je oblika' },
    { en: 'It glows in the dark', bs: 'Svijetli u mraku' },
  ],
  correctIndex: 0,
},
```

```typescript
{
  prompt: {
    en: 'What are the names of the three Powerpuff Girls?',
    bs: 'Kako se zovu tri Šmokljanke (Powerpuff Girls)?'
  },
  options: [
    { en: 'Blossom, Bubbles, and Buttercup', bs: 'Blossom, Bubbles i Buttercup' },
    { en: 'Daisy, Violet, and Rose', bs: 'Daisy, Violet i Rose' },
    { en: 'Ruby, Sapphire, and Pearl', bs: 'Ruby, Sapphire i Pearl' },
    { en: 'Misty, Dawn, and May', bs: 'Misty, Dawn i May' },
  ],
  correctIndex: 0,
},
```

```typescript
{
  prompt: {
    en: 'What are Finn and Jake’s species in Adventure Time?',
    bs: 'Šta su Finn i Jake po vrsti u Adventure Time?'
  },
  options: [
    { en: 'A human boy and a magical dog', bs: 'Ljudski dječak i čarobni pas' },
    { en: 'Two robots', bs: 'Dva robota' },
    { en: 'Two wizards', bs: 'Dva čarobnjaka' },
    { en: 'A vampire and a ghost', bs: 'Vampir i duh' },
  ],
  correctIndex: 0,
},
```

```typescript
{
  prompt: {
    en: 'What are the twins’ names in Gravity Falls?',
    bs: 'Kako se zovu blizanci u Gravity Fallsu?'
  },
  options: [
    { en: 'Dipper and Mabel', bs: 'Dipper i Mabel' },
    { en: 'Phineas and Candace', bs: 'Phineas i Candace' },
    { en: 'Timmy and Tammy', bs: 'Timmy i Tammy' },
    { en: 'Ed and Eddy', bs: 'Ed i Eddy' },
  ],
  correctIndex: 0,
},
```

```typescript
{
  prompt: {
    en: 'What are Steven Universe and his fellow protectors of Earth collectively called?',
    bs: 'Kako se zajedno zovu Steven Universe i njegovi zaštitnici Zemlje?'
  },
  options: [
    { en: 'The Crystal Gems', bs: 'Kristalni dragulji' },
    { en: 'The Guardians', bs: 'Čuvari' },
    { en: 'The Avengers', bs: 'Osvetnici' },
    { en: 'The Titans', bs: 'Titani' },
  ],
  correctIndex: 0,
},
```

```typescript
{
  prompt: {
    en: 'What disability does the earthbender Toph have in Avatar: The Last Airbender?',
    bs: 'Kakav je Tophin hendikep u Avatar: The Last Airbender?'
  },
  options: [
    { en: 'She is blind', bs: 'Slijepa je' },
    { en: 'She cannot speak', bs: 'Ne može govoriti' },
    { en: 'She cannot walk', bs: 'Ne može hodati' },
    { en: 'She is deaf', bs: 'Gluva je' },
  ],
  correctIndex: 0,
},
```

```typescript
{
  prompt: {
    en: 'What weapon does Samurai Jack wield throughout the series?',
    bs: 'Kojim oružjem se Samurai Jack bori tokom serije?'
  },
  options: [
    { en: 'A magic sword', bs: 'Čarobni mač' },
    { en: 'A bow', bs: 'Luk' },
    { en: 'A pair of nunchucks', bs: 'Nunčake' },
    { en: 'A spear', bs: 'Koplje' },
  ],
  correctIndex: 0,
},
```

```typescript
{
  prompt: {
    en: 'What is Morty’s last name in Rick and Morty?',
    bs: 'Kako je Mortyjevo prezime u Rick and Morty?'
  },
  options: [
    { en: 'Smith', bs: 'Smith' },
    { en: 'Sanchez', bs: 'Sanchez' },
    { en: 'Jones', bs: 'Jones' },
    { en: 'Brown', bs: 'Brown' },
  ],
  correctIndex: 0,
},
```

```typescript
{
  prompt: {
    en: 'What animal is BoJack in BoJack Horseman?',
    bs: 'Kakva je životinja BoJack u BoJack Horsemanu?'
  },
  options: [
    { en: 'A horse', bs: 'Konj' },
    { en: 'A dog', bs: 'Pas' },
    { en: 'A cat', bs: 'Mačka' },
    { en: 'A donkey', bs: 'Magarac' },
  ],
  correctIndex: 0,
},
```

```typescript
{
  prompt: {
    en: 'What is unusual about the Griffin family dog Brian in Family Guy?',
    bs: 'Šta je neobično kod psa Briana u porodici Griffin u Family Guyu?'
  },
  options: [
    { en: 'He can talk and walk upright', bs: 'Može pričati i hodati uspravno' },
    { en: 'He can fly', bs: 'Može letjeti' },
    { en: 'He is invisible', bs: 'Nevidljiv je' },
    { en: 'He never ages', bs: 'Nikad ne stari' },
  ],
  correctIndex: 0,
},
```

```typescript
{
  prompt: {
    en: 'In South Park, what famously happens to Kenny in almost every episode?',
    bs: 'U South Parku, šta se poznato dešava Kennyju u skoro svakoj epizodi?'
  },
  options: [
    { en: 'He dies', bs: 'On umre' },
    { en: 'He wins the lottery', bs: 'On osvoji na lutriji' },
    { en: 'He loses his voice', bs: 'Izgubi glas' },
    { en: 'He moves away', bs: 'On se preseli' },
  ],
  correctIndex: 0,
},
```

```typescript
{
  prompt: {
    en: 'What is the name of SpongeBob’s pet snail?',
    bs: 'Kako se zove SpongeBobov kućni ljubimac, puž?'
  },
  options: [
    { en: 'Gary', bs: 'Gary' },
    { en: 'Larry', bs: 'Larry' },
    { en: 'Barry', bs: 'Barry' },
    { en: 'Terry', bs: 'Terry' },
  ],
  correctIndex: 0,
},
```

```typescript
{
  prompt: {
    en: 'What is Naruto’s biggest dream throughout the series?',
    bs: 'Šta je Narutov najveći san tokom serijala?'
  },
  options: [
    { en: 'To become Hokage', bs: 'Postati Hokage' },
    { en: 'To defeat all Digimon', bs: 'Pobijediti sve Digimone' },
    { en: 'To become a pirate king', bs: 'Postati kralj pirata' },
    { en: 'To catch every Pokémon', bs: 'Uhvatiti svakog Pokémona' },
  ],
  correctIndex: 0,
},
```

```typescript
{
  prompt: {
    en: 'How does Monkey D. Luffy gain his rubber-like stretching powers in One Piece?',
    bs: 'Kako Monkey D. Luffy dobije moć rastezanja u One Pieceu?'
  },
  options: [
    { en: 'By eating a Devil Fruit', bs: 'Jedući Voće Đavola' },
    { en: 'Through years of training', bs: 'Godinama treninga' },
    { en: 'From a magic potion', bs: 'Čarobnim napitkom' },
    { en: 'By a wizard’s curse', bs: 'Čarobnjakovom kletvom' },
  ],
  correctIndex: 0,
},
```

```typescript
{
  prompt: {
    en: 'What species is Goku originally from in Dragon Ball?',
    bs: 'Koje je vrste Goku porijeklom u Dragon Ballu?'
  },
  options: [
    { en: 'Saiyan', bs: 'Sajanac' },
    { en: 'Namekian', bs: 'Namekijanac' },
    { en: 'Human', bs: 'Čovjek' },
    { en: 'Android', bs: 'Android' },
  ],
  correctIndex: 0,
},
```

```typescript
{
  prompt: {
    en: 'What is the ultimate goal of a Pokémon trainer like Ash Ketchum?',
    bs: 'Koji je krajnji cilj Pokémon trenera kao što je Ash Ketchum?'
  },
  options: [
    { en: 'To become a Pokémon Master', bs: 'Postati Pokémon Majstor' },
    { en: 'To open a Pokémon shop', bs: 'Otvoriti Pokémon prodavnicu' },
    { en: 'To become a scientist', bs: 'Postati naučnik' },
    { en: 'To retire on a farm', bs: 'Otići u penziju na farmi' },
  ],
  correctIndex: 0,
},
```

```typescript
{
  prompt: {
    en: 'What is the process called when a Digimon transforms into a stronger form?',
    bs: 'Kako se zove proces kada se Digimon transformiše u jači oblik?'
  },
  options: [
    { en: 'Digivolution', bs: 'Digievolucija' },
    { en: 'Digimorphing', bs: 'Digimorfiranje' },
    { en: 'Digiascension', bs: 'Digiuzdizanje' },
    { en: 'Digiupgrade', bs: 'Digiunapređenje' },
  ],
  correctIndex: 0,
},
```

```typescript
{
  prompt: {
    en: 'In Teen Titans, who is the team’s usual leader?',
    bs: 'U Teen Titans, ko je uobičajeni vođa tima?'
  },
  options: [
    { en: 'Robin', bs: 'Robin' },
    { en: 'Beast Boy', bs: 'Beast Boy' },
    { en: 'Cyborg', bs: 'Cyborg' },
    { en: 'Starfire', bs: 'Starfire' },
  ],
  correctIndex: 0,
},
```

```typescript
{
  prompt: {
    en: 'What is the setting of the animated series Bluey, about a family of dogs?',
    bs: 'Gdje se dešava crtana serija Bluey, o porodici pasa?'
  },
  options: [
    { en: 'Australia', bs: 'Australija' },
    { en: 'United Kingdom', bs: 'Velika Britanija' },
    { en: 'Canada', bs: 'Kanada' },
    { en: 'New Zealand', bs: 'Novi Zeland' },
  ],
  correctIndex: 0,
},
```

```typescript
{
  prompt: {
    en: 'In Paw Patrol, what does the team of rescue pups do?',
    bs: 'Šta radi ekipa spasilačkih kučića u Patrolnim šapama?'
  },
  options: [
    { en: 'Rescue people and animals in their town', bs: 'Spašavaju ljude i životinje u svom gradu' },
    { en: 'Compete in dog shows', bs: 'Takmiče se na pas-show-ovima' },
    { en: 'Deliver mail', bs: 'Dostavljaju poštu' },
    { en: 'Guard a castle', bs: 'Čuvaju zamak' },
  ],
  correctIndex: 0,
},
```

## Fun Facts

```typescript
{
  prompt: {
    en: 'In which year was the wreck of the real Titanic ship discovered on the ocean floor?',
    bs: 'Koje godine je otkrivena olupina stvarnog broda Titanik na dnu okeana?'
  },
  options: [
    { en: '1985', bs: '1985.' },
    { en: '1912', bs: '1912.' },
    { en: '1997', bs: '1997.' },
    { en: '2001', bs: '2001.' },
  ],
  correctIndex: 0,
},
```

```typescript
{
  prompt: {
    en: 'What nearly destroyed most of the completed work on Toy Story 2 during production?',
    bs: 'Šta je skoro uništilo veći dio urađenog posla na Toy Story 2 tokom produkcije?'
  },
  options: [
    { en: 'An accidental file deletion', bs: 'Slučajno brisanje fajlova' },
    { en: 'A studio fire', bs: 'Požar u studiju' },
    { en: 'A flood in the office', bs: 'Poplava u kancelariji' },
    { en: 'A computer virus', bs: 'Kompjuterski virus' },
  ],
  correctIndex: 0,
},
```

```typescript
{
  prompt: {
    en: 'What is the name of the famous stock sound effect used in hundreds of films, including Star Wars and Lord of the Rings?',
    bs: 'Kako se zove poznati zvučni efekat korišten u stotinama filmova, uključujući Ratove zvijezda i Gospodara prstenova?'
  },
  options: [
    { en: 'The Wilhelm Scream', bs: 'Wilhelmov krik' },
    { en: 'The Skywalker Sound', bs: 'Skywalker zvuk' },
    { en: 'The Hollywood Howl', bs: 'Hollywood zavijanje' },
    { en: 'The Universal Roar', bs: 'Universal urlik' },
  ],
  correctIndex: 0,
},
```

```typescript
{
  prompt: {
    en: 'Who performed the puppetry and voice for Yoda in the original Star Wars trilogy?',
    bs: 'Ko je animirao lutku i glasovno tumačio Yodu u originalnoj trilogiji Ratova zvijezda?'
  },
  options: [
    { en: 'Frank Oz', bs: 'Frank Oz' },
    { en: 'Jim Henson', bs: 'Jim Henson' },
    { en: 'Kenny Baker', bs: 'Kenny Baker' },
    { en: 'Anthony Daniels', bs: 'Anthony Daniels' },
  ],
  correctIndex: 0,
},
```

```typescript
{
  prompt: {
    en: 'Which tech entrepreneur was a co-founder and major early investor of Pixar Animation Studios?',
    bs: 'Koji tehnološki poduzetnik je bio ko-osnivač i glavni raniji investitor Pixar Animation Studios?'
  },
  options: [
    { en: 'Steve Jobs', bs: 'Steve Jobs' },
    { en: 'Bill Gates', bs: 'Bill Gates' },
    { en: 'Elon Musk', bs: 'Elon Musk' },
    { en: 'Jeff Bezos', bs: 'Jeff Bezos' },
  ],
  correctIndex: 0,
},
```

```typescript
{
  prompt: {
    en: 'The dinosaur roars in Jurassic Park were partly created using sounds from which real animals?',
    bs: 'Urlici dinosaurusa u Jurassic Parku su djelimično napravljeni koristeći zvukove kojih stvarnih životinja?'
  },
  options: [
    { en: 'Tortoises and baby elephants', bs: 'Kornjača i slonovskih mladunčadi' },
    { en: 'Lions and tigers', bs: 'Lavova i tigrova' },
    { en: 'Whales and dolphins', bs: 'Kitova i dolfina' },
    { en: 'Horses and cows', bs: 'Konja i krava' },
  ],
  correctIndex: 0,
},
```

```typescript
{
  prompt: {
    en: 'Which song from The Lion King won the Academy Award for Best Original Song?',
    bs: 'Koja pjesma iz Kralja lavova je osvojila Oscara za najbolju originalnu pjesmu?'
  },
  options: [
    { en: 'Can You Feel the Love Tonight', bs: 'Can You Feel the Love Tonight' },
    { en: 'Circle of Life', bs: 'Circle of Life' },
    { en: 'Hakuna Matata', bs: 'Hakuna Matata' },
    { en: 'Be Prepared', bs: 'Be Prepared' },
  ],
  correctIndex: 0,
},
```

```typescript
{
  prompt: {
    en: 'Which actor was originally cast as the voice of Shrek before passing away and being replaced by Mike Myers?',
    bs: 'Koji glumac je originalno bio angažovan za glas Shreka prije nego što je preminuo i zamijenjen Mikeom Myersom?'
  },
  options: [
    { en: 'Chris Farley', bs: 'Chris Farley' },
    { en: 'John Candy', bs: 'John Candy' },
    { en: 'John Belushi', bs: 'John Belushi' },
    { en: 'Phil Hartman', bs: 'Phil Hartman' },
  ],
  correctIndex: 0,
},
```

```typescript
{
  prompt: {
    en: 'Before Avengers: Endgame overtook it, which film held the all-time box office record for over a decade?',
    bs: 'Prije nego što ga je pretekao Avengers: Endgame, koji film je preko decenije držao rekord po zaradi svih vremena?'
  },
  options: [
    { en: 'Avatar', bs: 'Avatar' },
    { en: 'Titanic', bs: 'Titanic' },
    { en: 'Star Wars', bs: 'Star Wars' },
    { en: 'Jurassic Park', bs: 'Jurassic Park' },
  ],
  correctIndex: 0,
},
```

```typescript
{
  prompt: {
    en: 'What was used to simulate blood in the famous black-and-white shower scene in Psycho?',
    bs: 'Šta je korišteno da simulira krv u poznatoj crno-bijeloj sceni pod tušem u Psychu?'
  },
  options: [
    { en: 'Chocolate syrup', bs: 'Sirup od čokolade' },
    { en: 'Red paint', bs: 'Crvena boja' },
    { en: 'Ketchup', bs: 'Kečap' },
    { en: 'Cranberry juice', bs: 'Sok od brusnice' },
  ],
  correctIndex: 0,
},
```

```typescript
{
  prompt: {
    en: 'What candy brand became famous after being used in E.T. the Extra-Terrestrial, after M&M’s turned down the offer?',
    bs: 'Koji brend bombona je postao poznat nakon što je korišten u E.T. the Extra-Terrestrial, nakon što je M&M’s odbio ponudu?'
  },
  options: [
    { en: 'Reese’s Pieces', bs: 'Reese’s Pieces' },
    { en: 'Skittles', bs: 'Skittles' },
    { en: 'Starburst', bs: 'Starburst' },
    { en: 'Gummy Bears', bs: 'Gumene bombone' },
  ],
  correctIndex: 0,
},
```

```typescript
{
  prompt: {
    en: 'Which song from Frozen won the Academy Award for Best Original Song?',
    bs: 'Koja pjesma iz Frozen je osvojila Oscara za najbolju originalnu pjesmu?'
  },
  options: [
    { en: 'Let It Go', bs: 'Let It Go' },
    { en: 'Do You Want to Build a Snowman?', bs: 'Do You Want to Build a Snowman?' },
    { en: 'For the First Time in Forever', bs: 'For the First Time in Forever' },
    { en: 'Love Is an Open Door', bs: 'Love Is an Open Door' },
  ],
  correctIndex: 0,
},
```

```typescript
{
  prompt: {
    en: 'What was the real name of the dog who played Toto in The Wizard of Oz?',
    bs: 'Kako se zvao pravim imenom pas koji je glumio Tota u Čarobnjaku iz Oza?'
  },
  options: [
    { en: 'Terry', bs: 'Terry' },
    { en: 'Rex', bs: 'Rex' },
    { en: 'Buddy', bs: 'Buddy' },
    { en: 'Max', bs: 'Max' },
  ],
  correctIndex: 0,
},
```

```typescript
{
  prompt: {
    en: 'Roughly how many years did it take to film the entire main Harry Potter movie series with the same young cast?',
    bs: 'Koliko je približno godina trajalo snimanje cijelog glavnog serijala filmova o Harryju Potteru s istom mladom glumačkom postavom?'
  },
  options: [
    { en: 'About 10 years', bs: 'Oko 10 godina' },
    { en: 'About 3 years', bs: 'Oko 3 godine' },
    { en: 'About 20 years', bs: 'Oko 20 godina' },
    { en: 'About 1 year', bs: 'Oko 1 godinu' },
  ],
  correctIndex: 0,
},
```

```typescript
{
  prompt: {
    en: 'In which city was The Sound of Music largely filmed on location?',
    bs: 'U kojem gradu je najveći dio The Sound of Music snimljen na lokaciji?'
  },
  options: [
    { en: 'Salzburg, Austria', bs: 'Salzburgu, Austrija' },
    { en: 'Vienna, Austria', bs: 'Beču, Austrija' },
    { en: 'Munich, Germany', bs: 'Minhenu, Njemačka' },
    { en: 'Zurich, Switzerland', bs: 'Cirihu, Švicarska' },
  ],
  correctIndex: 0,
},
```

```typescript
{
  prompt: {
    en: 'Which director made both Titanic and Avatar, two of the highest-grossing films ever?',
    bs: 'Koji režiser je snimio i Titanic i Avatar, dva od najzarađenijih filmova svih vremena?'
  },
  options: [
    { en: 'James Cameron', bs: 'James Cameron' },
    { en: 'Steven Spielberg', bs: 'Steven Spielberg' },
    { en: 'Peter Jackson', bs: 'Peter Jackson' },
    { en: 'Ridley Scott', bs: 'Ridley Scott' },
  ],
  correctIndex: 0,
},
```

```typescript
{
  prompt: {
    en: 'What was unusual about the box office success of Home Alone when it was first released?',
    bs: 'Šta je bilo neobično u vezi s uspjehom filma Sam u kući na blagajnama kada je prvi put objavljen?'
  },
  options: [
    { en: 'It became the highest-grossing comedy of its time', bs: 'Postao je najzarađenija komedija tog vremena' },
    { en: 'It was banned in several countries', bs: 'Bio je zabranjen u nekoliko zemalja' },
    { en: 'It lost money in theaters', bs: 'Izgubio je novac u bioskopima' },
    { en: 'It was released only on video', bs: 'Objavljen je samo na videu' },
  ],
  correctIndex: 0,
},
```

```typescript
{
  prompt: {
    en: 'Which classic horror film was temporarily banned from home video release in the UK for several years?',
    bs: 'Koji klasični horor film je privremeno bio zabranjen za izdavanje na videu u Velikoj Britaniji nekoliko godina?'
  },
  options: [
    { en: 'The Exorcist', bs: 'Egzorcist' },
    { en: 'Jaws', bs: 'Ralje' },
    { en: 'Halloween', bs: 'Halloween' },
    { en: 'Psycho', bs: 'Psycho' },
  ],
  correctIndex: 0,
},
```

```typescript
{
  prompt: {
    en: 'What made the character Baby Yoda (Grogu) from The Mandalorian an internet sensation almost overnight?',
    bs: 'Šta je učinilo lika Baby Yodu (Grogu) iz The Mandalorian internetskom senzacijom preko noći?'
  },
  options: [
    { en: 'His widely shared cute reaction memes and images', bs: 'Njegovi široko podijeljeni slatki memovi i slike' },
    { en: 'A viral dance he performed', bs: 'Viralni ples koji je izveo' },
    { en: 'A controversial plot twist', bs: 'Kontroverzni obrt u priči' },
    { en: 'A crossover with Star Trek', bs: 'Crossover sa Star Trekom' },
  ],
  correctIndex: 0,
},
```

```typescript
{
  prompt: {
    en: 'Why do many animated films use exaggerated, bouncy “squash and stretch” movement for characters?',
    bs: 'Zašto mnogi animirani filmovi koriste preuveličan, elastičan “squash and stretch” pokret za likove?'
  },
  options: [
    { en: 'It makes motion feel more alive and appealing', bs: 'Pokret djeluje življe i privlačnije' },
    { en: 'It saves rendering time', bs: 'Štedi vrijeme renderovanja' },
    { en: 'It was required by early film cameras', bs: 'Bilo je obavezno zbog ranih filmskih kamera' },
    { en: 'It reduces file size', bs: 'Smanjuje veličinu fajla' },
  ],
  correctIndex: 0,
},
```


