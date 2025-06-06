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

interface WeatherData {
  name: string;
  weather: { description: string; icon: string; main: string }[];
  main: { temp: number; humidity: number; feels_like: number; temp_min: number; temp_max: number; pressure: number };
  wind: { speed: number; deg: number };
  sys: { country: string; sunrise: number; sunset: number };
  dt: number;
  visibility: number;
  timezone: number;
  coord: { lat: number; lon: number };
}

interface ForecastItem {
  dt: number;
  main: {
    temp: number;
    feels_like: number;
    temp_min: number;
    temp_max: number;
    humidity: number;
  };
  weather: {
    description: string;
    icon: string;
    main: string;
  }[];
  wind: {
    speed: number;
    deg: number;
  };
  dt_txt: string;
}

interface ForecastData {
  list: ForecastItem[];
  city: {
    name: string;
    country: string;
    timezone: number;
  };
}

export default function WeatherApp() {
  const [city, setCity] = useState("");
  const [citySuggestions, setCitySuggestions] = useState<CitySuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [forecast, setForecast] = useState<ForecastData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [weatherCondition, setWeatherCondition] = useState<string>("default");
  const [activeTab, setActiveTab] = useState<"current" | "forecast">("current");
  const [selectedDay, setSelectedDay] = useState<number>(0);

  const API_KEY = "1a6e0b36c6da5dbd105dfa2301a8f892";

  // Fetch city suggestions
  const fetchCitySuggestions = async (query: string) => {
    if (query.length < 2) {
      setCitySuggestions([]);
      return;
    }
    
    try {
      const response = await axios.get(
        `https://api.openweathermap.org/geo/1.0/direct?q=${query}&limit=5&appid=${API_KEY}`
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

  const fetchWeatherData = async (selectedCity?: string) => {
    const cityToSearch = selectedCity || city;
    if (!cityToSearch.trim()) return;
    
    setLoading(true);
    setError(null);
    setShowSuggestions(false);
    try {
      // Fetch current weather
      const currentResponse = await axios.get(
        `https://api.openweathermap.org/data/2.5/weather?q=${cityToSearch}&appid=${API_KEY}&units=metric`
      );
      const currentData = currentResponse.data as WeatherData;
      setWeather(currentData);
      setWeatherCondition(currentData.weather[0].main.toLowerCase());
      
      // Fetch forecast data using coordinates from current weather
      const forecastResponse = await axios.get(
        `https://api.openweathermap.org/data/2.5/forecast?lat=${currentData.coord.lat}&lon=${currentData.coord.lon}&appid=${API_KEY}&units=metric`
      );
      setForecast(forecastResponse.data as ForecastData);
      
      setLastUpdated(new Date().toLocaleTimeString());
    } catch (err) {
      setError("City not found. Please try another location.");
      setWeather(null);
      setForecast(null);
      setWeatherCondition("default");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      fetchWeatherData();
    }
  };

  const handleSuggestionClick = (suggestion: CitySuggestion) => {
    const displayName = `${suggestion.name}${suggestion.state ? `, ${suggestion.state}` : ''}, ${suggestion.country}`;
    setCity(displayName);
    fetchWeatherData(displayName);
  };

  const getWeatherIcon = (iconCode: string) => {
    return `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
  };

  // Get wind direction from degrees
  const getWindDirection = (degrees: number) => {
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    const index = Math.round((degrees % 360) / 45) % 8;
    return directions[index];
  };

  // Format time from timestamp
  const formatTime = (timestamp: number, timezone: number) => {
    const date = new Date((timestamp + timezone) * 1000);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Format date from timestamp
  const formatDate = (timestamp: number, timezone: number) => {
    const date = new Date((timestamp + timezone) * 1000);
    return date.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' });
  };

  // Group forecast by day
  const groupForecastByDay = () => {
    if (!forecast) return [];
    
    const grouped: { [key: string]: ForecastItem[] } = {};
    
    forecast.list.forEach(item => {
      const date = new Date(item.dt * 1000).toLocaleDateString();
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(item);
    });
    
    return Object.entries(grouped).map(([date, items]) => ({
      date,
      items
    }));
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
          className="w-full max-w-4xl"
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
              onClick={() => fetchWeatherData()}
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

          {weather && (
            <div className="mb-6">
              <div className="flex border-b border-white/20">
                <button
                  onClick={() => setActiveTab("current")}
                  className={`px-4 py-2 font-medium ${activeTab === "current" ? "text-white border-b-2 border-blue-400" : "text-white/60"}`}
                >
                  Current Weather
                </button>
                <button
                  onClick={() => setActiveTab("forecast")}
                  className={`px-4 py-2 font-medium ${activeTab === "forecast" ? "text-white border-b-2 border-blue-400" : "text-white/60"}`}
                >
                  5-Day Forecast
                </button>
              </div>
            </div>
          )}

          <AnimatePresence mode="wait">
            {weather && activeTab === "current" && (
              <motion.div
                key="current"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
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

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center bg-white/10 rounded-lg p-4 backdrop-blur-sm border border-white/10">
                  <div>
                    <p className="text-white/80">Humidity</p>
                    <p className="text-xl font-semibold text-white">{weather.main.humidity}%</p>
                  </div>
                  <div>
                    <p className="text-white/80">Wind</p>
                    <p className="text-xl font-semibold text-white">
                      {weather.wind.speed} m/s {getWindDirection(weather.wind.deg)}
                    </p>
                  </div>
                  <div>
                    <p className="text-white/80">Visibility</p>
                    <p className="text-xl font-semibold text-white">
                      {(weather.visibility / 1000).toFixed(1)} km
                    </p>
                  </div>
                  <div>
                    <p className="text-white/80">Pressure</p>
                    <p className="text-xl font-semibold text-white">
                      {weather.main.pressure} hPa
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div className="bg-white/5 p-3 rounded-lg">
                    <p className="text-white/80">Sunrise</p>
                    <p className="text-lg font-semibold text-white">
                      {formatTime(weather.sys.sunrise, weather.timezone)}
                    </p>
                  </div>
                  <div className="bg-white/5 p-3 rounded-lg">
                    <p className="text-white/80">Sunset</p>
                    <p className="text-lg font-semibold text-white">
                      {formatTime(weather.sys.sunset, weather.timezone)}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {forecast && activeTab === "forecast" && (
              <motion.div
                key="forecast"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="bg-white/10 backdrop-blur-md p-6 rounded-xl shadow-2xl border border-white/20"
              >
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-white mb-2">
                    {forecast.city.name}, {forecast.city.country}
                  </h2>
                  <p className="text-white/80">5-Day Weather Forecast</p>
                </div>

                <div className="flex overflow-x-auto pb-2 mb-4 gap-2">
                  {groupForecastByDay().map((day, index) => (
                    <button
                      key={day.date}
                      onClick={() => setSelectedDay(index)}
                      className={`px-4 py-2 rounded-lg whitespace-nowrap ${selectedDay === index ? 'bg-blue-500 text-white' : 'bg-white/10 text-white/80 hover:bg-white/20'}`}
                    >
                      {formatDate(new Date(day.items[0].dt * 1000).getTime(), forecast.city.timezone)}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {groupForecastByDay()[selectedDay]?.items.map((item) => (
                    <div key={item.dt} className="bg-white/5 p-4 rounded-lg backdrop-blur-sm border border-white/10">
                      <div className="flex justify-between items-center mb-2">
                        <p className="font-medium">
                          {new Date(item.dt * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                        <img 
                          src={getWeatherIcon(item.weather[0].icon)} 
                          alt={item.weather[0].description}
                          className="w-10 h-10"
                        />
                      </div>
                      <div className="flex justify-between items-end">
                        <div>
                          <p className="text-2xl font-bold">{Math.round(item.main.temp)}°C</p>
                          <p className="text-sm capitalize text-white/80">{item.weather[0].description}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm">Feels like: {Math.round(item.main.feels_like)}°C</p>
                          <p className="text-sm">Wind: {item.wind.speed} m/s {getWindDirection(item.wind.deg)}</p>
                          <p className="text-sm">Humidity: {item.main.humidity}%</p>
                        </div>
                      </div>
                    </div>
                  ))}
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