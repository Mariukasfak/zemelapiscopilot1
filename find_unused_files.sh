#!/bin/bash

echo "========== ZEMELAPISCOPILOT1 PROJEKTO VALYMO ĮRANKIS =========="
echo "Ieškoma nenaudojamų failų jūsų projekte..."
echo ""

# Apibrėžiame spalvas išvestims
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Projekto direktorija 
PROJECT_DIR="/workspaces/zemelapiscopilot1"
SRC_DIR="$PROJECT_DIR/src"

# 1. Suraskime 10 didžiausių failų (išskyrus node_modules ir .git)
echo -e "${BLUE}[1] 10 DIDŽIAUSIŲ FAILŲ PROJEKTE:${NC}"
find "$PROJECT_DIR" -type f -not -path "*/node_modules/*" -not -path "*/.git/*" -not -path "*/dist/*" -not -path "*/build/*" -exec du -h {} \; | sort -rh | head -n 10
echo ""

# 2. Ieškokime nenaudojamų komponentų ir servisų
echo -e "${BLUE}[2] NENAUDOJAMI KOMPONENTAI (ĮTARIAMI):${NC}"

# Sukurkime sąrašą galimų komponentų
find "$SRC_DIR" -type f -name "*.tsx" -o -name "*.jsx" -o -name "*.ts" -o -name "*.js" | grep -v "index\." > /tmp/all_files.txt

# Patikrinkime kiekvieną failą ar jis yra importuojamas
while read -r file; do
  filename=$(basename "$file" | sed 's/\.[^.]*$//')
  
  # Ieškome importų šio failo
  imported_count=$(grep -r --include="*.{ts,tsx,js,jsx}" -l "import.*from.*['\"].*$filename['\"]" "$SRC_DIR" | wc -l)
  imported_count2=$(grep -r --include="*.{ts,tsx,js,jsx}" -l "import.*{.*$filename.*}.*from" "$SRC_DIR" | wc -l)
  
  # Jei failas nėra importuojamas niekur, greičiausiai jis nenaudojamas
  if [ "$imported_count" -eq 0 ] && [ "$imported_count2" -eq 0 ] && [[ "$filename" != "App" && "$filename" != "main" && "$filename" != "index" ]]; then
    echo -e "${YELLOW}Nenaudojamas:${NC} $file"
  fi
done < /tmp/all_files.txt
echo ""

# 3. Ieškokime dvigubų nuotraukų įkėlimo komponentų
echo -e "${BLUE}[3] NUOTRAUKŲ ĮKĖLIMO KOMPONENTŲ DUBLIKATAI:${NC}"
image_uploaders=(
  "$SRC_DIR/components/SimpleCropUploader.tsx"
  "$SRC_DIR/components/SmartImageUploader.tsx" 
  "$SRC_DIR/components/OneStepImageUploader.tsx"
  "$SRC_DIR/components/ImageUpload.tsx"
  "$SRC_DIR/components/AdvancedImageCropper.tsx"
)

for uploader in "${image_uploaders[@]}"; do
  if [ -f "$uploader" ]; then
    lines=$(wc -l < "$uploader")
    echo -e "${YELLOW}$(basename "$uploader")${NC} - $lines eilutės"
  fi
done
echo -e "${GREEN}Rekomendacija:${NC} Palikite tik vieną nuotraukų įkėlimo komponentą (pvz., OneStepImageUploader.tsx)"
echo ""

# 4. Patikrinkime JavaScript failus TypeScript projekte
echo -e "${BLUE}[4] JAVASCRIPT FAILAI TYPESCRIPT PROJEKTE:${NC}"
js_files=$(find "$SRC_DIR" -type f -name "*.js" -not -name "*.config.js" -not -path "*/node_modules/*")
if [ -n "$js_files" ]; then
  echo "$js_files"
  echo -e "${GREEN}Rekomendacija:${NC} Konvertuokite šiuos .js failus į .tsx arba .ts"
else
  echo "Nerasta JavaScript failų. Gerai!"
fi
echo ""

# 5. Patikrinkime .css failus, kai naudojamas Tailwind
echo -e "${BLUE}[5] NENAUDOJAMI CSS FAILAI:${NC}"
css_files=$(find "$SRC_DIR" -type f -name "*.css" -not -name "index.css" -not -name "tailwind.css")
if [ -n "$css_files" ]; then
  echo "$css_files"
  echo -e "${GREEN}Rekomendacija:${NC} Jeigu naudojate Tailwind CSS, apsvarstykite šių CSS failų pašalinimą"
fi
echo ""

# 6. Siūlomi ištrinti failai
echo -e "${BLUE}[6] SIŪLOMI IŠTRINTI FAILAI:${NC}"
echo -e "${RED}rm -f $SRC_DIR/components/LoadingSpinner.js${NC}"
echo -e "${RED}rm -f $SRC_DIR/components/LoadingSpinner.css${NC}"
echo -e "${RED}rm -f $SRC_DIR/components/SimpleCropUploader.tsx${NC}"
echo -e "${RED}rm -f $SRC_DIR/components/SmartImageUploader.tsx${NC}"
echo -e "${RED}rm -f $SRC_DIR/components/ImageUpload.tsx${NC}"
echo -e "${RED}rm -f $SRC_DIR/components/AdvancedImageCropper.tsx${NC}"
echo ""

echo "========== ANALIZĖ BAIGTA =========="
echo -e "${GREEN}Kad ištrinti siūlomus failus, galite nukopijuoti ir paleisti aukščiau pateiktas 'rm' komandas${NC}"
echo -e "${YELLOW}PERSPĖJIMAS: Prieš ištrinant, patikrinkite ar failas tikrai nenaudojamas!${NC}"

# Nuimame laikinus failus
rm -f /tmp/all_files.txt
