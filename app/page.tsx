'use client';

import React, { useState, useEffect } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";

interface CitySuggestion {
  name: string;
  country: string;
  state?: string;
  lat: number;
  lon: number;
}

export default function WeatherApp() {
  const [city, setCity] = useState("");
  const [citySuggestions, setCitySuggestions] = useState<CitySuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  interface WeatherData {
    name: string;
    weather: { description: string; icon: string; main: string }[];
    main: { temp: number; humidity: number; feels_like: number };
    wind: { speed: number };
    sys: { country: string };
    dt: number;
  }

  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [weatherCondition, setWeatherCondition] = useState<string>("default");

  // Fetch city suggestions
  const fetchCitySuggestions = async (query: string) => {
    if (query.length < 2) {
      setCitySuggestions([]);
      return;
    }
    
    try {
      const apiKey = "1a6e0b36c6da5dbd105dfa2301a8f892";
      const response = await axios.get(
        `https://api.openweathermap.org/geo/1.0/direct?q=${query}&limit=5&appid=${apiKey}`
      );
      setCitySuggestions(response.data as CitySuggestion[]);
    } catch (err) {
      console.error("Error fetching city suggestions:", err);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (city) {
        fetchCitySuggestions(city);
      }
    }, 300); // Debounce for 300ms

    return () => clearTimeout(timer);
  }, [city]);

  const fetchWeather = async (selectedCity?: string) => {
    const cityToSearch = selectedCity || city;
    if (!cityToSearch.trim()) return;
    
    setLoading(true);
    setError(null);
    setShowSuggestions(false);
    try {
      const apiKey = "1a6e0b36c6da5dbd105dfa2301a8f892";
      const response = await axios.get(
        `https://api.openweathermap.org/data/2.5/weather?q=${cityToSearch}&appid=${apiKey}&units=metric`
      );
      const data = response.data as WeatherData;
      setWeather(data);
      setWeatherCondition(data.weather[0].main.toLowerCase());
      setLastUpdated(new Date().toLocaleTimeString());
    } catch (err) {
      setError("City not found. Please try another location.");
      setWeather(null);
      setWeatherCondition("default");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      fetchWeather();
    }
  };

  const handleSuggestionClick = (suggestion: CitySuggestion) => {
    const displayName = `${suggestion.name}${suggestion.state ? `, ${suggestion.state}` : ''}, ${suggestion.country}`;
    setCity(displayName);
    fetchWeather(displayName);
  };

  const getWeatherIcon = (iconCode: string) => {
    return `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
  };

  // Get background gradient based on weather condition
  const getBackgroundGradient = () => {
    switch(weatherCondition) {
      case "clear":
        return "from-blue-400 to-cyan-300";
      case "clouds":
        return "from-gray-400 to-gray-600";
      case "rain":
        return "from-blue-700 to-gray-500";
      case "thunderstorm":
        return "from-purple-900 to-gray-800";
      case "snow":
        return "from-blue-100 to-blue-300";
      case "mist":
      case "smoke":
      case "haze":
      case "fog":
        return "from-gray-300 to-gray-500";
      case "drizzle":
        return "from-blue-300 to-gray-400";
      default:
        return "from-gray-900 to-gray-800";
    }
  };

  // Get appropriate background image or pattern
  const getBackgroundPattern = () => {
    switch(weatherCondition) {
      case "clear":
        return "bg-[url('https://images.unsplash.com/photo-1560258018-c7db7645254e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2000&q=80')]";
      case "clouds":
        return "bg-[url('https://images.unsplash.com/photo-1483728642387-6c3bdd6c93e5?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2000&q=80')]";
      case "rain":
        return "bg-[url('https://images.unsplash.com/photo-1438449805896-28a666819a20?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2000&q=80')]";
      case "thunderstorm":
        return "bg-[url('https://static.toiimg.com/thumb/msid-120851441,width-1280,height-720,resizemode-4/120851441.jpg')]";
      case "snow":
        return "bg-[url('https://www.oceanclock.com/img/cms/blog/Formation%20neige/comment%20se%20forme%20la%20neige.jpg')]";
      case "haze":
        return "bg-[url('https://d2h8hramu3xqoh.cloudfront.net/blog/wp-content/uploads/2022/08/Hazy-Skies-scaled.webp')]";
      case "mist":
        return "bg-[url('https://static.wikia.nocookie.net/demigodshaven/images/f/f5/Mist.jpg/revision/latest?cb=20110102163040')]";
      default:
        return "";
    }
  };

  return (
    <div className={`min-h-screen bg-gradient-to-br ${getBackgroundGradient()} ${getBackgroundPattern()} bg-cover bg-center text-white flex flex-col transition-all duration-1000`}>
      {/* Overlay for better text readability */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm"></div>

      {/* Header */}
      <header className="relative bg-black/30 backdrop-blur-md py-4 px-6 border-b border-white/10 shadow-sm z-10">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold text-indigo-400">Dennam.lk</h1>
          <p className="text-sm text-white/80 hidden sm:block">Real-time weather updates</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative flex-grow flex flex-col items-center justify-center px-4 py-12 z-10">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <h1 className="text-4xl font-bold mb-8 text-center text-white drop-shadow-lg">
            Weather Forecast
          </h1>

          <div className="relative flex flex-col sm:flex-row gap-3 mb-8">
            <div className="relative flex-grow">
              <input
                type="text"
                value={city}
                onChange={(e) => {
                  setCity(e.target.value);
                  setShowSuggestions(true);
                }}
                onKeyPress={handleKeyPress}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                placeholder="Enter city name"
                className="w-full p-3 rounded-lg bg-white/10 text-white border border-white/20 focus:outline-none focus:ring-2 focus:ring-blue-300/50 placeholder-white/60 transition-all backdrop-blur-sm"
              />
              {showSuggestions && citySuggestions.length > 0 && (
                <ul className="absolute z-20 w-full mt-1 bg-white/10 backdrop-blur-lg border border-white/20 rounded-lg shadow-lg overflow-hidden">
                  {citySuggestions.map((suggestion, index) => (
                    <li 
                      key={`${suggestion.name}-${suggestion.country}-${index}`}
                      className="px-4 py-2 hover:bg-white/20 cursor-pointer transition-colors"
                      onMouseDown={() => handleSuggestionClick(suggestion)}
                    >
                      {suggestion.name}{suggestion.state ? `, ${suggestion.state}` : ''}, {suggestion.country}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <motion.button
              onClick={() => fetchWeather()}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-white/20 hover:bg-white/30 text-white px-6 py-3 rounded-lg font-medium shadow-lg hover:shadow-white/10 transition-all backdrop-blur-sm border border-white/20"
            >
              Search
            </motion.button>
          </div>

          {loading && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex justify-center py-8"
            >
              <div className="w-12 h-12 border-4 border-blue-300 border-t-transparent rounded-full animate-spin"></div>
            </motion.div>
          )}

          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="bg-red-500/30 border border-red-400 text-white p-3 rounded-lg mb-6 backdrop-blur-sm"
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {weather && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
                className="bg-white/10 backdrop-blur-md p-6 rounded-xl shadow-2xl border border-white/20"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-2xl font-bold text-white">
                      {weather.name}, {weather.sys.country}
                    </h2>
                    <p className="text-white/80 capitalize">
                      {weather.weather[0].description}
                    </p>
                  </div>
                  {weather.weather[0].icon && (
                    <img 
                      src={getWeatherIcon(weather.weather[0].icon)} 
                      alt={weather.weather[0].description}
                      className="w-16 h-16 drop-shadow-lg"
                    />
                  )}
                </div>

                <div className="flex items-center justify-between mb-6">
                  <span className="text-5xl font-bold text-white drop-shadow-lg">
                    {Math.round(weather.main.temp)}°C
                  </span>
                  <div className="text-right">
                    <p className="text-white/80">Feels like: {Math.round(weather.main.feels_like)}°C</p>
                    <p className="text-sm text-white/60">
                      Last updated: {lastUpdated}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-center bg-white/10 rounded-lg p-4 backdrop-blur-sm border border-white/10">
                  <div>
                    <p className="text-white/80">Humidity</p>
                    <p className="text-xl font-semibold text-white">{weather.main.humidity}%</p>
                  </div>
                  <div>
                    <p className="text-white/80">Wind</p>
                    <p className="text-xl font-semibold text-white">{weather.wind.speed} m/s</p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="bg-black bg-opacity-30 border-t border-gray-700 text-center py-4 text-sm text-gray-400 backdrop-blur shadow-inner">
        &copy; {new Date().getFullYear()} Dennam.lk. Developed by Chalana Prabhashwara.
      </footer>
    </div>
  );
}