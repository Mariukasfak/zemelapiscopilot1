import { WeatherData } from '../types';

// OpenWeatherMap API raktas
const OPENWEATHER_API_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY || 'your_api_key_here';
const OPENWEATHER_BASE_URL = 'https://api.openweathermap.org/data/2.5';

// Funkcija orų duomenims gauti pagal koordinates
export const fetchWeatherData = async (latitude: number, longitude: number): Promise<WeatherData | null> => {
  try {
    // Pirma bandom gauti iš localStorage, kad taupyti API užklausas
    const cacheKey = `weather_${latitude.toFixed(2)}_${longitude.toFixed(2)}`;
    const cachedData = localStorage.getItem(cacheKey);
    
    if (cachedData) {
      const parsedData = JSON.parse(cachedData);
      const cacheTime = parsedData.timestamp;
      
      // Naudojame cache duomenis, jei jie ne senesni nei 1 valanda
      if (Date.now() - cacheTime < 60 * 60 * 1000) {
        console.log('Using cached weather data');
        return parsedData.data;
      }
    }
    
    // Kreipimasis į OpenWeatherMap API
    const response = await fetch(
      `${OPENWEATHER_BASE_URL}/weather?lat=${latitude}&lon=${longitude}&units=metric&lang=lt&appid=${OPENWEATHER_API_KEY}`
    );
    
    if (!response.ok) {
      throw new Error(`Weather API responded with status: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Konvertuojame gautus duomenis į mūsų formatą
    const weatherData: WeatherData = {
      temp: Math.round(data.main.temp * 10) / 10, // Apvaliname iki 1 skaičiaus po kablelio
      humidity: data.main.humidity,
      windSpeed: Math.round(data.wind.speed * 10) / 10,
      description: getWeatherDescriptionLT(data.weather[0].id, data.main.temp),
      icon: data.weather[0].icon
    };
    
    // Saugome duomenis localStorage
    localStorage.setItem(
      cacheKey, 
      JSON.stringify({
        data: weatherData,
        timestamp: Date.now()
      })
    );
    
    return weatherData;
  } catch (error) {
    console.error('Error fetching weather data:', error);
    
    // Jei nepavyko gauti duomenų, generuojame atsarginį variantą pagal sezoną
    return generateFallbackWeatherData(latitude, longitude);
  }
};

// Funkcija prognozėms gauti
export const fetchWeatherForecast = async (latitude: number, longitude: number, days: number = 3): Promise<WeatherData[]> => {
  try {
    // Pirma bandom gauti iš localStorage, kad taupyti API užklausas
    const cacheKey = `forecast_${latitude.toFixed(2)}_${longitude.toFixed(2)}`;
    const cachedData = localStorage.getItem(cacheKey);
    
    if (cachedData) {
      const parsedData = JSON.parse(cachedData);
      const cacheTime = parsedData.timestamp;
      
      // Naudojame cache duomenis, jei jie ne senesni nei 3 valandos
      if (Date.now() - cacheTime < 3 * 60 * 60 * 1000) {
        console.log('Using cached forecast data');
        return parsedData.data;
      }
    }
    
    // Kreipimasis į OpenWeatherMap API 5-dienų prognozę
    const response = await fetch(
      `${OPENWEATHER_BASE_URL}/forecast?lat=${latitude}&lon=${longitude}&units=metric&lang=lt&appid=${OPENWEATHER_API_KEY}`
    );
    
    if (!response.ok) {
      throw new Error(`Weather API responded with status: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Apdorojam prognozės duomenis
    const forecastData = processForecastData(data, days);
    
    // Saugome duomenis localStorage
    localStorage.setItem(
      cacheKey, 
      JSON.stringify({
        data: forecastData,
        timestamp: Date.now()
      })
    );
    
    return forecastData;
  } catch (error) {
    console.error('Error fetching weather forecast:', error);
    
    // Jei nepavyko gauti duomenų, generuojame atsarginį variantą pagal sezoną
    return generateFallbackForecast(latitude, longitude, days);
  }
};

// Funkcija prognozės duomenų apdorojimui
const processForecastData = (data: any, days: number): WeatherData[] => {
  const forecasts: WeatherData[] = [];
  const dayMap = new Map<string, any[]>();
  
  // Grupuojame prognozes pagal dieną
  data.list.forEach((item: any) => {
    const date = new Date(item.dt * 1000);
    const dateKey = date.toISOString().split('T')[0];
    
    if (!dayMap.has(dateKey)) {
      dayMap.set(dateKey, []);
    }
    
    dayMap.get(dateKey)?.push(item);
  });
  
  // Imame tiek dienų, kiek prašoma (max yra 5, nes tiek pateikia API)
  const dayKeys = Array.from(dayMap.keys()).slice(0, days);
  
  dayKeys.forEach(dayKey => {
    const dayData = dayMap.get(dayKey) || [];
    
    // Vidurdieniui artimiausia prognozė (apie 12-14 val)
    const middayForecast = dayData.reduce((closest, current) => {
      const currentHour = new Date(current.dt * 1000).getHours();
      const closestHour = new Date(closest.dt * 1000).getHours();
      
      return Math.abs(currentHour - 13) < Math.abs(closestHour - 13) ? current : closest;
    }, dayData[0]);
    
    const forecast: WeatherData = {
      temp: Math.round(middayForecast.main.temp * 10) / 10,
      humidity: middayForecast.main.humidity,
      windSpeed: Math.round(middayForecast.wind.speed * 10) / 10,
      description: getWeatherDescriptionLT(middayForecast.weather[0].id, middayForecast.main.temp),
      icon: middayForecast.weather[0].icon,
      date: dayKey
    };
    
    forecasts.push(forecast);
  });
  
  return forecasts;
};

// Lietuviški orų aprašymai
const getWeatherDescriptionLT = (conditionId: number, temp: number): string => {
  // Pagal OpenWeatherMap oro sąlygų kodus: https://openweathermap.org/weather-conditions
  if (conditionId >= 200 && conditionId < 300) {
    return 'Audra su perkūnija';
  } else if (conditionId >= 300 && conditionId < 400) {
    return 'Dulksna';
  } else if (conditionId >= 500 && conditionId < 600) {
    return 'Lietus';
  } else if (conditionId >= 600 && conditionId < 700) {
    return 'Sniegas';
  } else if (conditionId >= 700 && conditionId < 800) {
    return 'Rūkas';
  } else if (conditionId === 800) {
    if (temp < 0) return 'Giedra, šalta';
    if (temp < 10) return 'Giedra, vėsu';
    if (temp < 20) return 'Giedra, maloni temperatūra';
    return 'Giedra, šilta';
  } else if (conditionId > 800 && conditionId < 900) {
    return 'Debesuota';
  } else {
    // Aprašymas pagal temperatūrą, jei kodas nežinomas
    if (temp < 0) return 'Šalta';
    if (temp < 10) return 'Vėsu';
    if (temp < 20) return 'Maloni temperatūra';
    return 'Šilta';
  }
};

// Atsarginis variantas, jei nepavyktų gauti duomenų
const generateFallbackWeatherData = (latitude: number, longitude: number): WeatherData => {
  const currentDate = new Date();
  const month = currentDate.getMonth();
  
  // Vidutinė temperatūra pagal mėnesį Lietuvoje
  let baseTemp;
  let description;
  let icon;
  
  if (month === 0) {
    // Sausis
    baseTemp = -5 + (Math.random() * 6 - 3);
    description = 'Šalta';
    icon = '13d'; // Snowing
  } else if (month === 1) {
    // Vasaris
    baseTemp = -4 + (Math.random() * 6 - 3);
    description = 'Šalta';
    icon = '13d'; // Snowing
  } else if (month === 2) {
    // Kovas
    baseTemp = 1 + (Math.random() * 6 - 3);
    description = 'Vėsu';
    icon = '04d'; // Cloudy
  } else if (month === 3) {
    // Balandis
    baseTemp = 8 + (Math.random() * 6 - 3);
    description = 'Vėsu';
    icon = '10d'; // Light rain
  } else if (month === 4) {
    // Gegužė
    baseTemp = 14 + (Math.random() * 6 - 3);
    description = 'Šilta';
    icon = '03d'; // Partly cloudy
  } else if (month === 5) {
    // Birželis
    baseTemp = 17 + (Math.random() * 6 - 3);
    description = 'Šilta';
    icon = '02d'; // Few clouds
  } else if (month === 6) {
    // Liepa
    baseTemp = 19 + (Math.random() * 6 - 3);
    description = 'Šilta';
    icon = '01d'; // Clear
  } else if (month === 7) {
    // Rugpjūtis
    baseTemp = 18 + (Math.random() * 6 - 3);
    description = 'Šilta';
    icon = '01d'; // Clear
  } else if (month === 8) {
    // Rugsėjis
    baseTemp = 14 + (Math.random() * 6 - 3);
    description = 'Vėsu';
    icon = '03d'; // Partly cloudy
  } else if (month === 9) {
    // Spalis
    baseTemp = 8 + (Math.random() * 6 - 3);
    description = 'Vėsu';
    icon = '10d'; // Light rain
  } else if (month === 10) {
    // Lapkritis
    baseTemp = 3 + (Math.random() * 6 - 3);
    description = 'Vėsu';
    icon = '09d'; // Rain
  } else {
    // Gruodis
    baseTemp = -2 + (Math.random() * 6 - 3);
    description = 'Šalta';
    icon = '13d'; // Snowing
  }
  
  // Pridedame šiek tiek variacijos pagal lokaciją
  const locationVariation = (Math.sin(latitude * longitude / 1000) * 2);
  baseTemp += locationVariation;
  
  return {
    temp: Math.round(baseTemp * 10) / 10,
    humidity: Math.round(40 + Math.random() * 40),
    windSpeed: Math.round((2 + Math.random() * 8) * 10) / 10,
    description,
    icon
  };
};

// Generuojame atsarginę prognozę
const generateFallbackForecast = (latitude: number, longitude: number, days: number): WeatherData[] => {
  const forecasts: WeatherData[] = [];
  const current = generateFallbackWeatherData(latitude, longitude);
  
  // Pridedame dieną prie einamosioms dienos orų duomenų
  const currentDate = new Date();
  const currentDateStr = currentDate.toISOString().split('T')[0];
  forecasts.push({
    ...current,
    date: currentDateStr
  });
  
  // Generuojame prognozes sekančioms dienoms
  for (let i = 1; i < days; i++) {
    const nextDate = new Date();
    nextDate.setDate(currentDate.getDate() + i);
    const nextDateStr = nextDate.toISOString().split('T')[0];
    
    // Temperatūros variacija kiekvienai dienai
    const tempVariation = Math.random() * 4 - 2; // -2 iki +2 laipsnių
    
    forecasts.push({
      temp: Math.round((current.temp + tempVariation) * 10) / 10,
      humidity: Math.round(current.humidity + (Math.random() * 20 - 10)),
      windSpeed: Math.round((current.windSpeed + (Math.random() * 2 - 1)) * 10) / 10,
      description: current.description,
      icon: current.icon,
      date: nextDateStr
    });
  }
  
  return forecasts;
};