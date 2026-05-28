# Garden Weather Assistant

Aplikacja webowa wspierająca ogrodnika-hobbystę w ocenie warunków pogodowych dla roślin. Projekt pobiera dane pogodowe z API, pokazuje aktualną pogodę i prognozę, pozwala zarządzać listą własnych roślin oraz ocenia, czy aktualne warunki mogą być dla nich bezpieczne.

## Link do aplikacji

GitHub Pages: [Garden Weather](https://bocianski.github.io/www-projekt/)

## Technologie

Projekt został wykonany bez frameworków i bez procesu buildowania.

Użyte technologie:

- HTML5
- CSS3
- JavaScript ES6+
- Fetch API
- localStorage
- Open-Meteo API
- GitHub Actions
- GitHub Pages

## Cel projektu

Celem aplikacji jest połączenie danych pogodowych z prostą bazą wymagań roślin. Użytkownik może sprawdzić pogodę, prognozę oraz ocenić, czy posiadane rośliny są narażone na niekorzystne warunki, takie jak niska temperatura, wysoka temperatura lub silny wiatr.

## Główne funkcjonalności

Aplikacja umożliwia:

- sprawdzenie aktualnej pogody dla wybranej lokalizacji,
- wyświetlenie alertów pogodowych,
- wyświetlenie rekomendacji dla ogrodnika,
- sprawdzenie prognozy pogody na kilka dni,
- wyświetlenie prostych wykresów temperatury i opadów,
- zmianę lokalizacji w panelu ustawień,
- zapis lokalizacji w `localStorage`,
- dodawanie własnych roślin,
- usuwanie roślin z listy,
- wyświetlenie bazy roślin,
- dodawanie roślin z bazy do własnej listy,
- ocenę statusu rośliny na podstawie aktualnej pogody.

## Widoki aplikacji

### 1. Widok główny

Widok główny pokazuje:

- aktualną temperaturę,
- prędkość wiatru,
- czas pomiaru,
- alerty pogodowe,
- szybkie rekomendacje dla użytkownika.

Dane pogodowe są pobierane z API Open-Meteo za pomocą `fetch`.

### 2. Moje rośliny

Widok pozwala użytkownikowi dodawać własne rośliny do listy. Dane są zapisywane lokalnie w przeglądarce przy użyciu `localStorage`.

Formularz zawiera:

- nazwę rośliny,
- minimalną temperaturę,
- zapotrzebowanie na wodę.

Użytkownik może także usuwać dodane rośliny.

### 3. Baza roślin

Widok pokazuje bazę roślin z pliku:

```text
projekt/data/plants.json
```

Każda roślina zawiera:

- nazwę polską,
- nazwę łacińską,
- zdjęcie,
- kraje występowania,
- minimalną temperaturę,
- maksymalną temperaturę,
- zapotrzebowanie na wodę,
- krótki opis.

Roślinę można dodać z bazy do własnej listy.

### 4. Prognoza pogody

Widok prognozy pokazuje dane pogodowe na kilka dni:

- temperaturę maksymalną,
- temperaturę minimalną,
- sumę opadów.

Dodatkowo aplikacja wyświetla proste wykresy wykonane w HTML, CSS i JavaScript, bez bibliotek zewnętrznych.

### 5. Ustawienia

Panel ustawień pozwala wybrać lokalizację z listy miast. Wybrana lokalizacja jest zapisywana w `localStorage`, dzięki czemu po odświeżeniu strony aplikacja nadal korzysta z poprzedniego wyboru użytkownika.

## API

Aplikacja korzysta z Open-Meteo API.

Przykładowe dane pobierane z API:

- aktualna temperatura,
- prędkość wiatru,
- prognoza temperatury minimalnej i maksymalnej,
- suma opadów.

Komunikacja z API odbywa się w pliku:

```text
projekt/js/api/weatherApi.js
```

Do pobierania danych użyto:

- `fetch`,
- `async/await`,
- obsługi błędów przez `try/catch`,
- sprawdzania `response.ok`.

## localStorage

Aplikacja korzysta z `localStorage` do zapisu:

- listy roślin użytkownika,
- wybranej lokalizacji.

Obsługa zapisu i odczytu znajduje się w pliku:

```text
projekt/js/storage/localStorage.js
```

Dzięki temu dane użytkownika nie znikają po odświeżeniu strony.

## Analiza ryzyka dla roślin

Status rośliny jest obliczany na podstawie aktualnych danych pogodowych oraz wymagań zapisanych w bazie roślin.

Możliwe statusy:

```text
Bezpieczna
```

Warunki pogodowe mieszczą się w wymaganym zakresie.

```text
Uwaga
```

Warunki mogą być niekorzystne, np. zbyt wysoka temperatura lub silny wiatr.

```text
Zagrożona
```

Temperatura jest niższa niż minimalna temperatura wymagana przez roślinę.

```text
Brak danych
```

Aplikacja nie ma aktualnie danych pogodowych potrzebnych do analizy.

Logika analizy znajduje się w pliku:

```text
projekt/js/plantRisk.js
```

## Struktura projektu

```text
www-projekt/
├── .github/
│   └── workflows/
│       ├── ci.yml
│       └── deploy.yml
├── projekt/
│   ├── assets/
│   │   └── plants/
|   |   |   ├── jablka.jpg
|   |   |   ├── roze.jpg
|   |   |   .
|   |   |   .
|   |   |   .
│   ├── css/
│   │   └── main.css
│   ├── data/
│   │   └── plants.json
│   ├── js/
│   │   ├── api/
│   │   │   ├── plantsApi.js
│   │   │   └── weatherApi.js
│   │   ├── storage/
│   │   │   └── localStorage.js
│   │   ├── ui/
│   │   │   └── renderWeather.js
│   │   ├── main.js
│   │   └── plantRisk.js
│   └── index.html
└── README.md
```

## Routing

Aplikacja działa jako prosta strona typu SPA bez frameworka. Widoki są przełączane za pomocą hash routingu.

Przykładowe adresy:

```text
#home
#plants
#plant-base
#forecast
#settings
```

Routing jest obsługiwany w pliku:

```text
projekt/js/main.js
```

## CI/CD

Projekt posiada konfigurację GitHub Actions.

Workflow CI sprawdza:

- obecność wymaganych plików,
- możliwość uruchomienia projektu jako statycznej strony,
- dostępność podstawowych plików przez lokalny serwer.

Workflow deploy publikuje katalog:

```text
projekt/
```

na GitHub Pages.

Pliki konfiguracyjne:

```text
.github/workflows/ci.yml
.github/workflows/deploy.yml
```

## Instrukcja uruchomienia lokalnego

### Sposób 1: Live Server w VS Code

1. Otworzyć projekt w Visual Studio Code.
2. Otworzyć plik:

```text
projekt/index.html
```

3. Uruchomić go przez rozszerzenie Live Server.

### Sposób 2: Python HTTP server

W katalogu głównym projektu uruchomić:

```bash
python3 -m http.server 8080 --directory projekt
```

Następnie wejść w przeglądarce na:

```text
http://localhost:8080
```

## Obsługa błędów

Aplikacja obsługuje podstawowe błędy:

- brak danych pogodowych,
- błąd odpowiedzi API,
- brak danych w bazie roślin,
- pusta lista roślin,
- niepoprawnie wypełniony formularz,
- uszkodzone dane w `localStorage`.

Komunikaty błędów są wyświetlane użytkownikowi w odpowiednich widokach.

## Responsywność

Layout został wykonany w podejściu mobile-first. Elementy strony dopasowują się do szerokości ekranu. Widoki z kartami i wykresami korzystają z prostych układów CSS, takich jak `grid`, `flex` i media queries.
<!---
## Podział pracy w zespole

Przykładowy podział pracy:

### Szymon Niewiński

- struktura HTML,
- routing widoków,
- widok główny,
- panel ustawień.

### Szymon Niewiński

- integracja z API pogodowym,
- widok prognozy,
- wykresy temperatury i opadów,
- obsługa błędów API.

### Szymon Niewiński

- baza roślin,
- analiza ryzyka,
- localStorage,
- dokumentacja i testy końcowe.
--->
## Możliwe rozszerzenia

Projekt można rozbudować o:

- szczegółowy widok pojedynczej rośliny,
- filtrowanie bazy roślin,
- sortowanie roślin,
- edycję roślin użytkownika,
- dokładniejszą analizę opadów,
- geolokalizację użytkownika,
- wyszukiwanie miasta przez API geokodowania,
- bardziej rozbudowane rekomendacje ogrodnicze.

## Testy manualne przed oddaniem

Przed oddaniem projektu sprawdzono:

- uruchomienie strony lokalnie,
- działanie strony na GitHub Pages,
- przełączanie widoków,
- pobieranie aktualnej pogody,
- pobieranie prognozy,
- zmianę lokalizacji,
- zapis lokalizacji po odświeżeniu strony,
- dodawanie roślin ręcznie,
- usuwanie roślin,
- ładowanie bazy roślin,
- dodawanie roślin z bazy,
- działanie widoku na mniejszym ekranie.

## Autorzy

```text
Szymon Niewiński
Adrian Czech
Michał Baniel
```

## Status projektu

Projekt spełnia założenia MVP:

- minimum 3 widoki,
- dynamiczne renderowanie danych,
- komunikacja z API przez `fetch`,
- obsługa błędów,
- formularz z walidacją,
- zapis danych w `localStorage`,
- responsywny layout,
- wdrożenie na GitHub Pages,
- podstawowa dokumentacja.
