import React, { useState, useEffect } from 'react';
import { Thermometer, Droplets, Wind, RefreshCw } from 'lucide-react';
import { WeatherData } from '../types';
import { fetchWeatherData, fetchWeatherForecast } from '../services/weatherService';

interface WeatherComponentProps {
  latitude: number;
  longitude: number;
  locationName: string;
  compact?: boolean;
}

const WeatherComponent: React.FC<WeatherComponentProps> = ({
  latitude,
  longitude,
  locationName,
  compact = false
}) => {
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [forecastData, setForecastData] = useState<WeatherData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Funkcija duomenų atnaujinimui
  const refresh = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Gauname esamus orų duomenis
      const currentWeather = await fetchWeatherData(latitude, longitude);
      if (currentWeather) {
        setWeatherData(currentWeather);
      }
      
      // Gauname orų prognozę
      const forecast = await fetchWeatherForecast(latitude, longitude, 3);
      if (forecast.length > 0) {
        setForecastData(forecast);
      }
      
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Error refreshing weather data:', err);
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

  // Funkcija tam tikro dienos pavadinimo gavimui lietuvių kalba
  const getDayName = (dateStr: string | undefined): string => {
    if (!dateStr) return '';
    
    const date = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);
    
    // Patikrinam, ar tai šiandien ar rytoj
    if (date.toDateString() === today.toDateString()) {
      return 'Šiandien';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Rytoj';
    }
    
    // Jei ne, grąžiname savaitės dieną
    const weekdays = ['Sekm', 'Pirm', 'Antr', 'Treč', 'Ketv', 'Penkt', 'Šešt'];
    return weekdays[date.getDay()];
  };

  if (loading && !weatherData) {
    return (
      <div className="p-3 bg-blue-50 rounded-md text-center">
        <p className="text-blue-500">Kraunami orų duomenys...</p>
      </div>
    );
  }

  if (error && !weatherData) {
    return (
      <div className="p-3 bg-red-50 rounded-md">
        <p className="text-red-500 text-sm">{error}</p>
        <button 
          onClick={() => refresh()}
          className="mt-1 p-1 bg-red-100 text-red-700 rounded-md text-xs flex items-center"
        >
          <RefreshCw size={12} className="mr-1" /> Bandyti dar kartą
        </button>
      </div>
    );
  }

  // Jei nėra duomenų, nerodome nieko
  if (!weatherData) return null;

  // Kompaktiškas variantas
  if (compact) {
    return (
      <div className="flex items-center justify-between gap-2 text-gray-700">
        <div className="flex items-center">
          <img 
            src={`https://openweathermap.org/img/wn/${weatherData.icon}.png`} 
            alt="Oras" 
            className="w-10 h-10"
          />
          <div>
            <p className="font-medium">{weatherData.temp}°C</p>
            <p className="text-xs text-gray-500">{weatherData.description}</p>
          </div>
        </div>
        <button 
          onClick={() => refresh()}
          className="p-1 hover:bg-gray-100 rounded-full text-gray-500"
          title="Atnaujinti orų duomenis"
        >
          <RefreshCw size={14} />
        </button>
      </div>
    );
  }

  // Pilnas variantas
  return (
    <div className="p-3 bg-blue-50 rounded-md">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-medium text-sm">Oras dabar ({locationName})</h3>
        <button 
          onClick={() => refresh()}
          className="p-1 hover:bg-blue-100 rounded-full text-blue-600"
          title="Atnaujinti orų duomenis"
        >
          <RefreshCw size={16} />
        </button>
      </div>
      
      <div className="flex items-center mb-3">
        <img 
          src={`https://openweathermap.org/img/wn/${weatherData.icon}.png`} 
          alt="Oras"
          className="w-12 h-12"
        />
        <div>
          <p className="text-lg font-medium">{weatherData.temp}°C</p>
          <p className="text-sm text-gray-600">{weatherData.description}</p>
          <div className="flex items-center text-xs text-gray-500 space-x-2">
            <span className="flex items-center">
              <Droplets size={12} className="mr-1" />
              {weatherData.humidity}%
            </span>
            <span className="flex items-center">
              <Wind size={12} className="mr-1" />
              {weatherData.windSpeed} m/s
            </span>
          </div>
        </div>
      </div>
      
      {/* Prognozės */}
      {forecastData.length > 0 && (
        <div className="grid grid-cols-3 gap-2 mt-2 pt-2 border-t border-blue-100">
          {forecastData.map((day, index) => (
            <div key={index} className="text-center">
              <p className="text-xs font-medium">{getDayName(day.date)}</p>
              <img 
                src={`https://openweathermap.org/img/wn/${day.icon}.png`} 
                alt="Oras" 
                className="w-8 h-8 mx-auto"
              />
              <p className="text-sm">{day.temp}°C</p>
            </div>
          ))}
        </div>
      )}
      
      {/* Paskutinio atnaujinimo laikas */}
      {lastUpdated && (
        <div className="mt-2 text-xs text-gray-500 flex items-center justify-end">
          <Thermometer size={12} className="mr-1" /> 
          Atnaujinta: {lastUpdated.toLocaleTimeString()}
        </div>
      )}
    </div>
  );
};

export default WeatherComponent;