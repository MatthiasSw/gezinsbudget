# Gezinsbudget

Gezinsbudget is een eenvoudig Windows-programma om je huishoudbudget bij te houden. Je importeert de export van je Belfius-rekening, deelt je uitgaven en inkomsten in categorieën in en ziet per maand en per jaar waar je geld naartoe gaat.

Alles blijft op je eigen computer of netwerkschijf. Er is geen account, geen cloud en geen tracking. Het programma maakt geen internetverbinding.

## Inhoud

- [Installeren](#installeren)
- [Eerste stappen](#eerste-stappen)
- [Een bankbestand importeren](#een-bankbestand-importeren)
- [Transacties bekijken en categoriseren](#transacties-bekijken-en-categoriseren)
- [Regels: automatisch categoriseren](#regels-automatisch-categoriseren)
- [Terugkerende uitgaven](#terugkerende-uitgaven)
- [Instellingen](#instellingen)
- [Waar staan mijn gegevens?](#waar-staan-mijn-gegevens)
- [Problemen oplossen](#problemen-oplossen)

## Installeren

Gezinsbudget hoeft niet geïnstalleerd te worden. Download de nieuwste zip (`Gezinsbudget-<versie>-win.zip`) op de pagina [Releases](https://github.com/MatthiasSw/gezinsbudget/releases), pak hem uit in een map naar keuze, bijvoorbeeld op je bureaublad, en start `Gezinsbudget.exe` in die map.

Je gegevens blijven in je eigen map staan, ook als je het programma vervangt door een nieuwere versie. Pak daarvoor de nieuwe zip gewoon uit over de oude map of in een nieuwe map.

## Eerste stappen

1. Exporteer transacties van je Belfius webapp in csv. (zie [Belfius website](<https://www.belfius.be/webapps/nl/selfcare/belfius/rekeningen/saldo-historiek/Hoe-kan-ik-mijn-historiek-in-Belfius-Direct-Net-exporteren-naar-een-CSV-bestand-(Excel)>)).
2. Start Gezinsbudget.
3. Klik rechtsboven op **Bankbestand importeren** en kies het bestand dat je uit Belfius exporteerde.
4. Geef je rekening de eerste keer een naam, bijvoorbeeld "Zichtrekening".
5. Controleer het importvoorbeeld en klik op **Importeren**.
6. Deel je transacties in categorieën in en bekijk het tabblad **Overzicht**.

De eerste keer maakt het programma zelf een gegevensmap aan, zodat je niets hoeft in te stellen. Meer daarover lees je onder [Waar staan mijn gegevens?](#waar-staan-mijn-gegevens).

## Een bankbestand importeren

Zolang je nog niets hebt geïmporteerd, toont het tabblad **Transacties** de melding **Importeer je eerste banktransacties** met een knop **Bankbestand importeren**. Die knop doet hetzelfde als de knop rechtsboven.

Exporteer in Belfius de transacties van je rekening als **CSV-bestand** en bewaar het waar je wil. Gezinsbudget herkent het formaat automatisch, ook met accenten in namen.
(zie [Belfius website](<https://www.belfius.be/webapps/nl/selfcare/belfius/rekeningen/saldo-historiek/Hoe-kan-ik-mijn-historiek-in-Belfius-Direct-Net-exporteren-naar-een-CSV-bestand-(Excel)>))

Per rekening exporteer je één bestand. Heb je meerdere rekeningen, importeer dan elk bestand apart.

Bij het importeren gebeurt het volgende:

1. **Onbekende rekening.** Staat de rekening nog niet in het programma, dan vraagt Gezinsbudget om een naam. Zo kent het programma je eigen rekeningen.
2. **Importvoorbeeld.** Je ziet het bestand, de periode, hoeveel transacties nieuw zijn en hoeveel al aanwezig waren, plus de totalen van inkomsten en uitgaven. Er is op dat moment nog niets opgeslagen. Met **Annuleren** stop je zonder gevolgen.
3. **Importeren.** Pas na je bevestiging worden de nieuwe transacties opgeslagen.

Goed om te weten:

- **Je kan hetzelfde bestand veilig opnieuw importeren.** Transacties die er al zijn, worden overgeslagen en nooit dubbel toegevoegd.
- **Overlappende exports zijn geen probleem.** Exporteer je januari tot en met maart en later februari tot en met april, dan komen alleen de nieuwe transacties erbij.
- **Je eigen keuzes blijven behouden.** Een categorie die je zelf koos, wordt bij een nieuwe import nooit overschreven.

## Transacties bekijken en categoriseren

Het tabblad **Transacties** toont de lijst van je transacties.

### Filteren en zoeken

- Kies bovenaan een periode: **Deze maand**, **Vorige maand**, **Dit jaar**, **Vorig jaar** of **Alles**. Je kan ook zelf een datum invullen bij **Van** en **Tot en met**.
- Filter op **Rekening** en **Categorie**. Met **Zonder categorie** vind je wat je nog moet indelen.
- Typ in het zoekveld een naam, een stuk van de mededeling, een IBAN of een bedrag. Hoofdletters en accenten maken niet uit.
- **Interne overboekingen** zijn verplaatsingen tussen je eigen rekeningen. Ze zijn standaard verborgen. Je kan ze **Tonen** of **Enkel interne** bekijken. Ze zijn herkenbaar aan het teken ⇄ en een grijze kleur. Verderop in dit hoofdstuk staat wat het precies is.

### Wat is een interne overboeking?

Een interne overboeking is geld dat van een van je eigen rekeningen naar een andere eigen rekening gaat. Zet je bijvoorbeeld 500 € van je zichtrekening op je spaarrekening, dan staat er op je zichtrekening -500 € en op je spaarrekening +500 €. Je hebt niets uitgegeven en niets verdiend: het geld is alleen verplaatst.

Zou Gezinsbudget die twee bedragen meetellen, dan leken je inkomsten én je uitgaven 500 € te hoog. Daarom telt een interne overboeking niet mee in het overzicht, de grafieken, de budgetten en de terugkerende uitgaven.

Gezinsbudget herkent ze doordat de tegenrekening een van je eigen rekeningen is. Welke dat zijn, stel je in bij **Instellingen > Eigen rekeningen**. Zet je daar een rekening bij, dan worden bestaande transacties meteen opnieuw beoordeeld.

## Regels: automatisch categoriseren

Je hoeft niet elke transactie zelf in te delen. Met een regel krijgt een transactie automatisch een categorie, bijvoorbeeld alles van "Supermarkt Groenhof" als **Boodschappen**.

### Een regel laten voorstellen

Kies je voor een transactie een categorie, dan vraagt het programma: _"Altijd ‘Boodschappen’ gebruiken voor ‘Supermarkt Groenhof’?"_

- Met **Regel maken** wordt de regel opgeslagen. Daarna kan je de regel meteen toepassen op bestaande transacties. Op de knop staat hoeveel transacties daardoor wijzigen.
- Met **Nee** gebeurt er niets.

De vraag verschijnt alleen als alle gekozen transacties dezelfde tegenpartij hebben en er nog geen regel voor bestaat.

### Standaardregels

Gezinsbudget wordt geleverd met een reeks standaardregels voor bekende winkels en leveranciers. Zo komt "apotheek" bij **Apotheek**, "parking" bij **Parkeren**, "Lidl" of "Delhaize" bij **Boodschappen**, "Esso" bij **Brandstof** en "Basic-Fit" bij **Sport**. Ze zoeken in de naam van de tegenpartij én in de mededeling, en gelden dus meteen bij je eerste import. De startset bevat veel categorieën met bijhorende zoektermen, onder meer Boodschappen, Wonen met Energie, Water en Internet, Vervoer, Gezondheid, Verzekeringen, Onderwijs, Vrije tijd met Reizen & vakantie, Elektro & computers, Abonnementen, Belastingen, Lidmaatschappen en Giften & goede doelen.

- In een nieuwe gegevensmap staan ze er al.
- Heb je al gegevens? Open in **Instellingen > Regels** de sectie **Standaardregels** en klik op **Standaardregels bijwerken**. Na bevestiging worden ontbrekende standaardregels en categorieën toegevoegd en worden de zoektermen van de standaardregels vervangen door de nieuwste versie. Een kopie in **Mijn regels**, je eigen regels en je aan/uit-keuzes blijven zoals ze zijn. Het resultaat staat daarna boven de sectie: hoeveel regels erbij kwamen of werden bijgewerkt en welke categorieën nieuw zijn. Er verandert nog niets aan je transacties: klik daarna op **Regels toepassen** om de regels op je bestaande transacties los te laten.
- De standaardregels staan apart van je eigen regels, in een inklapbare sectie **Standaardregels** onder **Mijn regels**. Zo vind je je eigen regels altijd terug. **Je eigen regels gaan altijd voor** op de standaardregels.
- Een standaardregel kan je niet rechtstreeks aanpassen. Je kan hem wel **uitzetten** met het vakje **Actief**, **testen** of **kopiëren naar mijn regels** en daar aanpassen. Bij **Bijwerken** blijft je aan/uit-keuze bewaard.
- In de kolom **Zoektermen** staan de woorden gescheiden door een verticale streep (|), bijvoorbeeld `apotheek|pharma`. Voeg je eigen woorden toe via een eigen regel op dezelfde manier.

### Regels beheren

Ga naar **Instellingen** en kies het tabblad **Regels**. Bovenaan staat **Mijn regels**, daaronder de inklapbare sectie **Standaardregels**. Wat hieronder staat, geldt voor je eigen regels.

- **Voorwaarde:** kies het veld (tegenpartij of mededeling, alleen tegenpartij, alleen mededeling of IBAN van de tegenpartij) en hoe het moet passen: _bevat_, _is gelijk aan_ of _regex_. Regex is voor gevorderde gebruikers.
- **Hoofdlettergevoelig:** standaard maakt het niet uit of je ‘Aldi’, ‘ALDI’ of ‘aldi’ typt. Vink dit vakje aan als de schrijfwijze exact moet kloppen. Beweeg over de i naast de kolomkop voor uitleg.
- **Volgorde:** regels worden van boven naar onder bekeken en **de eerste die past, wint**. Sleep een regel aan het handvat links (⠿) naar een andere plaats, of gebruik de pijltjes.
- **Actief:** zet een regel uit zonder hem te verwijderen.
- **Test:** toont hoeveel transacties de regel raakt, met de eerste drie als voorbeeld. Staat er dat bij een aantal daarvan niets verandert, dan hebben die al de juiste categorie of zijn ze handmatig ingedeeld. Er wordt niets gewijzigd. Je hoeft een regel niet te testen voor je hem kan toepassen.
- Klik op **Opslaan** om je wijzigingen te bewaren, of op **Wijzigingen ongedaan maken** om terug te gaan. Een onvolledige of ongeldige regel, bijvoorbeeld met een lege waarde of een foute regex, wordt geweigerd. Onder de knoppen zie je of het gelukt is.
- **Regels toepassen op ...:** past de opgeslagen regels toe op bestaande transacties. In de knop staat hoeveel er wijzigen. Is dat niets, dan is de knop grijs. Na het toepassen verschijnt kort een melding naast de knop.
- **Verwijderen:** vraagt eerst om bevestiging.

Nieuwe transacties krijgen bij elke import automatisch de categorie van de eerste regel die past. **Een categorie die je zelf koos, blijft altijd staan.** Verwijder je een regel en pas je de regels opnieuw toe, dan verdwijnt de categorie die enkel door die regel was gezet.

## Instellingen

### Gegevensmap

Toont waar je gegevens staan. Met **Map wijzigen** kies je een andere map, bijvoorbeeld een gedeelde map op je netwerkschijf.

### Eigen rekeningen

Hier staan je eigen rekeningen met een naam. Je kan er rekeningen toevoegen, hernoemen en verwijderen. Het IBAN-nummer wordt gecontroleerd.

**Waarom staat dit in de instellingen?** Gezinsbudget kan alleen aan een overboeking zien dat het om je eigen geld gaat, bijvoorbeeld van je zichtrekening naar je spaarrekening, als het weet welke rekeningen van jou zijn. Zo'n **interne overboeking** is geen inkomst of uitgave en telt dus niet mee in je totalen. Wijzig je de lijst, dan worden alle bestaande transacties opnieuw beoordeeld en meldt het programma hoeveel er veranderden.

### Categorieën

Bij het eerste gebruik krijg je een startset, bijvoorbeeld _Loon_, _Boodschappen_, _Wonen_ met subcategorieën zoals _Energie_ en _Afval_, _Vervoer_, _Gezondheid_ en _Huisdieren_. Je kan alles aanpassen:

- Voeg een categorie toe met een naam, een soort (**Uitgave** of **Inkomst**) en eventueel een bovenliggende categorie.
- Geef elke categorie een **icoon**. Klik op het icoontje links van de naam en kies er een uit meer dan 150 emoji. De icoontjes verschijnen in de keuzelijsten, het overzicht en de grafieken.
- Hernoem een categorie of verplaats ze onder een andere hoofdcategorie. Je kan maar twee niveaus gebruiken: een hoofdcategorie en daaronder subcategorieën. Een subcategorie kan zelf geen subcategorieën hebben. Een lijntje verbindt subcategorieën met hun hoofdcategorie.

- **Verwijder** een categorie met de knop **Verwijderen**. Het programma vraagt eerst om bevestiging. Transacties die de categorie hadden, krijgen dan geen categorie meer en regels die ernaar verwijzen worden mee verwijderd. Een categorie met subcategorieën kan je pas verwijderen nadat je die verplaatst of verwijderd hebt.

### Budgetten

Per uitgavencategorie kan je een budget instellen: het bedrag dat je hoogstens wil uitgeven, per **maand** of per **jaar**. Typ het bedrag in het veld, bijvoorbeeld 150 of 150,50, kies de periode en klik op **Opslaan**. Laat je het veld leeg, dan heeft die categorie geen budget.

- Een budget op een hoofdcategorie telt ook de uitgaven van de subcategorieën mee.
- Een maandbudget wordt in het overzicht vermenigvuldigd met 12 om met een heel jaar te vergelijken.
- Is een categorie verwijderd of is het geen uitgavencategorie meer, dan wordt het budget niet meer getoond.

## Waar staan mijn gegevens?

Standaard in de map `Documents\Gezinsbudget`. Je kan een andere map kiezen in de instellingen.

De gegevens zijn gewone bestanden, geen verborgen database:

| Bestand of map    | Inhoud                                       |
| ----------------- | -------------------------------------------- |
| `transactions\`   | je transacties, één bestand per maand        |
| `categories.json` | je categorieën                               |
| `rules.json`      | je regels                                    |
| `budgets.json`    | je budgetten                                 |
| `settings.json`   | je eigen rekeningen                          |
| `imports\`        | een kopie van elk bestand dat je importeerde |

**Back-up:** kopieer de hele map. Dat is alles wat nodig is. Zet je de map terug op een andere pc en kies je ze in de instellingen, dan werkt alles weer.

**Privacy:** de map bevat je echte bankgegevens, ook de kopieën in `imports\`. Bewaar ze op een plek die enkel jij en je partner kunnen openen en deel de map niet openbaar.

## Problemen oplossen

**"Gegevensmap niet bereikbaar"**
De map staat op een schijf of netwerkschijf die niet beschikbaar is (bijvoorbeeld een USB-stick die niet aangesloten is of een netwerkschijf die uit staat), of de map werd verplaatst. Controleer dat en klik op **Opnieuw proberen**. Staat de map ergens anders, kies dan **Andere map kiezen**. Er gaat niets verloren: zodra de map weer bereikbaar is, werkt alles verder.

**"Gegevens in gebruik"**
Het programma is al open op een andere pc. Sluit het daar af en kies **Opnieuw proberen**. Is het programma op die andere pc niet netjes afgesloten, bijvoorbeeld door een stroompanne, dan kan de vergrendeling blijven staan. Na een kwartier zonder activiteit wordt ze als verlopen beschouwd en kan je weer verder.

**Het importbestand wordt niet herkend**
Controleer of je een CSV-export van Belfius gebruikt en geen PDF of Excel-bestand. Is het bestand bewerkt in Excel en opnieuw bewaard, dan kan het formaat veranderd zijn. Exporteer het opnieuw uit Belfius.

**Een bericht over ontbrekende kolommen of onleesbare regels**
Het bestand wijkt af van het verwachte formaat. Het programma toont welke kolommen ontbreken of op welke regels het fout loopt. Er wordt in dat geval niets geïmporteerd.

**Een tweede import levert 0 nieuwe transacties op**
Dat klopt als je hetzelfde bestand of een periode die al ingelezen is, opnieuw importeert. Alles stond er al.

**Een transactie staat bij de verkeerde categorie**
Kies zelf de juiste categorie. Je keuze wint altijd van een regel en blijft behouden, ook bij latere imports.

**Een bedrag telt niet mee in het overzicht**
Controleer of de transactie als interne overboeking is gemarkeerd (⇄). Dat gebeurt als de tegenrekening een van je eigen rekeningen is. Pas de lijst aan onder **Instellingen > Eigen rekeningen** als dat niet klopt.

## Voor ontwikkelaars

- `npm install` installeert de afhankelijkheden.
- `npm run dev` start het programma in ontwikkelmodus (in de map met `package.json`).
- `npm test` draait de unit tests. `npm run typecheck` en `npm run lint` controleren types en stijl. `npm run build` controleert de productiebuild.
- `npm run build:win` maakt in `release/` een zip met het uitgepakte programma.

Start het programma niet vanuit een terminal waar de omgevingsvariabele `ELECTRON_RUN_AS_NODE` staat. Dan krijg je de fout `Cannot read properties of undefined (reading 'whenReady')`. Verwijder de variabele voor die terminal.
