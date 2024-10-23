import React from 'react';
import './HeroSection.css'
import SocMedIcons from '../SocMedIcons/SocMedIcons';

const HeroSection = () => {
  return (
    <main className="hero container">
      <div className="hero-content">
        <h1>YOUR FEET DESERVE THE BEST</h1>
        <p>
          YOUR FEET DESERVE THE BEST AND WE’RE HERE TO HELP YOU WITH OUR
          SHOES. YOUR FEET DESERVE THE BEST AND WE’RE HERE TO HELP YOU WITH OUR
          SHOES.
        </p>

        <div className="hero-btn">
          <button class="button_primary"></button>
        </div>
        <SocMedIcons />
        
      </div>

      <div className="hero-image">
        <img src="/images/jordan1.png" alt="hero-image" />
      </div>
    </main>
  );
};

export default HeroSection;
