# Žemėlapis - Interaktyvus Lietuvos žemėlapis

Interaktyvus žemėlapis, rodantis įdomias vietas Lietuvoje. Naudojama React, Leaflet ir Supabase.

## Funkcijos

- Interaktyvus žemėlapis su vietų žymekliais
- Dinaminis duomenų krovimas pagal matomą žemėlapio sritį
- Detalesnė informacija apie vietas iššokančiame lange

## Pradžia

### Prielaidos

- Node.js (>= 14.x)
- npm arba yarn

### Įdiegimas

1. Klonuokite repozitoriją:
   ```bash
   git clone https://github.com/jūsų-vardas/zemelapiscopilot1.git
   cd zemelapiscopilot1
   ```

2. Įdiekite priklausomybes:
   ```bash
   npm install
   ```

3. Sukurkite `.env` failą pagrindinėje direktorijoje ir pridėkite savo Supabase duomenis:
   ```
   REACT_APP_SUPABASE_URL=jūsų_supabase_url
   REACT_APP_SUPABASE_ANON_KEY=jūsų_anon_key
   ```

4. Paleiskite vystymo serverį:
   ```bash
   npm start
   ```

### Duomenų bazės struktūra

Projektas naudoja Supabase su lentele `locations`, kuri turi šiuos laukus:
- id (uuid, primary key)
- name (string)
- description (text)
- coordinates (geography)
- image (string, URL)
- website (string, URL, optional)
- created_at (timestamp)

## Technologijos

- React
- Leaflet (react-leaflet)
- Supabase
- CSS Modules

## Licencija

MIT