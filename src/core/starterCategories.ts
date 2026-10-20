// The starter categories with the keywords (regular expressions) of their default rules.
export type StarterCategory = {
  name: string
  keywords?: string
  children?: StarterCategory[]
}

export const incomeCategories: StarterCategory[] = [
  {
    name: 'Loon',
    keywords: String.raw`\bloon\b|salaris|wedde|\bpaie\b|eindejaarspremie|premie werkgever|vakantiegeld`
  },
  { name: 'Terugbetalingen (mutualiteit)', keywords: 'terugbetaling|tegemoetkoming' },
  {
    name: 'Uitkeringen & toelagen',
    keywords: String.raw`kinderbijslag|groeipakket|uitkering|werkloosheid|\brva\b|rijksdienst|pensioen(?!sparen)|\bsfpd\b|riziv|tijdskrediet|loopbaanonderbreking|energiepremie|vlaamse overheid`
  },
  { name: 'Overige inkomsten' }
]

export const expenseCategories: StarterCategory[] = [
  {
    name: 'Huisdieren',
    keywords: String.raw`zooplus|maxi zoo|dierenhandel|dierapothe|dierenarts|dierenspeciaalzaak|pets place|tom ?& ?co|dierenkliniek|dierenwinkel|dierenasiel|trimsalon|dierenpension|hondenschool|dierenvoeding|brekz|dierenzorg|veearts`
  },
  {
    name: 'Contant geld',
    keywords: String.raw`geldopneming|\bcash\b|geldautomaat|\batm\b|bankautomaat`
  },
  {
    name: 'Sparen & beleggen',
    keywords: String.raw`argenta|spaarrekening|beleggingsfonds|pensioensparen|keytrade|\bbux\b|degiro|bolero|saxo|trade republic|effectenrekening|beleggen|spaarplan|spaardoel|vermogensbeheer|\btak ?2[13]\b|toekomstsparen|spaarpot|sparen`
  },
  {
    name: 'Wonen',
    children: [
      {
        name: 'Huur/lening',
        keywords: String.raw`woonkrediet|hypotheek|woonlening|\bhuur\b|huurgeld|huurbetaling|kredietaflossing|aflossing|syndicus|mede-?eigendom|appartementsgebouw|gemeenschappelijke kosten|woningkrediet|sociale huisvesting`
      },
      {
        name: 'Energie',
        keywords: String.raw`luminus|engie|eneco|totalenergies|energyvision|energy vision|pom-energie|energie\.be|octa\+|elindus|energie|fluvius|eandis|infrax|\bores\b|sibelga|mazout|stookolie|elektriciteit|aardgas|\bgas\b|zonnepane|\bmega\b|essent|lampiris|\bwatz\b`
      },
      {
        name: 'Water',
        keywords: String.raw`watergroep|pidpa|farys|swde|waterlink|water-link|aquafin|vivaqua|inbw|drinkwater|waterverbruik|waterfactuur|waterheffing|waterbedrijf`
      },
      {
        name: 'Internet & telefoon',
        keywords: String.raw`proximus|telenet|orange|scarlet|mobile vikings|\bvoo\b|\bbase\b|edpnet|telefoon|\bdigi\b|youfone|\bhey\b|jim mobile|mobistar|belgacom|skynet|\bgsm\b|simkaart|internetabonnement|glasvezel|\bwifi\b|decoder|digitale tv`
      },
      {
        name: 'Afval',
        keywords: String.raw`limburg\.net|recyclagepark|ivarem|ecowerf|idelux|ivvo|intradura|containerpark|imog|ibogem|mirom|ivio|vuilnis|huisvuil|afvalophaling|restafval|\bgft\b|afvalintercommunale|vlaco|renewi`
      },
      {
        name: 'Inrichting & meubels',
        keywords: String.raw`ikea|kwantum|jysk|new furniture|dille en kamille|maisons du monde|leen bakker|meubel|\baction\b|wibra|\bhema\b|vtwonen|home ?depot|\bcasa\b|zara home|xenos|blokker|beddenreus|matras|slaapkamer|keuken|vloerbedekking|tapijt|gordijn|verlichting|lampen|woonwinkel|interieur|decoratie|swiss sense|eijerkamp|dewaele|kreatix|kringloop|tweedehands`
      },
      {
        name: 'Bouw & tuin',
        keywords: String.raw`hubo|brico|gamma|karwei|aveve|tuincentrum|plantencentrum|verfland|verwarming|sanitair|bouwmaterialen|bouwcenter|bouwmarkt|dewulf|bricoman|hornbach|houthandel|steenhandel|schilder|loodgieter|elektricien|aannemer|dakwerken|renovatie|haagplanten|tuinaanleg|tuinman|isolatie|schrijnwerker|stukadoor|tegels|parket`
      }
    ]
  },
  {
    name: 'Hulp in huis',
    keywords: String.raw`dienstencheque|poetshulp|schoonmaak|poetsdienst|oppas|babysit|thuiszorg|gezinszorg|strijkdienst|tuinonderhoud|klusjesman|poetsvrouw|huishoudhulp`
  },
  {
    name: 'Boodschappen',
    keywords: String.raw`lidl|colruyt|delhaize|carrefour|\bcrf\b|albert heijn|\bah \d|\baldi\b|\bokay\b|\bspar\b|intermarche|\bcora\b|\bmatch\b|smatch|proxy|bakker|patisserie|slager|beenhouwer|supermarkt|\bsuper\b|bio-planet|biofresh|jumbo|\balvo\b|ekoplaza|groenteboer|fruithandel|visboer|viswinkel|delicatessen|hofwinkel|nachtwinkel|night ?shop|drankenhandel|drankencentrum|gall & gall|traiteur|chocolatier|slagerij|kruidenier|louis delhaize|ecoplus|biowinkel|marktkraam|marktfruit|dagwinkel`
  },
  {
    name: 'Elektro & computers',
    keywords: String.raw`vanden borre|krefel|\bbcc\b|mediamarkt|media markt|coolblue|apple store|samsung|dyson|nespresso|philips|\bbose\b|sonos|lenovo|\bdell\b|\bhp\b|\basus\b|\bacer\b|logitech|phone house|mobile center|computer|laptop|printer|cartridge|inktcentrale|alternate|elektronica|electro world|elektrowinkel|powerbank`
  },
  {
    name: 'Vervoer',
    children: [
      {
        name: 'Brandstof',
        keywords: String.raw`esso|\bq8\b|total nb|lukoil|shell|texaco|gulf|dats ?24|tankstation|brandstof|tamoil|power ?oil|\bbp\b|maes|tinqo|laadpaal|oplaadpunt|allego|supercharger|fastned|blue ?corner|zunder|\bevbox\b|elektrisch laden`
      },
      {
        name: 'Openbaar vervoer',
        keywords: String.raw`nmbs|sncb|de lijn|\bmivb\b|\bstib\b|\btec\b|arrive|treinkaart|\buber\b|taxi|flixbus|eurostar|thalys|ouigo|blablacar|blue-?bike|donkey republic|billy bike|\bdott\b|\bvillo\b|swapfiets|bolt\.eu|treinticket|busticket`
      },
      {
        name: 'Parkeren',
        keywords: String.raw`parking|q-park|qpark|interparking|parkmobile|easypark|parkeer|p\+r|apcoa|indigo park|parkeerkaart|parkeergarage|parkeerbeheer`
      },
      {
        name: 'Onderhoud wagen',
        keywords: String.raw`garage|carrosserie|autokeuring|\bgocca\b|dekra|bandencentrum|autoservice|midas|norauto|carglass|euromaster|vulco|bridgestone|autobedrijf|autoherstelling|banden|autowas|carwash|autogroep|\bapk\b`
      }
    ]
  },
  {
    name: 'Boetes',
    keywords: String.raw`\bpolitie\b|verkeersboete|boete|administratieve sanctie|fod justitie|minnelijke schikking|retributie|\bgas-?boete`
  },
  {
    name: 'Gezondheid',
    keywords: String.raw`mutualiteit|dkv|partena|hospitalia|ziekenfonds|christelijke mutualiteit|liberale mutualiteit|solidaris|helan|onafhankelijk ziekenfonds`,
    children: [
      {
        name: 'Apotheek',
        keywords: String.raw`apotheek|pharma|apotheker|multipharma|medi-market|farmacie|pharmacie`
      },
      {
        name: 'Dokter & ziekenhuis',
        keywords: String.raw`dokter|huisarts|tandarts|kinesist|ziekenhuis|\buz\b|az vesalius|oogarts|opticien|orthodont|psycholoog|logopedist|thuisverpleging|osteopaat|chiropract|dermatoloog|gynaecoloog|pediater|kinderarts|laboratorium|medisch centrum|polikliniek|radiologie|kliniek|ambulance|huisartsenwacht|mondzorg|hoorcentrum|audicien|diëtist|dietist`
      }
    ]
  },
  {
    name: 'Verzekeringen',
    keywords: String.raw`ethias|\baxa\b|allianz|baloise|vivium|verzekering|ag insurance|belfius insurance|\bdvv\b|fidea|p&v|delta lloyd|securex|cardif|interpolis|generali|lalux|euromex|polis|verzekeringspremie|hospitalisatie|brandverzekering|autoverzekering|rechtsbijstand`
  },
  {
    name: 'Onderwijs',
    keywords: String.raw`school(?!straat|laan|plein)|scholengroep|universiteit|hogeschool|inschrijvingsgeld|studiegeld|cursus|opleiding|syntra|\bcvo\b|schoolreis|schoolmaaltijd|studentenkot|studentenhuis|kuleuven|ugent|uantwerpen|\bvub\b|schoolfactuur|studiebeurs|boekenpakket|oudercomit|leerkracht|studentenvoorzieningen|schoolbus`
  },
  {
    name: 'Vrije tijd',
    children: [
      {
        name: 'Sport',
        keywords: String.raw`basic-?fit|fitness|sportcentrum|zwembad|tennis|padel|decathlon|intersport|go sport|sportwinkel|voetbalclub|sportclub|turnclub|judo|karate|dansschool|zwemclub|yoga|pilates|klimzaal|bowling|\bgolf\b|trampolinepark|schaatsbaan|skipiste|sportpas`
      },
      {
        name: 'Cinema & evenementen',
        keywords: String.raw`kinepolis|weezevent|ticketmaster|eventbrite|bioscoop|concert|pretpark|walibi|bobbejaanland|plopsa|museum|theater|ticketswap|festival|ancienne belgique|sportpaleis|lotto arena|pukkelpop|rock werchter|tomorrowland|cinema|utopolis|dierentuin|planckendael|cultuurcentrum|escape room|laser ?game|attractiepark|\bstudio ?skoop|opera`
      },
      {
        name: 'Reizen & vakantie',
        keywords: String.raw`booking\.com|airbnb|ryanair|brussels airlines|\btui\b|jetair|neckermann|vliegtuig|\bhotel\b|b&b|camping|center parcs|landal|roompot|eurocamp|vakantiepark|reisbureau|sunweb|d-reizen|vakantiehuis|expedia|skyscanner|transavia|easyjet|wizz air|lufthansa|\bklm\b|vueling|hostel|resort|reisorganisatie|brussels airport|charleroi airport|\bgîte\b|logies`
      },
      {
        name: 'Speelgoed & spel',
        keywords: String.raw`dreamland|bart smit|toys ?r us|top ?toys|smyths|\blego\b|speelgoed|spelletjes|king jouet|gezelschapsspel|spelwinkel|playmobil`
      },
      {
        name: 'Hobby & boeken',
        keywords: String.raw`boekhandel|standaard boekhandel|de slegte|bibliotheek|academie|muziekschool|hobbycenter|hobby|creatief|knutsel|naaigaren|kunstmaterialen|stripwinkel|muziekinstrument|\bwol\b`
      }
    ]
  },
  {
    name: 'Restaurant & horeca',
    keywords: String.raw`frituur|fritkot|snack|restaurant|brasserie|\bcafe\b|café|\bbar\b|kfc|mcdonald|burger king|\bquick\b|pizza|sushi|bistro|taverne|broodjes|bon.?ap|ijssalon|ijscasino|coffee|koffie|catering|domino|subway|starbucks|\bpanos\b|le pain quotidien|\bexki\b|class'?croute|lunch garden|\bwok\b|pita|kebab|döner|doner|thai |chinees|indisch|trattoria|tapas|grill|steakhouse|buffet|pancake|pannenkoeken|wafel|cafetaria|eetcafe|eetcafé|\bpub\b|biercafé|brouwerij|cocktail|gelato|deliveroo|takeaway|uber eats|thuisbezorgd|just eat|foodora`
  },
  {
    name: 'Kleding',
    keywords: String.raw`h&m|zara|c&a|primark|\bjbc\b|zeeman|omoda|schoenen|textiel|kleding|brantano|torfs|mango|pull ?& ?bear|bershka|stradivarius|jack & jones|vero moda|esprit|tommy hilfiger|\blevi'?s\b|\bnike\b|adidas|\bpuma\b|foot ?locker|scapino|bristol|van haren|e5 mode|hunkem|bel ?& ?bo|\bikks\b|okaidi|kinderkleding|babykleding|\bjeans\b|lingerie|ondergoed|kledij|stomerij|droogkuis|kleermaker|schoenmaker|wasserette`
  },
  {
    name: 'Verzorging',
    keywords: String.raw`kruidvat|ici paris|parfum|kapper|kapsalon|beauty|wellness|rituals|\blush\b|body shop|sephora|douglas|nagelstudio|pedicure|manicure|massage|schoonheidssalon|haarsalon|barber|\bspa\b|sauna|thermen|cosmetica|\betos\b|trekpleister|coiffure|schoonheidsinstituut|zonnebank|waxing`
  },
  {
    name: 'Abonnementen',
    keywords: String.raw`netflix|spotify|disney|videoland|streamz|youtube|apple\.com|dropbox|icloud|storytel|\bhbo\b|prime video|amazon prime|dazn|deezer|tidal|audible|google one|google storage|microsoft 365|office 365|adobe|canva|patreon|substack|nordvpn|norton|mcafee|kaspersky|playstation|xbox|nintendo|\bsteam\b|epic games|twitch|duolingo|medialaan|\bvtm go\b|goplay|dpg media|mediahuis|de standaard|nieuwsblad|laatste nieuws|\bknack\b|\bhumo\b|libelle|dag allemaal|\bcanal\+`
  },
  {
    name: 'Online shopping',
    keywords: String.raw`bol\.com|bolcom|amazon|aliexpress|zalando|temu|shein|ebay|cvkoopjes|trenday|2dehands|marktplaats|vinted|etsy|\basos\b|about you|beslist|wehkamp|paypal|klarna|webshop|banggood`
  },
  {
    name: 'Cadeaus',
    keywords: String.raw`fleurop|bloemist|dellflora|cadeau|geschenk|cadeaubon|geschenkbon|wenskaart|bloemen|boeket|partyland|party ?land|giftcard|wonderbox|\bbongo\b|smartbox|vivabox|cadeaubox`
  },
  {
    name: 'Lidmaatschappen',
    keywords: String.raw`lidgeld|lidmaatschap|vakbond|\bacv\b|\babvv\b|\bacod\b|test-?aankoop|touring|\bvab\b|davidsfonds|ledenvereniging|jeugdbeweging|\bchiro\b|\bscouts\b|\bkvlv\b|\bkaj\b`
  },
  {
    name: 'Belastingen',
    keywords: String.raw`belasting|fod financi|vlabel|onroerende voorheffing|\btaks\b|gemeentebelasting|provinciebelasting|opcentiemen|personenbelasting|verkeersbelasting|inschrijvingstaks|kijk- en luistergeld|rioolheffing|gemeentebestuur|stadsbestuur|\bocmw\b|voorafbetaling|aanslag|fiscus`
  },
  {
    name: 'Notaris & juridisch',
    keywords: String.raw`notaris|advocaat|deurwaarder|boekhouder|accountant|juridisch|bemiddelaar|expertise|vrederechter|griffie|gerechtskosten`
  },
  {
    name: 'Post & verzending',
    keywords: String.raw`bpost|postnl|\bdhl\b|\bups\b|fedex|\bgls\b|\bdpd\b|postpunt|verzendkosten|postzegel|bpack|mondial relay`
  },
  {
    name: 'Giften & goede doelen',
    keywords: String.raw`goed doel|rode kruis|unicef|\bwwf\b|oxfam|artsen zonder grenzen|kom op tegen kanker|11\.11\.11|warmste week|natuurpunt|greenpeace|amnesty|dierenasiel|sos kinderdorpen|plan international|broederlijk delen|vastenactie|damiaanactie|collecte|\bgift\b|steunbetuiging|donatie`
  },
  {
    name: 'Bankkosten',
    keywords: String.raw`beheerskosten|bankkosten|jaarbijdrage|bijdrage kaart|abonnementskosten|kosten rekening|rekeningkosten|bancontact kosten|debetrente|kaartbijdrage|maandelijkse bijdrage|kosten overschrijving|kosten internationaal|buitenlandse betaling|packaged`
  },
  { name: 'Overige uitgaven' }
]
