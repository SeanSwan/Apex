'use client';

import securityVideo from '../assets/security.mp4';
import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import UniversalAuthForm from '../components/UniversalAuthForm/UniversalAuthForm.component'; // Importing the universal authentication form

export default function HomePage() {
  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-black">
      {/* Video Background */}
      <video
        autoPlay
        loop
        muted
        className="absolute top-0 left-0 min-w-full min-h-full object-cover z-0 opacity-40"
      >
        <source src={securityVideo} type="video/mp4" />
        Your browser does not support the video tag.
      </video>

      {/* Content Overlay */}
      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center bg-black bg-opacity-70 p-4">
        <motion.h1
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="mb-8 text-5xl font-extrabold text-gold-500 font-[Orbitron]" // Modern futuristic font
        >
          DEFENSE INTERNATIONAL
        </motion.h1>

        {/* Authentication Form */}
        <Card className="w-full max-w-md bg-gray-900 text-gray-100 border border-gray-700">
          <CardHeader>
            <CardTitle className="text-center text-2xl text-gold-500 font-[Orbitron]">
              Welcome to Defense International
            </CardTitle>
            <CardDescription className="text-center text-gray-400">
              Revolutionizing security operations with cutting-edge AI technology. Our platform integrates
              all aspects of security management into one seamless interface, enhancing operational
              efficiency and safeguarding assets.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* UniversalAuthForm handles both login and signup within the same component */}
            <UniversalAuthForm />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}





