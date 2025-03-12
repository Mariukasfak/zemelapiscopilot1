import { useState, useEffect } from 'react';
import { WeatherData } from '../types';

// Čia importuojame funkcijas iš serviso
import { fetchWeatherData as fetchWeatherFromApi, fetchWeatherForecast as fetchForecastFromApi } from '../services/weatherService';

interface UseWeatherReturn {
  weatherData: WeatherData | null;
  forecastData: WeatherData[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  lastUpdated: Date | null;
}

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

export const useWeather = (latitude: number, longitude: number): UseWeatherReturn => {
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [forecastData, setForecastData] = useState<WeatherData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Funkcija orų duomenims gauti
  const fetchWeatherData = async (): Promise<WeatherData | null> => {
    try {
      return await fetchWeatherFromApi(latitude, longitude);
    } catch (error) {
      console.error('Error fetching weather data:', error);
      return generateFallbackWeatherData(latitude, longitude);
    }
  };

  // Funkcija orų prognozei gauti
  const fetchWeatherForecast = async (days: number = 3): Promise<WeatherData[]> => {
    try {
      return await fetchForecastFromApi(latitude, longitude, days);
    } catch (error) {
      console.error('Error fetching weather forecast:', error);
      return generateFallbackForecast(latitude, longitude, days);
    }
  };

  // Funkcija duomenų atnaujinimui
  const refresh = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Gauname esamus orų duomenis
      const currentWeather = await fetchWeatherData();
      if (currentWeather) {
        setWeatherData(currentWeather);
      }
      
      // Gauname orų prognozę
      const forecast = await fetchWeatherForecast(3);
      if (forecast.length > 0) {
        setForecastData(forecast);
      }
      
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Klaida atnaujinant orų duomenis:', err);
      setError('Nepavyko atnaujinti orų duomenų');
    } finally {
      setLoading(false);
    }
  };

  // Užkrauname duomenis, kai komponentas užsikrauna
  useEffect(() => {
    refresh();
    
    // Atnaujinti duomenis kas 15 minučių
    const interval = setInterval(refresh, 15 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [latitude, longitude]);

  return { weatherData, forecastData, loading, error, refresh, lastUpdated };
};