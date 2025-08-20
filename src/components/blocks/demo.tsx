'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { Wrapper, Status } from '@googlemaps/react-wrapper';
import { motion, AnimatePresence } from 'framer-motion';
import ScrollExpandMedia from '@/components/blocks/scroll-expansion-hero';

// Interface for court data
interface CourtData {
  id: number;
  name: string;
  address: string;
  borough: string;
  surface: string;
  permitStatus: string;
  courts: number;
  datesOpen: string;
  hours: string;
  description: string;
  lat: number;
  lng: number;
}

// Function to load and parse CSV data
const loadCourtsData = async (): Promise<CourtData[]> => {
  try {
    const response = await fetch('/NYC TENNIS COURTS - Sheet1.csv');
    const csvText = await response.text();
    
    // Use a more robust CSV parser that handles multi-line quoted fields
    const courts: CourtData[] = [];
    const lines = csvText.split('\n');
    let currentRow: string[] = [];
    let currentField = '';
    let inQuotes = false;
    let rowCount = 0;
    let processedRows = 0;
    let validCourts = 0;
    
    // Skip header row
    let startParsing = false;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      if (i === 0) {
        startParsing = true;
        continue; // Skip header
      }
      
      if (!startParsing) continue;
      
      // Parse character by character
      for (let j = 0; j < line.length; j++) {
        const char = line[j];
        
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          currentRow.push(currentField.trim());
          currentField = '';
        } else {
          currentField += char;
        }
      }
      
      // If we're not in quotes, this line ends a record
      if (!inQuotes) {
        currentRow.push(currentField.trim());
        rowCount++;
        
        // Process the complete row if it has enough fields
        if (currentRow.length >= 11) {
          processedRows++;
          
          const court: CourtData = {
            id: courts.length + 1,
            name: currentRow[0] || '',
            address: currentRow[1] || '',
            borough: currentRow[2] || '',
            surface: currentRow[3] || '',
            permitStatus: currentRow[4] || '',
            courts: parseInt(currentRow[5]) || 0,
            datesOpen: currentRow[6] || '',
            hours: currentRow[7] || '',
            description: currentRow[8] || '',
            lat: parseFloat(currentRow[9]) || 0,
            lng: parseFloat(currentRow[10]) || 0,
          };
          
          // Debug logging for invalid courts
          if (court.lat === 0 || court.lng === 0 || !court.name || court.name.length === 0) {
            console.log(`Skipping court: ${court.name || 'No name'} - lat: ${court.lat}, lng: ${court.lng}`);
          } else {
            courts.push(court);
            validCourts++;
          }
        } else {
          console.log(`Row ${rowCount} has insufficient fields (${currentRow.length}):`, currentRow);
        }
        
        // Reset for next row
        currentRow = [];
        currentField = '';
      } else {
        // Add line break if we're continuing a multi-line field
        currentField += '\n';
      }
    }
    
    console.log(`CSV Processing Summary:`);
    console.log(`- Total rows processed: ${rowCount}`);
    console.log(`- Rows with enough fields: ${processedRows}`);
    console.log(`- Valid courts loaded: ${validCourts}`);
    console.log(`- Expected: 57 courts`);
    
    return courts;
  } catch (error) {
    console.error('Error loading courts data:', error);
    return [];
  }
};

// Google Maps Component
const MapComponent = ({ courts, selectedBoroughs, selectedSurfaces, selectedPermitStatuses }: {
  courts: CourtData[];
  selectedBoroughs: string[];
  selectedSurfaces: string[];
  selectedPermitStatuses: string[];
}) => {
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [markers, setMarkers] = useState<google.maps.Marker[]>([]);

  // Use useMemo to prevent filteredCourts from changing on every render
  const filteredCourts = useMemo(() => {
    return courts.filter(court => {
      const boroughMatch = selectedBoroughs.length === 0 || selectedBoroughs.includes(court.borough);
      const surfaceMatch = selectedSurfaces.length === 0 || selectedSurfaces.includes(court.surface);
      const permitMatch = selectedPermitStatuses.length === 0 || selectedPermitStatuses.includes(court.permitStatus);
      return boroughMatch && surfaceMatch && permitMatch;
    });
  }, [courts, selectedBoroughs, selectedSurfaces, selectedPermitStatuses]);

  useEffect(() => {
    if (!map) return;

    // Clear existing markers
    markers.forEach(marker => marker.setMap(null));

    // Create new markers for filtered courts
    const newMarkers = filteredCourts.map(court => {
      const marker = new google.maps.Marker({
        position: { lat: court.lat, lng: court.lng },
        map: map,
        title: court.name,
        icon: {
          url: getSurfaceIcon(),
          scaledSize: new google.maps.Size(30, 30)
        }
      });

      // Info window for court details
      const infoWindow = new google.maps.InfoWindow({
        content: `
          <div style="color: black; font-family: Arial, sans-serif; max-width: 300px;">
            <h3 style="margin: 0 0 8px 0; font-size: 16px; font-weight: bold;">${court.name}</h3>
            <p style="margin: 4px 0; font-size: 12px; color: #666;">${court.address}</p>
            <div style="margin: 8px 0;">
              <p style="margin: 2px 0;"><strong>Surface:</strong> ${court.surface}</p>
              <p style="margin: 2px 0;"><strong>Courts:</strong> ${court.courts}</p>
              <p style="margin: 2px 0;"><strong>Hours:</strong> ${court.hours}</p>
              <p style="margin: 2px 0;"><strong>Season:</strong> ${court.datesOpen}</p>
              <p style="margin: 2px 0;"><strong>Permit:</strong> ${court.permitStatus}</p>
            </div>
            ${court.description ? `<p style="margin: 8px 0 0 0; font-size: 12px; color: #555; border-top: 1px solid #eee; padding-top: 8px;">${court.description.substring(0, 150)}${court.description.length > 150 ? '...' : ''}</p>` : ''}
          </div>
        `
      });

      marker.addListener('click', () => {
        infoWindow.open(map, marker);
      });

      return marker;
    });

    setMarkers(newMarkers);
  }, [map, filteredCourts]);

  const getSurfaceIcon = () => {
    // All pins are green now
    const color = '#10B981'; // Green for all courts
    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 30 30">
        <circle cx="15" cy="15" r="12" fill="${color}" stroke="white" stroke-width="2"/>
        <circle cx="15" cy="15" r="4" fill="white"/>
      </svg>`
    )}`;
  };

  const mapRef = (node: HTMLDivElement | null) => {
    if (node && !map) {
      const newMap = new google.maps.Map(node, {
        center: { lat: 40.7902065, lng: -73.9621475 }, // Central Park
        zoom: 12,
        styles: [
          {
            featureType: "poi",
            elementType: "labels",
            stylers: [{ visibility: "off" }]
          },
          {
            featureType: "road",
            elementType: "geometry",
            stylers: [{ color: "#f5f5f5" }]
          },
          {
            featureType: "landscape",
            elementType: "geometry",
            stylers: [{ color: "#f0f0f0" }]
          },
          {
            featureType: "water",
            elementType: "geometry",
            stylers: [{ color: "#e0e0e0" }]
          },
          {
            featureType: "administrative",
            elementType: "labels",
            stylers: [{ visibility: "simplified" }]
          },
          {
            featureType: "transit",
            stylers: [{ visibility: "off" }]
          }
        ]
      });
      setMap(newMap);
    }
  };

  return <div ref={mapRef} style={{ width: '100%', height: '600px', borderRadius: '8px' }} />;
};

// Render component for Google Maps
const render = (status: Status) => {
  if (status === Status.FAILURE) {
    return <div className="text-red-500 p-4 text-center">Error loading Google Maps. Please check your API key.</div>;
  }
  return <div className="text-center p-4">Loading Google Maps...</div>;
};

// Q&A Item Component
const QAItem = ({ qa }: { qa: { question: string; answer: string } }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className='relative'
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Question - Always visible */}
      <div className='py-6 cursor-pointer transition-all duration-300'>
        <div className='flex items-center justify-between'>
          <h3 className={`text-2xl font-semibold transition-colors duration-300 ${isHovered ? 'text-green-600' : 'text-gray-800'}`}>
            {qa.question}
          </h3>
          <motion.svg
            className={`w-6 h-6 transition-all duration-300 ${isHovered ? 'text-green-600' : 'text-gray-400'}`}
            animate={{ rotate: isHovered ? 180 : 0 }}
            transition={{ duration: 0.3 }}
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
          >
            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M19 9l-7 7-7-7' />
          </motion.svg>
        </div>
      </div>

      {/* Answer - Appears on hover */}
      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className='overflow-hidden'
          >
            <div className='pb-4'>
              <p className='text-gray-700 leading-relaxed text-lg'>
                {qa.answer}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

interface MediaAbout {
  overview: string;
  conclusion: string;
}

interface MediaContent {
  src: string;
  poster?: string;
  background: string;
  title: string;
  date: string;
  scrollToExpand: string;
  about: MediaAbout;
}

interface MediaContentCollection {
  [key: string]: MediaContent;
}

const sampleMediaContent: MediaContentCollection = {
  video: {
    // You can use local files from public folder like this:
    // src: '/your-video.mp4',
    // poster: '/your-poster.jpg',
    // background: '/your-background.jpg',
    
    // Using your tennis video:
    src: '/mixkit-two-people-playing-tennis-aerial-view-880-hd-ready.mp4',
    poster: '/sunset.jpg', // Using sunset as poster image
    background: '/sunset.jpg', // Using your sunset image as background
    title: 'The New York City Tennis Club',
    date: 'Scroll down',
    scrollToExpand: 'Scroll Down',
    about: {
      overview:
        'Welcome to The New York City Tennis Club - your ultimate resource for real-time wait times and court availability across NYC\'s premier tennis facilities. We\'re revolutionizing the way New Yorkers access tennis courts by providing instant updates, eliminating guesswork, and ensuring you never waste time waiting for a court again.',
      conclusion:
        'Join the tennis revolution in NYC. With our innovative platform, you can check wait times, book courts instantly, and maximize your playing time. Experience the future of tennis accessibility in the city that never sleeps.',
    },
  },
  image: {
    // You can use local files from public folder like this:
    // src: '/your-image.jpg',
    // background: '/your-background.jpg',
    
    // Or keep using external URLs:
    src: 'https://images.unsplash.com/photo-1682687982501-1e58ab814714?q=80&w=1280&auto=format&fit=crop',
    background: '/sunset.jpg', // Using your sunset image as background
    title: 'The New York City Tennis Club',
    date: 'Aerial View',
    scrollToExpand: 'Scroll Down',
    about: {
      overview:
        'The New York City Tennis Club is transforming the tennis experience in NYC. Our platform provides real-time wait times, court availability, and instant booking capabilities, making it easier than ever for tennis enthusiasts to find and secure court time across the city.',
      conclusion:
        'Say goodbye to long waits and hello to more tennis. Our revolutionary approach to court management is changing the game for NYC tennis players, ensuring you spend more time playing and less time waiting.',
    },
  },
};

const MediaContent = ({ mediaType }: { mediaType: 'video' | 'image' }) => {
  const [selectedBoroughs, setSelectedBoroughs] = useState<string[]>([]);
  const [selectedSurfaces, setSelectedSurfaces] = useState<string[]>([]);
  const [selectedPermitStatuses, setSelectedPermitStatuses] = useState<string[]>([]);
  const [courts, setCourts] = useState<CourtData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasPlayed, setHasPlayed] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Auto-play video when it comes into view
  useEffect(() => {
    if (!isMounted || !videoRef.current) return;

    const video = videoRef.current;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasPlayed) {
            video.play().catch(() => {
              // Autoplay failed, that's ok
            });
            setHasPlayed(true);
          }
        });
      },
      { threshold: 0.5 }
    );

    observer.observe(video);
    return () => observer.disconnect();
  }, [isMounted, hasPlayed]);

  // Load courts data on component mount
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const courtsData = await loadCourtsData();
      setCourts(courtsData);
      setLoading(false);
    };
    
    loadData();
  }, []);

  const handleBoroughChange = (borough: string, checked: boolean) => {
    if (checked) {
      setSelectedBoroughs(prev => [...prev, borough]);
    } else {
      setSelectedBoroughs(prev => prev.filter(b => b !== borough));
    }
  };

  const handleSurfaceChange = (surface: string, checked: boolean) => {
    if (checked) {
      setSelectedSurfaces(prev => [...prev, surface]);
    } else {
      setSelectedSurfaces(prev => prev.filter(s => s !== surface));
    }
  };

  const handlePermitStatusChange = (permitStatus: string, checked: boolean) => {
    if (checked) {
      setSelectedPermitStatuses(prev => [...prev, permitStatus]);
    } else {
      setSelectedPermitStatuses(prev => prev.filter(ps => ps !== permitStatus));
    }
  };

  // Replace with your actual Google Maps API key
  const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";
  const hasApiKey = GOOGLE_MAPS_API_KEY && GOOGLE_MAPS_API_KEY !== "YOUR_API_KEY_HERE";

  return (
    <div className='w-full mx-auto px-4'>
      <style jsx global>{`
        /* From Uiverse.io by SujitAdroja */ 
        .btn {
          color: #1F2937 !important;
          text-transform: uppercase !important;
          text-decoration: none !important;
          border: 2px solid white !important;
          padding: 15px 30px !important;
          font-size: 20px !important;
          cursor: pointer !important;
          font-weight: bold !important;
          background: transparent !important;
          position: relative !important;
          transition: all 1s !important;
          overflow: hidden !important;
          display: inline-block !important;
        }

        .btn:hover {
          color: white !important;
        }

        .btn::before {
          content: "" !important;
          position: absolute !important;
          height: 100% !important;
          width: 0% !important;
          top: 0 !important;
          left: -40px !important;
          transform: skewX(45deg) !important;
          background-color: #1F2937 !important;
          z-index: -1 !important;
          transition: all 1s !important;
        }

        .btn:hover::before {
          width: 160% !important;
        }
      `}</style>
      
      <style jsx>{`
        .checkbox-wrapper input[type="checkbox"] {
          visibility: hidden;
          display: none;
        }

        .checkbox-wrapper *,
        .checkbox-wrapper ::after,
        .checkbox-wrapper ::before {
          box-sizing: border-box;
          user-select: none;
        }

        .checkbox-wrapper {
          position: relative;
          display: block;
          overflow: hidden;
        }

        .checkbox-wrapper .label {
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .checkbox-wrapper .check {
          width: 50px;
          height: 50px;
          position: absolute;
          opacity: 0;
        }

        .checkbox-wrapper .label svg {
          vertical-align: middle;
        }

        .checkbox-wrapper .path1 {
          stroke-dasharray: 400;
          stroke-dashoffset: 400;
          transition: .5s stroke-dashoffset;
          opacity: 0;
          stroke: #10B981;
          stroke-width: 3;
          fill: none;
        }

        .checkbox-wrapper input[type="checkbox"]:checked + label svg g path {
          stroke-dashoffset: 0;
          opacity: 1;
        }

        .checkbox-wrapper .checkbox-rect {
          stroke: #d1d5db;
          fill: none;
          stroke-width: 2;
          transition: all 0.3s ease;
        }

        .checkbox-wrapper input[type="checkbox"]:checked + label svg rect {
          stroke: #10B981;
          fill: #10B981;
        }

        /* Big Green Animated Hover Cards */
        .cards {
          display: flex;
          flex-direction: column;
          gap: 25px;
        }

        .cards .red {
          background-color: white;
          box-shadow: 0 6px 20px rgba(21, 128, 61, 0.4);
          border: 2px solid rgba(21, 128, 61, 0.3);
        }

        .cards .blue {
          background-color: white;
          box-shadow: 0 6px 20px rgba(21, 128, 61, 0.4);
          border: 2px solid rgba(21, 128, 61, 0.3);
        }

        .cards .green {
          background-color: white;
          box-shadow: 0 6px 20px rgba(21, 128, 61, 0.4);
          border: 2px solid rgba(21, 128, 61, 0.3);
        }

        .cards .card {
          display: flex;
          align-items: center;
          justify-content: center;
          flex-direction: column;
          text-align: center;
          height: 180px;
          width: 400px;
          border-radius: 15px;
          color: #374151;
          cursor: pointer;
          transition: 400ms;
          padding: 25px;
          position: relative;
        }

        .cards .card p.tip {
          font-size: 1.4em;
          font-weight: 700;
          color: #111827;
          margin-bottom: 15px;
          background: none;
          border: none;
          box-shadow: none;
          padding: 0;
        }

        .cards .card p.second-text {
          font-size: 1.1em;
          color: #6b7280;
          background: none;
          border: none;
          box-shadow: none;
          padding: 0;
        }

        .cards .card .comment-box {
          position: absolute;
          bottom: -60px;
          left: -20px;
          background: white;
          border: 2px solid rgba(21, 128, 61, 0.5);
          border-radius: 8px;
          padding: 12px 16px;
          box-shadow: 0 4px 12px rgba(21, 128, 61, 0.3);
          opacity: 0;
          visibility: hidden;
          transition: all 0.3s ease;
          white-space: nowrap;
          font-size: 0.9em;
          color: #374151;
          z-index: 10;
        }

        .cards .card:hover {
          /* Keep shadow effect but no scale transform to prevent text movement */
          box-shadow: 0 10px 30px rgba(21, 128, 61, 0.5);
        }

        .cards .card:hover .comment-box {
          opacity: 1;
          visibility: visible;
          bottom: -50px;
        }

        .cards:hover > .card:not(:hover) {
          filter: blur(8px);
          /* Keep blur effect but no scale transform to prevent text movement */
        }

        /* Animated Hover Bars - From Uiverse.io by joe-watson-sbf */
        .card {
          width: 800px;
          height: 600px;
          border-radius: 12px;
          background: #15803d;
          display: flex;
          gap: 10px;
          padding: 1em;
        }

        .card p {
          height: 100%;
          flex: 1;
          overflow: hidden;
          cursor: pointer;
          border-radius: 6px;
          transition: all .5s;
          background: white;
          border: 2px solid #15803d;
          display: flex;
          justify-content: center;
          align-items: center;
        }

        .card > div:hover {
          flex: 6;
        }

        .card > div span {
          min-width: 35em;
          padding: 1.2em;
          text-align: center;
          transform: rotate(-90deg);
          transition: all .5s;
          text-transform: uppercase;
          color: #15803d;
          letter-spacing: .1em;
          font-size: 1.4em;
        }

        .card > div:hover span {
          transform: rotate(0);
        }

        /* Comment Input Boxes for Interactive Court Info */
        .comment-inputs {
          margin-top: 20px;
          opacity: 0;
          visibility: hidden;
          transition: all 0.3s ease;
        }

        .card:hover + .comment-inputs {
          opacity: 1;
          visibility: visible;
        }

        .comment-input {
          margin-bottom: 15px;
          opacity: 0;
          transform: translateY(10px);
          transition: all 0.3s ease;
        }

        .card:hover + .comment-inputs .comment-input {
          opacity: 1;
          transform: translateY(0);
        }

        .comment-input input {
          width: 100%;
          padding: 12px 16px;
          border: 2px solid rgba(21, 128, 61, 0.3);
          border-radius: 8px;
          background: white;
          color: #374151;
          font-size: 0.9em;
          transition: all 0.3s ease;
        }

        .comment-input input:focus {
          outline: none;
          border-color: rgba(21, 128, 61, 0.6);
          box-shadow: 0 0 0 3px rgba(21, 128, 61, 0.1);
        }

        .comment-input input::placeholder {
          color: #9ca3af;
        }

        /* Comment Input Boxes Within Each Hover Bar */
        .card > div {
          height: 100%;
          flex: 1;
          overflow: hidden;
          cursor: pointer;
          border-radius: 6px;
          transition: all .5s;
          background: white;
          border: 2px solid #15803d;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          position: relative;
        }

        .card > div .comment-input-inline {
          position: absolute;
          bottom: 40px;
          left: 15px;
          right: 15px;
          opacity: 0;
          visibility: hidden;
          transition: all 0.3s ease;
          transform: translateY(10px);
        }

        .card > div:hover .comment-input-inline {
          opacity: 1;
          visibility: visible;
          transform: translateY(0);
        }

        .comment-input-inline input {
          width: 100%;
          padding: 16px 20px;
          border: 2px solid rgba(21, 128, 61, 0.4);
          border-radius: 10px;
          background: white;
          color: #374151;
          font-size: 1.1em;
          transition: all 0.3s ease;
        }

        .comment-input-inline input:focus {
          outline: none;
          border-color: rgba(21, 128, 61, 0.7);
          box-shadow: 0 0 0 2px rgba(21, 128, 61, 0.1);
        }

        .comment-input-inline input::placeholder {
          color: #9ca3af;
          font-size: 0.75em;
        }

        /* Wait Time Controls */
        .wait-time-controls {
          position: absolute;
          bottom: 120px;
          left: 15px;
          right: 15px;
          display: flex;
          gap: 12px;
          opacity: 0;
          visibility: hidden;
          transition: all 0.3s ease;
          transform: translateY(10px);
        }

        .card > div:hover .wait-time-controls {
          opacity: 1;
          visibility: visible;
          transform: translateY(0);
        }

        .wait-time-selector {
          flex: 1;
        }

        .wait-time-selector select {
          width: 100%;
          padding: 10px 12px;
          border: 2px solid rgba(21, 128, 61, 0.4);
          border-radius: 8px;
          background: white;
          color: #374151;
          font-size: 0.9em;
          transition: all 0.3s ease;
          cursor: pointer;
        }

        .wait-time-selector select:focus {
          outline: none;
          border-color: rgba(21, 128, 61, 0.7);
          box-shadow: 0 0 0 2px rgba(21, 128, 61, 0.1);
        }

        .report-btn {
          padding: 10px 20px;
          background: rgba(21, 128, 61, 0.9);
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 0.9em;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          white-space: nowrap;
        }

        .report-btn:hover {
          background: rgba(21, 128, 61, 1);
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(21, 128, 61, 0.3);
        }
      `}</style>
      
      {/* Content Container - Constrained */}
      <motion.div 
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.3 }}
        className='max-w-7xl mx-auto'
      >
        {/* Real-Time Wait Times Section */}
        <motion.section 
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className='mb-20'
        >
          <motion.h2 
            className='text-4xl md:text-5xl font-bold text-center mb-16 text-gray-800 dark:text-white'
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            Real-Time Wait Times
          </motion.h2>

          <div className='grid grid-cols-1 lg:grid-cols-2 gap-20'>
            {/* Animated Hover Bars - Left Side */}
            <motion.div 
              className='space-y-6'
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <h3 className='text-2xl font-semibold mb-6 text-gray-800 dark:text-white'>
                Interactive Court Info
              </h3>

              {/* Animated Hover Bars */}
              <div className="card">
                                <div>
                  <span>Hudson River Park Courts</span>
                  <div className="wait-time-controls">
                    <div className="wait-time-selector">
                      <select>
                        <option value="">Select wait time...</option>
                        <option value="less-than-1">Less than 1 hour</option>
                        <option value="1-2">1-2 hours</option>
                        <option value="2-3">2-3 hours</option>
                        <option value="more-than-3">More than 3 hours</option>
                      </select>
                    </div>
                    <button className="report-btn">Report</button>
                  </div>
                  <div className="comment-input-inline">
                    <input type="text" placeholder="Leave a comment about the wait time..." />
                  </div>
                </div>
                <div>
                  <span>Pier 42</span>
                  <div className="wait-time-controls">
                    <div className="wait-time-selector">
                      <select>
                        <option value="">Select wait time...</option>
                        <option value="less-than-1">Less than 1 hour</option>
                        <option value="1-2">1-2 hours</option>
                        <option value="2-3">2-3 hours</option>
                        <option value="more-than-3">More than 3 hours</option>
                      </select>
                    </div>
                    <button className="report-btn">Report</button>
                  </div>
                  <div className="comment-input-inline">
                    <input type="text" placeholder="Leave a comment about the wait time..." />
                  </div>
                </div>
                <div>
                  <span>Brian Watkins Courts</span>
                  <div className="wait-time-controls">
                    <div className="wait-time-selector">
                      <select>
                        <option value="">Select wait time...</option>
                        <option value="less-than-1">Less than 1 hour</option>
                        <option value="1-2">1-2 hours</option>
                        <option value="2-3">2-3 hours</option>
                        <option value="more-than-3">More than 3 hours</option>
                      </select>
                    </div>
                    <button className="report-btn">Report</button>
                  </div>
                  <div className="comment-input-inline">
                    <input type="text" placeholder="Leave a comment about the wait time..." />
                  </div>
                </div>
                <div>
                  <span>South Oxford Courts</span>
                  <div className="wait-time-controls">
                    <div className="wait-time-selector">
                      <select>
                        <option value="">Select wait time...</option>
                        <option value="less-than-1">Less than 1 hour</option>
                        <option value="1-2">1-2 hours</option>
                        <option value="2-3">2-3 hours</option>
                        <option value="more-than-3">More than 3 hours</option>
                      </select>
                    </div>
                    <button className="report-btn">Report</button>
                  </div>
                  <div className="comment-input-inline">
                    <input type="text" placeholder="Leave a comment about the wait time..." />
                  </div>
                </div>
              </div>
              

            </motion.div>

            {/* Big Green Display Cards - Right Side */}
            <motion.div 
              className='space-y-6'
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <h3 className='text-2xl font-semibold mb-6 text-gray-800 dark:text-white' style={{ transform: 'translateX(300px)' }}>
                Live Updates
              </h3>

              {/* Big Green Display Cards */}
              <div className="cards" style={{ transform: 'translateX(300px)' }}>
                {/* Hudson River Park Courts - Green */}
                <div className="card green">
                  <p className="tip">Hudson River Park Courts</p>
                  <p className="second-text">Less than 1 hour • Updated 12 min ago</p>
                </div>
                
                {/* Pier 42 - Blue */}
                <div className="card blue">
                  <p className="tip">Pier 42</p>
                  <p className="second-text">1-2 hours • Updated 45 min ago</p>
                </div>
                
                {/* Brian Watkins Courts - Red */}
                <div className="card red">
                  <p className="tip">Brian Watkins Courts</p>
                  <p className="second-text">More than 2 hours • Updated 1 hour ago</p>
                </div>
                
                {/* South Oxford Courts - Green */}
                <div className="card green">
                  <p className="tip">South Oxford Courts</p>
                  <p className="second-text">Less than 1 hour • Updated 8 min ago</p>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.section>

        <motion.h2 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className='text-5xl font-bold mb-12 text-black dark:text-white text-center'
        >
          Court Finder
        </motion.h2>
        
        {/* Centered checkbox sections */}
        <div className='flex justify-center'>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.9 }}
            className='grid grid-cols-1 md:grid-cols-3 gap-16 mb-12'
          >
            {/* Boroughs */}
            <motion.div 
              initial={{ x: -50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ 
                duration: 0.6, 
                delay: 1.1 
              }}
              className='text-center'
            >
              <h3 className='text-2xl font-bold mb-6 text-black dark:text-white'>
                Boroughs
              </h3>
              <div className='space-y-4 flex flex-col items-start'>
                {['Manhattan', 'Brooklyn', 'Queens', 'The Bronx'].map((borough, index) => (
                  <motion.div
                    key={borough}
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ 
                      duration: 0.5, 
                      delay: 1.3 + (index * 0.1) 
                    }}
                    whileHover={{ 
                      scale: 1.02,
                      transition: { duration: 0.2 }
                    }}
                    className='flex items-center gap-4 w-full'
                  >
                    <div className="checkbox-wrapper flex-shrink-0">
                      <input 
                        className="check"
                        type="checkbox" 
                        id={`borough-${borough}`}
                        onChange={(e) => handleBoroughChange(borough, e.target.checked)}
                      />
                      <label htmlFor={`borough-${borough}`} className="label">
                        <svg width={45} height={45} viewBox="0 0 95 95">
                          <rect x={30} y={20} width={50} height={50} className="checkbox-rect" />
                        </svg>
                      </label>
    </div>
                    <span className='text-lg text-black dark:text-white'>{borough}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Surfaces */}
            <motion.div 
              initial={{ x: 0, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 1.1 }}
              className='text-center'
            >
              <h3 className='text-2xl font-bold mb-6 text-black dark:text-white'>
                Surfaces
              </h3>
              <div className='space-y-4 flex flex-col items-start'>
                {['Hard', 'Clay', 'Har-Tru'].map((surface, index) => (
                  <motion.div
                    key={surface}
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ 
                      duration: 0.5, 
                      delay: 1.3 + (index * 0.1) 
                    }}
                    whileHover={{ 
                      scale: 1.02,
                      transition: { duration: 0.2 }
                    }}
                    className='flex items-center gap-4 w-full'
                  >
                    <div className="checkbox-wrapper flex-shrink-0">
                      <input 
                        className="check"
                        type="checkbox" 
                        id={`surface-${surface}`}
                        onChange={(e) => handleSurfaceChange(surface, e.target.checked)}
                      />
                      <label htmlFor={`surface-${surface}`} className="label">
                        <svg width={45} height={45} viewBox="0 0 95 95">
                          <rect x={30} y={20} width={50} height={50} className="checkbox-rect" />
                        </svg>
                      </label>
                    </div>
                    <span className='text-lg text-black dark:text-white'>{surface}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Permit Status */}
            <motion.div 
              initial={{ x: 50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 1.1 }}
              className='text-center'
            >
              <h3 className='text-2xl font-bold mb-6 text-black dark:text-white'>
                Permit Status
              </h3>
              <div className='space-y-4 flex flex-col items-start'>
                {[
                  { value: 'Required & Enforced', label: 'Required & Enforced' },
                  { value: 'Required, but Rarely Checked', label: 'Required, Rarely Checked' },
                  { value: 'Not Required', label: 'Not Required' },
                  { value: 'Required', label: 'Required' }
                ].map((permitStatus, index) => (
                  <motion.div
                    key={permitStatus.value}
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ 
                      duration: 0.5, 
                      delay: 1.3 + (index * 0.1) 
                    }}
                    whileHover={{ 
                      scale: 1.02,
                      transition: { duration: 0.2 }
                    }}
                    className='flex items-center gap-4 w-full'
                  >
                    <div className="checkbox-wrapper flex-shrink-0">
                      <input 
                        className="check"
                        type="checkbox" 
                        id={`permit-${permitStatus.value}`}
                        onChange={(e) => handlePermitStatusChange(permitStatus.value, e.target.checked)}
                      />
                      <label htmlFor={`permit-${permitStatus.value}`} className="label">
                        <svg width={45} height={45} viewBox="0 0 95 95">
                          <rect x={30} y={20} width={50} height={50} className="checkbox-rect" />
                        </svg>
                      </label>
                    </div>
                    <span className='text-lg text-black dark:text-white whitespace-nowrap'>{permitStatus.label}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        </div>
      </motion.div>

      {/* Map Section - Full Width */}
      <motion.div 
        initial={{ opacity: 0, y: 80 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className='mt-12'
      >
        <motion.h3 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className='text-3xl font-bold mb-6 text-black dark:text-white text-center'
        >
          Court Locations {courts.length > 0 && `(${courts.length} courts)`}
        </motion.h3>
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className='bg-white rounded-lg p-4 shadow-lg'
        >
          {loading ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className='h-[600px] bg-gray-100 rounded-lg flex flex-col items-center justify-center text-gray-600'
            >
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className='text-6xl mb-4'
              >
                ⏳
              </motion.div>
              <h4 className='text-xl font-bold mb-2 text-gray-800'>Loading Tennis Courts...</h4>
              <p className='text-center'>Fetching court data from NYC database</p>
            </motion.div>
          ) : hasApiKey ? (
            <Wrapper apiKey={GOOGLE_MAPS_API_KEY} render={render}>
              <MapComponent 
                courts={courts}
                selectedBoroughs={selectedBoroughs}
                selectedSurfaces={selectedSurfaces}
                selectedPermitStatuses={selectedPermitStatuses}
              />
            </Wrapper>
          ) : (
            <div className='h-[600px] bg-gray-100 rounded-lg flex flex-col items-center justify-center text-gray-600'>
              <div className='text-6xl mb-4'>🗺️</div>
              <h4 className='text-xl font-bold mb-2 text-gray-800'>Google Maps Integration Ready</h4>
              <p className='text-center max-w-md'>
                Add your Google Maps API key to <code className='bg-gray-200 px-2 py-1 rounded'>.env.local</code> to see the interactive court map.
              </p>
              <div className='mt-4 text-sm text-gray-500'>
                <p>Courts loaded: {courts.length}</p>
                <p>Selected filters: {selectedBoroughs.length > 0 ? selectedBoroughs.join(', ') : 'All Boroughs'}</p>
                <p>Surfaces: {selectedSurfaces.length > 0 ? selectedSurfaces.join(', ') : 'All Surfaces'}</p>
                <p>Permit Status: {selectedPermitStatuses.length > 0 ? selectedPermitStatuses.join(', ') : 'All Permit Types'}</p>
              </div>
    </div>
          )}
        </motion.div>
        
        {/* Legend */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className='mt-4 flex justify-center gap-6 text-sm'
        >
          <div className='flex items-center gap-2'>
            <div className='w-4 h-4 bg-emerald-500 rounded-full'></div>
            <span className='text-black dark:text-white'>All Tennis Courts</span>
    </div>
        </motion.div>
      </motion.div>

      {/* NYC Tennis 101 Q&A Section */}
      <motion.div 
        initial={{ opacity: 0, y: 80 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className='mt-24 py-16'
      >
        <div className='max-w-4xl mx-auto px-4'>
          <motion.h2 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className='text-5xl font-bold mb-16 text-black text-center'
          >
            NYC Tennis 101
          </motion.h2>
          
          <div className='space-y-8'>
            {[
                              {
                  question: "What is the official tennis season?",
                  answer: "The official NYC tennis season runs from the first Saturday of April through the Sunday before Thanksgiving. Most outdoor public courts require a valid NYC Parks tennis permit during this time."
                },
                {
                  question: "What types of permits are available?",
                  answer: "There are several types: Full-Season Permit (best for frequent players, valid the entire season), Single-Play Permit (one-day use for occasional play - $15), Senior Permit (discounted rate for seniors 65+), and Student Permit (discounted rate for students with valid ID)."
                },
                {
                  question: "Where can I get a tennis permit?",
                  answer: "You can get permits at NYC Parks Tennis Permit Offices in all five boroughs: Bronx (1 Bronx River Parkway, Bronx, NY 10462), Brooklyn (95 Prospect Park West, between 4th & 5th Streets, Brooklyn, NY 11215), Manhattan (830 5th Avenue, The Arsenal, Room 1 Basement, New York, NY 10065), Queens (Passerelle Building, across from outdoor tennis courts, Flushing Meadows–Corona Park, Queens, NY 11368), or Paragon Sports (867 Broadway & 18th Street, New York, NY 10003). All offices are open Monday–Friday, 9 AM–4 PM, except Paragon which is open Monday–Sunday, 11:00 a.m.–7:00 p.m. (note: Paragon will not issue/renew permits past 30 minutes before closing)."
                },
              {
                question: "How strictly are permits enforced?",
                answer: "Enforcement varies widely between courts. Some locations check permits every time, others rarely check, and some courts are permit-free. There are also opportunities to play without a permit during the official season."
              },
              {
                question: "Can I play tennis in winter?",
                answer: "Yes! After the season ends (late November - March), permits are no longer required at most courts. Many courts remain open, while others close. Some facilities install seasonal 'bubbles' and operate privately with separate fees."
              },
              {
                question: "What should I know about court rules?",
                answer: "Rules vary significantly: some courts have time limits, reservation systems, or attendants; others are purely first-come, first-serve. Surfaces and conditions also differ by location and borough."
              }
            ].map((qa, index) => (
              <QAItem key={index} qa={qa} />
            ))}
          </div>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 1.0 }}
            className='text-center text-gray-600 mt-16 text-lg'
          >
            For specific court details, rules, and permit enforcement, always check our{' '}
            <span className='text-green-600 font-semibold'>Court Finder</span> above.
          </motion.p>
        </div>
      </motion.div>

      {/* Tennis App Promotion Section */}
      <motion.div
        initial={{ opacity: 0, y: 80 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className='mt-24 py-20 bg-white'
      >
        <div className='max-w-7xl mx-auto px-4'>
          
          <div className='flex flex-col lg:flex-row gap-12 items-center'>
            {/* Left Side - Content */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className='lg:w-2/5 space-y-8'
            >
              <motion.h2
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className='text-5xl lg:text-6xl font-bold text-gray-900 leading-tight'
              >
                Tennis convenience starts here
              </motion.h2>
              
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.6 }}
                className='text-xl text-gray-600 leading-relaxed'
              >
                Thousands of NYC tennis players trust our platform, <br />
                <span className='font-semibold text-green-600'>the best court finder experience.*</span>
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.8 }}
                className='space-y-4'
              >
                <div className='flex items-center space-x-3'>
                  <div className='w-6 h-6 bg-green-500 rounded-full flex items-center justify-center'>
                    <svg className='w-4 h-4 text-white' fill='currentColor' viewBox='0 0 20 20'>
                      <path fillRule='evenodd' d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z' clipRule='evenodd' />
                    </svg>
                  </div>
                  <span className='text-lg text-gray-700 font-medium'>Find courts instantly</span>
    </div>
                
                <div className='flex items-center space-x-3'>
                  <div className='w-6 h-6 bg-green-500 rounded-full flex items-center justify-center'>
                    <svg className='w-4 h-4 text-white' fill='currentColor' viewBox='0 0 20 20'>
                      <path fillRule='evenodd' d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z' clipRule='evenodd' />
                    </svg>
                  </div>
                  <span className='text-lg text-gray-700 font-medium'>Real-time wait times</span>
                </div>
                
                <div className='flex items-center space-x-3'>
                  <div className='w-6 h-6 bg-green-500 rounded-full flex items-center justify-center'>
                    <svg className='w-4 h-4 text-white' fill='currentColor' viewBox='0 0 20 20'>
                      <path fillRule='evenodd' d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z' clipRule='evenodd' />
                    </svg>
                  </div>
                  <span className='text-lg text-gray-700 font-medium'>Never wait again</span>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 1.0 }}
                className='flex flex-col items-center space-y-4'
              >
                {/* Simple QR Code */}
                <div className='w-56 h-56 bg-white border-2 border-gray-200 rounded-xl p-6 shadow-lg'>
                  <svg viewBox="0 0 25 25" className='w-full h-full'>
                    {/* Corner squares */}
                    <rect x="0" y="0" width="7" height="7" fill="#000" rx="0.5"/>
                    <rect x="1" y="1" width="5" height="5" fill="#fff" rx="0.3"/>
                    <rect x="2" y="2" width="3" height="3" fill="#000" rx="0.2"/>
                    
                    <rect x="18" y="0" width="7" height="7" fill="#000" rx="0.5"/>
                    <rect x="19" y="1" width="5" height="5" fill="#fff" rx="0.3"/>
                    <rect x="20" y="2" width="3" height="3" fill="#000" rx="0.2"/>
                    
                    <rect x="0" y="18" width="7" height="7" fill="#000" rx="0.5"/>
                    <rect x="1" y="19" width="5" height="5" fill="#fff" rx="0.3"/>
                    <rect x="2" y="20" width="3" height="3" fill="#000" rx="0.2"/>
                    
                    {/* Timing patterns */}
                    <rect x="8" y="0" width="1" height="1" fill="#000"/>
                    <rect x="10" y="0" width="1" height="1" fill="#000"/>
                    <rect x="12" y="0" width="1" height="1" fill="#000"/>
                    <rect x="14" y="0" width="1" height="1" fill="#000"/>
                    <rect x="16" y="0" width="1" height="1" fill="#000"/>
                    
                    <rect x="0" y="8" width="1" height="1" fill="#000"/>
                    <rect x="2" y="8" width="1" height="1" fill="#000"/>
                    <rect x="4" y="8" width="1" height="1" fill="#000"/>
                    <rect x="6" y="8" width="1" height="1" fill="#000"/>
                    <rect x="8" y="8" width="1" height="1" fill="#000"/>
                    <rect x="10" y="8" width="1" height="1" fill="#000"/>
                    <rect x="12" y="8" width="1" height="1" fill="#000"/>
                    <rect x="14" y="8" width="1" height="1" fill="#000"/>
                    <rect x="16" y="8" width="1" height="1" fill="#000"/>
                    <rect x="18" y="8" width="1" height="1" fill="#000"/>
                    <rect x="20" y="8" width="1" height="1" fill="#000"/>
                    <rect x="22" y="8" width="1" height="1" fill="#000"/>
                    <rect x="24" y="8" width="1" height="1" fill="#000"/>
                    
                    <rect x="8" y="1" width="1" height="1" fill="#000"/>
                    <rect x="8" y="3" width="1" height="1" fill="#000"/>
                    <rect x="8" y="5" width="1" height="1" fill="#000"/>
                    <rect x="8" y="7" width="1" height="1" fill="#000"/>
                    <rect x="8" y="9" width="1" height="1" fill="#000"/>
                    <rect x="8" y="11" width="1" height="1" fill="#000"/>
                    <rect x="8" y="13" width="1" height="1" fill="#000"/>
                    <rect x="8" y="15" width="1" height="1" fill="#000"/>
                    <rect x="8" y="17" width="1" height="1" fill="#000"/>
                    <rect x="8" y="19" width="1" height="1" fill="#000"/>
                    <rect x="8" y="21" width="1" height="1" fill="#000"/>
                    <rect x="8" y="23" width="1" height="1" fill="#000"/>
                    
                    {/* Data modules */}
                    <rect x="9" y="9" width="1" height="1" fill="#000"/>
                    <rect x="11" y="9" width="1" height="1" fill="#000"/>
                    <rect x="13" y="9" width="1" height="1" fill="#000"/>
                    <rect x="15" y="9" width="1" height="1" fill="#000"/>
                    <rect x="17" y="9" width="1" height="1" fill="#000"/>
                    <rect x="19" y="9" width="1" height="1" fill="#000"/>
                    <rect x="21" y="9" width="1" height="1" fill="#000"/>
                    <rect x="23" y="9" width="1" height="1" fill="#000"/>
                    
                    <rect x="9" y="11" width="1" height="1" fill="#000"/>
                    <rect x="11" y="11" width="1" height="1" fill="#000"/>
                    <rect x="13" y="11" width="1" height="1" fill="#000"/>
                    <rect x="15" y="11" width="1" height="1" fill="#000"/>
                    <rect x="17" y="11" width="1" height="1" fill="#000"/>
                    <rect x="19" y="11" width="1" height="1" fill="#000"/>
                    <rect x="21" y="11" width="1" height="1" fill="#000"/>
                    <rect x="23" y="11" width="1" height="1" fill="#000"/>
                    
                    <rect x="9" y="13" width="1" height="1" fill="#000"/>
                    <rect x="11" y="13" width="1" height="1" fill="#000"/>
                    <rect x="13" y="13" width="1" height="1" fill="#000"/>
                    <rect x="15" y="13" width="1" height="1" fill="#000"/>
                    <rect x="17" y="13" width="1" height="1" fill="#000"/>
                    <rect x="19" y="13" width="1" height="1" fill="#000"/>
                    <rect x="21" y="13" width="1" height="1" fill="#000"/>
                    <rect x="23" y="13" width="1" height="1" fill="#000"/>
                    
                    {/* Additional data pattern */}
                    <rect x="10" y="15" width="1" height="1" fill="#000"/>
                    <rect x="12" y="15" width="1" height="1" fill="#000"/>
                    <rect x="14" y="15" width="1" height="1" fill="#000"/>
                    <rect x="16" y="15" width="1" height="1" fill="#000"/>
                    <rect x="18" y="15" width="1" height="1" fill="#000"/>
                    <rect x="20" y="15" width="1" height="1" fill="#000"/>
                    <rect x="22" y="15" width="1" height="1" fill="#000"/>
                    <rect x="24" y="15" width="1" height="1" fill="#000"/>
                    
                    <rect x="9" y="17" width="1" height="1" fill="#000"/>
                    <rect x="11" y="17" width="1" height="1" fill="#000"/>
                    <rect x="13" y="17" width="1" height="1" fill="#000"/>
                    <rect x="15" y="17" width="1" height="1" fill="#000"/>
                    <rect x="17" y="17" width="1" height="1" fill="#000"/>
                    <rect x="19" y="17" width="1" height="1" fill="#000"/>
                    <rect x="21" y="17" width="1" height="1" fill="#000"/>
                    <rect x="23" y="17" width="1" height="1" fill="#000"/>
                  </svg>
                </div>
                
                <p className='text-xl font-bold text-gray-800'>
                  Download The App
                </p>
              </motion.div>

              <motion.p
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 1.2 }}
                className='text-sm text-gray-500'
              >
                *Rated best tennis court finder of 2024 by NYC Parks & Recreation.
              </motion.p>
            </motion.div>

            {/* Right Side - 3D iPhone Mockup */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className='lg:w-3/5 flex justify-center'
      >
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                whileInView={{ scale: 1, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.6 }}
                className='relative'
              >
                {/* Video instead of 3D phone */}
                <div className='w-full h-[1000px] bg-transparent'>
                  {!isMounted ? (
                    <div className='w-full h-full flex items-center justify-center text-gray-500'>
                      Loading video...
                    </div>
                  ) : (
                    <video 
                      ref={videoRef}
                      className='w-full h-full object-contain bg-transparent transform -translate-y-16 scale-105'
                      muted
                      playsInline
                      disablePictureInPicture
                      style={{ outline: 'none' }}
                    >
                      <source src="/8_17_2025_23_17_24_contentcore.xyz.mp4" type="video/mp4" />
                      Your browser does not support the video tag.
                    </video>
                  )}
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

const Demo = () => {
  const [mediaType] = useState('video');
  const currentMedia = sampleMediaContent[mediaType];
  const [showNav, setShowNav] = useState(true);

  useEffect(() => {
    window.scrollTo(0, 0);

    const resetEvent = new Event('resetSection');
    window.dispatchEvent(resetEvent);
  }, [mediaType]);

  // Handle scroll to hide/show navigation
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      setShowNav(scrollY < 100); // Hide nav when scrolled down more than 100px
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className='min-h-screen'>
      {/* Navigation Bar */}
      <AnimatePresence>
        {showNav && (
          <motion.nav 
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className='fixed top-0 left-0 right-0 z-50'
          >
            {/* Logo - Positioned at very top left */}
            <motion.div 
              initial={{ x: -100, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
              className='absolute -top-28 left-4 z-60 md:-top-24 lg:-top-20'
            >
              <img 
                src='/Untitled design.png' 
                alt='NYC Tennis Club Logo' 
                className='h-56 w-auto md:h-72 lg:h-96 object-contain drop-shadow-lg'
                style={{ background: 'transparent' }}
              />
            </motion.div>
            
        <div className='container mx-auto px-4 py-14 md:py-18'>
          <div className='flex items-center justify-center'>
              {/* Navigation Links - Centered */}
              {/* Navigation buttons removed as requested */}
            </div>
          </div>
        </motion.nav>
        )}
      </AnimatePresence>

      <ScrollExpandMedia
        mediaType={mediaType as 'video' | 'image'}
        mediaSrc={currentMedia.src}
        posterSrc={mediaType === 'video' ? currentMedia.poster : undefined}
        bgImageSrc={currentMedia.background}
        title={currentMedia.title}
        date={currentMedia.date}
        scrollToExpand={currentMedia.scrollToExpand}
      >
        <MediaContent mediaType={mediaType as 'video' | 'image'} />
      </ScrollExpandMedia>
    </div>
  );
};

export default Demo; 